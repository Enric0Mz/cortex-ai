import { prisma } from "@/lib/prisma";
import { ServiceUnavailableError } from "@/lib/errors";
import { tryCatch, type Result } from "@/lib/result";
import type { CurrentUser } from "./schemas";

type UpsertInput = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
};

export async function upsertUserFromAuth(
  input: UpsertInput,
): Promise<Result<CurrentUser, ServiceUnavailableError>> {
  return tryCatch(
    async () => {
      const user = await prisma.user.upsert({
        where: { id: input.id },
        update: {
          email: input.email,
          name: input.name,
          avatarUrl: input.avatarUrl,
        },
        create: {
          id: input.id,
          email: input.email,
          name: input.name,
          avatarUrl: input.avatarUrl,
          authProvider: "google",
        },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
        },
      });
      return user;
    },
    (cause) => new ServiceUnavailableError("database", cause),
  );
}

export async function findUserById(
  id: string,
): Promise<Result<CurrentUser | null, ServiceUnavailableError>> {
  return tryCatch(
    async () => {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          avatarUrl: true,
        },
      });
      return user;
    },
    (cause) => new ServiceUnavailableError("database", cause),
  );
}
