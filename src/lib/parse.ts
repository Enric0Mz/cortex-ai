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
