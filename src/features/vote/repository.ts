import { prisma } from "@/lib/prisma";
import { ServiceUnavailableError } from "@/lib/errors";
import { tryCatch, type Result } from "@/lib/result";

type VoteRow = {
  id: string;
  comparisonId: string;
  responseId: string;
  userId: string;
  createdAt: Date;
};

export async function getAnonymousUserId(): Promise<
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

export async function findResponseInComparison(
  comparisonId: string,
  responseId: string,
): Promise<Result<{ id: string } | null, ServiceUnavailableError>> {
  return tryCatch(
    async () => {
      const response = await prisma.response.findFirst({
        where: {
          id: responseId,
          comparisonId,
        },
        select: { id: true },
      });
      return response;
    },
    (cause) => new ServiceUnavailableError("database", cause),
  );
}

export async function upsertVote(
  comparisonId: string,
  responseId: string,
  userId: string,
): Promise<Result<VoteRow, ServiceUnavailableError>> {
  return tryCatch(
    async () => {
      const vote = await prisma.vote.upsert({
        where: {
          comparisonId_userId: {
            comparisonId,
            userId,
          },
        },
        update: { responseId },
        create: {
          comparisonId,
          responseId,
          userId,
        },
        select: {
          id: true,
          comparisonId: true,
          responseId: true,
          userId: true,
          createdAt: true,
        },
      });
      return vote;
    },
    (cause) => new ServiceUnavailableError("database", cause),
  );
}
