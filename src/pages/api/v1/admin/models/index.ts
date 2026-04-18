import type { NextApiRequest, NextApiResponse } from "next";
import {
  CreateAiModelRequestSchema,
  type AiModelResponse,
} from "@/features/ai-models/schemas";
import { createModel } from "@/features/ai-models/domain";
import { AppError } from "@/lib/errors";
import type { ErrorResponse } from "@/openapi/common";
import parseBody from "@/lib/parse";
import { requireAdminToken } from "@/lib/auth";
import { toErrorResponse } from "@/lib/http";

type ResponseBody = AiModelResponse | ErrorResponse;

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

  const auth = requireAdminToken(req);
  if (!auth.ok) {
    res.status(auth.error.statusCode).json(toErrorResponse(auth.error));
    return;
  }

  const parsed = parseBody(CreateAiModelRequestSchema, req.body);
  if (!parsed.ok) {
    res.status(parsed.error.statusCode).json(toErrorResponse(parsed.error));
    return;
  }

  const result = await createModel(parsed.value);
  if (!result.ok) {
    res.status(result.error.statusCode).json(toErrorResponse(result.error));
    return;
  }

  res.status(201).json(result.value);
}
