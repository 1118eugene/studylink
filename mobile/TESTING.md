# StudyLink Mobile Testing

This document records the Phase 3 verification status. Automated checks are run against the source and bundle; manual/device scenarios are marked separately when no emulator or device is available.

| Area | Scenario | Expected result | Actual result | Status |
|---|---|---|---|---|
| Authentication | Registration | Valid form creates an account and opens the protected app | Covered by auth flow and client validation; requires configured API credentials for manual execution | Manual |
| Authentication | Login / invalid login | Valid credentials sign in; invalid credentials show a safe error | Centralized API errors and validation implemented; live credentials not available in this environment | Manual |
| Authentication | Session restoration | SecureStore token is restored and `/api/auth/me` validates it | Implemented in `AuthContext`; no token is written to AsyncStorage/localStorage | Pass (code review) |
| Authentication | Logout / restart | Token is cleared and protected screens are unavailable | Implemented through SecureStore clear and protected navigation | Pass (code review) |
| Dashboard | Loading, partial failure, empty sections, refresh | Each section remains independently usable and can retry | Implemented with section-level states and pull-to-refresh | Pass (code review) |
| Groups | List, details, enrollment | Real group data loads; enrollment reports API errors safely | Implemented | Pass (code review) |
| Groups | Creation and editing | Supported fields validate, submit once, and refresh | Implemented; editing is restricted to owner/admin | Pass (code review) |
| Sessions | List, details, enrollment | Real session data loads and enrollment reports API errors safely | Implemented | Pass (code review) |
| Sessions | Creation and editing | Supported fields validate and admin editing refreshes details | Implemented; backend response does not expose creator identity, so non-admin edit is not shown | Pass (code review) |
| Academics | Schools, programs, courses, details | Academic hierarchy and course details load with retry/empty states | Implemented | Pass (code review) |
| Academics | Course enrollment | Catalog/enrolled course distinction uses backend `isEnrolled` where available | Implemented in catalog API model; live enrollment requires configured API | Manual |
| Resources | List, search, details, save/library | Real resources and library state are shown; URLs are opened safely | Implemented | Pass (code review) |
| Profile | View, edit, save, logout | Editable supported fields validate and save | Implemented with API error states | Pass (code review) |
| Navigation | Tabs and detail back navigation | Routes preserve IDs and return correctly | Implemented and typechecked | Pass (code review) |
| Build | Typecheck and Android bundle | No TypeScript or bundle errors | Commands passed before and after this phase where noted in final report | Pass |
| Runtime | Android emulator/device | App launches and live API flows work | No emulator or connected device was available | Not run |

## Commands

Run from `mobile/`:

```text
npm run typecheck
npx expo config --type public
npx expo export --platform android
```

Run from the project root:

```text
npm run typecheck
npm run build
```

## Deliberate backend limitations

The mobile app does not invent group leave, session unenrollment, course unenrollment, messaging, notifications, push notifications, or offline synchronization because the current backend does not provide those capabilities.
