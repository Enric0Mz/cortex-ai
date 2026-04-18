import type {
  ConflictError,
  ServiceUnavailableError,
} from "@/lib/errors";
import type { Result } from "@/lib/result";
import type {
  AiModelResponse,
  CreateAiModelsBulkRequest,
  CreateAiModelsBulkResponse,
  CreateAiModelRequest,
} from "@/features/ai-models/schemas";
import { createAiModel, createAiModelsBulk, listAiModels } from "./repository";

export function listModels(): Promise<
  Result<AiModelResponse[], ServiceUnavailableError>
> {
  return listAiModels();
}

export function createModel(
  input: CreateAiModelRequest,
): Promise<Result<AiModelResponse, ConflictError | ServiceUnavailableError>> {
  return createAiModel(input);
}

export function createModelsBulk(
  input: CreateAiModelsBulkRequest,
): Promise<
  Result<CreateAiModelsBulkResponse, ConflictError | ServiceUnavailableError>
> {
  return createAiModelsBulk(input);
}
