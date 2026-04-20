import type { NextApiRequest, NextApiResponse } from "next";
import {
  ServiceUnavailableError,
  UnauthorizedError,
  ValidationError,
} from "@/lib/errors";
import { ok, err, tryCatch, type Result } from "@/lib/result";
import { env } from "@/lib/env";
import { createServerSupabase } from "@/lib/supabase/server";
import type { CurrentUser, SignInResponse } from "./schemas";
import { findUserById, upsertUserFromAuth } from "./repository";

export function isSafeRedirect(next: string | undefined): boolean {
  if (!next) return true;
  if (next.startsWith("/") && !next.startsWith("//")) return true;
  try {
    const parsed = new URL(next);
    const app = new URL(env.NEXT_PUBLIC_APP_URL);
    return parsed.origin === app.origin;
  } catch {
    return false;
  }
}

export async function getSignInUrl(
  req: NextApiRequest,
  res: NextApiResponse,
  next: string | undefined,
): Promise<Result<SignInResponse, ValidationError | ServiceUnavailableError>> {
  if (!isSafeRedirect(next)) {
    return err(new ValidationError("next must be a same-origin URL"));
  }

  const supabase = createServerSupabase(req, res);
  const nextParam = next ? `?next=${encodeURIComponent(next)}` : "";
  const redirectTo = `${env.NEXT_PUBLIC_APP_URL}/api/v1/auth/callback${nextParam}`;

  const result = await tryCatch(
    async () => {
      return await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo, skipBrowserRedirect: true },
      });
    },
    (cause) => new ServiceUnavailableError("auth", cause),
  );

  if (!result.ok) return err(result.error);
  const { data, error } = result.value;
  if (error || !data.url) {
    return err(new ServiceUnavailableError("auth"));
  }
  return ok({ url: data.url });
}

export async function exchangeCodeForSession(
  req: NextApiRequest,
  res: NextApiResponse,
  code: string,
): Promise<Result<CurrentUser, UnauthorizedError | ServiceUnavailableError>> {
  const supabase = createServerSupabase(req, res);

  const exchange = await tryCatch(
    async () => supabase.auth.exchangeCodeForSession(code),
    (cause) => new ServiceUnavailableError("auth", cause),
  );
  if (!exchange.ok) return err(exchange.error);
  const { data, error } = exchange.value;
  if (error || !data.session || !data.user) {
    return err(new UnauthorizedError("authentication required"));
  }

  const meta = (data.user.user_metadata ?? {}) as Record<string, unknown>;
  const name =
    typeof meta.full_name === "string"
      ? meta.full_name
      : typeof meta.name === "string"
        ? meta.name
        : null;
  const avatarUrl =
    typeof meta.avatar_url === "string" ? meta.avatar_url : null;

  return upsertUserFromAuth({
    id: data.user.id,
    email: data.user.email ?? "",
    name,
    avatarUrl,
  });
}

export async function getCurrentUser(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<Result<CurrentUser, UnauthorizedError | ServiceUnavailableError>> {
  const supabase = createServerSupabase(req, res);

  const session = await tryCatch(
    async () => supabase.auth.getUser(),
    (cause) => new ServiceUnavailableError("auth", cause),
  );
  if (!session.ok) return err(session.error);
  const { data, error } = session.value;
  if (error || !data.user) {
    return err(new UnauthorizedError("authentication required"));
  }

  const userResult = await findUserById(data.user.id);
  if (!userResult.ok) return err(userResult.error);
  if (!userResult.value) {
    return err(new UnauthorizedError("authentication required"));
  }
  return ok(userResult.value);
}

export async function signOut(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<Result<void, ServiceUnavailableError>> {
  const supabase = createServerSupabase(req, res);
  const result = await tryCatch(
    async () => supabase.auth.signOut(),
    (cause) => new ServiceUnavailableError("auth", cause),
  );
  if (!result.ok) return err(result.error);
  return ok(undefined);
}
