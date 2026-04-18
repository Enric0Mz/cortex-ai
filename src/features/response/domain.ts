import { NotFoundError, ServiceUnavailableError } from "@/lib/errors";
import { err, type Result } from "@/lib/result";
import type { ResponseDetails } from "./schemas";
import { findResponseById } from "./repository";

export async function getResponseById(
  responseId: string,
): Promise<Result<ResponseDetails, NotFoundError | ServiceUnavailableError>> {
  const result = await findResponseById(responseId);
  if (!result.ok) return err(result.error);
  if (!result.value) return err(new NotFoundError("response"));

  const row = result.value;
  return {
    ok: true,
    value: {
      id: row.id,
      comparisonId: row.comparisonId,
      provider: row.provider as ResponseDetails["provider"],
      aiModel: row.aiModel,
      content: row.content,
      inputTokens: row.inputTokens,
      outputTokens: row.outputTokens,
      costUsd: row.costUsd,
      latencyMs: row.latencyMs,
      createdAt: row.createdAt.toISOString(),
    },
  };
}
