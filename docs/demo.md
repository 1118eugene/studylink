# StudyLink demo

## Start locally

Install dependencies and run the web/API pair:

```bash
npm install
npm run dev
```

The launcher selects available ports and configures the Vite API proxy. For mobile in a browser, run `npm run dev:mobile:web`; for a phone or simulator, set `EXPO_PUBLIC_API_URL` in `apps/mobile/.env` to the API host reachable from that device and run `npm run dev:mobile`.

With no `DATABASE_URL`, the server loads sample catalogue content and keeps changes in the local JSON file. Remove or replace that local file only when you intentionally want to reset your demo state.

## Suggested walkthrough

1. Create two student accounts through signup and complete their profiles.
2. Browse the course catalogue and enroll in a course.
3. Create a study group with requirements and a member capacity. Join from the second account, first without accepting the requirements (expect a validation message), then with confirmation.
4. Schedule a session, RSVP from the second account, and cancel the RSVP.
5. Share a resource with a source note and appropriate course information.
6. Report a group or resource and review it using a moderator/admin account. Verify that the decision is audited and that the reporter receives a notification.
7. Open the mobile client in browser mode and repeat the group/session tasks at a narrow viewport.

Moderator/admin credentials should be provisioned through the development database or test fixture; the application does not ship a shared privileged demo password.

## Automated API demo

Run:

```bash
npm run test:api
```

The script creates an isolated temporary admin fixture, exercises signup/authentication, preferences, course enrollment, group requirements/capacity/leave, session RSVP/cancellation, report review/notification, rejected upload type, and suspension, then stops the server and removes the fixture.
