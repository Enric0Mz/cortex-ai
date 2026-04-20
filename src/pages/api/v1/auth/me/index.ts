import type { NextApiRequest, NextApiResponse } from "next";
import { AppError } from "@/lib/errors";
import { toErrorResponse } from "@/lib/http";
import { getCurrentUser } from "@/features/auth/domain";
import type { CurrentUser } from "@/features/auth/schemas";
import type { ErrorResponse } from "@/openapi/common";

type ResponseBody = CurrentUser | ErrorResponse;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseBody>,
): Promise<void> {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    const error = new AppError("method not allowed", 405, "METHOD_NOT_ALLOWED");
    res.status(405).json(toErrorResponse(error));
    return;
  }

  const result = await getCurrentUser(req, res);
  if (!result.ok) {
    res.status(result.error.statusCode).json(toErrorResponse(result.error));
    return;
  }

  res.status(200).json(result.value);
}
