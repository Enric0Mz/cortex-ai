type LiveBadgeProps = {
  count?: number;
};

const formatter = new Intl.NumberFormat("pt-BR");

export function LiveBadge({ count = 1842 }: LiveBadgeProps) {
  return (
    <div className="inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-[color:var(--purple)]/25 bg-[color:var(--purple-pale)]/70 px-3 py-1.5 text-[12.5px] font-medium text-[color:var(--purple)]">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-[color:var(--purple)] opacity-70 [animation:var(--animate-pulse-dot)]" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--purple)]" />
      </span>
      Beta aberto · {formatter.format(count)} comparações hoje
    </div>
  );
}
