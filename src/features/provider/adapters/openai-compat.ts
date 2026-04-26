import { ProviderError } from "@/lib/errors";
import { tryCatch } from "@/lib/result";
import type { ProviderResult } from "@/features/comparison/schemas";
import type { ProviderId } from "@/features/ai-models/schemas";
import type { ProviderAdapter, StreamYield } from "../types";
import { parseSSELines } from "../lib/sse";

interface OpenAICompatConfig {
  id: ProviderId;
  baseUrl: string;
  apiKey: string;
  model: string;
  modelProvider: ProviderId;
  isFree: boolean;
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

interface OpenAIChatStreamChunk {
  choices?: Array<{
    delta?: { content?: string };
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
            aiModel: {
              name: config.model,
              provider: config.modelProvider,
              isFree: config.isFree,
            },
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
    streamGenerate(prompt, signal) {
      return openAIChatStream(config, prompt, signal);
    },
  };
}

async function* openAIChatStream(
  config: OpenAICompatConfig,
  prompt: string,
  signal: AbortSignal,
): AsyncIterable<StreamYield> {
  const started = Date.now();
  let accumulated = "";
  let inputTokens = 0;
  let outputTokens = 0;

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        Accept: "text/event-stream",
        ...config.extraHeaders,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: "user", content: prompt }],
        stream: true,
        stream_options: { include_usage: true },
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`HTTP ${response.status}: ${body.slice(0, 200)}`);
    }

    for await (const payload of parseSSELines(response.body)) {
      if (payload === "[DONE]") break;
      let chunk: OpenAIChatStreamChunk;
      try {
        chunk = JSON.parse(payload) as OpenAIChatStreamChunk;
      } catch {
        continue;
      }
      const text = chunk.choices?.[0]?.delta?.content;
      if (typeof text === "string" && text.length > 0) {
        accumulated += text;
        yield { type: "delta", text };
      }
      if (chunk.usage) {
        inputTokens = chunk.usage.prompt_tokens ?? inputTokens;
        outputTokens = chunk.usage.completion_tokens ?? outputTokens;
      }
    }
  } catch (cause) {
    yield {
      type: "error",
      error: new ProviderError(
        config.id,
        cause instanceof Error ? cause.message : String(cause),
        cause,
      ),
    };
    return;
  }

  yield {
    type: "done",
    result: {
      aiModel: {
        name: config.model,
        provider: config.modelProvider,
        isFree: config.isFree,
      },
      content: accumulated,
      inputTokens,
      outputTokens: outputTokens || accumulated.length,
      costUsd: 0,
      latencyMs: Date.now() - started,
    },
  };
}
