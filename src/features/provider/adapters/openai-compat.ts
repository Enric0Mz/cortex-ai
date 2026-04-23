import { ProviderError } from "@/lib/errors";
import { tryCatch } from "@/lib/result";
import type { ProviderResult } from "@/features/comparison/schemas";
import type { ProviderId } from "@/features/ai-models/schemas";
import type { ProviderAdapter } from "../types";

interface OpenAICompatConfig {
  id: ProviderId;
  baseUrl: string;
  apiKey: string;
  model: string;
  modelProvider: string;
  extraHeaders?: Record<string, string>;
}

interface OpenAIChatResponse {
  choices: Array<{
    message: { content: string };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
}

export function openAIChatAdapter(config: OpenAICompatConfig): ProviderAdapter {
  return {
    id: config.id,
    model: config.model,
    async generate(prompt, signal) {
      const started = Date.now();
      return tryCatch<ProviderResult, ProviderError>(
        async () => {
          const response = await fetch(`${config.baseUrl}/chat/completions`, {
            method: "POST",
            signal,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${config.apiKey}`,
              ...config.extraHeaders,
            },
            body: JSON.stringify({
              model: config.model,
              messages: [{ role: "user", content: prompt }],
            }),
          });

          if (!response.ok) {
            const body = await response.text();
            throw new Error(`HTTP ${response.status}: ${body.slice(0, 200)}`);
          }

          const data = (await response.json()) as OpenAIChatResponse;
          const content = data.choices?.[0]?.message?.content;
          if (typeof content !== "string") {
            throw new Error("empty response from provider");
          }

          return {
            aiModel: { name: config.model, provider: config.modelProvider },
            content,
            inputTokens: data.usage?.prompt_tokens ?? 0,
            outputTokens: data.usage?.completion_tokens ?? 0,
            costUsd: 0,
            latencyMs: Date.now() - started,
          };
        },
        (cause) =>
          new ProviderError(
            config.id,
            cause instanceof Error ? cause.message : String(cause),
            cause,
          ),
      );
    },
  };
}
