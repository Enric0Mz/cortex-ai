export const MIN_MODELS_PER_COMPARISON = 2;
export const MAX_MODELS_PER_COMPARISON = 4;
export const HISTORY_PAGE_SIZE = 10;
export const ROTATING_TEXT_INTERVAL_MS = 3000;

// All Free Tier for MVP
export const PROVIDER_MODELS = {
  gemini: "gemini-2.5-flash",
  groq: "llama-3.3-70b-versatile",
  mistral: "mistral-small-latest",
  openrouter: "openai/gpt-oss-120b:free",
} as const;

export const PROVIDER_MODEL_PROVIDERS = {
  gemini: "google",
  groq: "meta",
  mistral: "mistral",
  openrouter: "openai",
} as const;

export const PROVIDER_TIMEOUT_MS = 30_000;
