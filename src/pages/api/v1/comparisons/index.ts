import type { NextApiRequest, NextApiResponse } from "next";
import { AppError } from "@/lib/errors";
import {
  CreateComparisonRequestSchema,
  type ComparisonResult,
} from "@/features/comparison/schemas";
import type { ErrorResponse } from "@/openapi/common";
import { runComparison } from "@/features/comparison/domain";
import parseBody from "@/lib/parse";
import { toErrorResponse } from "@/lib/http";
import { requireUser } from "@/lib/auth";

type ResponseBody = ComparisonResult | ErrorResponse;

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

  const user = await requireUser(req, res);
  if (!user.ok) {
    res.status(user.error.statusCode).json(toErrorResponse(user.error));
    return;
  }

  const parsed = parseBody(CreateComparisonRequestSchema, req.body);
  if (!parsed.ok) {
    res.status(parsed.error.statusCode).json(toErrorResponse(parsed.error));
    return;
  }

  const result = await runComparison(user.value.id, parsed.value);
  if (!result.ok) {
    res.status(result.error.statusCode).json(toErrorResponse(result.error));
    return;
  }

  res.status(200).json(result.value);
}
