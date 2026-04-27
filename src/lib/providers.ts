import type { CompanyId, ProviderId } from "@/features/ai-models/schemas";

export const PROVIDER_LABELS: Record<ProviderId, string> = {
  gemini: "Google",
  groq: "Groq",
  mistral: "Mistral AI",
  openrouter: "OpenRouter",
  anthropic: "Anthropic",
  openai: "OpenAI",
  google: "Google",
  meta: "Meta",
  deepseek: "DeepSeek",
  xai: "xAI",
  qwen: "Qwen",
};

export const COMPANY_LABELS: Record<CompanyId, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  google: "Google",
  meta: "Meta",
  mistralai: "Mistral AI",
  deepseek: "DeepSeek",
  xai: "xAI",
  qwen: "Qwen",
};
