import type { NextApiRequest, NextApiResponse } from "next";
import { AppError } from "@/lib/errors";
import { toErrorResponse } from "@/lib/http";
import parseBody from "@/lib/parse";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  SignUpRequestSchema,
  type SignUpResponse,
} from "@/features/auth/schemas";
import { signUpWithPassword } from "@/features/auth/domain";
import type { ErrorResponse } from "@/openapi/common";

type ResponseBody = SignUpResponse | ErrorResponse;

function clientIp(req: NextApiRequest): string {
  const forwarded = req.headers["x-forwarded-for"];
  const first = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  if (first) return first.split(",")[0]!.trim();
  return req.socket.remoteAddress ?? "unknown";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseBody>,
): Promise<void> {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    const error = new AppError("method not allowed", 405, "METHOD_NOT_ALLOWED");
    res.status(405).json(toErrorResponse(error));
    return;
  }

  const rate = checkRateLimit(`signup:${clientIp(req)}`, 20, 60_000);
  if (!rate.ok) {
    const error = new AppError("too many requests", 429, "RATE_LIMITED");
    res.status(429).json(toErrorResponse(error));
    return;
  }

  const parsed = parseBody(SignUpRequestSchema, req.body ?? {});
  if (!parsed.ok) {
    res.status(parsed.error.statusCode).json(toErrorResponse(parsed.error));
    return;
  }

  const result = await signUpWithPassword(parsed.value);
  if (!result.ok) {
    res.status(result.error.statusCode).json(toErrorResponse(result.error));
    return;
  }

  res.status(200).json(result.value);
}
