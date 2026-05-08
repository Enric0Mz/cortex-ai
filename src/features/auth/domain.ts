import type { NextApiRequest, NextApiResponse } from "next";
import {
  ConflictError,
  ServiceUnavailableError,
  UnauthorizedError,
  ValidationError,
} from "@/lib/errors";
import { ok, err, tryCatch, type Result } from "@/lib/result";
import { env } from "@/lib/env";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { sendConfirmationEmail } from "@/lib/email/send-confirmation";
import type { CurrentUser, SignInResponse, SignUpResponse } from "./schemas";
import { deleteUserById, findUserById, upsertUserFromAuth } from "./repository";

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

  const appMeta = (data.user.app_metadata ?? {}) as Record<string, unknown>;
  const provider = appMeta.provider === "email" ? "email" : "google";

  return upsertUserFromAuth({
    id: data.user.id,
    email: data.user.email ?? "",
    name,
    avatarUrl,
    authProvider: provider,
    emailConfirmedAt: parseConfirmedAt(data.user.email_confirmed_at),
  });
}

function parseConfirmedAt(value: string | null | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

const VERIFY_OTP_TYPES = ["magiclink", "signup", "email", "recovery"] as const;
type VerifyOtpType = (typeof VERIFY_OTP_TYPES)[number];

export function isVerifyOtpType(value: string): value is VerifyOtpType {
  return (VERIFY_OTP_TYPES as readonly string[]).includes(value);
}

export async function verifyEmailToken(
  req: NextApiRequest,
  res: NextApiResponse,
  tokenHash: string,
  type: VerifyOtpType,
): Promise<Result<CurrentUser, UnauthorizedError | ServiceUnavailableError>> {
  const supabase = createServerSupabase(req, res);

  const verify = await tryCatch(
    async () => supabase.auth.verifyOtp({ token_hash: tokenHash, type }),
    (cause) => new ServiceUnavailableError("auth", cause),
  );
  if (!verify.ok) return err(verify.error);
  const { data, error } = verify.value;
  if (error || !data.session || !data.user) {
    return err(new UnauthorizedError("invalid or expired confirmation link"));
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
    authProvider: "email",
    emailConfirmedAt: parseConfirmedAt(data.user.email_confirmed_at),
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

type SignUpInput = {
  email: string;
  password: string;
  name?: string;
};

type SignUpError = ValidationError | ConflictError | ServiceUnavailableError;

function classifySupabaseSignUpError(
  message: string,
  status: number | undefined,
): SignUpError | null {
  const m = message.toLowerCase();
  if (
    m.includes("already registered") ||
    m.includes("already been registered") ||
    m.includes("user already exists")
  ) {
    return new ConflictError("email already registered");
  }
  if (m.includes("password") && (m.includes("weak") || m.includes("short"))) {
    return new ValidationError("password too weak");
  }
  if (status === 422) {
    return new ValidationError(message);
  }
  return null;
}

export async function signUpWithPassword(
  input: SignUpInput,
): Promise<Result<SignUpResponse, SignUpError>> {
  const admin = createAdminSupabase();
  const redirectTo = `${env.NEXT_PUBLIC_APP_URL}/api/v1/auth/callback`;

  const created = await tryCatch(
    async () =>
      admin.auth.admin.createUser({
        email: input.email,
        password: input.password,
        email_confirm: false,
        user_metadata: input.name ? { full_name: input.name } : undefined,
      }),
    (cause) => new ServiceUnavailableError("auth", cause),
  );
  if (!created.ok) return err(created.error);

  const createdRes = created.value;
  if (createdRes.error || !createdRes.data.user) {
    if (createdRes.error) {
      const mapped = classifySupabaseSignUpError(
        createdRes.error.message,
        createdRes.error.status,
      );
      if (mapped) return err(mapped);
    }
    return err(new ServiceUnavailableError("auth"));
  }
  const user = createdRes.data.user;

  async function rollback(dbRowExists: boolean): Promise<void> {
    if (dbRowExists) {
      await deleteUserById(user.id);
    }
    await tryCatch(
      async () => admin.auth.admin.deleteUser(user.id),
      (cause) => new ServiceUnavailableError("auth", cause),
    );
  }

  const upserted = await upsertUserFromAuth({
    id: user.id,
    email: input.email,
    name: input.name ?? null,
    avatarUrl: null,
    authProvider: "email",
    emailConfirmedAt: parseConfirmedAt(user.email_confirmed_at),
  });
  if (!upserted.ok) {
    await rollback(false);
    return err(upserted.error);
  }

  const linkResult = await tryCatch(
    async () =>
      admin.auth.admin.generateLink({
        type: "magiclink",
        email: input.email,
        options: { redirectTo },
      }),
    (cause) => new ServiceUnavailableError("auth", cause),
  );
  if (!linkResult.ok) {
    await rollback(true);
    return err(linkResult.error);
  }

  const { data: linkData, error: linkErr } = linkResult.value;
  if (linkErr || !linkData.properties?.hashed_token) {
    await rollback(true);
    return err(new ServiceUnavailableError("auth"));
  }

  const callbackUrl = new URL(redirectTo);
  callbackUrl.searchParams.set("token_hash", linkData.properties.hashed_token);
  callbackUrl.searchParams.set("type", "magiclink");

  const send = await sendConfirmationEmail({
    to: input.email,
    name: input.name ?? null,
    confirmationUrl: callbackUrl.toString(),
  });
  if (!send.ok) {
    await rollback(true);
    return err(send.error);
  }

  return ok({
    id: user.id,
    email: input.email,
    emailConfirmationRequired: true,
  });
}

type SignInWithPasswordError = UnauthorizedError | ServiceUnavailableError;

export async function signInWithEmailPassword(
  req: NextApiRequest,
  res: NextApiResponse,
  input: { email: string; password: string },
): Promise<Result<CurrentUser, SignInWithPasswordError>> {
  const supabase = createServerSupabase(req, res);

  const result = await tryCatch(
    async () =>
      supabase.auth.signInWithPassword({
        email: input.email,
        password: input.password,
      }),
    (cause) => new ServiceUnavailableError("auth", cause),
  );
  if (!result.ok) return err(result.error);

  const { data, error } = result.value;
  if (error || !data.user || !data.session) {
    const message = (error?.message ?? "").toLowerCase();
    if (message.includes("not confirmed")) {
      return err(new UnauthorizedError("email not confirmed"));
    }
    return err(new UnauthorizedError("invalid email or password"));
  }

  const meta = (data.user.user_metadata ?? {}) as Record<string, unknown>;
  const name =
    typeof meta.full_name === "string"
      ? meta.full_name
      : typeof meta.name === "string"
        ? meta.name
        : null;

  return upsertUserFromAuth({
    id: data.user.id,
    email: data.user.email ?? input.email,
    name,
    avatarUrl: null,
    authProvider: "email",
    emailConfirmedAt: parseConfirmedAt(data.user.email_confirmed_at),
  });
}
