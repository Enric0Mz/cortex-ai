import { PROVIDER_MODELS } from "@/lib/constants";
import { ProviderError } from "@/lib/errors";
import { ok, err } from "@/lib/result";
import type { ProviderId } from "@/features/comparison/schemas";
import type { ProviderAdapter } from "../types";

// Deterministic in-process adapter used when USE_FAKE_PROVIDERS=true.
// Prompts control per-call behavior so e2e tests can exercise partial
// failures and timeouts without mocking fetch across process boundaries.
export function fakeAdapter(id: ProviderId): ProviderAdapter {
  const model = PROVIDER_MODELS[id];
  return {
    id,
    model,
    async generate(prompt, signal) {
      const started = Date.now();

      if (prompt.includes(`__fail:${id}`) || prompt.includes("__fail:all")) {
        return err(new ProviderError(id, "simulated failure"));
      }

      if (
        prompt.includes(`__timeout:${id}`) ||
        prompt.includes("__timeout:all")
      ) {
        try {
          await new Promise<void>((_, reject) => {
            if (signal.aborted) {
              reject(new Error("aborted"));
              return;
            }
            signal.addEventListener(
              "abort",
              () => reject(new Error("aborted")),
              { once: true },
            );
          });
        } catch (cause) {
          return err(
            new ProviderError(
              id,
              cause instanceof Error ? cause.message : String(cause),
              cause,
            ),
          );
        }
      }

      return ok({
        provider: id,
        aiModel: { name: model, provider: id },
        content: `[fake:${id}] ${prompt}`,
        inputTokens: prompt.length,
        outputTokens: prompt.length + id.length,
        costUsd: 0,
        latencyMs: Date.now() - started,
      });
    },
  };
}
