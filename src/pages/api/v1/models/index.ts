import type { NextApiRequest, NextApiResponse } from "next";
import {
  CreateAiModelsBulkRequestSchema,
  type CreateAiModelsBulkResponse,
  type ListAiModelsResponse,
} from "@/features/ai-models/schemas";
import { createModelsBulk, listModels } from "@/features/ai-models/domain";
import type { ErrorResponse } from "@/openapi/common";
import { AppError } from "@/lib/errors";
import { toErrorResponse } from "@/lib/http";
import parseBody from "@/lib/parse";
import { requireAdminToken } from "@/lib/auth";

type ResponseBody = ListAiModelsResponse | CreateAiModelsBulkResponse | ErrorResponse;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseBody>,
): Promise<void> {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    const error = new AppError("method not allowed", 405, "METHOD_NOT_ALLOWED");
    res.status(405).json(toErrorResponse(error));
    return;
  }

  if (req.method === "POST") {
    const auth = requireAdminToken(req);
    if (!auth.ok) {
      res.status(auth.error.statusCode).json(toErrorResponse(auth.error));
      return;
    }

    const parsed = parseBody(CreateAiModelsBulkRequestSchema, req.body);
    if (!parsed.ok) {
      res.status(parsed.error.statusCode).json(toErrorResponse(parsed.error));
      return;
    }

    const createResult = await createModelsBulk(parsed.value);
    if (!createResult.ok) {
      res
        .status(createResult.error.statusCode)
        .json(toErrorResponse(createResult.error));
      return;
    }

    res.status(201).json(createResult.value);
    return;
  }

  const listResult = await listModels();
  if (!listResult.ok) {
    res
      .status(listResult.error.statusCode)
      .json(toErrorResponse(listResult.error));
    return;
  }

  res.status(200).json(listResult.value);
}
