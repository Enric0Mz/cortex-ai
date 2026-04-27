import { expect, type APIRequestContext } from "@playwright/test";
import type { AiModelResponse } from "@/features/ai-models/schemas";

export const SEED_MODELS = [
  {
    name: "gemini-2.5-flash",
    provider: "gemini" as const,
    company: "google" as const,
    isFree: true,
  },
  {
    name: "llama-3.3-70b-versatile",
    provider: "groq" as const,
    company: "meta" as const,
    isFree: true,
  },
  {
    name: "mistral-small-latest",
    provider: "mistral" as const,
    company: "mistralai" as const,
    isFree: true,
  },
  {
    name: "openai/gpt-oss-120b:free",
    provider: "openrouter" as const,
    company: "openai" as const,
    isFree: true,
  },
];

export async function registerFakeModels(
  request: APIRequestContext,
): Promise<AiModelResponse[]> {
  const adminToken = process.env.ADMIN_API_TOKEN ?? "";
  const createReq = await request.post("/api/v1/models", {
    headers: { "x-admin-token": adminToken },
    data: { models: SEED_MODELS },
  });
  expect([201, 409]).toContain(createReq.status());

  const listReq = await request.get("/api/v1/models");
  expect(listReq.status()).toBe(200);
  const all = (await listReq.json()) as AiModelResponse[];
  return all.filter((m) =>
    SEED_MODELS.some(
      (seed) => seed.name === m.name && seed.provider === m.provider,
    ),
  );
}
