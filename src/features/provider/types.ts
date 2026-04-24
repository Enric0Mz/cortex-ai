import type { Result } from "@/lib/result";
import type { ProviderError } from "@/lib/errors";
import type { ProviderResult } from "@/features/comparison/schemas";
import type { ProviderId } from "@/features/ai-models/schemas";

export type StreamYield =
  | { type: "delta"; text: string }
  | { type: "done"; result: ProviderResult }
  | { type: "error"; error: ProviderError };

export interface ProviderAdapter {
  id: ProviderId;
  model: string;
  generate(
    prompt: string,
    signal: AbortSignal,
  ): Promise<Result<ProviderResult, ProviderError>>;
  streamGenerate(
    prompt: string,
    signal: AbortSignal,
  ): AsyncIterable<StreamYield>;
}
