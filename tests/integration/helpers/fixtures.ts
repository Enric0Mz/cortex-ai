import { test as base, type APIRequestContext } from "@playwright/test";
import { signInTestUser, type TestUser } from "./auth";

type Session = { ctx: APIRequestContext; user: TestUser };

type Fixtures = {
  anon: APIRequestContext;
  ctx: APIRequestContext;
  user: TestUser;
  _session: Session;
};

export const test = base.extend<Fixtures>({
  anon: async ({ playwright, baseURL }, use) => {
    const anon = await playwright.request.newContext({ baseURL });
    await use(anon);
    await anon.dispose();
  },
  _session: async ({ playwright, baseURL }, use) => {
    const ctx = await playwright.request.newContext({ baseURL });
    const user = await signInTestUser(ctx);
    await use({ ctx, user });
    await ctx.dispose();
  },
  ctx: async ({ _session }, use) => {
    await use(_session.ctx);
  },
  user: async ({ _session }, use) => {
    await use(_session.user);
  },
});

export { expect } from "@playwright/test";
