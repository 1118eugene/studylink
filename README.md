# StudyLink

StudyLink is a private student study-group coordination and academic networking app built with React, TypeScript, Vite, Express, and PostgreSQL.

## What It Does

The app supports authenticated dashboards, study groups, sessions, resources, live enrollment activity, and protected internal pages. The layout now uses a left sidebar so the app feels like a workspace instead of a public landing page.

## Development

Use Node.js 20.19+ or 22.12+.

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

The dev launcher starts the backend, starts Vite on a free port, and opens the site in your browser.

For local development without PostgreSQL, the backend uses `backend/data.json`. This fallback is for development only; it is not durable hosting storage.

## Mobile App

Install and start the Expo client from `mobile/`:

```bash
cd mobile
npm install
```

Copy `mobile/.env.example` to `mobile/.env` and set `EXPO_PUBLIC_API_BASE_URL` to the running API URL. For a physical device, use a network-accessible address for your development machine rather than `localhost`. Then run `npm start`.

## Production

Build the frontend:

```bash
npm run build
```

Set `DATABASE_URL` for PostgreSQL and `CORS_ORIGIN` for the deployed frontend URL, then start the server with:

```bash
npm run server
```

Production requires both `DATABASE_URL` and `AUTH_SECRET`; the server refuses to start without them. In development, an unset `AUTH_SECRET` is generated randomly for that process, so local tokens do not survive a server restart. Apply the database migrations before starting the service:

```bash
npm run db:migrate
```

Optionally load the sample academic content with `npm run db:seed`. The local JSON fallback must not be used for production data.

Run the API smoke checks with `npm run smoke`. Without credentials it checks health and confirms protected access is rejected; to exercise the academic API routes too, set `SMOKE_AUTH_TOKEN` to a valid bearer token. Set `SMOKE_REQUIRE_DATABASE=true` to fail unless PostgreSQL is connected.

Configure Render to build the backend from this repository root using `Dockerfile`, then set `DATABASE_URL`, `AUTH_SECRET`, and `CORS_ORIGIN` in the Render service environment. Configure the frontend's `VITE_API_BASE_URL` in Vercel to the Render backend's public URL. Keep deployment platform settings in their respective dashboards; no Render manifest is maintained in this repository.

The Render Docker image contains only the backend/API; Vercel is responsible for the frontend. To build and run the backend container manually from the repository root:

```bash
docker build -t studylink .
docker run -p 4000:4000 -e DATABASE_URL=... -e AUTH_SECRET=... -e CORS_ORIGIN=... studylink
```

The backend can serve a local `dist/` build if one exists, but the Render image deliberately does not package the frontend.
Uploaded files are currently stored on the server's local filesystem. Hosted environments with ephemeral disks need persistent disk or object-storage integration before uploaded files can be considered durable.

## Project Structure

- `src/` - frontend application source
- `src/components/` - shared UI components
- `src/pages/` - page-level screens
- `backend/` - API server, auth, and database access
- `backend/db/` - migrations and seed data
- `scripts/` - development and migration scripts

## Notes

The StudyLink AI resource finder currently returns curated/example search links; it is not connected to a live AI or search provider. PostgreSQL provisioning, the frontend/backend deployment URLs, and durable upload storage must be configured for a production deployment.
