export interface DatabaseHealth {
  status: "up" | "down";
  version: string | null;
  openConnections: number | null;
  latencyMs: number;
  error: string | null;
}

export interface HealthResponse {
  status: "ok" | "degraded";
  uptimeSeconds: number;
  timestamp: string;
  database: DatabaseHealth;
}

export interface DatabaseStats {
  version: string;
  openConnections: number;
}

export interface VersionRow {
  server_version: string;
}

export interface ConnectionsRow {
  count: bigint;
}
