# API (Bun + Express + Zod + Postgres)

API med fokus på:
- Strict typed env + hard validation at startup
- Env-driven Problem Type URIs (RFC 9457 style)
- Problem Details (`application/problem+json`) for all errors
- Object-oriented repos + dependency injection
- DB-backed opaque session tokens (no JWT in v1)
- Structured logging + optional cache provider

## Structure

- `src/provider/config.ts`
- `src/provider/db.ts`
- `src/provider/http.ts`
- `src/provider/cache.ts` (`noop`, `memory`, `redis`)
- `src/provider/logger.ts`
- `src/middleware/*.ts` (auth/rate-limit/request-logging)
- `src/repo/*.ts`
- `src/request/*.ts`
- `src/routes/*.ts`
- `src/utils/*.ts`
- `src/migrations/*.sql`

## Run

```bash
bun install
docker compose up -d
cp .env.example .env
bun run migrate
bun run dev
```

## Endpoints

- `GET /healthz` (liveness)
- `GET /healthz/readyz` (readiness)
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout` (Bearer)
- `GET /api/v1/users?limit=20&offset=0` (Bearer)
- `GET /api/v1/users/:id` (Bearer)
- `POST /api/v1/users` (Bearer)
- `GET /api/v1/example` (template route for new features)

## Key env

- `CACHE_MODE`: `noop|memory|redis`
- `AUTH_RATE_LIMIT_*` and `GLOBAL_RATE_LIMIT_*`
- `SESSION_TTL_SECONDS`, password policy/hash settings

## Quality gates

```bash
bun run ci:check
bun run test:coverage
bun run migrate:smoke
```
