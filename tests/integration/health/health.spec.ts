import { test, expect } from "@playwright/test";
import type { HealthResponse } from "@/health/types";
import {
  disableDatabaseConnections,
  enableDatabaseConnections,
} from "../helpers/db-control";

test.describe("Health route tests", async () => {
  test.describe.configure({ mode: "serial" });

  test.afterEach(async () => {
    await enableDatabaseConnections();
  });

  test("Should return 200 with application ok and db up", async ({
    request,
  }) => {
    const req = await request.get("/api/v1/health");
    expect(req.status()).toBe(200);

    const result: HealthResponse = await req.json();
    expect(result.status).toMatch("ok");
    expect(result.database.status).toMatch("up");
    expect(result.database.version).toMatch("16.13");
    expect(result.database.openConnections).toBeLessThan(5);
  });

  test("Should return degraded when database is unavailable", async ({
    request,
  }) => {
    await disableDatabaseConnections();

    try {
      const req = await request.get("/api/v1/health");
      expect(req.status()).toBe(503);

      const result: HealthResponse = await req.json();
      expect(result.status).toBe("degraded");
      expect(result.database.status).toBe("down");
      expect(result.database.error).toMatch("database unavailable");
      expect(result.database.version).toBe(null);
      expect(result.database.openConnections).toBe(null);
    } finally {
      await enableDatabaseConnections();
    }
  });
});
