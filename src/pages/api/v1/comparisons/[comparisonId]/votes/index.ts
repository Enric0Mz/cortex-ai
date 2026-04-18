import type { NextApiRequest, NextApiResponse } from "next";
import { AppError } from "@/lib/errors";
import { toErrorResponse } from "@/lib/http";
import parseBody, { parseUuidParam } from "@/lib/parse";
import {
  CreateVoteRequestSchema,
  type VoteResponse,
} from "@/features/vote/schemas";
import { castVote } from "@/features/vote/domain";
import type { ErrorResponse } from "@/openapi/common";

type ResponseBody = VoteResponse | ErrorResponse;

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

  const comparisonId = parseUuidParam(req, "comparisonId");
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
