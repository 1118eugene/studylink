# StudyLink

StudyLink helps students find course peers, organise study groups and sessions, and share academic resources. The project contains independent web, mobile, and API workspaces, plus a small package of shared contracts.

## Requirements

- Node.js 20.19+ or 22.12+
- npm
- PostgreSQL for persistent, multi-user deployment (optional for local development)

## Install and run

From this directory:

```bash
npm install
npm run dev
```

The development launcher starts the API and web app on available local ports and opens the web app. To run them separately, use `npm run dev:api` and `npm run dev:web`.

For the Expo application in a browser, use `npm run dev:mobile:web`. For a device or simulator, use `npm run dev:mobile` and then choose an Expo target. Set `EXPO_PUBLIC_API_URL` in `apps/mobile/.env` to an API address reachable from that device; `localhost` only works when the API runs on the same device.

Copy the workspace examples when you need per-app environment files:

- `apps/api/.env.example` → `apps/api/.env`
- `apps/web/.env.example` → `apps/web/.env`
- `apps/mobile/.env.example` → `apps/mobile/.env`

Keep real credentials out of source control. Production requires `DATABASE_URL` and a strong `AUTH_SECRET`; configure `CORS_ORIGIN` with the deployed client origins.

## Data and migrations

Without `DATABASE_URL`, the API uses its local JSON adapter. It reads initial sample content from `apps/api/backend/data.json` and writes mutable state to `apps/api/backend/data.local.json` by default. Set `STUDYLINK_DATA_PATH` to use a different file. This adapter is for local demos and tests, not production or concurrent use.

Uploaded files are stored under `apps/api/public/uploads` by default. Set `STUDYLINK_UPLOADS_PATH` to use a different location. A deployed service needs durable, access-controlled file storage before uploads can be considered production-ready.

With PostgreSQL configured, apply migrations using:

```bash
npm run migrate
```

Database migrations live in `apps/api/backend/db/migrations`. Configure the API process with `DATABASE_URL`, `AUTH_SECRET`, `PORT`, and `CORS_ORIGIN` as appropriate.

## Build and test

```bash
npm test
npm run build:mobile
```

`npm test` runs the API integration tests against an isolated temporary JSON store, builds the web app, and typechecks the mobile and web workspaces. The API tests start and stop their own local server and remove their temporary state and uploads. `npm run build:mobile` exports the Expo app for web.

Other useful commands include `npm run smoke` for the health/authentication smoke check and `npm run typecheck` for both client workspaces.

## Project structure

```text
apps/
  api/       Express API, database adapter, migrations, scripts
  mobile/    Expo / React Native app (native and web)
  web/       React / TypeScript / Vite web app
packages/
  shared/    Shared API contracts and report constants
docs/        Architecture, workflow, demo, and report traceability
```

See [the architecture overview](./docs/architecture.md), [the demo guide](./docs/demo.md), [the team workflow](./docs/team-workflow.md), and [requirements traceability](./docs/requirements-traceability.md) for more.

## Scope notes

The optional StudyLink AI resource finder currently returns curated/example links; it is not connected to a live AI provider. Accessibility, performance, and low-bandwidth behavior still need formal audits and measurements. Review the traceability document before presenting the prototype as production-ready.
