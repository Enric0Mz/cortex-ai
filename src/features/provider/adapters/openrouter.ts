import type { ProviderAdapter } from "../types";
import { openAIChatAdapter } from "./openai-compat";

export function openrouterAdapter(
  apiKey: string,
  model: string,
  isFree: boolean,
): ProviderAdapter {
  return openAIChatAdapter({
    id: "openrouter",
    baseUrl: "https://openrouter.ai/api/v1",
    apiKey,
    model,
    modelProvider: "openrouter",
    isFree,
    extraHeaders: {
      "HTTP-Referer": "https://cortex-ai.local",
      "X-Title": "Cortex AI",
    },
  });
}
