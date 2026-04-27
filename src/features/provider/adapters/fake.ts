import { ProviderError } from "@/lib/errors";
import { ok, err } from "@/lib/result";
import type { CompanyId, ProviderId } from "@/features/ai-models/schemas";
import type { ProviderAdapter, StreamYield } from "../types";

// Deterministic in-process adapter used when USE_FAKE_PROVIDERS=true.
// Prompts control per-call behavior so e2e tests can exercise partial
// failures and timeouts without mocking fetch across process boundaries.
//
// Sentinels:
//   __fail:<id> / __fail:all          fail before emitting anything
//   __timeout:<id> / __timeout:all    hang until the signal aborts
//   __streamfail:<id>                 emit 2 deltas then fail mid-stream
//   __chunks:<n>                      split stream into exactly n deltas
// Two adapters that share an id (same provider, different models) react to
// `<id>` sentinels together — tests should pick distinct providers or assert
// aggregates.
export function fakeAdapter(
  id: ProviderId,
  model: string,
  company: CompanyId,
  isFree: boolean,
): ProviderAdapter {
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
          await waitForAbort(signal);
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
        aiModel: { name: model, provider: id, company, isFree },
        content: `[fake:${id}] ${prompt}`,
        inputTokens: prompt.length,
        outputTokens: prompt.length + id.length,
        costUsd: 0,
        latencyMs: Date.now() - started,
      });
    },
    streamGenerate(prompt, signal) {
      return fakeStream(id, model, company, isFree, prompt, signal);
    },
  };
}

async function* fakeStream(
  id: ProviderId,
  model: string,
  company: CompanyId,
  isFree: boolean,
  prompt: string,
  signal: AbortSignal,
): AsyncIterable<StreamYield> {
  const started = Date.now();

  if (prompt.includes(`__fail:${id}`) || prompt.includes("__fail:all")) {
    yield { type: "error", error: new ProviderError(id, "simulated failure") };
    return;
  }

  if (prompt.includes(`__timeout:${id}`) || prompt.includes("__timeout:all")) {
    try {
      await waitForAbort(signal);
    } catch (cause) {
      yield {
        type: "error",
        error: new ProviderError(
          id,
          cause instanceof Error ? cause.message : String(cause),
          cause,
        ),
      };
      return;
    }
  }

  const full = `[fake:${id}] ${prompt}`;
  const streamFail = prompt.includes(`__streamfail:${id}`);
  // streamfail emits 2 deltas then errors, so we need at least 3 chunks to
  // have something to emit before the failure index.
  const chunks = chunkFor(prompt, full, streamFail ? 4 : 1);
  const failAfter = streamFail ? 2 : -1;

  let emitted = "";
  for (let i = 0; i < chunks.length; i++) {
    if (signal.aborted) {
      yield { type: "error", error: new ProviderError(id, "aborted") };
      return;
    }
    if (i === failAfter) {
      yield {
        type: "error",
        error: new ProviderError(id, "simulated stream failure"),
      };
      return;
    }
    emitted += chunks[i];
    yield { type: "delta", text: chunks[i] };
    await microtaskTick();
  }

  yield {
    type: "done",
    result: {
      aiModel: { name: model, provider: id, company, isFree },
      content: emitted,
      inputTokens: prompt.length,
      outputTokens: emitted.length,
      costUsd: 0,
      latencyMs: Date.now() - started,
    },
  };
}

function chunkFor(prompt: string, full: string, minChunks: number): string[] {
  const match = prompt.match(/__chunks:(\d+)/);
  const requested = match ? Math.max(1, parseInt(match[1], 10)) : 1;
  const n = Math.max(requested, minChunks);
  if (n === 1) return [full];
  const size = Math.ceil(full.length / n);
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const start = i * size;
    const end = i === n - 1 ? full.length : Math.min(full.length, start + size);
    out.push(full.slice(start, end));
  }
  return out;
}

function microtaskTick(): Promise<void> {
  return new Promise((resolve) => queueMicrotask(resolve));
}

function waitForAbort(signal: AbortSignal): Promise<void> {
  return new Promise((_, reject) => {
    if (signal.aborted) {
      reject(new Error("aborted"));
      return;
    }
    signal.addEventListener("abort", () => reject(new Error("aborted")), {
      once: true,
    });
  });
}
