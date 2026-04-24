import type { AiModelResponse } from "@/features/ai-models/schemas";

export const PENDING_COMPARISON_KEY = "cortex:compare:pending";

export type PendingComparison = {
  prompt: string;
  models: string[];
  selections: AiModelResponse[];
};

export function readAndConsumePending(): PendingComparison | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(PENDING_COMPARISON_KEY);
  if (!raw) return null;
  window.sessionStorage.removeItem(PENDING_COMPARISON_KEY);
  try {
    const parsed = JSON.parse(raw) as PendingComparison;
    if (
      typeof parsed.prompt === "string" &&
      Array.isArray(parsed.models) &&
      Array.isArray(parsed.selections)
    ) {
      return parsed;
    }
  } catch {
    // fallthrough
  }
  return null;
}
