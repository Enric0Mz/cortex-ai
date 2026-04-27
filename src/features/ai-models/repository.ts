import { prisma } from "@/lib/prisma";
import { ConflictError, ServiceUnavailableError } from "@/lib/errors";
import { tryCatch, type Result } from "@/lib/result";
import type {
  CompanyId,
  CreateAiModelsBulkRequest,
  CreateAiModelsBulkResponse,
  AiModelResponse,
  ListAiModelsQuery,
  ProviderId,
} from "@/features/ai-models/schemas";

function isUniqueConstraintError(cause: unknown): boolean {
  return (
    typeof cause === "object" &&
    cause !== null &&
    "code" in cause &&
    (cause as { code: unknown }).code === "P2002"
  );
}

export async function listAiModels(
  filter?: ListAiModelsQuery,
): Promise<Result<AiModelResponse[], ServiceUnavailableError>> {
  return tryCatch(
    async () => {
      const rows = await prisma.aiModel.findMany({
        where: {
          provider: filter?.provider,
          company: filter?.company,
          isFree: filter?.isFree,
        },
        orderBy: [{ company: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          provider: true,
          company: true,
          isFree: true,
        },
      });
      return rows.map((row) => ({
        ...row,
        provider: row.provider as ProviderId,
        company: row.company as CompanyId,
      }));
    },
    (cause) => {
      console.error("[listAiModels] DB error:", cause);
      return new ServiceUnavailableError("database", cause);
    },
  );
}

export async function findAiModelByNameProvider(
  name: string,
  provider: string,
): Promise<Result<AiModelResponse | null, ServiceUnavailableError>> {
  return tryCatch(
    async () => {
      const row = await prisma.aiModel.findUnique({
        where: { name_provider: { name, provider } },
        select: {
          id: true,
          name: true,
          provider: true,
          company: true,
          isFree: true,
        },
      });
      return row
        ? {
            ...row,
            provider: row.provider as ProviderId,
            company: row.company as CompanyId,
          }
        : null;
    },
    (cause) => {
      console.error("[findAiModelByNameProvider] DB error:", cause);
      return new ServiceUnavailableError("database", cause);
    },
  );
}

export async function createAiModelsBulk(
  input: CreateAiModelsBulkRequest,
): Promise<
  Result<CreateAiModelsBulkResponse, ConflictError | ServiceUnavailableError>
> {
  return tryCatch<
    CreateAiModelsBulkResponse,
    ConflictError | ServiceUnavailableError
  >(
    async () => {
      const rows = await prisma.aiModel.createManyAndReturn({
        data: input.models.map((model) => ({
          name: model.name,
          provider: model.provider,
          company: model.company,
          isFree: model.isFree,
        })),
        select: {
          id: true,
          name: true,
          provider: true,
          company: true,
          isFree: true,
        },
      });
      return rows.map((row) => ({
        ...row,
        provider: row.provider as ProviderId,
        company: row.company as CompanyId,
      }));
    },
    (cause) => {
      if (isUniqueConstraintError(cause)) {
        return new ConflictError("one or more models already exist");
      }
      console.error("[createAiModelsBulk] DB error:", cause);
      return new ServiceUnavailableError("database", cause);
    },
  );
}
