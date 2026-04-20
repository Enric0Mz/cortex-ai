import type { ConflictError, ServiceUnavailableError } from "@/lib/errors";
import type { Result } from "@/lib/result";
import type {
  AiModelResponse,
  CreateAiModelsBulkRequest,
  CreateAiModelsBulkResponse,
} from "@/features/ai-models/schemas";
import { createAiModelsBulk, listAiModels } from "./repository";

export function listModels(): Promise<
  Result<AiModelResponse[], ServiceUnavailableError>
> {
  return listAiModels();
}

export function createModelsBulk(
  input: CreateAiModelsBulkRequest,
): Promise<
  Result<CreateAiModelsBulkResponse, ConflictError | ServiceUnavailableError>
> {
  return createAiModelsBulk(input);
}
