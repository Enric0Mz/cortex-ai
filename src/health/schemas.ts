import { z } from "@/openapi/zod";
import { registry } from "@/openapi/registry";

export const DatabaseHealthSchema = registry.register(
  "DatabaseHealth",
  z.object({
    status: z.enum(["up", "down"]).openapi({ example: "up" }),
    version: z
      .string()
      .nullable()
      .openapi({ example: "16.13" }),
    openConnections: z
      .number()
      .int()
      .nullable()
      .openapi({ example: 2 }),
    latencyMs: z.number().int().openapi({ example: 4 }),
    error: z.string().nullable().openapi({ example: null }),
  }),
);
export type DatabaseHealth = z.infer<typeof DatabaseHealthSchema>;

export const HealthResponseSchema = registry.register(
  "HealthResponse",
  z.object({
    status: z.enum(["ok", "degraded"]).openapi({ example: "ok" }),
    uptimeSeconds: z.number().int().openapi({ example: 12 }),
    timestamp: z
      .string()
      .openapi({ format: "date-time", example: "2026-04-15T10:00:00.000Z" }),
    database: DatabaseHealthSchema,
  }),
);
export type HealthResponse = z.infer<typeof HealthResponseSchema>;

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
