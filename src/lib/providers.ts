import type { ProviderId } from "@/features/ai-models/schemas";

export const PROVIDER_LABELS: Record<ProviderId, string> = {
  gemini: "Google",
  groq: "Groq",
  mistral: "Mistral AI",
  openrouter: "OpenRouter",
};
