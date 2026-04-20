@AGENTS.md

# Cortex AI

AI model comparison platform. Sends a prompt to multiple LLM providers in parallel and returns all responses for side-by-side comparison. Built with Next.js (Pages Router), Prisma, Supabase, and Zod.

## Architecture: Three-Layer Rule

Every API feature follows three layers. No exceptions.

```
src/pages/api/v1/<feature>/index.ts   ← HTTP layer
src/features/<feature>/domain.ts      ← Business logic
src/features/<feature>/repository.ts  ← Database access
```

### 1. `index.ts` (HTTP layer)

Lives in `src/pages/api/v1/`. Handles **only** HTTP concerns: method checks, request parsing, calling domain, sending responses. No business logic, no database calls.

```ts
export default async function handler(req, res) {
  // 1. Method guard
  // 2. Parse body with parseBody()
  // 3. Call domain function
  // 4. Send response
}
```

### 2. `domain.ts` (Business logic)

Lives in `src/features/<feature>/`. Orchestrates the feature: calls repository functions, runs provider fan-outs, builds response payloads. Never touches `req`/`res`. Never calls `prisma` directly.

### 3. `repository.ts` (Database layer)

Lives in `src/features/<feature>/`. The **only** place that talks to Prisma/database. Exports functions that return `Result<T, ServiceUnavailableError>`. Domain calls these, never `prisma` directly.

Reference implementation: `src/pages/api/v1/comparisons/index.ts` → `src/features/comparison/domain.ts` → `src/features/comparison/repository.ts`.

## Schemas and Types

Each feature has its schemas in `src/<feature>/schemas.ts`:

- Define shapes as **Zod schemas**, not hand-written interfaces.
- Import `z` from `@/openapi/zod` (loads the OpenAPI extension).
- Derive types with `z.infer<typeof Schema>` and export them alongside the schema.
- Register reusable schemas with `registry.register("Name", schema)` from `@/openapi/registry`.

```ts
// src/comparison/schemas.ts
export const CreateComparisonRequestSchema = registry.register(
  "CreateComparisonRequest",
  z.object({ prompt: z.string().min(1), category: z.string().optional() }),
);
export type CreateComparisonRequest = z.infer<
  typeof CreateComparisonRequestSchema
>;
```

## Error Handling

- Use `Result<T, E>` from `@/lib/result.ts`. Branch on `.ok`, never raw `try`/`catch` in feature code.
- `tryCatch(fn, mapError)` wraps async calls into Results. Use `mapError` to translate low-level errors into domain errors from `@/lib/errors.ts`.
- `parseBody(schema, body)` from `@/lib/parse.ts` returns `Result<T, ValidationError>`.
- `try`/`finally` for cleanup is fine.

## TypeScript

- Only add type annotations when the compiler can't infer or when it improves readability.
- No hand-written interfaces that duplicate a Zod schema. Always `z.infer`.
- Prefer `as const` for literal objects (see `PROVIDER_MODELS` in `src/lib/constants.ts`).

## Development Workflow (TDD)

Follow this order for every new feature:

1. **Discover** — Understand what the feature does. Read related schemas, existing routes, and domain logic.
2. **Plan integration tests** — Write test cases in `tests/integration/<feature>/` using Playwright before writing any implementation.
3. **Execute tests** — Run them, confirm they fail for the right reason.
4. **Plan main code** — Design the three layers (index → domain → repository).
5. **Execute** — Implement until tests pass.

Run tests: `npm run test:integration`

## Simplicity

- No over-engineering. If a simple function works, don't abstract it.
- No speculative features or "just in case" code.
- Three similar lines > one premature abstraction.
- Keep code readable for someone learning — clear names, short functions, obvious flow.

## OpenAPI

- Every route must be registered in `src/openapi/paths/<name>.ts` with `registry.registerPath({...})`.
- That file must be imported from `src/openapi/paths/index.ts` (the barrel).
- Swagger UI: `/api-docs` (dev only by default, `ENABLE_API_DOCS=true` for production).

## Key Files

| Path                                | Purpose                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------- |
| `src/lib/result.ts`                 | `Result<T,E>`, `ok()`, `err()`, `tryCatch()`                              |
| `src/lib/errors.ts`                 | `AppError` hierarchy (`ValidationError`, `ServiceUnavailableError`, etc.) |
| `src/lib/parse.ts`                  | `parseBody(schema, body)` — validates with Zod, returns Result            |
| `src/lib/constants.ts`              | Provider models, timeouts, limits                                         |
| `src/features/provider/registry.ts` | `buildAdapters()` — resolves configured AI providers                      |
| `playwright.config.ts`              | Integration test config, test server on port 3001                         |
