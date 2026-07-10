# WWM Build Lab Design System

## Signature

A **lacquered instrument panel**: matte ink surfaces, precise brass rules and restrained cinnabar actions. Wuxia identity comes from linework, typography and equipment imagery, not decorative fantasy backgrounds.

## Tokens

### Color

- Canvas: `#090d0f`
- Surface: `#11181b`
- Raised: `#172125`
- Rule: `#314044`
- Primary text: `#eef1ec`
- Secondary text: `#a7b0aa`
- Brass: `#c6a15b`
- Jade: `#58aa82`
- Cinnabar: `#d05a43`
- Information: `#6f9fc2`

### Type

- Display: Georgia fallback for restrained WWM character.
- UI: system sans for controls and reading.
- Data: system monospace for numbers and formulas.
- Scale: 11, 12, 14, 16, 20, 28.

### Shape and Spacing

- Radius: 2px rows, 4px controls, 6px major panels.
- Spacing: 4, 8, 12, 16, 24, 32.
- Shadows only for modal/sheet elevation.
- Motion: 140ms interaction feedback, disabled under reduced motion.

## Core Components

- Product masthead
- Workspace navigation
- Build context strip
- Equipped slot rail
- Gear data row/table
- Section header
- Status tag: verified, estimated, unverified, calibrated
- Metric trio
- Assumption control
- Tool side navigation
- Full-page tool panel
- Empty, loading and error state

## Accessibility

- 44px minimum touch target on mobile.
- 2px brass focus ring.
- State always has icon or text in addition to color.
- Native button/select/input elements.
- No text smaller than 12px for essential content.

