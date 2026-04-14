export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

/**
 * Runs an async function and captures any thrown error into a Result.
 * Callers branch on `result.ok` instead of wrapping call sites in try/catch.
 *
 * A mapError hook lets feature code translate low-level errors (e.g. Prisma)
 * into domain errors from @/lib/errors without an extra catch block.
 */
export async function tryCatch<T, E = Error>(
  fn: () => Promise<T>,
  mapError?: (cause: unknown) => E
): Promise<Result<T, E>> {
  try {
    return ok(await fn());
  } catch (cause) {
    if (mapError) {
      return err(mapError(cause));
    }
    const error =
      cause instanceof Error ? cause : new Error(String(cause));
    return err(error as unknown as E);
  }
}
