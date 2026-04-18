import type { NextApiRequest, NextApiResponse } from "next";
import { AppError } from "@/lib/errors";
import { toErrorResponse } from "@/lib/http";
import { parseUuidParam } from "@/lib/parse";
import { getVote } from "@/features/vote/domain";
import type { ErrorResponse } from "@/openapi/common";
import type { VoteResponse } from "@/features/vote/schemas";

type ResponseBody = VoteResponse | ErrorResponse;

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

  const comparisonId = parseUuidParam(req, "comparisonId");
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
