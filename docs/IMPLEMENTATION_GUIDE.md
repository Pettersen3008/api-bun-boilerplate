# Implementation Guide

Denne guiden viser hvordan man legger til ny feature på en enkel og konsistent måte.

## Core principles (MUST)

1. Object-oriented design:
- Repos skal implementeres som klasser (`class XRepo`) med tydelige metoder.
- Bruk interface for kontrakt (`IXRepo`) når det gir verdi for testing/utskiftbarhet.

2. Dependency injection:
- Avhengigheter injiseres via constructor (f.eks. `HttpClient`, cache, andre repos).
- Ingen direkte `new` av infrastruktur inne i route- eller repo-metoder.
- Opprett standardinstanser i composition root (modulens bunn eller `app.ts`).

3. Separation of concerns:
- `request` validerer input.
- `route` håndterer HTTP og mapping til Problem Details.
- `repo` håndterer DB/HTTP-integrasjon.

## Mappestruktur og ansvar

- `src/request/*.ts`: Inputkontrakter (Zod), parsing, validering, sanitering.
- `src/repo/*.ts`: Data-/integrasjonslogikk i klasseform. Kan bruke `db` og/eller `http`.
- `src/routes/*.ts`: HTTP-endepunkter. Leser request, kaller repo, returnerer response.
- `src/provider/*.ts`: Delte avhengigheter (`config`, `db`, `http`, `cache`).
- `src/utils/*.ts`: Små hjelpefunksjoner (f.eks. Problem Details mapping).

## Kriterier for ny route

1. Skal løse en konkret use-case med tydelig input/output.
2. Skal ha Zod-skjema i `src/request` for alle query/path/body-felt.
3. Skal returnere Problem Details ved valideringsfeil og runtime-feil.
4. Skal ikke inneholde SQL eller eksterne API-kall direkte i route-filen.
5. Skal lages som factory med DI: `createXRouter({ ...deps })`.
6. Skal være mountet under `/api/v1/...` i `src/app.ts`.

## Kriterier for nytt repo

1. Ett repo per domene/integrasjon (`users`, `invoices`, osv.).
2. Repo skal være en klasse (`class XRepo`) uten Express-kunnskap.
3. Avhengigheter injiseres via constructor (DI).
4. SQL skal være parameterisert (tagged template mot `db`).
5. HTTP-kall skal gå via `provider/http.ts` (ikke `fetch` direkte i routes).

## Hvordan legge til en ny feature

### 1) Request-skjema

Lag `src/request/<feature>.ts` med Zod-skjema.

### 2) Repo (OO + DI)

Lag `src/repo/<feature>.ts`:
- Definer interface `I<Feature>Repo` ved behov
- Implementer `class <Feature>Repo`
- Constructor-injiser avhengigheter
- Eksporter standardinstans fra composition root

### 3) Route (DI)

Lag `src/routes/<feature>.ts`:
- `create<Feature>Router({ repo })`
- Parse input med request-skjema
- Kall repo
- Returner JSON
- Map Zod-feil til `application/problem+json`

### 4) Mount route

I `src/app.ts`:
- `app.use("/api/v1/<feature>", <feature>Router)`

### 5) Test

- Legg til minst én test for request-validering i `test/`
- Kjør `bun test` og `bun run typecheck`

## Eksempler i eksisterende kode

- `src/repo/users.ts`: `UsersRepo` + `IUsersRepo`
- `src/routes/users.ts`: `createUsersRouter({ repo })`
- `src/routes/health.ts`: `createHealthRouter({ pingDb })`

## Starter templates

Use these copy-paste starter files:
- `src/request/example.ts`
- `src/repo/example.ts`
- `src/routes/example.ts`

Recommended workflow:
1. Copy all three files and rename to your feature name (same basename in all folders).
2. Replace schemas, repo methods, and route paths.
3. Mount the new router in `src/app.ts`.
4. Add tests for request validation and route behavior.
