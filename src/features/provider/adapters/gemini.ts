import { ProviderError } from "@/lib/errors";
import { tryCatch } from "@/lib/result";
import type { ProviderResult } from "@/features/comparison/schemas";
import type { ProviderAdapter } from "../types";

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
  };
}

export function geminiAdapter(apiKey: string, model: string): ProviderAdapter {
  return {
    id: "gemini",
    model,
    async generate(prompt, signal) {
      const started = Date.now();
      return tryCatch<ProviderResult, ProviderError>(
        async () => {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
          const response = await fetch(url, {
            method: "POST",
            signal,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
            }),
          });

          if (!response.ok) {
            const body = await response.text();
            throw new Error(`HTTP ${response.status}: ${body.slice(0, 200)}`);
          }

          const data = (await response.json()) as GeminiResponse;
          const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (typeof content !== "string") {
            throw new Error("empty response from provider");
          }

          return {
            aiModel: { name: model, provider: "gemini" },
            content,
            inputTokens: data.usageMetadata?.promptTokenCount ?? 0,
            outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
            costUsd: 0,
            latencyMs: Date.now() - started,
          };
        },
        (cause) =>
          new ProviderError(
            "gemini",
            cause instanceof Error ? cause.message : String(cause),
            cause,
          ),
      );
    },
  };
}
