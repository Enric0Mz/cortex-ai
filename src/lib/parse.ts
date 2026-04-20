import type { NextApiRequest } from "next";
import { z } from "zod";
import { ValidationError } from "./errors";
import { ok, err, type Result } from "./result";

export default function parseBody<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
  body: unknown,
): Result<z.infer<z.ZodObject<T>>, ValidationError> {
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return err(
      new ValidationError(
        parsed.error.issues[0]?.message ?? "invalid request body",
      ),
    );
  }
  return ok(parsed.data);
}

const UuidSchema = z.uuid();

export function parseUuidParam(
  req: NextApiRequest,
  name: string,
): Result<string, ValidationError> {
  const raw = req.query[name];
  const value = Array.isArray(raw) ? raw[0] : raw;

  if (!value) {
    return err(new ValidationError(`${name} is required`));
  }

  const parsed = UuidSchema.safeParse(value);
  if (!parsed.success) {
    return err(new ValidationError(`${name} must be a valid uuid`));
  }

  return ok(parsed.data);
}
