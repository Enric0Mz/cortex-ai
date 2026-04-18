import { PROVIDER_MODELS } from "@/lib/constants";
import type { ProviderAdapter } from "../types";
import { openAIChatAdapter } from "./openai-compat";

export function mistralAdapter(apiKey: string): ProviderAdapter {
  return openAIChatAdapter({
    id: "mistral",
    baseUrl: "https://api.mistral.ai/v1",
    apiKey,
    model: PROVIDER_MODELS.mistral,
    modelProvider: "mistral",
  });
}
