import { expect, type APIRequestContext } from "@playwright/test";

export type TestUser = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
};

function uniqueEmail(prefix = "tester"): string {
  const stamp = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
  return `${prefix}+${stamp}@cortex.test`;
}

export async function signInTestUser(
  request: APIRequestContext,
  opts: { email?: string; name?: string } = {},
): Promise<TestUser> {
  const adminToken = process.env.ADMIN_API_TOKEN ?? "";
  const email = opts.email ?? uniqueEmail();
  const name = opts.name ?? "Test User";
  const res = await request.post("/api/v1/auth/_test-signin", {
    headers: { "x-admin-token": adminToken },
    data: { email, name },
  });
  expect(res.status()).toBe(200);
  return (await res.json()) as TestUser;
}
