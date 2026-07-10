# Guided Gear-First Redesign

## Goal

Replace the current dense, right-rail-first calculator presentation with a guided workspace that opens on gear management while preserving every calculation, optimizer, import, OCR, and profile behavior.

## Confirmed Decisions

- Default screen is **Gear**.
- Primary flow is **Gear -> Build -> Simulation -> Analysis**.
- Gear view is compact enough to compare many pieces in one scan.
- Build configuration, Inner Ways, rotation assumptions, and DPS summary are grouped by task rather than scattered through the right rail.
- Deep graduation tools move out of the giant tabbed modal into a dedicated analysis workspace.
- Formula data is never replaced by UI sample values. Unknown parse data remains explicitly unknown.

## Product Model

The app is a work tool. Its first job is to answer "which item should I equip?" Its second job is to make the consequence of that choice visible without overstating simulation output as an in-game parse.

Reference patterns to adapt:

- Where Winds Math: gear comparison and rotation damage are distinct work areas.
- Where Winds Meet Calculator: quick-start flow separates build choice, stat input, and results.
- WWM Stats Calculator: combat attributes and enemy settings are separate groups.

## Information Architecture

### Persistent Header

- Product title and version state: `T91 Live`, `T96 Preview`.
- Active character and scheme selectors.
- Import/export, OCR, and help remain accessible but secondary.

### Primary Navigation

1. **Gear**: equipped strip, inventory filters, searchable gear list, quick equip/swap.
2. **Build**: selected path/weapons, Inner Ways, set/ring choices, calibration status.
3. **Simulation**: reference rotation preset, food/efficiency/target assumptions, formula versus reference output.
4. **Analysis**: graduation overview, upgrades, compare, stat priority, BiS, transmute, advanced rotation tools.

On desktop this is a horizontal task rail beneath the header. On mobile it becomes a sticky segmented control. It must not horizontally scroll.

## Gear Screen

- A compact equipped strip is always above the inventory.
- The inventory grid remains dense and preserves existing item cards, equipped state, quality, and DPS delta.
- Filters remain near the inventory: slot, set, search, and sort.
- The user can quick-swap from an equipped slot without leaving Gear.
- Build summary is a compact sticky summary, not a second full sidebar.

## Build Screen

- Path, weapons, scheme, ring, and Inner Ways live in clearly labelled sections.
- Inner Way cards state their tier and trigger type. Effects that are not verified show an `Unverified` status rather than an implied DPS result.
- Calibration is a visible status with a direct action, not explanatory body text in the rail.

## Simulation Screen

- Default rotation is a verified preset.
- Manual cast counts only appear under an explicit `Advanced rotation` section.
- Results use exact terms:
  - `Formula ceiling`: reference rotation with modeled uptime.
  - `Reference estimate`: formula ceiling after selected efficiency assumption.
  - `In-game parse`: user-entered comparison only; empty state says `Not entered`.
- Food, target, rotation duration, and efficiency are visible assumptions adjacent to the result.

## Analysis Screen

- Starts with graduation rate, current estimate, and three best upgrades.
- Uses vertical section navigation for Compare, Stat Priority, Cultivate, Best Build, BiS, Transmute, Rotation tools, and Team.
- Reuses existing calculations and modal content before extracting components. No formula logic changes are permitted in this redesign.

## Visual System

- Dark data-tool palette already used by the project: near-black canvas, charcoal surfaces, warm ivory text, vermilion primary action, muted gold emphasis, jade positive state.
- No decorative gradients, glowing effects, nested cards, or new dependencies.
- Design tokens are semantic: `--paper`, `--surface`, `--surface2`, `--line`, `--line2`, `--ink`, `--ink2`, `--ink3`, `--vermilion`, `--muted-gold`, `--jade`.
- Spacing uses 4/8px increments. Cards and inputs have 6-8px radius. Numeric output uses the existing mono font.
- Buttons are verbs: `Add gear`, `Open analysis`, `Calibrate`, `Compare gear`. Tooltips explain unfamiliar analysis terms, never basic buttons.

## Responsive Rules

- Desktop >= 1180px: gear workspace full width with compact build summary panel when useful.
- Tablet 768-1179px: one content column; summary blocks follow the active section.
- Mobile < 768px: one task section at a time, sticky task navigation, no horizontal layout overflow. Deep analysis becomes a full-height sheet.

## Accessibility

- Semantic buttons and labels; no click-only divs for new interactions.
- Visible keyboard focus using the gold focus token.
- Labels do not rely on color alone; equipped, verified, and selected states include text.
- Existing icon-only actions receive accessible names while being touched.

## Non-Goals

- Rebuilding DPS formulae, game data, Worker logic, OCR, or importer behavior.
- Inventing a real-world DPS value.
- Adding a new UI framework or dependency.

## Verification

- Typecheck and production build pass.
- Browser check at 390px, 768px, 1180px, and 1728px.
- No console errors and no horizontal overflow.
- Gear equip, build select, inner-way select, food toggle, calibration modal, analysis opening, and import/export continue to work.
