import { test, expect } from "../helpers/fixtures";
import { registerFakeModels } from "../helpers/seed-models";

import {
  ComparisonResult,
  CreateComparisonRequest,
} from "@/features/comparison/schemas";

test.describe("Comparison route tests", () => {
  let modelIds: string[] = [];

  test.beforeAll(async ({ request }) => {
    const seeded = await registerFakeModels(request);
    modelIds = seeded.map((m) => m.id);
    expect(modelIds.length).toBe(4);
  });

  test("POST /api/v1/comparisons requires authentication", async ({ anon }) => {
    const req = await anon.post("/api/v1/comparisons", {
      data: { prompt: "hi", models: modelIds },
    });
    expect(req.status()).toBe(401);
  });

  test("Comparing 4 models should return an array with 4 results", async ({
    ctx,
  }) => {
    const body: CreateComparisonRequest = {
      prompt: "How many letter a`s are present in banana in one sentence",
      models: modelIds,
    };

    const req = await ctx.post("/api/v1/comparisons", { data: body });

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

  test("POST rejects fewer than 2 models", async ({ ctx }) => {
    const req = await ctx.post("/api/v1/comparisons", {
      data: { prompt: "hi", models: [modelIds[0]] },
    });
    expect(req.status()).toBe(400);
  });

  test("POST rejects more than 4 models", async ({ ctx }) => {
    const req = await ctx.post("/api/v1/comparisons", {
      data: {
        prompt: "hi",
        models: [...modelIds, modelIds[0]],
      },
    });
    expect(req.status()).toBe(400);
  });

  test("POST rejects unknown model id", async ({ ctx }) => {
    const req = await ctx.post("/api/v1/comparisons", {
      data: {
        prompt: "hi",
        models: [modelIds[0], "11111111-1111-4111-8111-111111111111"],
      },
    });
    expect(req.status()).toBe(400);
  });

  test("POST rejects duplicate model ids", async ({ ctx }) => {
    const req = await ctx.post("/api/v1/comparisons", {
      data: {
        prompt: "hi",
        models: [modelIds[0], modelIds[0]],
      },
    });
    expect(req.status()).toBe(400);
  });
});
