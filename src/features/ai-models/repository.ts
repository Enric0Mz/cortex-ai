import { prisma } from "@/lib/prisma";
import {
  ConflictError,
  ServiceUnavailableError,
} from "@/lib/errors";
import { tryCatch, type Result } from "@/lib/result";
import type {
  CreateAiModelsBulkRequest,
  CreateAiModelsBulkResponse,
  AiModelResponse,
  CreateAiModelRequest,
} from "@/features/ai-models/schemas";

type Row = { id: string; name: string; provider: string };

function isUniqueConstraintError(cause: unknown): boolean {
  return (
    typeof cause === "object" &&
    cause !== null &&
    "code" in cause &&
    (cause as { code: unknown }).code === "P2002"
  );
}

export async function listAiModels(): Promise<
  Result<AiModelResponse[], ServiceUnavailableError>
> {
  return tryCatch(
    async () => {
      const rows = await prisma.aiModel.findMany({
        orderBy: [{ provider: "asc" }, { name: "asc" }],
        select: { id: true, name: true, provider: true },
      });
      return rows;
    },
    (cause) => {
      console.error("[listAiModels] DB error:", cause);
      return new ServiceUnavailableError("database", cause);
    },
  );
}

export async function createAiModel(
  input: CreateAiModelRequest,
): Promise<Result<AiModelResponse, ConflictError | ServiceUnavailableError>> {
  return tryCatch<AiModelResponse, ConflictError | ServiceUnavailableError>(
    async () => {
      const row: Row = await prisma.aiModel.create({
        data: { name: input.name, provider: input.provider },
        select: { id: true, name: true, provider: true },
      });
      return row;
    },
    (cause) => {
      if (isUniqueConstraintError(cause)) {
        return new ConflictError(
          `model already exists for provider "${input.provider}"`,
        );
      }
      console.error("[createAiModel] DB error:", cause);
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
        select: { id: true, name: true, provider: true },
      });
      return row;
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
        })),
        select: { id: true, name: true, provider: true },
      });
      return rows;
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
