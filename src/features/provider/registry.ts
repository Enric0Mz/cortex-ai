import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import type { CompanyId, ProviderId } from "@/features/ai-models/schemas";
import type { ProviderAdapter } from "./types";
import { geminiAdapter } from "./adapters/gemini";
import { groqAdapter } from "./adapters/groq";
import { mistralAdapter } from "./adapters/mistral";
import { openrouterAdapter } from "./adapters/openrouter";
import { fakeAdapter } from "./adapters/fake";

export type AdapterSelection = {
  provider: ProviderId;
  name: string;
  company: CompanyId;
  isFree: boolean;
};

export function buildAdapters(
  selections: AdapterSelection[],
): ProviderAdapter[] {
  if (process.env.USE_FAKE_PROVIDERS === "true") {
    return selections.map((s) =>
      fakeAdapter(s.provider, s.name, s.company, s.isFree),
    );
  }

  const adapters: ProviderAdapter[] = [];
  for (const { provider, name, company, isFree } of selections) {
    switch (provider) {
      case "gemini":
        if (env.GEMINI_API_KEY)
          adapters.push(
            geminiAdapter(env.GEMINI_API_KEY, name, company, isFree),
          );
        else logger.warn({ provider, model: name }, "provider.missing_api_key");
        break;
      case "groq":
        if (env.GROQ_API_KEY)
          adapters.push(groqAdapter(env.GROQ_API_KEY, name, company, isFree));
        else logger.warn({ provider, model: name }, "provider.missing_api_key");
        break;
      case "mistral":
        if (env.MISTRAL_API_KEY)
          adapters.push(
            mistralAdapter(env.MISTRAL_API_KEY, name, company, isFree),
          );
        else logger.warn({ provider, model: name }, "provider.missing_api_key");
        break;
      case "openrouter":
        if (env.OPENROUTER_API_KEY)
          adapters.push(
            openrouterAdapter(env.OPENROUTER_API_KEY, name, company, isFree),
          );
        else logger.warn({ provider, model: name }, "provider.missing_api_key");
        break;
    }
  }

  if (adapters.length === 0) {
    logger.warn(
      "no API keys configured for the selected models — comparison will return no responses",
    );
  }
  return adapters;
}
