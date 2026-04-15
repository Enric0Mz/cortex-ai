<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## API route conventions

- Request and response shapes live in `src/<feature>/schemas.ts` as Zod schemas, not hand-written interfaces. Import `z` from `@/openapi/zod` so the OpenAPI extension is guaranteed to be loaded.
- Derive types with `z.infer<typeof SomeSchema>` and export them alongside the schema. Do not duplicate the shape as a TS interface.
- Register reusable schemas as components via `registry.register("RefName", schema)` from `@/openapi/registry`. Registered schemas show up under `components.schemas` in the generated spec.
- Every new route must be registered in `src/openapi/paths/<name>.ts` with `registry.registerPath({...})`, and that file must be side-effect imported from `src/openapi/paths/index.ts`. This barrel is what the `/api/v1/openapi` handler loads to populate the registry — handlers themselves are lazy-loaded by Next.js and cannot be relied on to register paths.
- Handlers validate inputs at the boundary with `Schema.parse(...)` (or `.safeParse(...)` when you want a `Result`-friendly branch). Don't trust `req.body` or query strings — they are `unknown` until parsed.
- Error responses use `ErrorResponseSchema` from `@/openapi/common`. Status code, code, and message match the `AppError` hierarchy in `src/lib/errors.ts`.
- Error handling follows the Result/tryCatch convention (see `src/lib/result.ts`). Reference implementation: `src/pages/api/v1/health.ts`. No raw `try`/`catch` in feature code; `try`/`finally` for cleanup is fine.
- The Swagger UI lives at `/api-docs` and is served in development only by default. Set `ENABLE_API_DOCS=true` to expose it in production.
