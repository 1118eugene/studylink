# StudyLink architecture

## Workspaces

- `apps/web` is the browser client built with React, TypeScript, and Vite.
- `apps/mobile` is the Expo / React Native client, also configured for Expo web.
- `apps/api` is the Express JSON API, authentication layer, database access, migrations, and local-development scripts.
- `packages/shared` contains contracts/constants shared across workspaces.

The clients call the API over HTTP and send bearer tokens for authenticated routes. The API owns validation, authorization, notification creation, reporting, and persistence; UI visibility is not an authorization boundary.

## Persistence

When `DATABASE_URL` is present, `apps/api/backend/lib/db.js` uses PostgreSQL. Apply all SQL migrations in order with `npm run migrate`. The schema includes users, course enrollments, groups and memberships, sessions and RSVPs, resources, reports, notifications, and audit events.

When `DATABASE_URL` is absent, the API uses the local JSON adapter. It seeds first-run state from `apps/api/backend/data.json`, writes to `data.local.json` (or `STUDYLINK_DATA_PATH`), and emulates the application's SQL operations. This mode is intended for development and test runs only. It is not transactional or suitable for concurrent hosted use.

Uploads are validated by extension, base64 encoding, and a 5 MiB decoded-size limit. Files are written beneath `STUDYLINK_UPLOADS_PATH` or `apps/api/public/uploads`. Current static file serving is suitable for a local prototype; hosted deployments should move uploads to durable storage and define an explicit private-resource access policy.

## API areas

- `/api/auth`, `/api/profile`, and `/api/classmates`: account, profile, preferences, and discovery.
- `/api/courses` and `/api/academic`: curated course enrollment plus the university/school/program catalogue.
- `/api/groups` and `/api/sessions`: group membership, capacity, creation, session scheduling, RSVP, and cancellation.
- `/api/resources`, `/api/uploads`, and `/api/my/resources`: resource discovery and sharing.
- `/api/reports` and `/api/admin/reports`: content reports and moderator decisions.
- `/api/notifications`: user-scoped notifications and read/clear actions.
- `/api/admin/users`: administrator suspension controls.

## Local verification

`npm test` runs API integration checks with an isolated local data file and temporary upload directory, builds the web client, and typechecks web and mobile. `npm run build:mobile` produces an Expo web export. PostgreSQL migrations and a deployed storage configuration must be verified separately when those services are available.
