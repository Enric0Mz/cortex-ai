import { prisma } from "@/lib/prisma";
import { ServiceUnavailableError } from "@/lib/errors";
import { tryCatch, type Result } from "@/lib/result";
import {
  type CreateComparisonRequest,
  type ProviderId,
  type ProviderResult,
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
    (cause) => {
      console.error("[CreateComparison] DB error:", cause);
      return new ServiceUnavailableError("database", cause);
    },
  );
}

export async function CreateComparisonResponse(
  comparisonId: string,
  results: ProviderResult[],
): Promise<Result<Map<ProviderId, string>, ServiceUnavailableError>> {
  if (results.length === 0) {
    return { ok: true, value: new Map() };
  }
  return tryCatch(
    async () => {
      const aiModelIds = new Map<string, string>();
      for (const r of results) {
        const key = `${r.aiModel.name}|${r.aiModel.provider}`;
        if (aiModelIds.has(key)) continue;
        const row = await prisma.aiModel.upsert({
          where: {
            name_provider: {
              name: r.aiModel.name,
              provider: r.aiModel.provider,
            },
          },
          update: {},
          create: { name: r.aiModel.name, provider: r.aiModel.provider },
          select: { id: true },
        });
        aiModelIds.set(key, row.id);
      }

      const rows = await prisma.response.createManyAndReturn({
        data: results.map((r) => ({
          comparisonId,
          provider: r.provider,
          aiModelId: aiModelIds.get(`${r.aiModel.name}|${r.aiModel.provider}`)!,
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
    (cause) => {
      console.error("[CreateComparisonResponse] DB error:", cause);
      return new ServiceUnavailableError("database", cause);
    },
  );
}
