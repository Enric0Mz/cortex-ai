import { registry } from "@/openapi/registry";
import { HealthResponseSchema } from "@/health/schemas";

registry.registerPath({
  method: "get",
  path: "/api/v1/health",
  summary: "Liveness and database probe",
  description:
    "Returns service status with a snapshot of database health including PostgreSQL version and open connection count. Returns 503 and status=degraded when the database is unreachable; the response shape is identical across both cases.",
  tags: ["System"],
  responses: {
    200: {
      description: "Service is healthy and the database is reachable.",
      content: {
        "application/json": { schema: HealthResponseSchema },
      },
    },
    503: {
      description:
        "Service is degraded — the database probe failed. `status` is `degraded`, `database.status` is `down`, and version/openConnections are null.",
      content: {
        "application/json": { schema: HealthResponseSchema },
      },
    },
  },
});
