import { test, expect } from "../helpers/fixtures";
import { createClient } from "@supabase/supabase-js";

function uniqueEmail(prefix = "pwauth"): string {
  const stamp = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  return `${prefix}+${stamp}@cortex.test`;
}

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

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
  test("POST /api/v1/auth/signin accepts a safe redirect page", async ({
    request,
  }) => {
    const res = await request.post("/api/v1/auth/signin", {
      data: { next: "/" },
    });
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

test.describe("Email + password auth", () => {
  test.describe.configure({ mode: "serial" });

  test("GET /api/v1/auth/signup returns 405", async ({ request }) => {
    const res = await request.get("/api/v1/auth/signup");
    expect(res.status()).toBe(405);
  });

  test("POST /api/v1/auth/signup rejects a malformed email", async ({
    request,
  }) => {
    const res = await request.post("/api/v1/auth/signup", {
      data: { email: "not-an-email", password: "hunter22hunter" },
    });
    expect(res.status()).toBe(400);
  });

  test("POST /api/v1/auth/signup rejects a short password", async ({
    request,
  }) => {
    const res = await request.post("/api/v1/auth/signup", {
      data: { email: uniqueEmail(), password: "short" },
    });
    expect(res.status()).toBe(400);
  });

  test("POST /api/v1/auth/signup creates an unconfirmed user", async ({
    request,
  }) => {
    const email = uniqueEmail();
    const res = await request.post("/api/v1/auth/signup", {
      data: { email, password: "hunter22hunter", name: "Pat" },
    });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as {
      id: string;
      email: string;
      emailConfirmationRequired: boolean;
    };
    expect(body.email).toBe(email);
    expect(body.emailConfirmationRequired).toBe(true);
    expect(body.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  test("POST /api/v1/auth/signup with a duplicate email returns 409", async ({
    request,
  }) => {
    const email = uniqueEmail();
    const first = await request.post("/api/v1/auth/signup", {
      data: { email, password: "hunter22hunter" },
    });
    expect(first.status()).toBe(200);

    const second = await request.post("/api/v1/auth/signup", {
      data: { email, password: "hunter22hunter" },
    });
    expect(second.status()).toBe(409);
    const body = (await second.json()) as { code: string };
    expect(body.code).toBe("CONFLICT");
  });

  test("POST /api/v1/auth/signin/password rejects an unconfirmed user", async ({
    request,
  }) => {
    const email = uniqueEmail();
    const password = "hunter22hunter";
    const signup = await request.post("/api/v1/auth/signup", {
      data: { email, password },
    });
    expect(signup.status()).toBe(200);

    const res = await request.post("/api/v1/auth/signin/password", {
      data: { email, password },
    });
    expect(res.status()).toBe(401);
    const body = (await res.json()) as { code: string; message: string };
    expect(body.code).toBe("UNAUTHORIZED");
    expect(body.message).toContain("not confirmed");
  });

  test("POST /api/v1/auth/signin/password rejects a wrong password", async ({
    request,
  }) => {
    const email = uniqueEmail();
    const signup = await request.post("/api/v1/auth/signup", {
      data: { email, password: "hunter22hunter" },
    });
    expect(signup.status()).toBe(200);
    const { id } = (await signup.json()) as { id: string };
    await adminClient().auth.admin.updateUserById(id, { email_confirm: true });

    const res = await request.post("/api/v1/auth/signin/password", {
      data: { email, password: "wrong-password-xyz" },
    });
    expect(res.status()).toBe(401);
    const body = (await res.json()) as { code: string; message: string };
    expect(body.code).toBe("UNAUTHORIZED");
    expect(body.message).toContain("invalid");
  });

  test("POST /api/v1/auth/signin/password signs in a confirmed user", async ({
    playwright,
    baseURL,
  }) => {
    const ctx = await playwright.request.newContext({ baseURL });
    try {
      const email = uniqueEmail();
      const password = "hunter22hunter";
      const signup = await ctx.post("/api/v1/auth/signup", {
        data: { email, password, name: "Confirmed" },
      });
      expect(signup.status()).toBe(200);
      const { id } = (await signup.json()) as { id: string };
      await adminClient().auth.admin.updateUserById(id, {
        email_confirm: true,
      });

      const signin = await ctx.post("/api/v1/auth/signin/password", {
        data: { email, password },
      });
      expect(signin.status()).toBe(200);
      const user = (await signin.json()) as {
        id: string;
        email: string;
        name: string | null;
      };
      expect(user.id).toBe(id);
      expect(user.email).toBe(email);

      const me = await ctx.get("/api/v1/auth/me");
      expect(me.status()).toBe(200);
      const meBody = (await me.json()) as { id: string };
      expect(meBody.id).toBe(id);
    } finally {
      await ctx.dispose();
    }
  });

  test("a confirmation email is captured on signup (test mode)", async ({
    request,
  }) => {
    const email = uniqueEmail();
    const before = await request.get("/api/v1/auth/_test-emails", {
      headers: { "x-admin-token": process.env.ADMIN_API_TOKEN ?? "" },
    });
    expect(before.status()).toBe(200);
    const beforeBody = (await before.json()) as {
      emails: Array<{ to: string }>;
    };
    const beforeCount = beforeBody.emails.filter((e) => e.to === email).length;

    const signup = await request.post("/api/v1/auth/signup", {
      data: { email, password: "hunter22hunter" },
    });
    expect(signup.status()).toBe(200);

    const after = await request.get("/api/v1/auth/_test-emails", {
      headers: { "x-admin-token": process.env.ADMIN_API_TOKEN ?? "" },
    });
    expect(after.status()).toBe(200);
    const afterBody = (await after.json()) as {
      emails: Array<{
        to: string;
        subject: string;
        confirmationUrl: string;
      }>;
    };
    const sent = afterBody.emails.filter((e) => e.to === email);
    expect(sent.length).toBe(beforeCount + 1);
    expect(sent[0]!.subject).toContain("Confirm");
    expect(sent[0]!.confirmationUrl).toContain("/api/v1/auth/callback");
  });
});
