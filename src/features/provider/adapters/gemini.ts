import { ProviderError } from "@/lib/errors";
import { tryCatch } from "@/lib/result";
import type { ProviderResult } from "@/features/comparison/schemas";
import type { CompanyId } from "@/features/ai-models/schemas";
import type { ProviderAdapter, StreamYield } from "../types";
import { parseSSELines } from "../lib/sse";

interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
  };
}

interface GeminiStreamChunk {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
  }>;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
  };
}

export function geminiAdapter(
  apiKey: string,
  model: string,
  company: CompanyId,
  isFree: boolean,
): ProviderAdapter {
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
          if (typeof content !== "string" || content.length === 0) {
            throw new Error("provider returned no content");
          }

          return {
            aiModel: { name: model, provider: "gemini", company, isFree },
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
    streamGenerate(prompt, signal) {
      return geminiStream(apiKey, model, company, isFree, prompt, signal);
    },
  };
}

async function* geminiStream(
  apiKey: string,
  model: string,
  company: CompanyId,
  isFree: boolean,
  prompt: string,
  signal: AbortSignal,
): AsyncIterable<StreamYield> {
  const started = Date.now();
  let accumulated = "";
  let inputTokens = 0;
  let outputTokens = 0;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`HTTP ${response.status}: ${body.slice(0, 200)}`);
    }

    for await (const payload of parseSSELines(response.body)) {
      if (payload === "[DONE]") break;
      let chunk: GeminiStreamChunk;
      try {
        chunk = JSON.parse(payload) as GeminiStreamChunk;
      } catch {
        continue;
      }
      const parts = chunk.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (typeof part.text === "string" && part.text.length > 0) {
            accumulated += part.text;
            yield { type: "delta", text: part.text };
          }
        }
      }
      if (chunk.usageMetadata) {
        inputTokens = chunk.usageMetadata.promptTokenCount ?? inputTokens;
        outputTokens = chunk.usageMetadata.candidatesTokenCount ?? outputTokens;
      }
    }
  } catch (cause) {
    yield {
      type: "error",
      error: new ProviderError(
        "gemini",
        cause instanceof Error ? cause.message : String(cause),
        cause,
      ),
    };
    return;
  }

  if (accumulated.length === 0) {
    yield {
      type: "error",
      error: new ProviderError("gemini", "provider returned no content"),
    };
    return;
  }

  yield {
    type: "done",
    result: {
      aiModel: { name: model, provider: "gemini", company, isFree },
      content: accumulated,
      inputTokens,
      outputTokens: outputTokens || accumulated.length,
      costUsd: 0,
      latencyMs: Date.now() - started,
    },
  };
}
