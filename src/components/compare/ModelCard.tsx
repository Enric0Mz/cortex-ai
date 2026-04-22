import { useEffect, useRef, useState } from "react";
import {
  CheckIcon,
  ClockIcon,
  CopyIcon,
  DollarIcon,
  StarFilledIcon,
  StarIcon,
  TokenIcon,
} from "@/components/compare/icons";
import type { MockModel } from "@/components/compare/data";

type CardPhase = "waiting" | "streaming" | "done";
type VoteState = "none" | "self" | "other";

type ModelCardProps = {
  model: MockModel;
  streamSpeedMs: number;
  voteState: VoteState;
  onStreamDone: () => void;
  onVote: () => void;
};

export function ModelCard({
  model,
  streamSpeedMs,
  voteState,
  onStreamDone,
  onVote,
}: ModelCardProps) {
  const [phase, setPhase] = useState<CardPhase>("waiting");
  const [rendered, setRendered] = useState("");
  const [copied, setCopied] = useState(false);
  const onDoneRef = useRef(onStreamDone);
  useEffect(() => {
    onDoneRef.current = onStreamDone;
  }, [onStreamDone]);

  useEffect(() => {
    let cancelled = false;
    const timers: number[] = [];
    let i = 0;

    function tick() {
      if (cancelled) return;
      if (i >= model.text.length) {
        setPhase("done");
        onDoneRef.current();
        return;
      }
      const ch = model.text[i];
      let delay = streamSpeedMs + Math.random() * streamSpeedMs * 0.6;
      if (".,!?:;".includes(ch)) delay += 80;
      if (ch === "\n") delay += 40;
      i += 1;
      setRendered(model.text.slice(0, i));
      timers.push(window.setTimeout(tick, delay));
    }

    const startTimer = window.setTimeout(() => {
      if (cancelled) return;
      setPhase("streaming");
      tick();
    }, model.startDelayMs);

    return () => {
      cancelled = true;
      window.clearTimeout(startTimer);
      timers.forEach(window.clearTimeout);
    };
  }, [model, streamSpeedMs]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(model.text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard denied — no-op
    }
  }

  const isWinner = voteState === "self";
  const isDimmed = voteState === "other";
  const canInteract = phase === "done";
  const voteLocked = voteState !== "none";

  return (
    <article
      className={`flex min-h-[320px] flex-col overflow-hidden rounded-2xl bg-white transition-[border-color,box-shadow,opacity] duration-200 ${
        isWinner
          ? "border-[1.5px] border-[color:var(--purple)] shadow-[0_0_0_4px_rgba(124,58,237,0.09)]"
          : isDimmed
            ? "border border-[color:var(--border)] opacity-50 hover:opacity-65"
            : "border border-[color:var(--border)] hover:border-[color:var(--purple-light)]"
      }`}
    >
      <header className="flex items-center gap-2.5 border-b border-[color:var(--bg2)] px-3.5 pt-3.5 pb-3">
        <span
          aria-hidden="true"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[13px] font-semibold tracking-[-0.01em]"
          style={{ background: model.bg, color: model.color }}
        >
          {model.initial}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold leading-[1.2] tracking-[-0.01em] text-ink">
            {model.name}
          </div>
          <div className="mt-px text-[11px] leading-[1.3] text-ink-3">
            {model.sub}
          </div>
        </div>

        {isWinner ? (
          <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-[var(--radius-pill)] bg-[color:var(--purple-pale)] px-2.5 py-[3px] text-[11px] font-semibold text-[color:var(--purple)]">
            <StarFilledIcon />
            Vencedor
          </span>
        ) : (
          <CardStatusLabel phase={phase} latency={model.latency} />
        )}
      </header>

      <div className="flex-1 whitespace-pre-wrap px-3.5 py-3.5 text-[13.5px] leading-[1.7] text-ink-2">
        {phase === "waiting" ? (
          <span
            aria-hidden="true"
            className="inline-block h-4 w-[2px] align-[-0.1em] bg-[color:var(--purple-light)] [animation:var(--animate-cursor)]"
          />
        ) : (
          <>
            {rendered}
            {phase === "streaming" && (
              <span
                aria-hidden="true"
                className="ml-[1px] inline-block h-4 w-[2px] align-[-0.1em] bg-[color:var(--purple-light)] [animation:var(--animate-cursor)]"
              />
            )}
          </>
        )}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[color:var(--bg2)] px-3.5 py-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <MetaChip
            icon={<ClockIcon />}
            label={phase === "done" ? model.latency : "—"}
            active={phase === "done"}
          />
          <MetaChip
            icon={<DollarIcon />}
            label={phase === "done" ? model.cost : "—"}
            active={phase === "done"}
          />
          <MetaChip
            icon={<TokenIcon />}
            label={phase === "done" ? `${model.tokens} tok` : "—"}
            active={phase === "done"}
          />
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!canInteract}
            aria-label="Copiar resposta"
            className={`flex h-[30px] w-[30px] items-center justify-center rounded-lg transition-colors disabled:cursor-default disabled:opacity-50 ${
              copied
                ? "bg-[rgba(14,143,110,0.08)] text-[color:var(--success)]"
                : "text-ink-3 hover:bg-[color:var(--bg2)] hover:text-ink-2"
            }`}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </button>
          <button
            type="button"
            onClick={onVote}
            disabled={!canInteract || voteLocked}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-pill)] border px-3 py-1.5 text-[12px] font-medium tracking-[-0.005em] transition-colors disabled:cursor-default ${
              isWinner
                ? "border-[color:var(--purple)] bg-[color:var(--purple)] text-white"
                : "border-[color:var(--border)] text-ink-2 hover:border-[color:var(--purple-light)] hover:bg-[color:var(--purple-pale)] hover:text-[color:var(--purple)] disabled:opacity-60"
            }`}
          >
            {isWinner ? <StarFilledIcon /> : <StarIcon />}
            {isWinner ? "Votado" : "Votar"}
          </button>
        </div>
      </footer>
    </article>
  );
}

function CardStatusLabel({
  phase,
  latency,
}: {
  phase: CardPhase;
  latency: string;
}) {
  const text =
    phase === "waiting"
      ? "Aguardando…"
      : phase === "streaming"
        ? "Digitando…"
        : latency;
  return (
    <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[11px] font-medium tracking-[-0.005em] text-ink-3">
      <span
        aria-hidden="true"
        className={`h-[5px] w-[5px] rounded-full ${
          phase === "done"
            ? "bg-[color:var(--success)]"
            : "bg-[color:var(--purple-light)] [animation:var(--animate-sdot-pip)]"
        }`}
      />
      {text}
    </span>
  );
}

function MetaChip({
  icon,
  label,
  active,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-[color:var(--bg2)] px-2 py-[3px] font-mono text-[10.5px] tracking-[-0.01em] text-ink-3 transition-opacity ${
        active ? "opacity-100" : "opacity-40"
      }`}
    >
      <span aria-hidden="true" className="opacity-60">
        {icon}
      </span>
      {label}
    </span>
  );
}
