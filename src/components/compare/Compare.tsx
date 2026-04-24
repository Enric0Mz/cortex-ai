import { useEffect, useMemo, useState } from "react";
import { CompareBar } from "@/components/compare/CompareBar";
import { providerChrome } from "@/components/compare/chrome";
import { ModelCard } from "@/components/compare/ModelCard";
import { StatusRow } from "@/components/compare/StatusRow";
import { WinnerToast } from "@/components/compare/WinnerToast";
import { formatCost, formatLatency, formatTokens } from "@/components/compare/format";
import { parseSSEStream } from "@/lib/sse-client";
import type { AiModelResponse } from "@/features/ai-models/schemas";

type CardPhase = "waiting" | "streaming" | "done" | "failed";

type CardState = {
  phase: CardPhase;
  text: string;
  latency?: string;
  cost?: string;
  tokens?: string;
  responseId?: string;
  error?: string;
  errorCode?: string;
};

type CompareProps = {
  prompt: string;
  selections: AiModelResponse[];
};

function keyOf(selection: { provider: string; name: string }): string {
  return `${selection.provider}|${selection.name}`;
}

export function Compare({ prompt, selections }: CompareProps) {
  const keys = useMemo(() => selections.map(keyOf), [selections]);
  const [cards, setCards] = useState<Record<string, CardState>>(() =>
    Object.fromEntries(
      keys.map((k) => [k, { phase: "waiting" as const, text: "" }]),
    ),
  );
  const [votedKey, setVotedKey] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    (async () => {
      let res: Response;
      try {
        res = await fetch("/api/v1/comparisons/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt,
            models: selections.map((s) => s.id),
          }),
          signal: controller.signal,
        });
      } catch (cause) {
        if (!cancelled) markAllFailed(setCards, keys, networkError(cause));
        return;
      }

      if (!res.ok) {
        const msg = await res.text().catch(() => `HTTP ${res.status}`);
        if (!cancelled) markAllFailed(setCards, keys, msg.slice(0, 200));
        return;
      }

      try {
        for await (const frame of parseSSEStream(res.body)) {
          if (cancelled) return;
          applyEvent(frame.event, frame.data, setCards);
        }
      } catch (cause) {
        if (!cancelled && !controller.signal.aborted) {
          markAllWaitingFailed(setCards, networkError(cause));
        }
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
    // Re-run only if the input identity changes — safe because pending stash
    // is consumed on navigation.
  }, [prompt, keys.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps

  const doneCount = Object.values(cards).filter(
    (c) => c.phase === "done" || c.phase === "failed",
  ).length;
  const allDone = doneCount === selections.length;
  const votingEnabled = allDone && votedKey === null;

  function castVote(key: string) {
    if (!allDone || votedKey !== null) return;
    const card = cards[key];
    if (!card || card.phase !== "done") return;
    setVotedKey(key);
    setToastVisible(true);
    window.setTimeout(() => setToastVisible(false), 3500);
  }

  const gridCols = gridColsFor(selections.length);

  return (
    <>
      <CompareBar prompt={prompt} modelCount={selections.length} />

      <main className="min-h-screen pt-20 pb-20">
        <div className="mx-auto max-w-[1400px] px-5">
          <StatusRow
            allDone={allDone}
            totalCount={selections.length}
            votingEnabled={votingEnabled}
          />

          <div className={`grid items-start gap-3.5 ${gridCols}`}>
            {selections.map((selection) => {
              const key = keyOf(selection);
              const card = cards[key] ?? { phase: "waiting", text: "" };
              const chrome = providerChrome(selection.provider, selection.name);
              return (
                <ModelCard
                  key={key}
                  name={selection.name}
                  sub={chrome.sub}
                  initial={chrome.initial}
                  color={chrome.color}
                  bg={chrome.bg}
                  phase={card.phase}
                  text={card.text}
                  latency={card.latency}
                  cost={card.cost}
                  tokens={card.tokens}
                  errorCode={card.errorCode}
                  voteState={
                    votedKey === null
                      ? "none"
                      : votedKey === key
                        ? "self"
                        : "other"
                  }
                  onVote={() => castVote(key)}
                />
              );
            })}
          </div>
        </div>
      </main>

      <WinnerToast visible={toastVisible} />
    </>
  );
}

function gridColsFor(n: number): string {
  if (n === 2) return "md:grid-cols-2";
  if (n === 3) return "md:grid-cols-3";
  return "md:grid-cols-2";
}

function applyEvent(
  event: string,
  data: unknown,
  setCards: React.Dispatch<React.SetStateAction<Record<string, CardState>>>,
): void {
  if (event === "provider.delta") {
    const e = data as { aiModel: { name: string; provider: string }; text: string };
    const key = `${e.aiModel.provider}|${e.aiModel.name}`;
    setCards((prev) => {
      const card = prev[key];
      if (!card) return prev;
      return {
        ...prev,
        [key]: {
          ...card,
          phase: card.phase === "done" || card.phase === "failed" ? card.phase : "streaming",
          text: card.text + e.text,
        },
      };
    });
    return;
  }

  if (event === "provider.completed") {
    const e = data as {
      aiModel: { name: string; provider: string };
      response:
        | {
            status: "ok";
            id: string;
            content: string;
            inputTokens: number;
            outputTokens: number;
            costUsd: number;
            latencyMs: number;
          }
        | { status: "failed"; error: string; latencyMs: number; errorCode?: string };
    };
    const key = `${e.aiModel.provider}|${e.aiModel.name}`;
    setCards((prev) => {
      const card = prev[key];
      if (!card) return prev;
      if (e.response.status === "ok") {
        return {
          ...prev,
          [key]: {
            ...card,
            phase: "done",
            text: e.response.content,
            latency: formatLatency(e.response.latencyMs),
            cost: formatCost(e.response.costUsd),
            tokens: formatTokens(e.response.outputTokens),
            responseId: e.response.id,
          },
        };
      }
      return {
        ...prev,
        [key]: {
          ...card,
          phase: "failed",
          error: e.response.error,
          errorCode: e.response.errorCode ?? "ERR_503",
          latency: formatLatency(e.response.latencyMs),
        },
      };
    });
    return;
  }

  if (event === "provider.failed") {
    const e = data as {
      aiModel: { name: string; provider: string };
      response: { error: string; latencyMs: number; errorCode?: string };
    };
    const key = `${e.aiModel.provider}|${e.aiModel.name}`;
    setCards((prev) => {
      const card = prev[key];
      if (!card) return prev;
      return {
        ...prev,
        [key]: {
          ...card,
          phase: "failed",
          error: e.response.error,
          errorCode: e.response.errorCode ?? "ERR_503",
          latency: formatLatency(e.response.latencyMs),
        },
      };
    });
    return;
  }
  // comparison.created and done are informational — no per-card update needed.
}

function markAllFailed(
  setCards: React.Dispatch<React.SetStateAction<Record<string, CardState>>>,
  keys: string[],
  message: string,
): void {
  setCards((prev) => {
    const next = { ...prev };
    for (const k of keys) {
      const card = next[k];
      if (!card) continue;
      next[k] = { ...card, phase: "failed", error: message };
    }
    return next;
  });
}

function markAllWaitingFailed(
  setCards: React.Dispatch<React.SetStateAction<Record<string, CardState>>>,
  message: string,
): void {
  setCards((prev) => {
    const next = { ...prev };
    for (const [k, card] of Object.entries(prev)) {
      if (card.phase === "waiting" || card.phase === "streaming") {
        next[k] = { ...card, phase: "failed", error: message };
      }
    }
    return next;
  });
}

function networkError(cause: unknown): string {
  if (cause instanceof Error) return cause.message;
  return "Falha de rede";
}
