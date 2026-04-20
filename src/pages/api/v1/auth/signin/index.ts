import type { NextApiRequest, NextApiResponse } from "next";
import { AppError } from "@/lib/errors";
import { toErrorResponse } from "@/lib/http";
import parseBody from "@/lib/parse";
import {
  SignInRequestSchema,
  type SignInResponse,
} from "@/features/auth/schemas";
import { getSignInUrl } from "@/features/auth/domain";
import type { ErrorResponse } from "@/openapi/common";

type ResponseBody = SignInResponse | ErrorResponse;

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

  const body = req.body ?? {};
  const parsed = parseBody(SignInRequestSchema, body);
  if (!parsed.ok) {
    res.status(parsed.error.statusCode).json(toErrorResponse(parsed.error));
    return;
  }

  const result = await getSignInUrl(req, res, parsed.value.next);
  if (!result.ok) {
    res.status(result.error.statusCode).json(toErrorResponse(result.error));
    return;
  }

  res.status(200).json(result.value);
}
