# Phase A review

## Reviewed revision and worktree

- Original branch baseline: `16ff4bd3bb32fdfa1da64d164a006b1288ffc97d`
  (`git merge-base HEAD main`), checked out separately for the content capture.
- Card-system revision reviewed: `c87bdcf` on `ui/card-system-all`.
- The worktree was clean at review start. Phase A adds the snapshot script,
  this report, baseline files, package metadata, a development-gallery import
  fix, and preservation fixes for the shared card media and mobile session
  action labels.
- The temporary baseline server used a newly created student account against
  local test data. The baseline checkout's data file was restored afterward.

## Production gallery check

At the start of this review, `/dev/cards` had a development-mode route guard
but an eager static component import, so the gallery could still be included in
the production JavaScript bundle. The route now uses a development-only lazy
import. After `npm run build:web`, the production assets contained neither
`CardGallery` nor the gallery heading text. In production the development
module is absent and `/dev/cards` resolves through the application's fallback
route.

## Card-height measurements

Playwright measured rendered card bounding-box heights at a 1280 × 900 browser
viewport, with an authenticated local test account and the seeded catalogue.
The range is min–max across the cards present on the route; heights naturally
vary with complete content.

| Revision | Page | Cards measured | Height range | Mean |
| --- | --- | ---: | ---: | ---: |
| `c87bdcf` (current before redesign phases) | Course Directory | 15 | 735–781 px | 761.8 px |
| `c87bdcf` (current before redesign phases) | Learning Hub, My Library | 145 | 350–512 px | 470.4 px |
| `16ff4bd` (original merge-base) | Course Directory | 15 | 843–911 px | 875.0 px |
| `16ff4bd` (original merge-base) | Learning Hub, My Library | 145 | 403–596 px | 541.8 px |

The baseline course/resource measurements are saved with the route snapshots in
[`baseline/courses.json`](./baseline/courses.json) and
[`baseline/learning_view_library.json`](./baseline/learning_view_library.json).
The current revision's measurements were retained in session artifacts for
the subsequent before/after comparison.

## Legacy card markup still present

The shared primitive and CSS aliases have improved consistency, but several
pages still compose content with page-specific markup rather than the complete
card primitive. This distinction matters: shared colors and borders alone do
not deliver consistent layout, accessible structure, or predictable height.

| Surface | Remaining implementation |
| --- | --- |
| Course Directory | [`Courses.tsx`](../apps/web/src/pages/Courses.tsx) uses a shared outer `Card`, but cover chips, definition rows, counters, and action layout are page-specific markup. |
| Learning Hub | [`LearningHub.tsx`](../apps/web/src/pages/LearningHub.tsx) uses shared card containers, while resource fields, the shelf/toolbar, upload form, filters, and resource actions are custom structures. |
| Schools | [`Schools.tsx`](../apps/web/src/pages/Schools.tsx) uses legacy `group-card` and `detail-summary-card` articles. |
| StudyLink AI | [`StudyLinkAI.tsx`](../apps/web/src/pages/StudyLinkAI.tsx) uses compound card sections for parts of the response, but hero, prompt, preview, and summary panels still include custom containers. |
| Study Groups | [`StudyGroups.tsx`](../apps/web/src/pages/StudyGroups.tsx) uses the outer primitive for group cards; detailed metadata, permission-dependent actions, and modal flows are page-specific. |
| Group detail | [`GroupDetail.tsx`](../apps/web/src/pages/GroupDetail.tsx) uses primitive wrappers for several rows, but the hero and information-panel composition remain page-specific. |
| Sessions | [`Sessions.tsx`](../apps/web/src/pages/Sessions.tsx) wraps session records in the primitive; the date, metadata, agenda, and action composition remains custom. |
| Dashboard | [`Dashboard.tsx`](../apps/web/src/pages/Dashboard.tsx) retains custom stat links and dashboard sections, with only some summaries using the primitive. |
| Profile | [`Profile.tsx`](../apps/web/src/pages/Profile.tsx) retains custom hero, stats, details, and footprint cards. |
| Admin/moderation | [`AdminAcademic.tsx`](../apps/web/src/pages/AdminAcademic.tsx) retains custom panels and lists; [`AdminUsers.tsx`](../apps/web/src/pages/AdminUsers.tsx) wraps rows with the primitive but keeps its row layout; [`ReportQueue.tsx`](../apps/web/src/pages/ReportQueue.tsx) uses primitive wrappers with custom content/actions. |
| Course/resource details | [`CourseDetail.tsx`](../apps/web/src/pages/CourseDetail.tsx), [`CourseHub.tsx`](../apps/web/src/pages/CourseHub.tsx), [`ResourceDetail.tsx`](../apps/web/src/pages/ResourceDetail.tsx), and [`DiscoverClassmates.tsx`](../apps/web/src/pages/DiscoverClassmates.tsx) retain multiple legacy detail/summary structures. |
| Public pages | [`HeroSection.tsx`](../apps/web/src/components/HeroSection.tsx) remains a standalone hero; [`About.tsx`](../apps/web/src/pages/About.tsx) and [`Contact.tsx`](../apps/web/src/pages/Contact.tsx) retain image panels. Service/listing components already use the primitive. |
| Mobile | [`HomeScreen.tsx`](../apps/mobile/src/screens/HomeScreen.tsx), [`AcademicScreen.tsx`](../apps/mobile/src/screens/AcademicScreen.tsx), [`GroupsScreen.tsx`](../apps/mobile/src/screens/GroupsScreen.tsx), [`SessionsScreen.tsx`](../apps/mobile/src/screens/SessionsScreen.tsx), [`ResourcesScreen.tsx`](../apps/mobile/src/screens/ResourcesScreen.tsx), and [`ProfileScreen.tsx`](../apps/mobile/src/screens/ProfileScreen.tsx) use screen-specific card layouts. Shared loading/empty/error states in [`ScreenState.tsx`](../apps/mobile/src/components/ScreenState.tsx) use the primitive. |

## Content baseline

[`scripts/content-snapshot.mjs`](../scripts/content-snapshot.mjs) captures
visible text, buttons, links, image source/alt, and course/resource card heights
for the public and authenticated web routes. The initial snapshots were run
from the original merge-base checkout using a temporary account on its local
development API. No credentials or auth tokens are included in the snapshots.
`baseline/mobile-source.json` lists extracted JSX text and visible string
attributes from the original mobile source files.

The baseline directory contains per-route JSON for all 22 routes present at
the original merge-base and one mobile-source inventory. Routes added after
that revision, such as `/admin/users`, are captured separately during final
verification and reported as additions rather than baseline omissions.
Dynamic records and timestamps may vary, so the same test account/data must be
used for the final comparison.

## Verification notes

- The web production build and web/mobile typechecks passed after the Phase A
  changes. API integration tests passed for auth, profile preferences, course
  enrollment, groups, sessions, moderation, uploads, and suspension.
- The production bundle scan confirmed that the gallery component is absent.
- A Playwright browser binary download timed out; the capture used the locally
  installed Chrome executable instead.
- `npm install --save-dev playwright` reported 39 dependency audit findings
  (14 moderate, 22 high, 3 critical). No audit auto-fix was run; the existing
  dependency tree needs a separately scoped review before changing versions.
