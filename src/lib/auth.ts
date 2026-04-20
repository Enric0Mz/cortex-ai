import type { NextApiRequest, NextApiResponse } from "next";
import { env } from "@/lib/env";
import { ServiceUnavailableError, UnauthorizedError } from "@/lib/errors";
import { ok, err, type Result } from "@/lib/result";
import { getCurrentUser } from "@/features/auth/domain";
import type { CurrentUser } from "@/features/auth/schemas";

export function requireAdminToken(
  req: NextApiRequest,
): Result<void, UnauthorizedError> {
  const header = req.headers["x-admin-token"];
  const token = Array.isArray(header) ? header[0] : header;
  if (!env.ADMIN_API_TOKEN || !token || token !== env.ADMIN_API_TOKEN) {
    return err(new UnauthorizedError("admin token required"));
  }
  return ok(undefined);
}

export async function requireUser(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<Result<CurrentUser, UnauthorizedError | ServiceUnavailableError>> {
  return getCurrentUser(req, res);
}
