# StudyLink Mobile

The mobile contribution is an Expo React Native application that uses the shared StudyLink API and can run as a native app or in a browser. It is isolated under `apps/mobile/` from the Vite web application.

## Setup

```bash
cd apps/mobile
cd ../..
npm install
copy .env.example .env
npm run dev:mobile
```

Set `EXPO_PUBLIC_API_URL` to the backend origin (for a physical device, use the computer's LAN IP instead of `localhost`). Do not put database credentials, `AUTH_SECRET`, or user passwords in this file. To run in a browser from the workspace root, use `npm run dev:mobile:web`.

## Implemented mobile flow

- secure token persistence with Expo SecureStore;
- startup session validation through `/api/auth/me`;
- login, registration, logout, and protected navigation;
- dashboard backed by real courses, groups, sessions, and resources;
- dashboard sections that continue independently when one API request fails;
- study-group listing, details, metadata, enrollment, creation, leaving, and owner/admin deletion;
- session listing, details, agenda/preparation/attendance metadata, RSVP/cancellation, and creation;
- academic browsing from schools to programs to courses and course resources;
- resource search, detail metadata, external opening, and library saving;
- profile editing and saved-resource listing;
- loading, empty, retry, network, and API error states;
- pull-to-refresh on list/dashboard screens.

## Backend reuse and known limitations

Activity and moderation notifications are loaded from the authenticated API and can be configured through profile preferences. Push delivery is not included. The API can be run with PostgreSQL or its local JSON development store.

Mobile users can browse resources and save them to their library; resource upload is not currently offered in the mobile interface. The API upload endpoint validates supported extensions and a 5 MiB file limit, but hosted deployments still need durable storage and an explicit private-resource access policy.

## Verification

From the workspace root, run `npm run typecheck --workspace @studylink/mobile` or run the full `npm test` suite. Use `npm run build:mobile` to export the Expo app for web.
