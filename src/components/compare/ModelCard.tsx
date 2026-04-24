import { useEffect, useState } from "react";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  CopyIcon,
  DollarIcon,
  StarFilledIcon,
  StarIcon,
  TokenIcon,
  WarningIcon,
} from "@/components/compare/icons";

type CardPhase = "waiting" | "streaming" | "done" | "failed";
type VoteState = "none" | "self" | "other";

type ModelCardProps = {
  name: string;
  sub: string;
  initial: string;
  color: string;
  bg: string;
  phase: CardPhase;
  text: string;
  latency?: string;
  cost?: string;
  tokens?: string;
  errorCode?: string;
  voteState: VoteState;
  onVote: () => void;
};

export function ModelCard({
  name,
  sub,
  initial,
  color,
  bg,
  phase,
  text,
  latency,
  cost,
  tokens,
  errorCode,
  voteState,
  onVote,
}: ModelCardProps) {
  const [copied, setCopied] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  // Typewriter effect: revealing characters at a controlled pace
  useEffect(() => {
    if (phase === "waiting") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplayedText("");
      return;
    }

    if (displayedText.length >= text.length) return;

    const diff = text.length - displayedText.length;
    // Adaptive logic: far behind = jump more chars, near end = 1 char per tick
    const step = diff > 100 ? 12 : diff > 40 ? 4 : diff > 15 ? 2 : 1;
    const delay = diff > 60 ? 10 : 25;

    const timer = setTimeout(() => {
      setDisplayedText(text.slice(0, displayedText.length + step));
    }, delay);

    return () => clearTimeout(timer);
  }, [text, displayedText, phase]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard denied — no-op
    }
  }

  const isWinner = voteState === "self";
  const isDimmed = voteState === "other";
  const isFailed = phase === "failed";
  const canInteract = phase === "done";
  const voteLocked = voteState !== "none";
  const contentReady = !isFailed && phase !== "waiting";

  return (
    <article
      className={`flex min-h-[640px] flex-col overflow-hidden rounded-2xl bg-white transition-[border-color,box-shadow,opacity] duration-200 ${
        isWinner
          ? "border-[1.5px] border-[color:var(--purple)] shadow-[0_0_0_4px_rgba(124,58,237,0.09)]"
          : isFailed
            ? "border border-[color:var(--border)] opacity-80"
            : isDimmed
              ? "border border-[color:var(--border)] opacity-50 hover:opacity-65"
              : "border border-[color:var(--border)] hover:border-[color:var(--purple-light)]"
      }`}
    >
      <header className="flex items-center gap-2.5 border-b border-[color:var(--bg2)] px-3.5 pt-3.5 pb-3">
        <span
          aria-hidden="true"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[13px] font-semibold tracking-[-0.01em]"
          style={{ background: bg, color }}
        >
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold leading-[1.2] tracking-[-0.01em] text-ink">
            {name}
          </div>
          <div className="mt-px text-[11px] leading-[1.3] text-ink-3">
            {sub}
          </div>
        </div>

        {isWinner ? (
          <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-[var(--radius-pill)] bg-[color:var(--purple-pale)] px-2.5 py-[3px] text-[11px] font-semibold text-[color:var(--purple)]">
            <StarFilledIcon />
            Vencedor
          </span>
        ) : (
          <CardStatusLabel phase={phase} latency={latency} />
        )}
      </header>

      <div className="relative flex flex-1 flex-col">
        <div
          className={`relative flex-1 ${
            isExpanded ? "" : "max-h-[480px] overflow-hidden"
          }`}
        >
          <div className="whitespace-pre-wrap px-3.5 py-3.5 text-[13.5px] leading-[1.7] text-ink-2">
            {phase === "waiting" ? (
              <span
                aria-hidden="true"
                className="inline-block h-4 w-[2px] align-[-0.1em] bg-[color:var(--purple-light)] [animation:var(--animate-cursor)]"
              />
            ) : phase === "failed" ? (
              <div className="flex h-full flex-col items-center justify-center py-6 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#fdf5f0] text-[#d97757]">
                  <WarningIcon />
                </div>
                <h3 className="mb-2 text-[15px] font-semibold text-[#2a2218]">
                  Modelo indisponível
                </h3>
                <p className="max-w-[240px] text-[13px] leading-[1.5] text-ink-3">
                  Este modelo está com instabilidade no momento. Tente novamente
                  em alguns minutos.
                </p>
                {errorCode && (
                  <span className="mt-4 inline-flex items-center rounded-md bg-[#fdf5f0] px-2 py-0.5 font-mono text-[11px] font-medium text-[#d97757]">
                    {errorCode}
                  </span>
                )}
              </div>
            ) : (
              <>
                {displayedText}
                {(phase === "streaming" ||
                  displayedText.length < text.length) && (
                  <span
                    aria-hidden="true"
                    className="ml-[1px] inline-block h-4 w-[2px] align-[-0.1em] bg-[color:var(--purple-light)] [animation:var(--animate-cursor)]"
                  />
                )}
              </>
            )}
          </div>

          {!isExpanded && contentReady && (
            <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-24 bg-gradient-to-t from-white via-white/80 to-transparent" />
          )}
        </div>

        {contentReady && (
          <div className="px-3.5 pb-3 pt-2 mt-auto">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[rgba(124,58,237,0.15)] bg-[color:var(--purple-pale)] py-2 text-[13px] font-medium text-[color:var(--purple)] transition-colors hover:bg-[#eadeff]"
            >
              {isExpanded ? (
                <>
                  <ChevronUpIcon />
                  Recolher resposta
                </>
              ) : (
                <>
                  <ChevronDownIcon />
                  Expandir resposta
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <footer
        className={`flex flex-wrap items-center justify-between gap-2 border-t border-[color:var(--bg2)] px-3.5 py-2.5 transition-opacity ${
          isFailed
            ? "invisible h-0 overflow-hidden border-none py-0"
            : "visible"
        }`}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <MetaChip
            icon={<ClockIcon />}
            label={latency ?? "—"}
            active={phase === "done" || phase === "failed"}
          />
          <MetaChip
            icon={<DollarIcon />}
            label={cost ?? "—"}
            active={phase === "done"}
          />
          <MetaChip
            icon={<TokenIcon />}
            label={tokens ?? "—"}
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
  latency?: string;
}) {
  const text =
    phase === "waiting"
      ? "Aguardando…"
      : phase === "streaming"
        ? "Digitando…"
        : phase === "failed"
          ? "Indisponível"
          : (latency ?? "");
  const dotClass =
    phase === "done"
      ? "bg-[color:var(--success)]"
      : phase === "failed"
        ? "bg-[#d97757]"
        : "bg-[color:var(--purple-light)] [animation:var(--animate-sdot-pip)]";
  const textColorClass = phase === "failed" ? "text-[#d97757]" : "text-ink-3";
  const badgeClass =
    phase === "failed"
      ? "bg-[#fdf5f0] border-[#f4e2d8] border px-2 py-0.5 rounded-full"
      : "";

  return (
    <span
      className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[11px] font-medium tracking-[-0.005em] ${textColorClass} ${badgeClass}`}
    >
      <span
        aria-hidden="true"
        className={`h-[5px] w-[5px] rounded-full ${dotClass}`}
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
