import type { NextApiRequest, NextApiResponse } from "next";
import { AppError, ValidationError } from "@/lib/errors";
import { toErrorResponse } from "@/lib/http";
import {
  exchangeCodeForSession,
  isSafeRedirect,
  isVerifyOtpType,
  verifyEmailToken,
} from "@/features/auth/domain";
import { checkRateLimit } from "@/lib/rate-limit";

function clientIp(req: NextApiRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  if (first) return first.split(",")[0]!.trim();
  return req.socket.remoteAddress ?? "unknown";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    const error = new AppError("method not allowed", 405, "METHOD_NOT_ALLOWED");
    res.status(405).json(toErrorResponse(error));
    return;
  }

  const rate = checkRateLimit(`auth-callback:${clientIp(req)}`, 10, 60_000);
  if (!rate.ok) {
    const error = new AppError("too many requests", 429, "RATE_LIMITED");
    res.status(429).json(toErrorResponse(error));
    return;
  }

  const rawCode = req.query.code;
  const code = Array.isArray(rawCode) ? rawCode[0] : rawCode;
  const rawTokenHash = req.query.token_hash;
  const tokenHash = Array.isArray(rawTokenHash)
    ? rawTokenHash[0]
    : rawTokenHash;
  const rawType = req.query.type;
  const type = Array.isArray(rawType) ? rawType[0] : rawType;
  const rawNext = req.query.next;
  const next = Array.isArray(rawNext) ? rawNext[0] : rawNext;

  if (!code && !tokenHash) {
    const error = new ValidationError("code or token_hash is required");
    res.status(error.statusCode).json(toErrorResponse(error));
    return;
  }

  if (!isSafeRedirect(next)) {
    const error = new ValidationError("next must be a same-origin URL");
    res.status(error.statusCode).json(toErrorResponse(error));
    return;
  }

  if (tokenHash) {
    if (!type || !isVerifyOtpType(type)) {
      const error = new ValidationError("type is required");
      res.status(error.statusCode).json(toErrorResponse(error));
      return;
    }
    const result = await verifyEmailToken(req, res, tokenHash, type);
    if (!result.ok) {
      res.status(result.error.statusCode).json(toErrorResponse(result.error));
      return;
    }
    res.redirect(302, next ?? "/");
    return;
  }

  const result = await exchangeCodeForSession(req, res, code!);
  if (!result.ok) {
    res.status(result.error.statusCode).json(toErrorResponse(result.error));
    return;
  }

  res.redirect(302, next ?? "/");
}
