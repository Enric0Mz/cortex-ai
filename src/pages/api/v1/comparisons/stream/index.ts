import type { NextApiRequest, NextApiResponse } from "next";
import { AppError } from "@/lib/errors";
import { CreateComparisonRequestSchema } from "@/features/comparison/schemas";
import { streamComparison } from "@/features/comparison/stream-domain";
import type { StreamEvent } from "@/features/comparison/stream-schemas";
import parseBody from "@/lib/parse";
import { toErrorResponse } from "@/lib/http";
import { requireUser } from "@/lib/auth";

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

  const user = await requireUser(req, res);
  if (!user.ok) {
    res.status(user.error.statusCode).json(toErrorResponse(user.error));
    return;
  }

  const parsed = parseBody(CreateComparisonRequestSchema, req.body);
  if (!parsed.ok) {
    res.status(parsed.error.statusCode).json(toErrorResponse(parsed.error));
    return;
  }

  const controller = new AbortController();
  const abort = () => controller.abort();
  req.on("close", abort);
  res.on("close", abort);

  const setup = await streamComparison(
    user.value.id,
    parsed.value,
    controller.signal,
  );
  if (!setup.ok) {
    res.status(setup.error.statusCode).json(toErrorResponse(setup.error));
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  try {
    for await (const evt of setup.value) {
      if (controller.signal.aborted) break;
      if (!writeEvent(res, evt)) break;
    }
  } catch (cause) {
    console.error("[comparisons/stream] iteration error:", cause);
  } finally {
    res.end();
  }
}

function writeEvent(res: NextApiResponse, evt: StreamEvent): boolean {
  const frame = `event: ${evt.event}\ndata: ${JSON.stringify(evt.data)}\n\n`;
  return res.write(frame);
}
