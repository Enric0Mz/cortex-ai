import type { Result } from "@/lib/result";
import type { ProviderError } from "@/lib/errors";
import type { ProviderId, ProviderResult } from "@/comparison/schemas";

export interface ProviderAdapter {
  id: ProviderId;
  model: string;
  generate(
    prompt: string,
    signal: AbortSignal,
  ): Promise<Result<ProviderResult, ProviderError>>;
}
