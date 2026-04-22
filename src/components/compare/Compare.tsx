import { useMemo, useState } from "react";
import { CompareBar } from "@/components/compare/CompareBar";
import {
  MOCK_MODELS,
  MOCK_PROMPT,
  type ProviderKey,
} from "@/components/compare/data";
import { ModelCard } from "@/components/compare/ModelCard";
import { StatusRow } from "@/components/compare/StatusRow";
import { WinnerToast } from "@/components/compare/WinnerToast";

type CompareProps = {
  modelCount: 2 | 3 | 4;
  streamSpeedMs?: number;
};

export function Compare({ modelCount, streamSpeedMs = 11 }: CompareProps) {
  const models = useMemo(() => MOCK_MODELS.slice(0, modelCount), [modelCount]);
  const [doneIds, setDoneIds] = useState<Set<ProviderKey>>(new Set());
  const [votedId, setVotedId] = useState<ProviderKey | null>(null);
  const [toastVisible, setToastVisible] = useState(false);

  const allDone = doneIds.size === models.length;
  const votingEnabled = allDone && votedId === null;

  function markDone(id: ProviderKey) {
    setDoneIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  function castVote(id: ProviderKey) {
    if (votedId !== null || !allDone) return;
    setVotedId(id);
    setToastVisible(true);
    window.setTimeout(() => setToastVisible(false), 3500);
  }

  const gridCols = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-2",
  }[modelCount];

  return (
    <>
      <CompareBar prompt={MOCK_PROMPT} modelCount={modelCount} />

      <main className="min-h-screen pt-20 pb-20">
        <div className="mx-auto max-w-[1400px] px-5">
          <StatusRow
            allDone={allDone}
            totalCount={models.length}
            votingEnabled={votingEnabled}
          />

          <div className={`grid items-start gap-3.5 ${gridCols}`}>
            {models.map((model) => (
              <ModelCard
                key={model.id}
                model={model}
                streamSpeedMs={streamSpeedMs}
                voteState={
                  votedId === null
                    ? "none"
                    : votedId === model.id
                      ? "self"
                      : "other"
                }
                onStreamDone={() => markDone(model.id)}
                onVote={() => castVote(model.id)}
              />
            ))}
          </div>
        </div>
      </main>

      <WinnerToast visible={toastVisible} />
    </>
  );
}
