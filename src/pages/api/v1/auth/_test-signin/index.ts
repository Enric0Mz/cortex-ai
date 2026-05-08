import type { NextApiRequest, NextApiResponse } from "next";
import { AppError } from "@/lib/errors";
import { toErrorResponse } from "@/lib/http";
import { requireAdminToken } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { upsertUserFromAuth } from "@/features/auth/repository";

const TEST_PASSWORD = "cortex-test-password-change-me";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    res.status(404).end();
    return;
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    const error = new AppError("method not allowed", 405, "METHOD_NOT_ALLOWED");
    res.status(405).json(toErrorResponse(error));
    return;
  }

  const auth = requireAdminToken(req);
  if (!auth.ok) {
    res.status(auth.error.statusCode).json(toErrorResponse(auth.error));
    return;
  }

  const body = (req.body ?? {}) as { email?: unknown; name?: unknown };
  const email = typeof body.email === "string" ? body.email : null;
  const name = typeof body.name === "string" ? body.name : null;
  if (!email) {
    const error = new AppError("email required", 400, "VALIDATION_ERROR");
    res.status(400).json(toErrorResponse(error));
    return;
  }

  const admin = createAdminSupabase();

  const list = await admin.auth.admin.listUsers();
  if (list.error) {
    const error = new AppError("auth unavailable", 503, "SERVICE_UNAVAILABLE");
    res.status(503).json(toErrorResponse(error));
    return;
  }
  let user = list.data.users.find((u) => u.email === email) ?? null;

  if (!user) {
    const created = await admin.auth.admin.createUser({
      email,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: name ? { full_name: name } : undefined,
    });
    if (created.error || !created.data.user) {
      const error = new AppError(
        "auth unavailable",
        503,
        "SERVICE_UNAVAILABLE",
      );
      res.status(503).json(toErrorResponse(error));
      return;
    }
    user = created.data.user;
  } else {
    await admin.auth.admin.updateUserById(user.id, { password: TEST_PASSWORD });
  }

  const server = createServerSupabase(req, res);
  const signIn = await server.auth.signInWithPassword({
    email,
    password: TEST_PASSWORD,
  });
  if (signIn.error || !signIn.data.session) {
    const error = new AppError("auth unavailable", 503, "SERVICE_UNAVAILABLE");
    res.status(503).json(toErrorResponse(error));
    return;
  }

  const upsert = await upsertUserFromAuth({
    id: user.id,
    email,
    name,
    avatarUrl: null,
    authProvider: "google",
    emailConfirmedAt: new Date(),
  });
  if (!upsert.ok) {
    res.status(upsert.error.statusCode).json(toErrorResponse(upsert.error));
    return;
  }

  res.status(200).json(upsert.value);
}
