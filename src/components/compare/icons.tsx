import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const baseProps = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function ClockIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 13 13"
      width="11"
      height="11"
      strokeWidth={1.2}
      aria-hidden="true"
      {...baseProps}
      {...props}
    >
      <circle cx="6.5" cy="6.5" r="5.5" />
      <path d="M6.5 4v2.5L8 8" />
    </svg>
  );
}

export function DollarIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 12 12"
      width="11"
      height="11"
      strokeWidth={1.2}
      aria-hidden="true"
      {...baseProps}
      {...props}
    >
      <path d="M6 1v10" />
      <path d="M8.5 3.5H5a1.5 1.5 0 0 0 0 3h2a1.5 1.5 0 0 1 0 3H3" />
    </svg>
  );
}

export function TokenIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 12 12"
      width="11"
      height="11"
      strokeWidth={1.2}
      aria-hidden="true"
      {...baseProps}
      {...props}
    >
      <path d="M6 1l4 3v4L6 11 2 8V4l4-3z" />
    </svg>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 13 13"
      width="13"
      height="13"
      strokeWidth={1.2}
      aria-hidden="true"
      {...baseProps}
      {...props}
    >
      <rect x="4.5" y="4.5" width="7" height="7" rx="1.5" />
      <path d="M1.5 8.5V2a.5.5 0 0 1 .5-.5h6.5" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 13 13"
      width="13"
      height="13"
      strokeWidth={1.4}
      aria-hidden="true"
      {...baseProps}
      {...props}
    >
      <path d="M2.5 7L5 9.5l5.5-5.5" />
    </svg>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 12 12"
      width="11"
      height="11"
      strokeWidth={1.3}
      aria-hidden="true"
      {...baseProps}
      {...props}
    >
      <path d="M6 1l1.545 3.13 3.455.502-2.5 2.436.59 3.432L6 8.88l-3.09 1.62.59-3.432L1 5.632l3.455-.502L6 1z" />
    </svg>
  );
}

export function StarFilledIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 12 12"
      width="11"
      height="11"
      aria-hidden="true"
      fill="currentColor"
      {...props}
    >
      <path d="M6 1l1.545 3.13 3.455.502-2.5 2.436.59 3.432L6 8.88l-3.09 1.62.59-3.432L1 5.632l3.455-.502L6 1z" />
    </svg>
  );
}

export function CluePromptIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 13 13"
      width="13"
      height="13"
      strokeWidth={1.2}
      aria-hidden="true"
      {...baseProps}
      {...props}
    >
      <circle cx="6.5" cy="6.5" r="5.5" />
      <path d="M6.5 4v2.5l1.5 1.5" />
    </svg>
  );
}

export function PlusSmallIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 11 11"
      width="11"
      height="11"
      strokeWidth={1.5}
      aria-hidden="true"
      {...baseProps}
      {...props}
    >
      <path d="M5.5 1v9" />
      <path d="M1 5.5h9" />
    </svg>
  );
}

export function ArrowRightSmallIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 12 12"
      width="12"
      height="12"
      strokeWidth={1.3}
      aria-hidden="true"
      {...baseProps}
      {...props}
    >
      <path d="M2 6h8" />
      <path d="M6.5 2.5l4 3.5-4 3.5" />
    </svg>
  );
}

export function CompareMarkIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 18 18"
      width="14"
      height="14"
      aria-hidden="true"
      fill="none"
      {...props}
    >
      <path
        d="M9 9L3.5 4.5"
        stroke="#faf8f5"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.7"
      />
      <path
        d="M9 9L14.5 13.5"
        stroke="#faf8f5"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.7"
      />
      <circle cx="3.5" cy="4.5" r="1.5" fill="#7c3aed" />
      <circle cx="14.5" cy="13.5" r="1.5" fill="#7c3aed" />
      <circle cx="9" cy="9" r="2.2" fill="#faf8f5" />
    </svg>
  );
}

export function WarningIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      strokeWidth={1.5}
      aria-hidden="true"
      {...baseProps}
      {...props}
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      strokeWidth={2}
      aria-hidden="true"
      {...baseProps}
      {...props}
    >
      <path d="M23 4v6h-6" />
      <path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 12 12"
      width="12"
      height="12"
      strokeWidth={1.5}
      aria-hidden="true"
      {...baseProps}
      {...props}
    >
      <path d="M2 4.5l4 4 4-4" />
    </svg>
  );
}

export function ChevronUpIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 12 12"
      width="12"
      height="12"
      strokeWidth={1.5}
      aria-hidden="true"
      {...baseProps}
      {...props}
    >
      <path d="M2 7.5l4-4 4 4" />
    </svg>
  );
}
