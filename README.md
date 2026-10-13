# StudyLink

StudyLink helps students find course peers, organise study groups and sessions, and share academic resources. The repository is an npm-workspaces monorepo containing a Vite web frontend, an Expo mobile app, an Express API, and shared API contracts.

## Requirements

- Node.js 20.19+ or 22.12+
- npm
- PostgreSQL for persistent multi-user deployment (optional for local development)

## Architecture

- `apps/web`: React, TypeScript, and Vite frontend.
- `apps/mobile`: Expo / React Native application for native and web targets.
- `apps/api`: Express API, PostgreSQL/JSON data adapters, migrations, and API scripts.
- `packages/shared`: shared API contracts and moderation report constants.
- `docs`: architecture, demos, workflow, and feature traceability.

The moderation workflow lets users report content and gives moderators and admins a queue to review reports and take action. Database support for reports and review workflows is in migrations `007_content_reports.sql` and `008_report_workflows.sql`.

The card gallery is available at `/dev/cards` when running the web app in Vite development mode. Its route is omitted from production builds.

## Local development

Install dependencies at the repository root:

```bash
npm ci
npm run dev
```

The development launcher starts the API and web app on available local ports. To start them separately, use `npm run dev:api` and `npm run dev:web`. For the Expo application, use `npm run dev:mobile:web` in a browser or `npm run dev:mobile` for a device or simulator.

The API uses its local JSON adapter when `DATABASE_URL` is not set. It reads sample content from `apps/api/backend/data.json` and writes mutable local state to `apps/api/backend/data.local.json` by default. Set `STUDYLINK_DATA_PATH` to choose a different state file. This adapter is for local development and tests, not production or concurrent use.

Copy the environment examples for local app configuration as needed:

- `apps/api/.env.example` to `apps/api/.env`
- `apps/web/.env.example` to `apps/web/.env`
- `apps/mobile/.env.example` to `apps/mobile/.env`

For a mobile device, set `EXPO_PUBLIC_API_URL` to an API address reachable from that device; `localhost` only works when the API runs on the same device.

## Deployment

The currently supplied live services are the Render frontend at `https://studylink-frontend-dwby.onrender.com` and the Render API at `https://studylinkbackend-4a7r.onrender.com`. The API health endpoint is `/api/health`.

### Vercel frontend

The frontend URL above is currently hosted on Render. If deploying the web workspace to Vercel, use these Vercel project settings:

- Root directory: repository root (`.`)
- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_URL=https://studylinkbackend-4a7r.onrender.com`

Set `VITE_API_URL` for each Vercel environment that needs it (Production, Preview, and Development). The app's API client uses same-origin/local fallbacks during development, so configure the deployed Render URL in Vercel.

### Render API

The root `render.yaml` describes the Docker web service. Verify the Render service uses:

- Runtime: Docker
- Dockerfile path: `./Dockerfile`
- Docker context: `.`
- Health check path: `/api/health`

Configure these Render environment variables:

- `DATABASE_URL`: the PostgreSQL connection URL for the production database.
- `AUTH_SECRET`: a strong, private random secret.
- `CORS_ORIGIN`: `https://studylink-frontend-dwby.onrender.com` plus any deployed Vercel origin(s), comma-separated.

Render provides `PORT`; the container defaults to `4000` for local Docker use and listens on the supplied port. The service health check uses `/api/health`.

## Database migrations

With `DATABASE_URL` set to the PostgreSQL database, apply pending migrations from the repository root:

```bash
npm run migrate
```

Migration files are in `apps/api/backend/db/migrations` (`001_init.sql` through `008_report_workflows.sql`). This includes the content moderation schema in `007_content_reports.sql` and its workflow updates in `008_report_workflows.sql`. Do not point this command at production until the target database and migration timing have been confirmed.

Uploaded files default to `apps/api/public/uploads`. A deployed service needs durable, access-controlled file storage before uploads can be considered production-ready.

## Build and tests

```bash
npm run build
npm run typecheck
npm run test:api
```

`npm run test:api` runs the API integration suite against an isolated temporary JSON store; the test starts and stops its own local server and cleans up its temporary data and uploads. `npm test` runs the API tests, web build, and both client typechecks. `npm run build:mobile` exports the Expo app for web.
