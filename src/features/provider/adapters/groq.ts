import { PROVIDER_MODELS } from "@/lib/constants";
import type { ProviderAdapter } from "../types";
import { openAIChatAdapter } from "./openai-compat";

export function groqAdapter(apiKey: string): ProviderAdapter {
  return openAIChatAdapter({
    id: "groq",
    baseUrl: "https://api.groq.com/openai/v1",
    apiKey,
    model: PROVIDER_MODELS.groq,
    modelProvider: "meta",
  });
}
