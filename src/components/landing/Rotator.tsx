import { useEffect, useState } from "react";

type RotatorProps = {
  phrases: readonly string[];
};

export function Rotator({ phrases }: RotatorProps) {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);

  useEffect(() => {
    if (phrases.length === 0) return;

    if (isWaiting) {
      const timer = setTimeout(() => setIsWaiting(false), 2000);
      return () => clearTimeout(timer);
    }

    const currentPhrase = phrases[index];

    if (isDeleting) {
      if (subIndex === 0) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsDeleting(false);
        setIndex((index + 1) % phrases.length);
        return;
      }

      const timer = setTimeout(() => {
        setSubIndex((prev) => prev - 1);
      }, 40); // fast erase speed
      return () => clearTimeout(timer);
    }

    if (subIndex === currentPhrase.length) {
      setIsWaiting(true);
      setIsDeleting(true);
      return;
    }

    const timer = setTimeout(() => {
      setSubIndex((prev) => prev + 1);
    }, 80); // typing speed
    return () => clearTimeout(timer);
  }, [subIndex, index, isDeleting, isWaiting, phrases]);

  const currentPhrase = phrases[index] || "";
  const displayedText = currentPhrase.slice(0, subIndex);

  return (
    <span className="relative inline-flex items-baseline align-baseline text-[color:var(--purple)]">
      {/* Invisible element to reserve max width, so layout doesn't jump */}
      <span className="invisible whitespace-nowrap" aria-hidden="true">
        {phrases.reduce((a, b) => (a.length >= b.length ? a : b))}
      </span>

      <span
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center whitespace-nowrap"
      >
        {displayedText}
        <span
          className={`ml-[4px] inline-block h-[0.9em] w-[3px] translate-y-[0.05em] bg-[color:var(--purple)] transition-opacity duration-100 ${
            isWaiting ? "[animation:var(--animate-blink)]" : ""
          }`}
        />
      </span>

      <span className="sr-only">{phrases.join(", ")}</span>
    </span>
  );
}
