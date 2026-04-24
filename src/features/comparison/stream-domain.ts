import {
  ServiceUnavailableError,
  ValidationError,
  ProviderError,
} from "@/lib/errors";
import { err, ok, type Result } from "@/lib/result";
import type { AiModel } from "@/features/ai-models/schemas";
import type {
  ComparisonResponseItem,
  CreateComparisonRequest,
  ProviderResult,
} from "@/features/comparison/schemas";
import {
  buildAdapters,
  type AdapterSelection,
} from "@/features/provider/registry";
import type { StreamYield } from "@/features/provider/types";
import type { StreamEvent } from "./stream-schemas";
import {
  CreateComparison,
  CreateOneComparisonResponse,
  FindModelsByIds,
  type ModelSelection,
} from "./repository";

export type StreamSetupError = ServiceUnavailableError | ValidationError;

type InternalEvent =
  | { kind: "pump_yield"; selection: ModelSelection; chunk: StreamYield }
  | { kind: "pump_done"; selection: ModelSelection };

export async function streamComparison(
  userId: string,
  input: CreateComparisonRequest,
  signal: AbortSignal,
): Promise<Result<AsyncIterable<StreamEvent>, StreamSetupError>> {
  const modelsResult = await FindModelsByIds(input.models);
  if (!modelsResult.ok) return err(modelsResult.error);
  if (modelsResult.value.length !== input.models.length) {
    return err(new ValidationError("one or more model ids are unknown"));
  }
  const selections = modelsResult.value;

  const comparisonResult = await CreateComparison(userId, input);
  if (!comparisonResult.ok) return err(comparisonResult.error);
  const { id: comparisonId, createdAt } = comparisonResult.value;

  return ok(runStream(comparisonId, createdAt, input, selections, signal));
}

async function* runStream(
  comparisonId: string,
  createdAt: Date,
  input: CreateComparisonRequest,
  selections: ModelSelection[],
  signal: AbortSignal,
): AsyncIterable<StreamEvent> {
  const adapterSelections: AdapterSelection[] = selections.map((s) => ({
    provider: s.provider,
    name: s.name,
  }));
  const adapters = buildAdapters(adapterSelections);
  const adapterToSelection = new Map<
    string,
    ModelSelection
  >();
  for (const s of selections) {
    adapterToSelection.set(keyOf(s.provider, s.name), s);
  }

  yield {
    event: "comparison.created",
    data: {
      comparisonId,
      prompt: input.prompt,
      createdAt: createdAt.toISOString(),
      selections: selections.map((s) => ({
        aiModel: { name: s.name, provider: s.provider },
      })),
    },
  };

  if (adapters.length === 0) {
    yield { event: "done", data: { comparisonId } };
    return;
  }

  const queue = new AsyncQueue<InternalEvent>();
  let active = 0;

  for (const adapter of adapters) {
    const selection = adapterToSelection.get(keyOf(adapter.id, adapter.model));
    if (!selection) continue;
    active++;
    void pump(adapter.streamGenerate(input.prompt, signal), selection, queue);
  }

  while (active > 0) {
    const evt = await queue.take();

    if (evt.kind === "pump_done") {
      active--;
      continue;
    }

    const { selection, chunk } = evt;
    const aiModel: AiModel = { name: selection.name, provider: selection.provider };

    if (chunk.type === "delta") {
      yield {
        event: "provider.delta",
        data: { aiModel, text: chunk.text },
      };
    } else if (chunk.type === "done") {
      const persisted = signal.aborted
        ? null
        : await CreateOneComparisonResponse(comparisonId, chunk.result, selection.id);
      const response = toOkResponse(
        persisted && persisted.ok ? persisted.value.id : null,
        chunk.result,
      );
      yield {
        event: "provider.completed",
        data: { aiModel, response },
      };
    } else {
      yield {
        event: "provider.failed",
        data: {
          aiModel,
          response: toFailedResponse(aiModel, chunk.error),
        },
      };
    }
  }

  yield { event: "done", data: { comparisonId } };
}

async function pump(
  iterable: AsyncIterable<StreamYield>,
  selection: ModelSelection,
  queue: AsyncQueue<InternalEvent>,
): Promise<void> {
  try {
    for await (const chunk of iterable) {
      queue.push({ kind: "pump_yield", selection, chunk });
    }
  } catch (cause) {
    const error =
      cause instanceof ProviderError
        ? cause
        : new ProviderError(
            selection.provider,
            cause instanceof Error ? cause.message : String(cause),
            cause,
          );
    queue.push({
      kind: "pump_yield",
      selection,
      chunk: { type: "error", error },
    });
  } finally {
    queue.push({ kind: "pump_done", selection });
  }
}

function keyOf(provider: string, name: string): string {
  return `${provider}|${name}`;
}

function toOkResponse(
  id: string | null,
  result: ProviderResult,
): ComparisonResponseItem {
  if (!id) {
    return {
      aiModel: result.aiModel,
      status: "failed",
      error: "model not registered",
      latencyMs: result.latencyMs,
    };
  }
  return { id, status: "ok", ...result };
}

function toFailedResponse(
  aiModel: AiModel,
  error: ProviderError,
): ComparisonResponseItem {
  return {
    aiModel,
    status: "failed",
    error: error.message,
    latencyMs: 0,
  };
}

// FIFO with a single resolver-based wakeup. Pumps `push` concurrently;
// the multiplexer `take`s in order. No polling, no Promise.race footguns.
class AsyncQueue<T> {
  private items: T[] = [];
  private wake: (() => void) | null = null;

  push(item: T): void {
    this.items.push(item);
    const w = this.wake;
    if (w) {
      this.wake = null;
      w();
    }
  }

  async take(): Promise<T> {
    if (this.items.length > 0) return this.items.shift()!;
    await new Promise<void>((resolve) => {
      this.wake = resolve;
    });
    return this.items.shift()!;
  }
}
