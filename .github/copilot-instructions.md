# Copilot instructions for this repo

Purpose: Give AI coding agents the minimum-but-sufficient context to be productive in this codebase. Keep responses concrete and follow the patterns documented here.

## Architecture overview

- Monorepo managed by pnpm workspaces: `apps/backend` (NestJS + Fastify + Prisma + Redis), `apps/frontend` (Vue 3 + Vite + UnoCSS).
- Backend entry: `apps/backend/src/main.ts` uses Fastify adapter, global ValidationPipe, ClassSerializer, and a TransformInterceptor that wraps all successful responses.
- Swagger is enabled in non-production at `/docs` (Nest Swagger) and `/documentation` (Fastify Swagger UI). Cookie auth scheme uses cookie name `sid`.
- Persistence: PostgreSQL via Prisma (`apps/backend/prisma/schema.prisma`). Sessions are stored in Redis using `ioredis` with the token key `sid`.

## Run and environment

- Workspace uses pnpm 10.22.0. Typical dev:
  - Backend: from repo root
    - `pnpm -C apps/backend prisma:generate` and (for a new DB) `pnpm -C apps/backend prisma:push`
    - `pnpm -C apps/backend dev` (Nest watch) or `pnpm -C apps/backend build && pnpm -C apps/backend start`
  - Frontend: `pnpm -C apps/frontend dev`

- Required backend env vars (validated in `EnvConfigModule`): `NODE_ENV`, `PORT` (default 4021), `HOST` (default 0.0.0.0), `DATABASE_URL`, `REDIS_HOST`, `REDIS_PORT` (6379), `REDIS_DB` (0), `COOKIE_SECRET` (optional). Place `.env` in `apps/backend/`.
- Frontend needs `VITE_API_BASE_URL` pointing to the backend, e.g. `http://localhost:4021`.

## Response and error conventions (critical)

- Success shape is unified by `TransformInterceptor` as:
  - `{ code: 200, success: true, message: 'success' | ResMsg, data?: any }`.

- Errors use `HanaException` (see `common/exceptions`) or Nest HttpException, normalized by `AllExceptionFilter`:
  - `{ code: <http>, message: string, errorCode: <project code>, timestamp }`.

- Frontend `ky` client (`apps/frontend/src/service/index.ts`) unwraps API responses and treats only `code === 200` (or `0`) as success. Business errors throw `HanaError`.

## Auth, sessions, and permissions

- Auth is cookie-based sessions (NOT bearer tokens). Cookie name: `sid`. Sessions live in Redis; see `SessionService`.
- `AuthGuard` reads `sid` from cookies and attaches `request.user` and `request.sessionId` (Fastify module augmentation at `src/types/fastify.d.ts`).
- Permission model is RBAC with context:
  - Use decorators from `common/decorators/permissions.decorator.ts`, e.g. `@ProjectPermissions(['api:read'], 'projectId')`.
  - `PermissionsGuard` enforces membership and required permissions using Prisma lookups.
- To make a route public, use `@Public()`. To set a success message, use `@ResMsg('...')`.

## Backend feature patterns

- Feature modules live under `apps/backend/src/<feature>/` with `*.module.ts`, `*.service.ts`, `*.controller.ts`, and `dto/`.
- DTOs use `class-validator` and `class-transformer`. Global ValidationPipe enables whitelist + implicit conversion. Controllers typically `plainToInstance` DTOs for output mapping.
- Logging: `WinstonLogger` is used in production with daily rotate files under `logs/`.
- Build: `tsdown` bundles to `dist/` (config at `tsdown.config.ts`). If a new runtime dependency is added and missing at runtime, consider adding it to `external`.

## Data and seeding

- Seed RBAC and system configs via `apps/backend/scripts/rbac-seed.ts`.
  - Run with one of:
    - `pnpm dlx tsx apps/backend/scripts/rbac-seed.ts`
    - From backend dir: `pnpm dlx tsx scripts/rbac-seed.ts`

- Permissions are defined in `constants/permission.ts`, roles in `constants/role.ts`, system defaults in `constants/system-config.ts`.

## Frontend integration notes

- HTTP client is `ky` with hooks in `src/service/index.ts`.
  - Important: for cookie-based auth, requests must include credentials. When adding calls, pass `{ credentials: 'include' }` or set it on the shared `ky` instance.
  - Hooks unwrap `{ data }` so component code receives the actual payload.

- Router is `vue-router`; UnoCSS is configured in `uno.config.ts`. Vite alias `@` -> `src/`.

## Practical examples

- Protect a route by project permission and use the normalized success shape:
  - Controller method path includes `:projectId` and annotates with `@ProjectPermissions(['api:write'])` and optionally `@ResMsg('...')`.

- To access current user in a controller: use `@ReqUser()` or `@ReqUser('id')`.

If anything above is incomplete or you need additional conventions (e.g., test strategy, CI), open an issue or ask to extend this document.
