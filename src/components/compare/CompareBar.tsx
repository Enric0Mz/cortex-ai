import Link from "next/link";
import {
  CluePromptIcon,
  CompareMarkIcon,
  PlusSmallIcon,
} from "@/components/compare/icons";

type CompareBarProps = {
  prompt: string;
  modelCount: number;
  onEditPrompt?: () => void;
};

export function CompareBar({
  prompt,
  modelCount,
  onEditPrompt,
}: CompareBarProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-[60] h-14 border-b border-[color:var(--border)]/70 bg-white/85 backdrop-blur-md backdrop-saturate-150">
      <div className="mx-auto grid h-full max-w-[1400px] grid-cols-[auto_1fr_auto] items-center gap-4 px-5">
        <Link
          href="/"
          aria-label="CortexAI — início"
          className="flex items-center gap-2"
        >
          <span className="flex h-[26px] w-[26px] items-center justify-center rounded-[7px] bg-[color:var(--ink)]">
            <CompareMarkIcon />
          </span>
          <span className="text-[14px] font-semibold tracking-[-0.015em] sm:inline hidden">
            CortexAI
          </span>
        </Link>

        <button
          type="button"
          onClick={onEditPrompt}
          title="Editar prompt"
          className="group flex min-w-0 items-center gap-2.5 rounded-[10px] border border-[color:var(--border)] bg-[color:var(--bg2)] px-3 py-[7px] text-left transition-colors hover:border-[color:var(--purple-light)] hover:bg-white"
        >
          <CluePromptIcon className="shrink-0 text-ink-3" />
          <span className="min-w-0 flex-1 truncate text-[13px] tracking-[-0.005em] text-ink-2">
            {prompt}
          </span>
          <span className="shrink-0 rounded-[var(--radius-pill)] bg-[color:var(--purple-pale)] px-2 py-0.5 text-[11px] font-medium text-[color:var(--purple)] sm:inline hidden">
            Editar
          </span>
        </button>

        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-[var(--radius-pill)] border border-[color:var(--border)] bg-[color:var(--bg2)] px-2.5 py-1 text-[12px] font-medium text-ink-3 tabular-nums">
            {modelCount} modelo{modelCount > 1 ? "s" : ""}
          </span>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-[color:var(--ink)] px-3.5 py-[7px] text-[12.5px] font-medium tracking-[-0.005em] text-[color:var(--bg)] transition-colors hover:bg-[#2a2218]"
          >
            <PlusSmallIcon />
            <span className="sm:inline hidden">Nova comparação</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
