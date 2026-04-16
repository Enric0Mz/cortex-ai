import { prisma } from "@/lib/prisma";
import { ServiceUnavailableError } from "@/lib/errors";
import { tryCatch, type Result } from "@/lib/result";
import {
  type CreateComparisonRequest,
  type ProviderId,
} from "@/features/comparison/schemas";

export async function CreateComparison(
  userId: string,
  input: CreateComparisonRequest,
): Promise<Result<{ id: string; createdAt: Date }, ServiceUnavailableError>> {
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

export async function CreateComparisonResponse(
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
