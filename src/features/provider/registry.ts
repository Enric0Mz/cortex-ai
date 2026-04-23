import { env } from "@/lib/env";
import type { ProviderId } from "@/features/ai-models/schemas";
import type { ProviderAdapter } from "./types";
import { geminiAdapter } from "./adapters/gemini";
import { groqAdapter } from "./adapters/groq";
import { mistralAdapter } from "./adapters/mistral";
import { openrouterAdapter } from "./adapters/openrouter";
import { fakeAdapter } from "./adapters/fake";

const ALL_PROVIDER_IDS: ProviderId[] = [
  "gemini",
  "groq",
  "mistral",
  "openrouter",
];

export function buildAdapters(): ProviderAdapter[] {
  if (process.env.USE_FAKE_PROVIDERS === "true") {
    return ALL_PROVIDER_IDS.map(fakeAdapter);
  }

  const adapters: ProviderAdapter[] = [];
  if (env.GEMINI_API_KEY) adapters.push(geminiAdapter(env.GEMINI_API_KEY));
  if (env.GROQ_API_KEY) adapters.push(groqAdapter(env.GROQ_API_KEY));
  if (env.MISTRAL_API_KEY) adapters.push(mistralAdapter(env.MISTRAL_API_KEY));
  if (env.OPENROUTER_API_KEY)
    adapters.push(openrouterAdapter(env.OPENROUTER_API_KEY));

  if (adapters.length === 0) {
    console.warn(
      "[provider] no API keys configured — comparison requests will return no responses",
    );
  }
  return adapters;
}
