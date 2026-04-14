import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { AppError, ServiceUnavailableError } from "@/lib/errors";

interface DatabaseHealth {
  status: "up" | "down";
  version: string | null;
  openConnections: number | null;
  latencyMs: number;
  error: string | null;
}

interface HealthResponse {
  status: "ok" | "degraded";
  uptimeSeconds: number;
  timestamp: string;
  database: DatabaseHealth;
}

interface VersionRow {
  server_version: string;
}

interface ConnectionsRow {
  count: bigint;
}

type DatabaseStatsResult =
  | { ok: true; version: string; openConnections: number }
  | { ok: false; error: AppError };

function fetchDatabaseStats(): Promise<DatabaseStatsResult> {
  return Promise.all([
    prisma.$queryRaw<VersionRow[]>`SHOW server_version`,
    prisma.$queryRaw<ConnectionsRow[]>`
      SELECT count(*)::bigint AS count
      FROM pg_stat_activity
      WHERE datname = current_database()
    `,
  ])
    .then(([versionRows, connectionRows]) => ({
      ok: true as const,
      version: versionRows[0]?.server_version ?? "unknown",
      openConnections: Number(connectionRows[0]?.count ?? 0),
    }))
    .catch((cause: unknown) => ({
      ok: false as const,
      error: new ServiceUnavailableError("database", cause),
    }));
}

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<HealthResponse>
): Promise<void> {
  const start = Date.now();
  const result = await fetchDatabaseStats();
  const latencyMs = Date.now() - start;

  const database: DatabaseHealth = {
    status: result.ok ? "up" : "down",
    version: result.ok ? result.version : null,
    openConnections: result.ok ? result.openConnections : null,
    latencyMs,
    error: result.ok ? null : result.error.message,
  };

  res.status(result.ok ? 200 : result.error.statusCode).json({
    status: result.ok ? "ok" : "degraded",
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    database,
  });
}
