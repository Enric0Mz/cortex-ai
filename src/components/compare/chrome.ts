import type { CompanyId, ProviderId } from "@/features/ai-models/schemas";
import { COMPANY_LABELS, PROVIDER_LABELS } from "@/lib/providers";

export const COMPANY_COLORS: Record<CompanyId, string> = {
  anthropic: "#c96442",
  openai: "#0e8f6e",
  google: "#3b82f6",
  meta: "#1d6cf3",
  mistralai: "#b8623c",
  deepseek: "#5b6cff",
  xai: "#1a1410",
  qwen: "#7c5cbf",
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
  company?: string,
): ProviderChrome {
  const companyId = company as CompanyId | undefined;
  const providerId = provider as ProviderId;
  const color = (companyId && COMPANY_COLORS[companyId]) ?? "#7c5cbf";
  const sub = PROVIDER_LABELS[providerId] ?? provider;
  const companyLabel = (companyId && COMPANY_LABELS[companyId]) ?? company;
  const initial = firstLetter(companyLabel ?? name);
  return { initial, color, bg: hexWithAlpha(color, 0.1), sub };
}

function firstLetter(value: string): string {
  const trimmed = value.trim();
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
