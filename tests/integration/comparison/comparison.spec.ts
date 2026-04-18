import { test, expect } from "@playwright/test";
import { PROVIDER_MODELS } from "@/lib/constants";

import {
  ComparisonResult,
  CreateComparisonRequest,
} from "@/features/comparison/schemas";

test.describe("Comparison route tests", () => {
  test.beforeAll(async ({ request }) => {
    const adminToken = "test-admin-token";
    const modelsToRegister = [
      { name: PROVIDER_MODELS.gemini, provider: "gemini" },
      { name: PROVIDER_MODELS.groq, provider: "groq" },
      { name: PROVIDER_MODELS.mistral, provider: "mistral" },
      { name: PROVIDER_MODELS.openrouter, provider: "openrouter" },
    ];

    for (const model of modelsToRegister) {
      const req = await request.post("/api/v1/admin/models", {
        headers: { "x-admin-token": adminToken },
        data: model,
      });
      expect([201, 409]).toContain(req.status());
    }
  });

  test("Comparing 4 models should return an array with 4 results", async ({
    request,
  }) => {
    const body: CreateComparisonRequest = {
      prompt: "How many letter a`s are present in banana in one sentence",
      category: "generic",
    };

    const req = await request.post("/api/v1/comparisons", {
      data: body,
    });

    expect(req.status()).toBe(200);

    const result: ComparisonResult = await req.json();
    const responses = result.responses;

    expect(responses.length).toBe(4);

    for (const item of responses) {
      if (item.status === "ok") {
        expect(item.inputTokens).toBe(body.prompt.length);
      }
    }
  });
});
