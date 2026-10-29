# Requirements traceability

This matrix groups the report's functional and non-functional requirements by their topics. “Implemented” means a working prototype path exists, not that the feature has been independently certified for production.

## Actor dashboards

The authenticated dashboard opens after sign-in and presents role-specific, API-backed information. Students see their course enrolments, group memberships, joined future sessions, saved resources, and account notifications. Administrators see account and content totals, upcoming sessions, reports awaiting review, recent audit events, API/database health, and the AI integration console. Moderators see their report-review workload alongside their own study information.

The dashboard's expandable report-to-app coverage section includes FR1–FR14 and NFR1–NFR11, with the requirement area, implementation evidence, current prototype status, and remaining work. Keep this presentation aligned with the matrix below when requirements change.

The report's AI Provider is an external service behind the application gateway, not a user account. Its status is represented honestly: the current build has no connected external provider, does not send student prompts to one, and does not claim provider uptime or request analytics. The administrator AI service console shows persisted curated-link and curation-flag counts and records.

## Functional requirements

| ID | Requirement area from the report | Evidence in the prototype | Status / remaining work |
|---|---|---|---|
| FR1 | Account registration, sign-in, and authenticated access | API auth routes, bearer authentication, signup/login screens | Implemented; production secret and account lifecycle operations need deployment configuration. |
| FR2 | Student profiles and academic information | Profile API and web/mobile profile screens | Implemented; verify the full profile field set against institutional policy. |
| FR3 | Profile visibility and notification preferences | Profile preference fields/API; local and PostgreSQL persistence | Implemented; preferences should be checked for every notification type as new types are added. |
| FR4 | Browse courses and academic catalogue | Course endpoints and academic school/program/course catalogue | Implemented; catalogue content must be maintained by deployment administrators. |
| FR5 | Enroll in and withdraw from courses | Course enrollment API and web/mobile actions | Implemented for the app course catalogue; separate academic catalogue enrollment is not currently provided. |
| FR6 | Create, edit, and remove study groups | Group API and web/mobile flows with owner/admin controls | Implemented. |
| FR7 | Join, leave, and enforce group requirements/capacity | API checks membership, acceptance, closed groups, capacity, and owner protection | Implemented; covered in local-store integration tests. |
| FR8 | Schedule sessions and manage attendance/RSVP | Session API and clients support create/edit/delete, RSVP, and cancellation | Implemented; session creation requires group membership or ownership. |
| FR9 | Share and discover resources with provenance | Resource metadata includes source note and course code; upload endpoint validates type and size | Partially implemented; durable storage and private download authorization are deployment gaps. |
| FR10 | Report inappropriate group/resource content and moderate reports | Report queue, moderator/admin decisions, remove/dismiss actions | Implemented; moderation workflow has local integration coverage. |
| FR11 | Suspend user accounts | Admin-only suspension endpoint and audit event | Implemented at API level; administration interface and operational appeal/reinstatement policy need review. |
| FR12 | Notify users about relevant activity and moderation outcomes | User-scoped notifications and preference checks; web/mobile notification surfaces | Implemented for current group/session/moderation events; push delivery is not included. |
| FR13 | Optional AI-assisted resource discovery with privacy awareness | Local course-guidance prototype, visible privacy/verification notice, response-report submission, and admin provider-status console | Prototype only; external AI is not connected. Prompt/report data retention and privacy review remain. |
| FR14 | Audit sensitive actions | API audit events include authentication, moderation, suspension, and AI-response reports; administrators can review recent events in the dashboard | Partially implemented; define retention and complete coverage for all sensitive operations. |

## Non-functional requirements

| ID | Requirement area from the report | Evidence / current approach | Status / verification needed |
|---|---|---|---|
| NFR1 | Usability | Consistent web/mobile task surfaces, validation messages, loading/error states | Prototype implemented; conduct usability testing with representative students. |
| NFR2 | Accessibility | Semantic controls and accessible labels are used in parts of the UI | Not certified; complete keyboard, screen-reader, contrast, and WCAG review. |
| NFR3 | Security | Server-side auth/role checks, input checks, upload restrictions, rate limits, production secret requirement | Baseline controls implemented; threat model, dependency review, and penetration testing remain. |
| NFR4 | Privacy | Profile visibility, notification preferences, no external AI calls in current prototype | Partially addressed; define data retention, consent, export/deletion, and hosting policy. |
| NFR5 | Performance | Query-side aggregation and bounded notifications/uploads | Not benchmarked; establish latency and load targets and test with realistic data. |
| NFR6 | Reliability | API error handling and local/PostgreSQL adapters | Partially addressed; local JSON is demo-only and hosted backups/monitoring/recovery remain. |
| NFR7 | Portability | Separate Vite, Expo, and Express workspaces; Expo web support | Implemented; verify deployment matrix and supported browsers/devices. |
| NFR8 | Low data usage | Web/mobile clients avoid large media downloads in core flows; uploads capped at 5 MiB | Partially addressed; measure network usage and add explicit offline/low-bandwidth behavior if required. |
| NFR9 | Modularity | Separate app/API/shared workspaces and route/data layers | Implemented structurally; continue to keep business rules in the API. |
| NFR10 | Maintainability | TypeScript checks, migrations, workspace scripts, API tests, architecture docs | Implemented baseline; expand automated coverage and CI as the team workflow matures. |
| NFR11 | Logging and monitoring | Server errors, audit rows, and local prototype analytics | Partially addressed; central structured logging, alerting, and retention are not configured. |

## Validation status

The repository scripts provide repeatable local checks: `npm test` runs API integration tests, builds the web workspace, and typechecks both clients; `npm run build:mobile` exports Expo for web. These checks do not replace PostgreSQL migration verification, accessibility auditing, performance benchmarking, or deployment testing.
