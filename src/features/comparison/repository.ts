import { prisma } from "@/lib/prisma";
import { ServiceUnavailableError } from "@/lib/errors";
import { tryCatch, type Result } from "@/lib/result";
import {
  type CreateComparisonRequest,
  type ProviderResult,
} from "@/features/comparison/schemas";
import { ProviderId } from "@/features/ai-models/schemas";

export type ModelSelection = {
  id: string;
  name: string;
  provider: ProviderId;
  isFree: boolean;
};

export async function FindModelsByIds(
  ids: string[],
): Promise<Result<ModelSelection[], ServiceUnavailableError>> {
  return tryCatch(
    async () => {
      const rows = await prisma.aiModel.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true, provider: true, isFree: true },
      });
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        provider: r.provider as ProviderId,
        isFree: r.isFree,
      }));
    },
    (cause) => {
      console.error("[FindModelsByIds] DB error:", cause);
      return new ServiceUnavailableError("database", cause);
    },
  );
}

export async function CreateComparison(
  userId: string | null,
  input: CreateComparisonRequest,
): Promise<Result<{ id: string; createdAt: Date }, ServiceUnavailableError>> {
  return tryCatch(
    async () => {
      const row = await prisma.comparison.create({
        data: {
          userId: userId ?? undefined,
          prompt: input.prompt,
        },
        select: { id: true, createdAt: true },
      });
      return row;
    },
    (cause) => {
      console.error("[CreateComparison] DB error:", cause);
      return new ServiceUnavailableError("database", cause);
    },
  );
}

export async function CreateOneComparisonResponse(
  comparisonId: string,
  result: ProviderResult,
  aiModelId: string,
): Promise<Result<{ id: string }, ServiceUnavailableError>> {
  return tryCatch(
    async () => {
      const row = await prisma.response.create({
        data: {
          comparisonId,
          provider: result.aiModel.provider,
          aiModelId,
          content: result.content,
          inputTokens: result.inputTokens,
          outputTokens: result.outputTokens,
          costUsd: result.costUsd,
          latencyMs: result.latencyMs,
        },
        select: { id: true },
      });
      return row;
    },
    (cause) => {
      console.error("[CreateOneComparisonResponse] DB error:", cause);
      return new ServiceUnavailableError("database", cause);
    },
  );
}

export async function CreateComparisonResponse(
  comparisonId: string,
  results: ProviderResult[],
): Promise<Result<Map<string, string>, ServiceUnavailableError>> {
  if (results.length === 0) {
    return { ok: true, value: new Map() };
  }
  return tryCatch(
    async () => {
      const modelKeys = Array.from(
        new Set(results.map((r) => `${r.aiModel.name}|${r.aiModel.provider}`)),
      );
      const requestedModels = modelKeys.map((key) => {
        const [name, provider] = key.split("|");
        return { name, provider };
      });

      const registeredModels = await prisma.aiModel.findMany({
        where: { OR: requestedModels },
        select: { id: true, name: true, provider: true },
      });

      const aiModelIds = new Map<string, string>();
      for (const model of registeredModels) {
        aiModelIds.set(`${model.name}|${model.provider}`, model.id);
      }

      const persistableResults = results.filter((r) => {
        const key = `${r.aiModel.name}|${r.aiModel.provider}`;
        return aiModelIds.has(key);
      });

      if (persistableResults.length === 0) {
        return new Map<string, string>();
      }

      const rows = await prisma.response.createManyAndReturn({
        data: persistableResults.map((r) => ({
          comparisonId,
          provider: r.aiModel.provider,
          aiModelId: aiModelIds.get(`${r.aiModel.name}|${r.aiModel.provider}`)!,
          content: r.content,
          inputTokens: r.inputTokens,
          outputTokens: r.outputTokens,
          costUsd: r.costUsd,
          latencyMs: r.latencyMs,
        })),
        select: { id: true, provider: true, aiModelId: true },
      });

      const modelById = new Map<string, { name: string; provider: string }>();
      for (const m of registeredModels) {
        modelById.set(m.id, { name: m.name, provider: m.provider });
      }

      const byModelKey = new Map<string, string>();
      for (const row of rows) {
        const m = modelById.get(row.aiModelId);
        if (!m) continue;
        byModelKey.set(`${m.name}|${m.provider}`, row.id);
      }
      return byModelKey;
    },
    (cause) => {
      console.error("[CreateComparisonResponse] DB error:", cause);
      return new ServiceUnavailableError("database", cause);
    },
  );
}
