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

    expect(doc.components?.schemas?.HealthResponse).toBeDefined();
    expect(doc.components?.schemas?.DatabaseHealth).toBeDefined();
    expect(doc.components?.schemas?.ErrorResponse).toBeDefined();
    expect(doc.components?.securitySchemes?.bearerAuth).toBeDefined();
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
