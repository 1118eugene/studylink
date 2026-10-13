# StudyLink Card System

The card system establishes shared spacing, radius, elevation, typography,
semantic colors, interaction states, and content patterns for web and mobile.
Use the compound `Card` component for new card surfaces and the shared token
contract when an existing screen is not yet migrated. Keep existing fields,
actions, permissions, and routes intact when changing presentation.

## Variants and composition

The web and mobile components provide elevated, outlined, filled, and feature
variants, plus header, body, metadata, section, badge, media fallback, footer,
and loading/empty/error patterns. Web additionally provides an expandable
content pattern and an overlay link for whole-card navigation. Prefer individual
links and buttons inside cards when a card contains multiple actions.

Category accents are only supplemental cues; retain visible category labels.
Use a single outer card surface rather than nesting card-shaped boxes inside it.
Long descriptions should remain reachable, either by wrapping naturally or
through an accessible expansion control.

## Accessibility and responsive behavior

Card headings follow the page heading hierarchy. Actions remain native links or
buttons, focus indicators are visible, disabled states are explicit, and
loading/error states announce their purpose. Shared styles honor reduced-motion
preferences. Card grids use responsive columns and spacing; verify narrow
screens at 360 px and tablet/desktop widths at 768, 1280, and 1920 px.

The web token stylesheet supports automatic system color preference and explicit
`data-theme="light"` / `data-theme="dark"` overrides. The development-only
gallery at `/dev/cards` previews variants and states in both themes.

## Migration and verification notes

The inventory in [CARD_INVENTORY.md](./CARD_INVENTORY.md) tracks original
surfaces and their current implementations. Shared CSS aliases normalize the
visual treatment of legacy web containers while individual screens are
migrated to the compound primitive. Mobile screens share the tokenized card
shape; some complex screen-specific cards still use their existing markup and
actions.

Before/after rendered heights depend on populated content and viewport width.
No representative production dataset is available in this workspace to claim
fixed before/after height measurements. Record measurements with the same
content at the target viewports rather than inferring them from CSS.
