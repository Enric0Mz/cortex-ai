import { ROTATING_TEXT_INTERVAL_MS } from "@/lib/constants";

type RotatorProps = {
  phrases: readonly string[];
};

export function Rotator({ phrases }: RotatorProps) {
  const totalMs = phrases.length * ROTATING_TEXT_INTERVAL_MS;

  return (
    <span className="relative inline-flex items-baseline align-baseline">
      <span className="invisible whitespace-nowrap" aria-hidden="true">
        {phrases.reduce((a, b) => (a.length >= b.length ? a : b))}
      </span>

      <span
        aria-hidden="true"
        className="absolute inset-0 text-[color:var(--purple)]"
      >
        {phrases.map((phrase, i) => (
          <span
            key={phrase}
            className="rotator-phrase"
            style={{
              animationDelay: `${i * ROTATING_TEXT_INTERVAL_MS}ms`,
              animationDuration: `${totalMs}ms`,
            }}
          >
            {phrase}
          </span>
        ))}
      </span>

      <span
        aria-hidden="true"
        className="ml-1 inline-block h-[0.9em] w-[3px] translate-y-[0.05em] bg-[color:var(--purple)] [animation:var(--animate-blink)]"
      />

      <span className="sr-only">{phrases.join(", ")}</span>
    </span>
  );
}
