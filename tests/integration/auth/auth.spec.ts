import { test, expect } from "../helpers/fixtures";

test.describe("Auth routes", () => {
  test.describe.configure({ mode: "serial" });

  test("GET /api/v1/auth/me returns 401 when not authenticated", async ({
    anon,
  }) => {
    const res = await anon.get("/api/v1/auth/me");
    expect(res.status()).toBe(401);
    const body = (await res.json()) as { code: string; message: string };
    expect(body.code).toBe("UNAUTHORIZED");
    expect(body.message).toBe("authentication required");
  });

  test("GET /api/v1/auth/me returns the current user after sign-in", async ({
    ctx,
    user,
  }) => {
    const res = await ctx.get("/api/v1/auth/me");
    expect(res.status()).toBe(200);
    const body = (await res.json()) as {
      id: string;
      email: string;
      name: string | null;
    };
    expect(body.id).toBe(user.id);
    expect(body.email).toBe(user.email);
  });

  test("POST /api/v1/auth/signout clears the session", async ({ ctx }) => {
    const signedIn = await ctx.get("/api/v1/auth/me");
    expect(signedIn.status()).toBe(200);

    const signOut = await ctx.post("/api/v1/auth/signout");
    expect(signOut.status()).toBe(204);

    const after = await ctx.get("/api/v1/auth/me");
    expect(after.status()).toBe(401);
  });

  test("POST /api/v1/auth/signin returns a Google OAuth URL", async ({
    request,
  }) => {
    const res = await request.post("/api/v1/auth/signin", { data: {} });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { url: string };
    expect(body.url).toContain("supabase");
  });

  test("POST /api/v1/auth/signin rejects an unsafe next redirect", async ({
    request,
  }) => {
    const res = await request.post("/api/v1/auth/signin", {
      data: { next: "https://evil.example.com/steal" },
    });
    expect(res.status()).toBe(400);
  });

  test("GET /api/v1/auth/callback returns 400 when code is missing", async ({
    request,
  }) => {
    const res = await request.get("/api/v1/auth/callback");
    expect(res.status()).toBe(400);
  });
});
