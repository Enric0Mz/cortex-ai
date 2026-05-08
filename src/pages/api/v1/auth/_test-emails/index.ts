import type { NextApiRequest, NextApiResponse } from "next";
import { AppError } from "@/lib/errors";
import { toErrorResponse } from "@/lib/http";
import { requireAdminToken } from "@/lib/auth";
import {
  getCapturedEmails,
  clearCapturedEmails,
} from "@/lib/email/send-confirmation";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    res.status(404).end();
    return;
  }

  const auth = requireAdminToken(req);
  if (!auth.ok) {
    res.status(auth.error.statusCode).json(toErrorResponse(auth.error));
    return;
  }

  if (req.method === "GET") {
    res.status(200).json({ emails: getCapturedEmails() });
    return;
  }
  if (req.method === "DELETE") {
    clearCapturedEmails();
    res.status(204).end();
    return;
  }

  res.setHeader("Allow", "GET, DELETE");
  const error = new AppError("method not allowed", 405, "METHOD_NOT_ALLOWED");
  res.status(405).json(toErrorResponse(error));
}
