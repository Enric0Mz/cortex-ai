import type { ProviderAdapter } from "../types";
import { openAIChatAdapter } from "./openai-compat";

export function groqAdapter(
  apiKey: string,
  model: string,
  isFree: boolean,
): ProviderAdapter {
  return openAIChatAdapter({
    id: "groq",
    baseUrl: "https://api.groq.com/openai/v1",
    apiKey,
    model,
    modelProvider: "groq",
    isFree,
  });
}
