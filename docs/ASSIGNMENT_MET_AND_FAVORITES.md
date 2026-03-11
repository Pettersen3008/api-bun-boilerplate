# Assignment: Auth -> Users (with password) -> Favorites -> MET -> Caching

## Purpose

Denne oppgaven skal gjennomføres i riktig rekkefølge for å bygge en trygg og produksjonsklar feature:
1. Auth og users med passord
2. Favoritter knyttet til autentisert bruker
3. MET-endepunkt via backend
4. Caching + rate limiting

Viktig: **Favoritter skal ikke implementeres før auth + passord er på plass.**

## Mandatory architecture rules

Følg prosjektets standard fra `docs/IMPLEMENTATION_GUIDE.md`:
- Object-oriented repos (`class XRepo`)
- Dependency injection
- Zod i `request/*`
- Problem Details (`application/problem+json`) ved feil
- Ingen SQL eller `fetch` direkte i route-filer

---

## Phase 0: Ground rules (must be done first)

### Required behavior
- Alle nye endepunkter ligger under `/api/v1/...`
- Alle valideringsfeil returnerer Problem Details
- Alle uventede feil går via global error handler (Problem Details)
- Ingen sensitive felt (som passord) skal logges

### Required files to add/update
- `src/request/*.ts`
- `src/repo/*.ts`
- `src/routes/*.ts`
- `src/migrations/*.sql`
- `src/app.ts` (mounting)

---

## Phase 1: Auth + users with password (hard prerequisite)

## 1.1 Database changes (migration)

Lag en migration som utvider users og legger til sessions.

### `users` requirements
- `password_hash` må finnes (ikke lagre plaintext passord)
- `email` må fortsatt være unik

### `user_sessions` table (recommended)
- `id` UUID PK
- `user_id` UUID FK -> `users(id)` ON DELETE CASCADE
- `token_hash` TEXT UNIQUE NOT NULL
- `expires_at` TIMESTAMPTZ NOT NULL
- `revoked_at` TIMESTAMPTZ nullable
- `created_at` TIMESTAMPTZ DEFAULT NOW()

### Indexes
- index på `user_sessions(user_id)`
- index på `user_sessions(expires_at)`

## 1.2 API endpoints

Implementer:
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`

### Register contract
- Input: `email`, `fullName`, `password`
- Validering: Zod
- Passord hash med `Bun.password.hash(...)`
- Returner brukerdata uten passord

### Login contract
- Input: `email`, `password`
- Verifisering med `Bun.password.verify(...)`
- Opprett session-token
- Lagre kun `token_hash` i DB
- Returner bearer token + expiry

### Auth middleware
- Les `Authorization: Bearer <token>`
- Hash token og slå opp aktiv session
- Sett authenticated user i request/locals
- Returner `401` Problem Details ved feil token/mangler

## 1.3 Acceptance criteria (phase 1)
- Register oppretter bruker med hash (ikke plaintext)
- Login returnerer token
- Ugyldig passord gir `401`
- Duplikat e-post gir `409`

---

## Phase 2: Favorites (only after phase 1)

## 2.1 Database changes (migration)

Lag `favorite_locations`:
- `id` UUID PK
- `user_id` UUID FK -> `users(id)` ON DELETE CASCADE
- `name` TEXT NOT NULL
- `lat` DOUBLE PRECISION NOT NULL
- `lon` DOUBLE PRECISION NOT NULL
- `created_at` TIMESTAMPTZ DEFAULT NOW()

Constraints:
- `UNIQUE (user_id, lat, lon)`
- `CHECK lat BETWEEN -90 AND 90`
- `CHECK lon BETWEEN -180 AND 180`

## 2.2 API endpoints

Implementer (autentisert):
- `POST /api/v1/favorites`
- `GET /api/v1/favorites`
- `DELETE /api/v1/favorites/:id`

### Rules
- Bruk user fra auth middleware, ikke fra body/query/header-triks
- Bruker skal kun kunne lese/slette egne favoritter
- Zod-validering for body og params

## 2.3 Acceptance criteria (phase 2)
- Opprette favoritt gir `201`
- Duplikat favoritt gir `409`
- Liste returnerer kun egne favoritter
- Slette ukjent/ikke-egen favoritt gir `404`

---

## Phase 3: MET backend endpoint

Implementer:
- `GET /api/v1/weather?lat=<number>&lon=<number>`

### Rules
- Input valideres med Zod
- Kall MET via repo + `provider/http.ts` (ikke i route)
- Map upstream-feil til `502` eller `503` Problem Details
- Enkel strukturert logging for request/upstream-feil

## Acceptance criteria (phase 3)
- Gyldig query -> `200`
- Ugyldig query -> `400`
- MET-feil/timeout -> `502/503`

---

## Phase 4: Caching + rate limiting

Dette gjøres etter at phase 1-3 er ferdig.

### Caching
- Cache weather-respons i Redis/Valkey
- TTL 5-15 minutter (start med 10)
- Key eksempel: `weather:{lat_rounded}:{lon_rounded}`
- Returner gjerne `x-cache: HIT|MISS`

### Rate limiting
- Per IP eller API-key
- Returner `429` Problem Details ved overskridelse
- Startnivå: 60 req/min

## Acceptance criteria (phase 4)
- Repeated weather request gir cache HIT innen TTL
- For høy trafikk gir `429`

---

## Quality checklist (Definition of Done)

Alle punkter må være oppfylt:
1. `bun run typecheck` passerer
2. `bun test` passerer
3. `bun run migrate` kjører uten feil
4. Endepunkter testet manuelt (curl/Insomnia/Postman)
5. Problem Details brukes konsekvent ved feil
6. Ingen passord i logs/response
7. README eller docs oppdatert med nye endepunkter

---

## Suggested implementation order (strict)

1. Migration: users + sessions
2. Auth repo/request/routes + middleware
3. Migration: favorites
4. Favorites repo/request/routes
5. Weather request/repo/route
6. Cache + rate limit

Hvis du blir ferdig tidlig, forbedre testdekning før du går videre.
