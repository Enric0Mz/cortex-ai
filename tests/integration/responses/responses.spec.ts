import { test, expect } from "@playwright/test";
import { PROVIDER_MODELS } from "@/lib/constants";
import type { ComparisonResult } from "@/features/comparison/schemas";
import {
  disableDatabaseConnections,
  enableDatabaseConnections,
} from "../helpers/db-control";

type ResponseDetails = {
  id: string;
  comparisonId: string;
  provider: string;
  aiModel: {
    name: string;
    provider: string;
  };
  content: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  latencyMs: number;
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

  const req = await request.post("/api/v1/models", {
    headers: { "x-admin-token": adminToken },
    data: { models: modelsToRegister },
  });
  expect([201, 409]).toContain(req.status());
}

async function createComparisonWithOkResponses(request: {
  post: (
    url: string,
    options?: { data?: unknown },
  ) => Promise<{ status(): number; json(): Promise<unknown> }>;
}): Promise<ComparisonResult> {
  const req = await request.post("/api/v1/comparisons", {
    data: {
      prompt: "Response lookup test prompt",
      category: "responses",
    },
  });
  expect(req.status()).toBe(200);
  const comparison = (await req.json()) as ComparisonResult;
  const okResponses = comparison.responses.filter((r) => r.status === "ok");
  expect(okResponses.length).toBeGreaterThan(0);
  return comparison;
}

test.describe("Responses route tests", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async ({ request }) => {
    await registerFakeModels(request);
  });

  test("GET should return full response payload for valid responseId", async ({
    request,
  }) => {
    const comparison = await createComparisonWithOkResponses(request);
    const okResponse = comparison.responses.find((r) => r.status === "ok")!;

    const req = await request.get(`/api/v1/responses/${okResponse.id}`);
    expect(req.status()).toBe(200);

    const result = (await req.json()) as ResponseDetails;
    expect(result.id).toBe(okResponse.id);
    expect(result.comparisonId).toBe(comparison.id);
    expect(result.provider).toBe(okResponse.provider);
    expect(result.aiModel.name).toBe(okResponse.aiModel.name);
    expect(result.aiModel.provider).toBe(okResponse.aiModel.provider);
    expect(typeof result.content).toBe("string");
    expect(typeof result.createdAt).toBe("string");
  });

  test("GET should return 404 for unknown responseId", async ({ request }) => {
    const req = await request.get(
      "/api/v1/responses/11111111-1111-4111-8111-111111111111",
    );
    expect(req.status()).toBe(404);

    const result = (await req.json()) as {
      code: string;
      message: string;
      statusCode: number;
    };
    expect(result.code).toBe("NOT_FOUND");
    expect(result.statusCode).toBe(404);
  });

  test("GET should return 400 for invalid responseId", async ({ request }) => {
    const req = await request.get("/api/v1/responses/not-a-uuid");
    expect(req.status()).toBe(400);
  });

  test("POST should return method not allowed", async ({ request }) => {
    const req = await request.post(
      "/api/v1/responses/00000000-0000-0000-0000-000000000001",
      {
        data: {},
      },
    );
    expect(req.status()).toBe(405);
  });

  test("GET should return 503 when database is unavailable", async ({
    request,
  }) => {
    const comparison = await createComparisonWithOkResponses(request);
    const responseId = comparison.responses.find((r) => r.status === "ok")!.id;

    await disableDatabaseConnections();
    try {
      const req = await request.get(`/api/v1/responses/${responseId}`);
      expect(req.status()).toBe(503);
    } finally {
      await enableDatabaseConnections();
    }
  });
});
