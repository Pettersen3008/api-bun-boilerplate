# Pagination

The users list endpoint supports two modes with one standardized response envelope:

- Offset mode: `GET /api/v1/users?limit=20&offset=0`
- Cursor mode: `GET /api/v1/users?limit=20&cursor=<token>`
- Cursor-first default: `GET /api/v1/users?limit=20` (same as first cursor page)

`offset` and `cursor` are mutually exclusive.

Response envelope:
- `{ data: [...], meta: { mode, limit, count, nextCursor?, offset? } }`

## Offset mode

Request:
- `limit` (1-100)
- `offset` (>= 0)

Response meta:
- `mode: "offset"`
- `limit`
- `offset`
- `count`

Use for simple admin/internal use cases only.

## Cursor mode

Request:
- `limit` (1-100)
- `cursor` (opaque base64url token)

Response meta:
- `mode: "cursor"`
- `limit`
- `count`
- `nextCursor` (string or `null`)

Cursor mode is preferred for high-volume pagination because it avoids expensive large offsets.

## Query strictness

- Allowed query fields are strict allowlist fields per endpoint.
- Unknown query params must return `400`.
- Users baseline supports only `limit`, `cursor`, and `offset`.

## Ordering guarantee

Users are ordered by:
1. `created_at DESC`
2. `id DESC`

The cursor is based on `(created_at, id)`.
