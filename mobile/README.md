# StudyLink Mobile

The mobile contribution is an Expo React Native application that uses the existing StudyLink Express API and PostgreSQL-backed data model. It is isolated under `mobile/` so the existing Vite web application is not replaced or coupled to native build tooling.

## Setup

```bash
cd mobile
npm install
copy .env.example .env
npm run start
```

Set `EXPO_PUBLIC_API_BASE_URL` to the backend origin. Do not put database credentials, `AUTH_SECRET`, or user passwords in this file.

## Implemented mobile flow

- secure token persistence with Expo SecureStore;
- startup session validation through `/api/auth/me`;
- login, registration, logout, and protected navigation;
- dashboard backed by real courses, groups, sessions, and resources;
- dashboard sections that continue independently when one API request fails;
- study-group listing, details, metadata, enrollment, creation, and owner/admin deletion;
- session listing, details, agenda/preparation/attendance metadata, enrollment, and creation;
- academic browsing from schools to programs to courses and course resources;
- resource search, detail metadata, external opening, and library saving;
- profile editing and saved-resource listing;
- loading, empty, retry, network, and API error states;
- pull-to-refresh on list/dashboard screens.

## Backend reuse and known limitations

The app intentionally uses the existing API contracts. The backend currently has no group leave, session unenrollment, course unenrollment, push notification, or server-backed notification endpoints, so those actions are not presented as completed mobile features.

The upload endpoint is not exposed in this first mobile slice because it needs additional mobile file validation and storage review before being treated as production-ready.
