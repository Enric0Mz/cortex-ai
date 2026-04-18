import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "@/openapi/zod";
import { AppError, ValidationError } from "@/lib/errors";
import { toErrorResponse } from "@/lib/http";
import { getVote } from "@/features/vote/domain";
import type { ErrorResponse } from "@/openapi/common";
import type { GetVoteResponse } from "@/features/vote/schemas";

type ResponseBody = GetVoteResponse | ErrorResponse;

const ComparisonIdSchema = z.uuid();

function parseComparisonId(
  req: NextApiRequest,
): { ok: true; value: string } | { ok: false; error: ValidationError } {
  const raw = req.query.comparisonId;
  const comparisonId = Array.isArray(raw) ? raw[0] : raw;

  if (!comparisonId) {
    return {
      ok: false,
      error: new ValidationError("comparisonId is required"),
    };
  }

  const parsed = ComparisonIdSchema.safeParse(comparisonId);
  if (!parsed.success) {
    return {
      ok: false,
      error: new ValidationError("comparisonId must be a valid uuid"),
    };
  }

  return { ok: true, value: parsed.data };
}

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

  const comparisonId = parseComparisonId(req);
  if (!comparisonId.ok) {
    res
      .status(comparisonId.error.statusCode)
      .json(toErrorResponse(comparisonId.error));
    return;
  }

  const result = await getVote(comparisonId.value);
  if (!result.ok) {
    res.status(result.error.statusCode).json(toErrorResponse(result.error));
    return;
  }

  res.status(200).json(result.value);
}
