import type { NextApiRequest, NextApiResponse } from "next";
import { AppError } from "@/lib/errors";
import { toErrorResponse } from "@/lib/http";
import { parseUuidParam } from "@/lib/parse";
import type { ErrorResponse } from "@/openapi/common";
import { getResponseById } from "@/features/response/domain";
import type { ResponseDetails } from "@/features/response/schemas";

type ResponseBody = ResponseDetails | ErrorResponse;

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

  const responseId = parseUuidParam(req, "responseId");
  if (!responseId.ok) {
    res.status(responseId.error.statusCode).json(toErrorResponse(responseId.error));
    return;
  }

  const result = await getResponseById(responseId.value);
  if (!result.ok) {
    res.status(result.error.statusCode).json(toErrorResponse(result.error));
    return;
  }

  res.status(200).json(result.value);
}
