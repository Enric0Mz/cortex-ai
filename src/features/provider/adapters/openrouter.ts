import { PROVIDER_MODELS } from "@/lib/constants";
import type { ProviderAdapter } from "../types";
import { openAIChatAdapter } from "./openai-compat";

export function openrouterAdapter(apiKey: string): ProviderAdapter {
  return openAIChatAdapter({
    id: "openrouter",
    baseUrl: "https://openrouter.ai/api/v1",
    apiKey,
    model: PROVIDER_MODELS.openrouter,
    modelProvider: "openai",
    extraHeaders: {
      "HTTP-Referer": "https://cortex-ai.local",
      "X-Title": "Cortex AI",
    },
  });
}
