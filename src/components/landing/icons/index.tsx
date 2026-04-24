import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const baseProps = {
  fill: "none",
  stroke: "currentColor",
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function ArrowRight(props: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      width="18"
      height="18"
      strokeWidth={1.7}
      aria-hidden="true"
      {...baseProps}
      {...props}
    >
      <path d="M4 10h12" />
      <path d="M11 5l5 5-5 5" />
    </svg>
  );
}

export function PlayTriangle(props: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      width="14"
      height="14"
      strokeWidth={1.6}
      aria-hidden="true"
      {...baseProps}
      fill="currentColor"
      stroke="none"
      {...props}
    >
      <path d="M6 4.5v11l9-5.5-9-5.5z" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      strokeWidth={1.6}
      aria-hidden="true"
      {...baseProps}
      {...props}
    >
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </svg>
  );
}

export function StarFilled(props: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      width="14"
      height="14"
      strokeWidth={1.5}
      aria-hidden="true"
      {...baseProps}
      fill="currentColor"
      stroke="currentColor"
      {...props}
    >
      <path d="M10 2.5l2.35 4.76 5.25.76-3.8 3.7.9 5.23L10 14.5l-4.7 2.46.9-5.24-3.8-3.7 5.25-.76L10 2.5z" />
    </svg>
  );
}

export function StarOutline(props: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      width="14"
      height="14"
      strokeWidth={1.5}
      aria-hidden="true"
      {...baseProps}
      {...props}
    >
      <path d="M10 2.5l2.35 4.76 5.25.76-3.8 3.7.9 5.23L10 14.5l-4.7 2.46.9-5.24-3.8-3.7 5.25-.76L10 2.5z" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 14 14"
      width="14"
      height="14"
      strokeWidth={1.6}
      aria-hidden="true"
      {...baseProps}
      {...props}
    >
      <path d="M7 2v10" />
      <path d="M2 7h10" />
    </svg>
  );
}

export function MicIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 14 14"
      width="14"
      height="14"
      strokeWidth={1.4}
      aria-hidden="true"
      {...baseProps}
      {...props}
    >
      <rect x="4.5" y="1" width="5" height="8" rx="2.5" />
      <path d="M2 7.5a5 5 0 0 0 10 0" />
      <path d="M7 12.5v1" />
    </svg>
  );
}

export function SubmitArrowIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 13 13"
      width="13"
      height="13"
      strokeWidth={1.5}
      aria-hidden="true"
      {...baseProps}
      {...props}
    >
      <path d="M2 6.5h9" />
      <path d="M7.5 3l4 3.5-4 3.5" />
    </svg>
  );
}

export function BrandMark(props: IconProps) {
  return (
    <svg
      viewBox="0 0 28 28"
      width="28"
      height="28"
      aria-hidden="true"
      fill="none"
      {...props}
    >
      <circle
        cx="14"
        cy="14"
        r="5"
        fill="#f5f1e8"
        stroke="#1f1a12"
        strokeWidth="1.5"
      />
      <circle cx="5" cy="7" r="2.3" fill="#7c3aed" />
      <circle cx="23" cy="7" r="2.3" fill="#7c3aed" />
      <circle cx="5" cy="21" r="2.3" fill="#7c3aed" />
      <circle cx="23" cy="21" r="2.3" fill="#7c3aed" />
      <path
        d="M9 10l-3-2m13 2l3-2m-13 8l-3 2m13-2l3 2"
        stroke="#1f1a12"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.45"
      />
    </svg>
  );
}

export function FilterIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      strokeWidth={1.5}
      aria-hidden="true"
      {...baseProps}
      {...props}
    >
      <path d="M14 4H2" />
      <path d="M11.5 8H4.5" />
      <path d="M9 12H7" />
    </svg>
  );
}

export function CheckSquareIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      strokeWidth={1.5}
      aria-hidden="true"
      {...baseProps}
      fill="var(--purple)"
      stroke="none"
      {...props}
    >
      <rect x="0" y="0" width="16" height="16" rx="4" />
      <path
        d="M4.5 8l2.5 2.5 4.5-4.5"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function SquareIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      strokeWidth={1.5}
      aria-hidden="true"
      {...baseProps}
      {...props}
    >
      <rect x="1" y="1" width="14" height="14" rx="4" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      strokeWidth={1.5}
      aria-hidden="true"
      {...baseProps}
      {...props}
    >
      <circle cx="7" cy="7" r="4.5" />
      <path d="M10.5 10.5L14 14" />
    </svg>
  );
}
