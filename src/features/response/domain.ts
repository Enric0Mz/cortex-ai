import { NotFoundError, ServiceUnavailableError } from "@/lib/errors";
import { ok, err, type Result } from "@/lib/result";
import { ProviderIdSchema } from "@/features/ai-models/schemas";
import type { ResponseDetails } from "./schemas";
import { findResponseById } from "./repository";

export async function getResponseById(
  responseId: string,
): Promise<Result<ResponseDetails, NotFoundError | ServiceUnavailableError>> {
  const result = await findResponseById(responseId);
  if (!result.ok) return err(result.error);
  if (!result.value) return err(new NotFoundError("response"));

  const row = result.value;
  return ok({
    id: row.id,
    comparisonId: row.comparisonId,
    provider: ProviderIdSchema.parse(row.provider),
    aiModel: row.aiModel,
    content: row.content,
    inputTokens: row.inputTokens,
    outputTokens: row.outputTokens,
    costUsd: row.costUsd,
    latencyMs: row.latencyMs,
    createdAt: row.createdAt.toISOString(),
  });
}
