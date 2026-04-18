import type { NextApiRequest, NextApiResponse } from "next";
import { z } from "@/openapi/zod";
import { AppError, ValidationError } from "@/lib/errors";
import { toErrorResponse } from "@/lib/http";
import type { ErrorResponse } from "@/openapi/common";
import { getResponseById } from "@/features/response/domain";
import type { ResponseDetails } from "@/features/response/schemas";

type ResponseBody = ResponseDetails | ErrorResponse;

const ResponseIdSchema = z.uuid();

function parseResponseId(
  req: NextApiRequest,
): { ok: true; value: string } | { ok: false; error: ValidationError } {
  const raw = req.query.responseId;
  const responseId = Array.isArray(raw) ? raw[0] : raw;

  if (!responseId) {
    return {
      ok: false,
      error: new ValidationError("responseId is required"),
    };
  }

  const parsed = ResponseIdSchema.safeParse(responseId);
  if (!parsed.success) {
    return {
      ok: false,
      error: new ValidationError("responseId must be a valid uuid"),
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

  const responseId = parseResponseId(req);
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
