import type { ProviderAdapter } from "../types";
import { openAIChatAdapter } from "./openai-compat";

export function mistralAdapter(
  apiKey: string,
  model: string,
  isFree: boolean,
): ProviderAdapter {
  return openAIChatAdapter({
    id: "mistral",
    baseUrl: "https://api.mistral.ai/v1",
    apiKey,
    model,
    modelProvider: "mistral",
    isFree,
  });
}
