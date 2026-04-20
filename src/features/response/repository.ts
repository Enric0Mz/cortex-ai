import { prisma } from "@/lib/prisma";
import { ServiceUnavailableError } from "@/lib/errors";
import { tryCatch, type Result } from "@/lib/result";

type ResponseRow = {
  id: string;
  comparisonId: string;
  provider: string;
  aiModel: { name: string; provider: string };
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
      return row;
    },
    (cause) => new ServiceUnavailableError("database", cause),
  );
}
