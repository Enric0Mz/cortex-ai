import { test, expect } from "@playwright/test";

test.describe("OpenAPI spec endpoint", () => {
  test("serves a valid OpenAPI 3.1 document with registered paths and components", async ({
    request,
  }) => {
    const req = await request.get("/api/v1/openapi");
    expect(req.status()).toBe(200);

    const doc = await req.json();

    expect(doc.openapi).toMatch(/^3\.1/);
    expect(doc.info.title).toBe("Cortex AI API");
    expect(typeof doc.info.version).toBe("string");

    expect(doc.paths).toBeDefined();
    expect(doc.paths["/api/v1/health"]).toBeDefined();
    expect(doc.paths["/api/v1/health"].get).toBeDefined();
    expect(doc.paths["/api/v1/health"].get.responses["200"]).toBeDefined();
    expect(doc.paths["/api/v1/health"].get.responses["503"]).toBeDefined();

    expect(doc.paths["/api/v1/openapi"]).toBeDefined();
    expect(doc.paths["/api/v1/openapi"].get).toBeDefined();
    expect(doc.paths["/api/v1/models"]).toBeDefined();
    expect(doc.paths["/api/v1/models"].get).toBeDefined();
    expect(doc.paths["/api/v1/models"].post).toBeDefined();
    expect(doc.paths["/api/v1/responses/{responseId}"]).toBeDefined();
    expect(doc.paths["/api/v1/responses/{responseId}"].get).toBeDefined();
    expect(doc.paths["/api/v1/comparisons/{comparisonId}/votes"]).toBeDefined();
    expect(
      doc.paths["/api/v1/comparisons/{comparisonId}/votes"].post,
    ).toBeDefined();
    expect(doc.paths["/api/v1/comparisons/{comparisonId}/vote"]).toBeDefined();
    expect(
      doc.paths["/api/v1/comparisons/{comparisonId}/vote"].get,
    ).toBeDefined();

    expect(doc.components?.schemas?.HealthResponse).toBeDefined();
    expect(doc.components?.schemas?.DatabaseHealth).toBeDefined();
    expect(doc.components?.schemas?.ErrorResponse).toBeDefined();
    expect(doc.components?.schemas?.CreateAiModelRequest).toBeDefined();
    expect(doc.components?.schemas?.CreateAiModelsBulkRequest).toBeDefined();
    expect(doc.components?.schemas?.CreateAiModelsBulkResponse).toBeDefined();
    expect(doc.components?.schemas?.AiModelResponse).toBeDefined();
    expect(doc.components?.schemas?.ListAiModelsResponse).toBeDefined();
    expect(doc.components?.schemas?.CreateVoteRequest).toBeDefined();
    expect(doc.components?.schemas?.VoteResponse).toBeDefined();
    expect(doc.components?.schemas?.ResponseDetails).toBeDefined();
    expect(doc.components?.schemas?.CurrentUser).toBeDefined();
    expect(doc.components?.schemas?.SignInRequest).toBeDefined();
    expect(doc.components?.schemas?.SignInResponse).toBeDefined();
    expect(doc.paths["/api/v1/auth/signin"]).toBeDefined();
    expect(doc.paths["/api/v1/auth/callback"]).toBeDefined();
    expect(doc.paths["/api/v1/auth/me"]).toBeDefined();
    expect(doc.paths["/api/v1/auth/signout"]).toBeDefined();
    expect(doc.components?.securitySchemes?.bearerAuth).toBeDefined();
    expect(doc.components?.securitySchemes?.cookieAuth).toBeDefined();
  });

  test("sets no-store cache header", async ({ request }) => {
    const req = await request.get("/api/v1/openapi");
    expect(req.headers()["cache-control"]).toBe("no-store");
  });
});

test.describe("Swagger UI page", () => {
  test("renders the api-docs page in non-production", async ({ request }) => {
    const req = await request.get("/api-docs");
    expect(req.status()).toBe(200);

    const html = await req.text();
    expect(html).toContain('id="swagger-ui"');
  });
});
