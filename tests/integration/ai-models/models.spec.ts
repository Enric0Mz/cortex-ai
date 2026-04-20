import { test, expect } from "@playwright/test";
import type { ListAiModelsResponse } from "@/features/ai-models/schemas";

const ADMIN_TOKEN = process.env.ADMIN_API_TOKEN ?? "";
const unique = (prefix: string): string =>
  `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;

test.describe("AI models routes", () => {
  test.describe.configure({ mode: "serial" });

  test("GET /api/v1/models with empty DB returns an empty array", async ({
    request,
  }) => {
    const req = await request.get("/api/v1/models");
    expect(req.status()).toBe(200);
    const body: ListAiModelsResponse = await req.json();
    expect(body).toEqual([]);
  });

  test("POST /api/v1/models bulk create with valid token returns 201", async ({
    request,
  }) => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const req = await request.post("/api/v1/models", {
      headers: { "x-admin-token": ADMIN_TOKEN },
      data: {
        models: [
          { name: `bulk-a-${suffix}`, provider: `bulk-provider-a-${suffix}` },
          { name: `bulk-b-${suffix}`, provider: `bulk-provider-b-${suffix}` },
        ],
      },
    });

    expect(req.status()).toBe(201);
    const result = await req.json();
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
  });

  test("POST /api/v1/models bulk create without token returns 401", async ({
    request,
  }) => {
    const req = await request.post("/api/v1/models", {
      data: {
        models: [{ name: "bulk-no-auth", provider: "bulk-no-auth-provider" }],
      },
    });
    expect(req.status()).toBe(401);
  });

  test("POST /api/v1/models bulk create with wrong token returns 401", async ({
    request,
  }) => {
    const req = await request.post("/api/v1/models", {
      headers: { "x-admin-token": "wrong-token" },
      data: {
        models: [{ name: "bulk-wrong", provider: "bulk-wrong-provider" }],
      },
    });
    expect(req.status()).toBe(401);
  });

  test("POST /api/v1/models bulk create with duplicate name/provider returns 409", async ({
    request,
  }) => {
    const name = unique("bulk-duplicate");
    const provider = unique("bulk-provider-duplicate");

    const first = await request.post("/api/v1/models", {
      headers: { "x-admin-token": ADMIN_TOKEN },
      data: { models: [{ name, provider }] },
    });
    expect(first.status()).toBe(201);

    const second = await request.post("/api/v1/models", {
      headers: { "x-admin-token": ADMIN_TOKEN },
      data: { models: [{ name, provider }] },
    });
    expect(second.status()).toBe(409);
  });

  test("GET /api/v1/models returns created models sorted by provider and name", async ({
    request,
  }) => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const models = [
      { name: `zeta-${suffix}`, provider: `provider-b-${suffix}` },
      { name: `alpha-${suffix}`, provider: `provider-a-${suffix}` },
    ] as const;

    const createReq = await request.post("/api/v1/models", {
      headers: { "x-admin-token": ADMIN_TOKEN },
      data: { models: [...models] },
    });
    expect(createReq.status()).toBe(201);

    const listReq = await request.get("/api/v1/models");
    expect(listReq.status()).toBe(200);
    const listBody: ListAiModelsResponse = await listReq.json();

    const created = listBody.filter(
      (m) =>
        (m.name === models[0].name && m.provider === models[0].provider) ||
        (m.name === models[1].name && m.provider === models[1].provider),
    );
    expect(created).toHaveLength(2);
    expect(created[0]).toMatchObject({
      name: models[1].name,
      provider: models[1].provider,
    });
    expect(created[1]).toMatchObject({
      name: models[0].name,
      provider: models[0].provider,
    });
  });

  test("POST /api/v1/models bulk create invalid body returns 400", async ({
    request,
  }) => {
    const req = await request.post("/api/v1/models", {
      headers: { "x-admin-token": ADMIN_TOKEN },
      data: { models: [] },
    });
    expect(req.status()).toBe(400);
  });
});
