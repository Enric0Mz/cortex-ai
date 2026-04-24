import { prisma } from "@/lib/prisma";
import { ServiceUnavailableError } from "@/lib/errors";
import { tryCatch, type Result } from "@/lib/result";
import type { ProviderId } from "@/features/ai-models/schemas";

type ResponseRow = {
  id: string;
  comparisonId: string;
  provider: string;
  aiModel: { name: string; provider: ProviderId; isFree: boolean };
  content: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  latencyMs: number;
  createdAt: Date;
};

export async function findResponseById(
  responseId: string,
): Promise<Result<ResponseRow | null, ServiceUnavailableError>> {
  return tryCatch(
    async () => {
      const row = await prisma.response.findUnique({
        where: { id: responseId },
        select: {
          id: true,
          comparisonId: true,
          provider: true,
          aiModel: {
            select: {
              name: true,
              provider: true,
              isFree: true,
            },
          },
          content: true,
          inputTokens: true,
          outputTokens: true,
          costUsd: true,
          latencyMs: true,
          createdAt: true,
        },
      });
      return row
        ? {
            ...row,
            aiModel: {
              ...row.aiModel,
              provider: row.aiModel.provider as ProviderId,
            },
          }
        : null;
    },
    (cause) => new ServiceUnavailableError("database", cause),
  );
}
