import { ArrowRightSmallIcon } from "@/components/compare/icons";

type StatusRowProps = {
  allDone: boolean;
  totalCount: number;
  votingEnabled: boolean;
};

export function StatusRow({
  allDone,
  totalCount,
  votingEnabled,
}: StatusRowProps) {
  const pluralize = totalCount > 1;
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-[12px] font-medium tracking-[-0.005em] text-ink-3">
        <span
          className={`h-1.5 w-1.5 rounded-full ${
            allDone
              ? "bg-[color:var(--success)]"
              : "bg-[color:var(--purple)] [animation:var(--animate-sdot)]"
          }`}
          aria-hidden="true"
        />
        {allDone
          ? `${totalCount} resposta${pluralize ? "s" : ""} gerada${pluralize ? "s" : ""}`
          : "Gerando respostas…"}
      </span>

      <span
        aria-live="polite"
        className={`flex items-center gap-1.5 text-[12px] font-medium text-ink-3 transition-opacity duration-300 ${
          votingEnabled ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      >
        Todas as respostas prontas — vote na melhor
        <ArrowRightSmallIcon />
      </span>
    </div>
  );
}
