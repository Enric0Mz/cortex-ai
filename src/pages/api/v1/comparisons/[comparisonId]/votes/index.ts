import type { NextApiRequest, NextApiResponse } from "next";
import { AppError, ValidationError } from "@/lib/errors";
import { toErrorResponse } from "@/lib/http";
import parseBody from "@/lib/parse";
import {
  CreateVoteRequestSchema,
  type VoteResponse,
} from "@/features/vote/schemas";
import { castVote } from "@/features/vote/domain";
import type { ErrorResponse } from "@/openapi/common";

type ResponseBody = VoteResponse | ErrorResponse;

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

  return { ok: true, value: comparisonId };
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

  const comparisonId = parseComparisonId(req);
  if (!comparisonId.ok) {
    res
      .status(comparisonId.error.statusCode)
      .json(toErrorResponse(comparisonId.error));
    return;
  }

  const parsed = parseBody(CreateVoteRequestSchema, req.body);
  if (!parsed.ok) {
    res.status(parsed.error.statusCode).json(toErrorResponse(parsed.error));
    return;
  }

  const result = await castVote(comparisonId.value, parsed.value);
  if (!result.ok) {
    res.status(result.error.statusCode).json(toErrorResponse(result.error));
    return;
  }

  res.status(200).json(result.value);
}
