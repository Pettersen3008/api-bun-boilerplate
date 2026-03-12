# API Behavior Spec (v1)

This document defines stable behavior for list endpoints in `/api/v1`.

## Pagination contract

- Query parameters:
  - `limit` (default 20, min 1, max 100)
  - `cursor` (preferred mode, default when `offset` is omitted)
  - `offset` (allowed only for explicitly approved endpoints)
- `cursor` and `offset` are mutually exclusive.
- Response envelope:
  - `{ data: [...], meta: { mode, limit, count, nextCursor?, offset? } }`

## Cursor ordering guarantee

- Cursor mode must have deterministic ordering with tie-breakers.
- Users endpoint ordering:
  - `created_at DESC, id DESC`

## Filters and sort

- Only whitelisted query params are allowed.
- Unknown query params must return `400` Problem Details.
- Users baseline currently does not expose endpoint-specific filter/sort params.
- If added later, use endpoint allowlists only (no generic DSL).

### Bounds

- `limit`: `1..100`
- `offset`: `0..5000` (only where allowed)

## Error contract

- Non-2xx responses must be `application/problem+json`.
- Validation/business failures must remain consistent in shape:
  - `type`, `title`, `status`, `detail`, `instance`
  - optional extension members like `requestId`, `errors`.

## Compatibility policy for v1

- No breaking wire changes (field remove/rename/type changes).
- Additive changes are allowed (new optional fields/metadata).
- If breaking changes are required, introduce a new versioned path.
