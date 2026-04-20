import { test, expect, type APIRequestContext } from "@playwright/test";
import { PROVIDER_MODELS } from "@/lib/constants";
import type { ComparisonResult } from "@/features/comparison/schemas";
import {
  disableDatabaseConnections,
  enableDatabaseConnections,
} from "../helpers/db-control";
import { signInTestUser } from "../helpers/auth";

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
  const adminToken = process.env.ADMIN_API_TOKEN ?? "";
  const modelsToRegister = [
    { name: PROVIDER_MODELS.gemini, provider: "gemini" },
    { name: PROVIDER_MODELS.groq, provider: "groq" },
    { name: PROVIDER_MODELS.mistral, provider: "mistral" },
    { name: PROVIDER_MODELS.openrouter, provider: "openrouter" },
  ];

  const req = await request.post("/api/v1/models", {
    headers: { "x-admin-token": adminToken },
    data: { models: modelsToRegister },
  });
  expect([201, 409]).toContain(req.status());
}

async function createComparisonWithOkResponses(
  request: APIRequestContext,
): Promise<ComparisonResult> {
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

  test.beforeEach(async ({ request }) => {
    await signInTestUser(request);
  });

  test("votes routes require authentication", async ({
    request,
    playwright,
    baseURL,
  }) => {
    const seeded = await createComparisonWithOkResponses(request);
    const responseId = seeded.responses.find((r) => r.status === "ok")!.id;

    const anon = await playwright.request.newContext({ baseURL });
    try {
      const postRes = await anon.post(
        `/api/v1/comparisons/${seeded.id}/votes`,
        { data: { responseId } },
      );
      expect(postRes.status()).toBe(401);

      const getRes = await anon.get(`/api/v1/comparisons/${seeded.id}/vote`);
      expect(getRes.status()).toBe(401);
    } finally {
      await anon.dispose();
    }
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

  test("GET /vote should return 404 when user has not voted yet", async ({
    request,
  }) => {
    const comparison = await createComparisonWithOkResponses(request);

    const req = await request.get(`/api/v1/comparisons/${comparison.id}/vote`);
    expect(req.status()).toBe(404);
    const result = (await req.json()) as {
      code: string;
      message: string;
      statusCode: number;
    };
    expect(result.code).toBe("NOT_FOUND");
    expect(result.statusCode).toBe(404);
  });

  test("GET /vote should return vote after vote creation", async ({
    request,
  }) => {
    const comparison = await createComparisonWithOkResponses(request);
    const responseId = comparison.responses.find((r) => r.status === "ok")!.id;

    const createReq = await request.post(
      `/api/v1/comparisons/${comparison.id}/votes`,
      { data: { responseId } },
    );
    expect(createReq.status()).toBe(200);
    const created = (await createReq.json()) as VoteResponse;

    const getReq = await request.get(`/api/v1/comparisons/${comparison.id}/vote`);
    expect(getReq.status()).toBe(200);
    const fetched = (await getReq.json()) as VoteResponse;

    expect(fetched.id).toBe(created.id);
    expect(fetched.comparisonId).toBe(comparison.id);
    expect(fetched.responseId).toBe(responseId);
    expect(fetched.userId).toBe(created.userId);
  });

  test("POST /vote should return method not allowed", async ({ request }) => {
    const comparison = await createComparisonWithOkResponses(request);
    const responseId = comparison.responses.find((r) => r.status === "ok")!.id;

    const req = await request.post(`/api/v1/comparisons/${comparison.id}/vote`, {
      data: { responseId },
    });
    expect(req.status()).toBe(405);
  });

  test("GET /vote should return 400 for invalid comparisonId", async ({
    request,
  }) => {
    const req = await request.get("/api/v1/comparisons/not-a-uuid/vote");
    expect(req.status()).toBe(400);
  });

  test("GET /vote should return 503 when database is unavailable", async ({
    request,
  }) => {
    const comparison = await createComparisonWithOkResponses(request);

    await disableDatabaseConnections();
    try {
      const req = await request.get(
        `/api/v1/comparisons/${comparison.id}/vote`,
      );
      expect(req.status()).toBe(503);
    } finally {
      await enableDatabaseConnections();
    }
  });
});
