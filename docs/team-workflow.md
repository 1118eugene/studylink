# Team workflow

## Workspace ownership

Keep changes close to the application layer that owns them:

- Web-only presentation and browser routing: `apps/web`.
- Native and Expo web screens: `apps/mobile`.
- Contracts, validation, authorization, and persistence: `apps/api`.
- Cross-client types or enumerations: `packages/shared`.

An API behavior change should include coverage for both PostgreSQL SQL and the local adapter where feasible, and clients should use the API contract rather than duplicating authorization rules.

## Branch and review routine

1. Create a focused branch from the agreed integration branch.
2. Link the work to its functional/non-functional requirement IDs in the change description.
3. Keep changes scoped and make commits that can be reviewed independently (for example: workspace structure, API workflow, client integration, documentation).
4. Before requesting review, run `npm test` and `npm run build:mobile`; test the affected workflow in the browser or device target.
5. Have a teammate review API authorization, migrations, error states, and both client surfaces for behavior consistency.
6. Do not include `.env` files, local JSON state, upload artifacts, or generated build output.

## Database changes

Add a numbered migration under `apps/api/backend/db/migrations`, update the API/local JSON implementation, and describe rollback or compatibility implications in the pull request. Run migrations only against a configured development database; integration tests use temporary JSON state.

## Review checklist

- Is the API the source of truth for access control and validation?
- Are errors surfaced to the user instead of appearing as successful operations?
- Are group owners, ordinary members, moderators, and admins handled according to their permissions?
- Do web, mobile, PostgreSQL, and local-store behaviors agree?
- Are new requirements reflected in `requirements-traceability.md`?
- Are commands and setup instructions reproducible from a clean workspace install?
