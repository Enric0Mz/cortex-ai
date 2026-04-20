import type { NextApiRequest, NextApiResponse } from "next";
import { AppError } from "@/lib/errors";
import { toErrorResponse } from "@/lib/http";
import { signOut } from "@/features/auth/domain";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    const error = new AppError("method not allowed", 405, "METHOD_NOT_ALLOWED");
    res.status(405).json(toErrorResponse(error));
    return;
  }

  const result = await signOut(req, res);
  if (!result.ok) {
    res.status(result.error.statusCode).json(toErrorResponse(result.error));
    return;
  }

  res.status(204).end();
}
