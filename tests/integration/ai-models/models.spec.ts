import { test, expect } from "@playwright/test";
import {
  ListAiModelsResponse,
  ProviderIdSchema,
} from "@/features/ai-models/schemas";

const ADMIN_TOKEN = process.env.ADMIN_API_TOKEN ?? "";

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
          {
            name: `bulk-a-${suffix}`,
            provider: `openrouter`,
            company: `openai`,
            isFree: true,
          },
          {
            name: `bulk-b-${suffix}`,
            provider: `openrouter`,
            company: `openai`,
            isFree: false,
          },
        ],
      },
    });

    const result = await req.json();

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ isFree: true }),
        expect.objectContaining({ isFree: false }),
      ]),
    );
  });

  test("POST /api/v1/models bulk create without token returns 401", async ({
    request,
  }) => {
    const req = await request.post("/api/v1/models", {
      data: {
        models: [
          {
            name: "bulk-no-auth",
            provider: "bulk-no-auth-provider",
            company: "openai",
          },
        ],
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
        models: [
          {
            name: "bulk-wrong",
            provider: "bulk-wrong-provider",
            company: "openai",
          },
        ],
      },
    });
    expect(req.status()).toBe(401);
  });

  test("POST /api/v1/models bulk create with duplicate name/provider returns 409", async ({
    request,
  }) => {
    const name = "bulk-duplicate";
    const provider = "openrouter";
    const company = "openai";

    const first = await request.post("/api/v1/models", {
      headers: { "x-admin-token": ADMIN_TOKEN },
      data: { models: [{ name, provider, company, isFree: false }] },
    });
    expect(first.status()).toBe(201);

    const second = await request.post("/api/v1/models", {
      headers: { "x-admin-token": ADMIN_TOKEN },
      data: { models: [{ name, provider, company, isFree: false }] },
    });
    expect(second.status()).toBe(409);
  });

  test("GET /api/v1/models returns created models sorted by company and name", async ({
    request,
  }) => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const models = [
      {
        name: `zeta-${suffix}`,
        provider: `openrouter`,
        company: `openai`,
        isFree: false,
      },
      {
        name: `alpha-${suffix}`,
        provider: `openrouter`,
        company: `openai`,
        isFree: true,
      },
      {
        name: `mid-${suffix}`,
        provider: `gemini`,
        company: `google`,
        isFree: true,
      },
    ] as const;

    const createReq = await request.post("/api/v1/models", {
      headers: { "x-admin-token": ADMIN_TOKEN },
      data: { models: [...models] },
    });
    expect(createReq.status()).toBe(201);

    const listReq = await request.get("/api/v1/models");
    expect(listReq.status()).toBe(200);
    const listBody: ListAiModelsResponse = await listReq.json();

    const created = listBody.filter((m) =>
      models.some(
        (model) => model.name === m.name && model.provider === m.provider,
      ),
    );
    expect(created).toHaveLength(3);
    expect(created[0]).toMatchObject({
      name: models[2].name,
      provider: models[2].provider,
      company: models[2].company,
      isFree: models[2].isFree,
    });
    expect(created[1]).toMatchObject({
      name: models[1].name,
      provider: models[1].provider,
      company: models[1].company,
      isFree: models[1].isFree,
    });
    expect(created[2]).toMatchObject({
      name: models[0].name,
      provider: models[0].provider,
      company: models[0].company,
      isFree: models[0].isFree,
    });
  });

  test("POST and GET round-trip isFree", async ({ request }) => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const name = `is-free-${suffix}`;
    const createReq = await request.post("/api/v1/models", {
      headers: { "x-admin-token": ADMIN_TOKEN },
      data: {
        models: [{ name, provider: "groq", company: "meta", isFree: true }],
      },
    });
    expect(createReq.status()).toBe(201);

    const listReq = await request.get("/api/v1/models");
    expect(listReq.status()).toBe(200);
    const listBody: ListAiModelsResponse = await listReq.json();
    expect(listBody).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name, provider: "groq", isFree: true }),
      ]),
    );
  });

  test("GET /api/v1/models filters by provider", async ({ request }) => {
    const req = await request.get("/api/v1/models?provider=groq");
    expect(req.status()).toBe(200);
    const body: ListAiModelsResponse = await req.json();
    expect(body.every((model) => model.provider === "groq")).toBe(true);
  });

  test("GET /api/v1/models filters by isFree", async ({ request }) => {
    const req = await request.get("/api/v1/models?isFree=true");
    expect(req.status()).toBe(200);
    const body: ListAiModelsResponse = await req.json();
    expect(body.length).toBeGreaterThan(0);
    expect(body.every((model) => model.isFree)).toBe(true);
  });

  test("GET /api/v1/models parses isFree=false as false", async ({
    request,
  }) => {
    const req = await request.get("/api/v1/models?isFree=false");
    expect(req.status()).toBe(200);
    const body: ListAiModelsResponse = await req.json();
    expect(body.length).toBeGreaterThan(0);
    expect(body.every((model) => !model.isFree)).toBe(true);
  });

  test("GET /api/v1/models composes provider and isFree filters", async ({
    request,
  }) => {
    const req = await request.get(
      "/api/v1/models?provider=openrouter&isFree=true",
    );
    expect(req.status()).toBe(200);
    const body: ListAiModelsResponse = await req.json();
    expect(
      body.every((model) => model.provider === "openrouter" && model.isFree),
    ).toBe(true);
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

  test("POST /api/v1/models bulk create with invalid provider returns 400", async ({
    request,
  }) => {
    const modelPayload = {
      name: "openai/gpt-oss-120b:free",
      provider: "invalid",
      company: "openai",
    };
    const req = await request.post("/api/v1/models", {
      headers: { "x-admin-token": ADMIN_TOKEN },
      data: { models: [modelPayload] },
    });
    expect(req.status()).toBe(400);

    const body = await req.json();

    const providerOpts = ProviderIdSchema.options
      .map((o) => `"${o}"`)
      .join("|");

    expect(body.message).toBe(
      `Invalid option: expected one of ${providerOpts}`,
    );
    expect(body.code).toBe("VALIDATION_ERROR");
    expect(body.statusCode).toBe(400);
  });

  test("POST /api/v1/models bulk create with missing company returns 400", async ({
    request,
  }) => {
    const req = await request.post("/api/v1/models", {
      headers: { "x-admin-token": ADMIN_TOKEN },
      data: {
        models: [{ name: "missing-company", provider: "openrouter" }],
      },
    });
    expect(req.status()).toBe(400);
    const body = await req.json();
    expect(body.code).toBe("VALIDATION_ERROR");
  });

  test("POST /api/v1/models bulk create with invalid company returns 400", async ({
    request,
  }) => {
    const req = await request.post("/api/v1/models", {
      headers: { "x-admin-token": ADMIN_TOKEN },
      data: {
        models: [
          {
            name: "invalid-company",
            provider: "openrouter",
            company: "not-a-company",
          },
        ],
      },
    });
    expect(req.status()).toBe(400);
    const body = await req.json();
    expect(body.code).toBe("VALIDATION_ERROR");
  });

  test("GET /api/v1/models filters by company", async ({ request }) => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const createReq = await request.post("/api/v1/models", {
      headers: { "x-admin-token": ADMIN_TOKEN },
      data: {
        models: [
          {
            name: `meta-filter-${suffix}`,
            provider: "groq",
            company: "meta",
            isFree: true,
          },
        ],
      },
    });
    expect(createReq.status()).toBe(201);

    const req = await request.get("/api/v1/models?company=meta");
    expect(req.status()).toBe(200);
    const body: ListAiModelsResponse = await req.json();
    expect(body.length).toBeGreaterThan(0);
    expect(body.every((model) => model.company === "meta")).toBe(true);
  });

  test("GET /api/v1/models with invalid company returns 400", async ({
    request,
  }) => {
    const req = await request.get("/api/v1/models?company=not-a-company");
    expect(req.status()).toBe(400);
  });

  test("GET /api/v1/models composes provider and company filters", async ({
    request,
  }) => {
    const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    await request.post("/api/v1/models", {
      headers: { "x-admin-token": ADMIN_TOKEN },
      data: {
        models: [
          {
            name: `groq-meta-${suffix}`,
            provider: "groq",
            company: "meta",
            isFree: true,
          },
        ],
      },
    });

    const req = await request.get("/api/v1/models?provider=groq&company=meta");
    expect(req.status()).toBe(200);
    const body: ListAiModelsResponse = await req.json();
    expect(body.length).toBeGreaterThan(0);
    expect(
      body.every(
        (model) => model.provider === "groq" && model.company === "meta",
      ),
    ).toBe(true);
  });
});
