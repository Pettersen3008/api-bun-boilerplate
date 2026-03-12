# Data and API Quality

## API response consistency

- Use stable response envelopes:
  - `{ data: ... }` for entity responses
  - `{ data: [...], meta: { ... } }` for paginated list responses
- Use Problem Details for all non-2xx responses.

## Pagination rules

Standard list query contract:
- `limit`, `cursor` (default mode), optional `offset` for approved internal/admin endpoints.
- Validate with Zod (`limit`/`offset` bounds, mutually exclusive cursor/offset).
- Include list meta:
  - `meta.mode`
  - `meta.limit`
  - `meta.count` (items in current page)
  - `meta.nextCursor` in cursor mode
  - `meta.offset` in offset mode

## Input normalization

- Trim and normalize user-controlled strings where relevant
- Lowercase fields that should be case-insensitive (for example email)
- Reject unknown query parameters for list/filter/sort endpoints
- Keep allowlist-only filter/sort params (no open-ended DSL)

## Backward compatibility

For existing endpoints:
- add fields, do not remove or rename existing fields without versioning plan
- avoid changing field types
- keep error contract stable (`application/problem+json`)

## Data integrity

- Prefer DB constraints (unique/check/fk) for invariant enforcement
- Handle constraint violations by mapping to explicit API errors (for example `409`)
