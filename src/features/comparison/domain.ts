import { PROVIDER_TIMEOUT_MS } from "@/lib/constants";
import { ServiceUnavailableError, ValidationError } from "@/lib/errors";
import { err, type Result } from "@/lib/result";
import {
  type ComparisonResponseItem,
  type ComparisonResult,
  type CreateComparisonRequest,
} from "@/features/comparison/schemas";
import { buildAdapters } from "@/features/provider/registry";
import {
  CreateComparison,
  CreateComparisonResponse,
  FindModelsByIds,
} from "./repository";

export async function runComparison(
  userId: string,
  input: CreateComparisonRequest,
): Promise<
  Result<ComparisonResult, ServiceUnavailableError | ValidationError>
> {
  const modelsResult = await FindModelsByIds(input.models);
  if (!modelsResult.ok) return err(modelsResult.error);
  if (modelsResult.value.length !== input.models.length) {
    return err(new ValidationError("one or more model ids are unknown"));
  }
  const selections = modelsResult.value;
  const comparisonResult = await CreateComparison(userId, input);
  if (!comparisonResult.ok) return err(comparisonResult.error);
  const { id: comparisonId, createdAt } = comparisonResult.value;

  const adapters = buildAdapters(selections);
  const settled = await Promise.all(
    adapters.map(async (adapter) => {
      const signal = AbortSignal.timeout(PROVIDER_TIMEOUT_MS);
      const started = Date.now();
      const result = await adapter.generate(input.prompt, signal);
      return { adapter, result, fallbackLatency: Date.now() - started };
    }),
  );

  const successes = settled.flatMap((entry) =>
    entry.result.ok ? [entry.result.value] : [],
  );
  const persistResult = await CreateComparisonResponse(comparisonId, successes);
  if (!persistResult.ok) return err(persistResult.error);
  const idsByModelKey = persistResult.value;

  const responses: ComparisonResponseItem[] = settled.map((entry) => {
    if (entry.result.ok) {
      const value = entry.result.value;
      const id = idsByModelKey.get(
        `${value.aiModel.name}|${value.aiModel.provider}`,
      );
      if (!id) {
        return {
          provider: value.provider,
          model: value.aiModel.name,
          status: "failed" as const,
          error: "model not registered",
          latencyMs: value.latencyMs,
        };
      }
      return { id, status: "ok" as const, ...value };
    }
    return {
      provider: entry.adapter.id,
      model: entry.adapter.model,
      status: "failed" as const,
      error: entry.result.error.message,
      latencyMs: entry.fallbackLatency,
    };
  });

  return {
    ok: true,
    value: {
      id: comparisonId,
      prompt: input.prompt,
      createdAt: createdAt.toISOString(),
      responses,
    },
  };
}
