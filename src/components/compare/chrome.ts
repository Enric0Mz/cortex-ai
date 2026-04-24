import type { ProviderId } from "@/features/ai-models/schemas";

export const PROVIDER_COLORS: Record<ProviderId, string> = {
  gemini: "#3b82f6",
  groq: "#e87d2e",
  mistral: "#b8623c",
  openrouter: "#0e8f6e",
};

const PROVIDER_LABELS: Record<ProviderId, string> = {
  gemini: "Google",
  groq: "Groq",
  mistral: "Mistral AI",
  openrouter: "OpenRouter",
};

export type ProviderChrome = {
  initial: string;
  color: string;
  bg: string;
  sub: string;
};

export function providerChrome(
  provider: string,
  name: string,
): ProviderChrome {
  const id = provider as ProviderId;
  const color = PROVIDER_COLORS[id] ?? "#7c5cbf";
  const sub = PROVIDER_LABELS[id] ?? provider;
  const initial = firstLetter(name);
  return { initial, color, bg: hexWithAlpha(color, 0.1), sub };
}

function firstLetter(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const letter = trimmed.replace(/[^A-Za-z0-9]/g, "")[0];
  return (letter ?? trimmed[0]).toUpperCase();
}

function hexWithAlpha(hex: string, alpha: number): string {
  const match = hex.match(/^#?([0-9a-fA-F]{6})$/);
  if (!match) return hex;
  const r = parseInt(match[1].slice(0, 2), 16);
  const g = parseInt(match[1].slice(2, 4), 16);
  const b = parseInt(match[1].slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
