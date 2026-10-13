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
| Sessions | Creation and editing | Supported fields validate and authorized owners/creators/admins can edit | Implemented; permissions come from the session creator and group owner fields | Pass (API test + typecheck) |
| Academics | Schools, programs, courses, details | Academic hierarchy and course details load with retry/empty states | Implemented | Pass (code review) |
| Academics | Course enrollment and withdrawal | Enrolled courses show status and can be withdrawn | Implemented for app courses; the separate academic catalogue does not yet enroll students | Pass (API test + typecheck) |
| Resources | List, search, details, save/library | Real resources and library state are shown; URLs are opened safely | Implemented | Pass (code review) |
| Profile | View, edit, save, logout | Editable supported fields validate and save | Implemented with API error states | Pass (code review) |
| Notifications | Load and preferences | Server notifications are scoped to the current account and reflect preferences | Mobile profile displays recent API notifications and saves category preferences; read/clear are API-only | Pass (API test + typecheck) |
| Navigation | Tabs and detail back navigation | Routes preserve IDs and return correctly | Implemented and typechecked | Pass (code review) |
| Build | Typecheck and Expo web export | No TypeScript or bundle errors | Mobile typecheck and Expo web export pass | Pass |
| Runtime | Android emulator/device | App launches and live API flows work | No emulator or connected device was available | Not run |

## Commands

Run from the workspace root:

```text
npm run typecheck --workspace @studylink/mobile
npm run build:mobile
```

Full checks:

```text
npm test
```

## Remaining mobile limitations

The mobile app does not include resource upload, messaging, push notifications, or offline synchronization. Academic-catalogue course enrollment is also distinct from the app course enrollment flow and remains unimplemented.
