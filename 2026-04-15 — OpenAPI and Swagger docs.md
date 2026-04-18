# Models catalog endpoints — implementation report

Branch: `feature/comparison`

Commits:
- `304a20b12c051f4658b12ab4eb5e97e1b9c2f307` — `feat(models): add admin and public model catalog APIs`
- `b9e69f23add6c6c384891b23a32cbe92db0f2ffc` — `test(integration): reset DB before running suite`

## Goal

Implement an admin-curated AI model catalog with:
- public listing (`GET /api/v1/models`)
- admin model creation (`POST /api/v1/admin/models`)
- admin bulk model creation (`POST /api/v1/models`)

Also stop implicit model growth from comparison execution by requiring models to be pre-registered.

## What shipped

### Schemas — `src/features/ai-models/schemas.ts`

Zod-first contracts registered in the OpenAPI registry:

- `AiModelSchema` + `AiModel` type (fixed old lowercase type naming).
- `CreateAiModelRequestSchema` for single creation.
- `AiModelResponseSchema` and `ListAiModelsResponseSchema`.
- `CreateAiModelsBulkRequestSchema` (`{ models: [...] }`, min 1 item).
- `CreateAiModelsBulkResponseSchema` (array of created rows).

All types are `z.infer` exports.

### Auth + HTTP helpers — `src/lib/`

- `auth.ts`:
  - `requireAdminToken(req)` validates `x-admin-token` against `env.ADMIN_API_TOKEN`.
  - returns `Result<void, UnauthorizedError>`.
- `http.ts`:
  - `toErrorResponse(error)` centralizes `AppError -> ErrorResponse` mapping.

### AI models domain/repository — `src/features/ai-models/`

- `domain.ts`:
  - `listModels()`
  - `createModel(input)`
  - `createModelsBulk(input)`
- `repository.ts`:
  - `listAiModels()` sorted by provider/name
  - `createAiModel()` with `P2002 -> ConflictError`
  - `createAiModelsBulk()` with `P2002 -> ConflictError`
  - `findAiModelByNameProvider()`
  - all DB calls wrapped with `tryCatch` and map infra failures to `ServiceUnavailableError`.

### Routes — `src/pages/api/v1/`

- `models/index.ts`:
  - `GET /api/v1/models` (public list)
  - `POST /api/v1/models` (admin-token protected bulk create)
  - method guard `Allow: GET, POST`
  - body parsing via `parseBody(...)`
  - app errors via `toErrorResponse(...)`
- `admin/models/index.ts`:
  - `POST /api/v1/admin/models` (admin-token protected single create)
  - method guard `Allow: POST`
  - body parsing via `parseBody(...)`

### Comparison persistence change — `src/features/comparison/`

- `repository.ts`:
  - removed `aiModel` upsert side effect in `CreateComparisonResponse`.
  - now resolves model IDs only from already-registered `(name, provider)` pairs.
  - responses tied to unregistered models are excluded from DB insert.
- `domain.ts`:
  - missing persisted ID for a provider now surfaces as:
    - `status: "failed"`
    - `error: "model not registered"`

### OpenAPI — `src/openapi/paths/`

- Added `models.ts` path registration for:
  - `GET /api/v1/models`
  - `POST /api/v1/models`
  - `POST /api/v1/admin/models`
- Added header parameter documentation for `x-admin-token`.
- Imported `./models` in `paths/index.ts`.

### Env wiring

- `src/lib/env.ts` includes `ADMIN_API_TOKEN`.
- `.env.example` documents required admin token.
- `.env.test` / `.env.test.example` include test admin token.

### Integration coverage

- `tests/integration/ai-models/models.spec.ts`:
  - list empty
  - admin token required/invalid
  - single create 201
  - duplicate create 409
  - list sorted
  - invalid body 400
  - bulk create 201
  - bulk without token 401
  - invalid bulk body 400
- `tests/integration/comparison/comparison.spec.ts`:
  - pre-registers fake adapter models before comparison tests.
- `tests/integration/openapi/openapi.spec.ts`:
  - asserts new paths and schemas exist.

### Test workflow hardening

- `package.json`:
  - `test:integration` now runs DB reset first:
    - `npm run test:db:reset && playwright test tests/integration`
- `playwright.config.ts`:
  - forced `workers: 1` to avoid DB state races with health tests that intentionally toggle database availability.

## Verification

- `npm run lint` — passed.
- `npm run test:integration` — passed (`16 passed`) with DB reset included in the command.

## Not in this change

- No update/delete model admin routes.
- No migration to Supabase role-based authorization (still shared-secret header).
- No admin UI.
