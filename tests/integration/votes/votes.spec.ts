import { test, expect } from "@playwright/test";
import { PROVIDER_MODELS } from "@/lib/constants";
import type { ComparisonResult } from "@/features/comparison/schemas";
import {
  disableDatabaseConnections,
  enableDatabaseConnections,
} from "../helpers/db-control";

type VoteResponse = {
  id: string;
  comparisonId: string;
  responseId: string;
  userId: string;
  createdAt: string;
};

async function registerFakeModels(request: {
  post: (
    url: string,
    options?: { headers?: Record<string, string>; data?: unknown },
  ) => Promise<{ status(): number }>;
}): Promise<void> {
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
}

async function createComparisonWithOkResponses(request: {
  post: (
    url: string,
    options?: { data?: unknown },
  ) => Promise<{ status(): number; json(): Promise<unknown> }>;
}): Promise<ComparisonResult> {
  const req = await request.post("/api/v1/comparisons", {
    data: {
      prompt: "Vote test prompt",
      category: "votes",
    },
  });
  expect(req.status()).toBe(200);
  const comparison = (await req.json()) as ComparisonResult;
  const okResponses = comparison.responses.filter((r) => r.status === "ok");
  expect(okResponses.length).toBeGreaterThan(1);
  return comparison;
}

test.describe("Votes route tests", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async ({ request }) => {
    await registerFakeModels(request);
  });

  test("POST should create a vote for a valid response", async ({ request }) => {
    const comparison = await createComparisonWithOkResponses(request);
    const responseId = comparison.responses.find((r) => r.status === "ok")!.id;

    const req = await request.post(
      `/api/v1/comparisons/${comparison.id}/votes`,
      {
        data: { responseId },
      },
    );

    expect(req.status()).toBe(200);
    const result = (await req.json()) as VoteResponse;
    expect(result.comparisonId).toBe(comparison.id);
    expect(result.responseId).toBe(responseId);
    expect(typeof result.id).toBe("string");
    expect(typeof result.userId).toBe("string");
    expect(typeof result.createdAt).toBe("string");
  });

  test("POST should update existing vote when re-voting in same comparison", async ({
    request,
  }) => {
    const comparison = await createComparisonWithOkResponses(request);
    const okResponses = comparison.responses.filter((r) => r.status === "ok");
    const firstResponseId = okResponses[0].id;
    const secondResponseId = okResponses[1].id;

    const firstReq = await request.post(
      `/api/v1/comparisons/${comparison.id}/votes`,
      {
        data: { responseId: firstResponseId },
      },
    );
    expect(firstReq.status()).toBe(200);
    const firstVote = (await firstReq.json()) as VoteResponse;

    const secondReq = await request.post(
      `/api/v1/comparisons/${comparison.id}/votes`,
      {
        data: { responseId: secondResponseId },
      },
    );
    expect(secondReq.status()).toBe(200);
    const secondVote = (await secondReq.json()) as VoteResponse;

    expect(secondVote.id).toBe(firstVote.id);
    expect(secondVote.responseId).toBe(secondResponseId);
    expect(secondVote.comparisonId).toBe(comparison.id);
  });

  test("POST should reject responseId that does not belong to comparison", async ({
    request,
  }) => {
    const comparisonA = await createComparisonWithOkResponses(request);
    const comparisonB = await createComparisonWithOkResponses(request);
    const foreignResponseId = comparisonB.responses.find(
      (r) => r.status === "ok",
    )!.id;

    const req = await request.post(
      `/api/v1/comparisons/${comparisonA.id}/votes`,
      {
        data: { responseId: foreignResponseId },
      },
    );

    expect(req.status()).toBe(400);
  });

  test("POST should reject invalid body", async ({ request }) => {
    const comparison = await createComparisonWithOkResponses(request);

    const req = await request.post(
      `/api/v1/comparisons/${comparison.id}/votes`,
      {
        data: {},
      },
    );

    expect(req.status()).toBe(400);
  });

  test("GET should return method not allowed", async ({ request }) => {
    const comparison = await createComparisonWithOkResponses(request);

    const req = await request.get(`/api/v1/comparisons/${comparison.id}/votes`);
    expect(req.status()).toBe(405);
  });

  test("POST should return 503 when database is unavailable", async ({
    request,
  }) => {
    const comparison = await createComparisonWithOkResponses(request);
    const responseId = comparison.responses.find((r) => r.status === "ok")!.id;

    await disableDatabaseConnections();

    try {
      const req = await request.post(
        `/api/v1/comparisons/${comparison.id}/votes`,
        {
          data: { responseId },
        },
      );
      expect(req.status()).toBe(503);
    } finally {
      await enableDatabaseConnections();
    }
  });
});
