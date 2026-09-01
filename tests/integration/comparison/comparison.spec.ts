import { test, expect } from "../helpers/fixtures";
import { PROVIDER_MODELS, PROVIDER_MODEL_PROVIDERS } from "@/lib/constants";

import {
  ComparisonResult,
  CreateComparisonRequest,
} from "@/features/comparison/schemas";

test.describe("Comparison route tests", () => {
  test.beforeAll(async ({ request }) => {
    const adminToken = process.env.ADMIN_API_TOKEN ?? "";
    const modelsToRegister = [
      {
        name: PROVIDER_MODELS.gemini,
        provider: PROVIDER_MODEL_PROVIDERS.gemini,
      },
      { name: PROVIDER_MODELS.groq, provider: PROVIDER_MODEL_PROVIDERS.groq },
      {
        name: PROVIDER_MODELS.mistral,
        provider: PROVIDER_MODEL_PROVIDERS.mistral,
      },
      {
        name: PROVIDER_MODELS.openrouter,
        provider: PROVIDER_MODEL_PROVIDERS.openrouter,
      },
    ];

    const req = await request.post("/api/v1/models", {
      headers: { "x-admin-token": adminToken },
      data: { models: modelsToRegister },
    });
    expect([201, 409]).toContain(req.status());
  });

  test("POST /api/v1/comparisons requires authentication", async ({ anon }) => {
    const req = await anon.post("/api/v1/comparisons", {
      data: { prompt: "hi", category: "generic" },
    });
    expect(req.status()).toBe(401);
  });

  test("Comparing 4 registered models should persist and return all results", async ({
    ctx,
  }) => {
    const body: CreateComparisonRequest = {
      prompt: "How many letter a`s are present in banana in one sentence",
      category: "generic",
    };

    const req = await ctx.post("/api/v1/comparisons", { data: body });

    expect(req.status()).toBe(200);

    const result: ComparisonResult = await req.json();
    const responses = result.responses;

    expect(responses.length).toBe(4);

    for (const item of responses) {
      expect(item.status).toBe("ok");
      if (item.status === "ok")
        expect(item.inputTokens).toBe(body.prompt.length);
    }
  });
});
