import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { ServiceUnavailableError } from "@/lib/errors";
import { tryCatch, type Result } from "@/lib/result";

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

interface DatabaseStats {
  version: string;
  openConnections: number;
}

interface VersionRow {
  server_version: string;
}

interface ConnectionsRow {
  count: bigint;
}

async function fetchDatabaseStats(): Promise<Result<DatabaseStats, ServiceUnavailableError>> {
  return tryCatch(
    async () => {
      const [versionRows, connectionRows] = await Promise.all([
        prisma.$queryRaw<VersionRow[]>`SHOW server_version`,
        prisma.$queryRaw<ConnectionsRow[]>`
          SELECT count(*)::bigint AS count
          FROM pg_stat_activity
          WHERE datname = current_database()
        `,
      ]);
      return {
        version: versionRows[0]?.server_version ?? "unknown",
        openConnections: Number(connectionRows[0]?.count ?? 0),
      };
    },
    (cause) => new ServiceUnavailableError("database", cause),
  );
}

export default async function handler(
  _req: NextApiRequest,
  res: NextApiResponse<HealthResponse>,
): Promise<void> {
  const start = Date.now();
  const result = await fetchDatabaseStats();
  const latencyMs = Date.now() - start;

  const database: DatabaseHealth = {
    status: result.ok ? "up" : "down",
    version: result.ok ? result.value.version : null,
    openConnections: result.ok ? result.value.openConnections : null,
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
