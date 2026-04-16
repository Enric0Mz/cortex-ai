import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { AppError, ServiceUnavailableError } from "@/lib/errors";
import { tryCatch, type Result } from "@/lib/result";
import {
  CreateComparisonRequestSchema,
  type ComparisonResult,
} from "@/features/comparison/schemas";
import type { ErrorResponse } from "@/openapi/common";
import { runComparison } from "@/features/comparison/domain";
import parseBody from "@/lib/parse";

type ResponseBody = ComparisonResult | ErrorResponse;

// TODO(auth): replace with authed Supabase user
async function getAnonymousUserId(): Promise<
  Result<string, ServiceUnavailableError>
> {
  return tryCatch(
    async () => {
      const user = await prisma.user.upsert({
        where: { email: "anonymous@local" },
        update: {},
        create: {
          email: "anonymous@local",
          name: "Anonymous",
          authProvider: "anonymous",
        },
        select: { id: true },
      });
      return user.id;
    },
    (cause) => new ServiceUnavailableError("database", cause),
  );
}

function toErrorResponse(error: AppError): ErrorResponse {
  return {
    code: error.code,
    message: error.message,
    statusCode: error.statusCode,
  };
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

  const parsed = parseBody(CreateComparisonRequestSchema, req.body);

  if (!parsed.ok) {
    res.status(parsed.error.statusCode).json(toErrorResponse(parsed.error));
    return;
  }

  const input = parsed.value;

  const userResult = await getAnonymousUserId();
  if (!userResult.ok) {
    res
      .status(userResult.error.statusCode)
      .json(toErrorResponse(userResult.error));
    return;
  }

  const result = await runComparison(userResult.value, input);
  if (!result.ok) {
    res.status(result.error.statusCode).json(toErrorResponse(result.error));
    return;
  }

  res.status(200).json(result.value);
}
