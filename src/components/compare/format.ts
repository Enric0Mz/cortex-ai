export function formatLatency(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return "—";
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.round(ms)}ms`;
}

export function formatCost(usd: number): string {
  if (!Number.isFinite(usd) || usd <= 0) return "$0";
  if (usd >= 0.01) return `$${usd.toFixed(4)}`;
  return `$${usd.toFixed(5)}`;
}

export function formatTokens(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "—";
  return `${Math.round(n)} tok`;
}
