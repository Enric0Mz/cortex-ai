import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import {
  AppError,
  ServiceUnavailableError,
  ValidationError,
} from "@/lib/errors";
import { tryCatch, type Result } from "@/lib/result";
import { PROVIDER_TIMEOUT_MS } from "@/lib/constants";
import {
  CreateComparisonRequestSchema,
  type ComparisonResponseItem,
  type ComparisonResult,
  type CreateComparisonRequest,
  type ProviderId,
} from "@/comparison/schemas";
import type { ErrorResponse } from "@/openapi/common";
import { buildAdapters } from "@/features/provider/registry";

type ResponseBody = ComparisonResult | ErrorResponse;

// TODO(auth): replace with authed Supabase user
async function getAnonymousUserId(): Promise<
  Result<string, ServiceUnavailableError>
> {
  return tryCatch(
    async () => {
      const user = await prisma.user.upsert({
        where: { email: "anonymous@local" },
        update: {},
        create: {
          email: "anonymous@local",
          name: "Anonymous",
          authProvider: "anonymous",
        },
        select: { id: true },
      });
      return user.id;
    },
    (cause) => new ServiceUnavailableError("database", cause),
  );
}

async function createComparisonRow(
  userId: string,
  input: CreateComparisonRequest,
): Promise<
  Result<{ id: string; createdAt: Date }, ServiceUnavailableError>
> {
  return tryCatch(
    async () => {
      const row = await prisma.comparison.create({
        data: {
          userId,
          prompt: input.prompt,
          category: input.category ?? null,
        },
        select: { id: true, createdAt: true },
      });
      return row;
    },
    (cause) => new ServiceUnavailableError("database", cause),
  );
}

async function persistSuccessfulResponses(
  comparisonId: string,
  results: Array<{
    provider: ProviderId;
    model: string;
    content: string;
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
    latencyMs: number;
  }>,
): Promise<Result<Map<ProviderId, string>, ServiceUnavailableError>> {
  if (results.length === 0) {
    return { ok: true, value: new Map() };
  }
  return tryCatch(
    async () => {
      const rows = await prisma.response.createManyAndReturn({
        data: results.map((r) => ({
          comparisonId,
          provider: r.provider,
          model: r.model,
          content: r.content,
          inputTokens: r.inputTokens,
          outputTokens: r.outputTokens,
          costUsd: r.costUsd,
          latencyMs: r.latencyMs,
        })),
        select: { id: true, provider: true },
      });
      const byProvider = new Map<ProviderId, string>();
      for (const row of rows) {
        byProvider.set(row.provider as ProviderId, row.id);
      }
      return byProvider;
    },
    (cause) => new ServiceUnavailableError("database", cause),
  );
}

function toErrorResponse(error: AppError): ErrorResponse {
  return {
    code: error.code,
    message: error.message,
    statusCode: error.statusCode,
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseBody>,
): Promise<void> {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    const error = new AppError("method not allowed", 405, "METHOD_NOT_ALLOWED");
    res.status(405).json(toErrorResponse(error));
    return;
  }

  const parsed = CreateComparisonRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    const error = new ValidationError(
      parsed.error.issues[0]?.message ?? "invalid request body",
    );
    res.status(error.statusCode).json(toErrorResponse(error));
    return;
  }
  const input = parsed.data;

  const userResult = await getAnonymousUserId();
  if (!userResult.ok) {
    res.status(userResult.error.statusCode).json(toErrorResponse(userResult.error));
    return;
  }

  const comparisonResult = await createComparisonRow(userResult.value, input);
  if (!comparisonResult.ok) {
    res
      .status(comparisonResult.error.statusCode)
      .json(toErrorResponse(comparisonResult.error));
    return;
  }
  const { id: comparisonId, createdAt } = comparisonResult.value;

  const adapters = buildAdapters();
  const settled = await Promise.all(
    adapters.map(async (adapter) => {
      const signal = AbortSignal.timeout(PROVIDER_TIMEOUT_MS);
      const started = Date.now();
      const result = await adapter.generate(input.prompt, signal);
      return { adapter, result, fallbackLatency: Date.now() - started };
    }),
  );

  const successes = settled.flatMap((entry) =>
    entry.result.ok ? [entry.result.value] : [],
  );
  const persistResult = await persistSuccessfulResponses(
    comparisonId,
    successes,
  );
  if (!persistResult.ok) {
    res
      .status(persistResult.error.statusCode)
      .json(toErrorResponse(persistResult.error));
    return;
  }
  const idsByProvider = persistResult.value;

  const responses: ComparisonResponseItem[] = settled.map((entry) => {
    if (entry.result.ok) {
      const value = entry.result.value;
      const id = idsByProvider.get(value.provider);
      if (!id) {
        return {
          provider: value.provider,
          model: value.model,
          status: "failed",
          error: "persistence mismatch",
          latencyMs: value.latencyMs,
        };
      }
      return { id, status: "ok", ...value };
    }
    return {
      provider: entry.adapter.id,
      model: entry.adapter.model,
      status: "failed",
      error: entry.result.error.message,
      latencyMs: entry.fallbackLatency,
    };
  });

  const payload: ComparisonResult = {
    id: comparisonId,
    prompt: input.prompt,
    category: input.category ?? null,
    createdAt: createdAt.toISOString(),
    responses,
  };
  res.status(200).json(payload);
}
