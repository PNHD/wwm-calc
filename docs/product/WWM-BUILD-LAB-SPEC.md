# Spec: WWM Build Lab Premium Product Rebuild

## Objective

Rebuild the presentation layer of the existing React calculator as a cohesive game-native product for serious Where Winds Meet Global optimizers. Success means the app no longer resembles the previous card-grid/sidebar UI, while every calculation, data source, import flow and optimizer behavior remains intact.

## Tech Stack

- React 19, TypeScript, Vite
- Existing Lucide icon dependency
- Existing calculation, timeline, OCR, import and data modules
- CSS Modules or a single new product stylesheet with semantic tokens
- No new dependencies

## Commands

- Install: `npm install`
- Develop: `npm run dev -- --host 127.0.0.1 --port 4179`
- Typecheck: `npm run lint`
- Build: `npm run build`
- Deploy preview: `npx wrangler pages deploy dist --project-name=wonton-wwm --branch=codex-premium-product`

## Project Structure

- `src/product/` — new presentation components and product shell
- `src/product/components/` — navigation, context bar, panels, tabs, data rows and status components
- `src/product/workspaces/` — Arsenal, Build, Combat and Optimize views
- `src/product/product.css` — semantic tokens and product styles
- `src/App.tsx` — remains state/calculation owner during migration
- `src/data/`, `src/utils/`, `worker/` — unchanged calculation and data boundaries

## Product Architecture

### Global Shell

- Compact masthead: product name, Global/T91/T96 status, character and scheme.
- Primary navigation: Arsenal, Build, Combat, Optimize.
- Context strip: selected path, weapon pair, four Inner Ways, calibration state and current reference estimate.
- Global actions live in an overflow/action group: import, OCR, export, help.

### Arsenal

- Default workspace.
- Equipped slot rail at top with eight compact slot buttons.
- Inventory below uses a sortable data table on desktop and structured rows on mobile.
- Columns: item, slot/set, key stats, tuning/mastery state, build delta, action.
- No repeated giant cards.

### Build

- Two-column desktop workspace.
- Left: path and weapon configuration with visual selectors.
- Right: Inner Ways and set/ring/calibration.
- Unverified effects have explicit status and never look equivalent to verified data.

### Combat

- Assumptions bar first: tier/target, food, efficiency, rotation preset and duration.
- Three distinct outputs: Formula ceiling, Modeled estimate, Recorded parse.
- Combat attributes and damage distribution use tabbed data panels.
- Advanced rotation editing is collapsed by default.

### Optimize

- Full page, not a modal.
- Overview first: graduation rate, confidence status, top three upgrades.
- Secondary vertical navigation: Compare, Stat Priority, Cultivate, Best Build, BiS, Transmute, Rotation, Coverage, Skill Editor and Team.
- Existing analysis logic is reused without formula changes.

## Code Style

```tsx
export function ProductTab({ active, icon: Icon, label, onSelect }: ProductTabProps) {
  return (
    <button type="button" className={active ? "product-tab is-active" : "product-tab"}
      aria-current={active ? "page" : undefined} onClick={onSelect}>
      <Icon aria-hidden="true" size={18} />
      <span>{label}</span>
    </button>
  );
}
```

- Components use semantic class names prefixed `product-`.
- Components remain presentational; calculation state stays in App until a later logic extraction.
- No inline style for new product components.
- Copy uses sentence case and consistent terms from this spec.

## Testing Strategy

- Typecheck and production build after every workspace migration.
- Browser verification at 390, 768, 1180 and 1728 pixels.
- Browser workflow checks: filter gear, equip/swap, change build, select Inner Way, toggle food, adjust efficiency, open each optimizer tool, import/export.
- Zero console errors or warnings.
- No horizontal page overflow.
- Keyboard access and visible focus for every new control.

## Boundaries

### Always

- Preserve calculation results for identical input.
- Keep import/export data compatibility.
- Use semantic tokens and accessible controls.
- Verify real browser screenshots before merging.

### Ask First

- Formula changes.
- Data schema changes.
- New dependencies.
- Removing an existing tool.

### Never

- Invent missing game data.
- Present estimate as guaranteed in-game DPS.
- Commit secrets or generated build output.
- Deploy an unfinished redesign to production.

## Success Criteria

- Four distinct full-page workspaces replace the old sidebar and giant analysis modal.
- Gear inventory is a table/ledger component, not the old card grid.
- Visual identity is game-native dark with strong WWM character and WCAG-readable data.
- Build and Combat expose only controls relevant to their task.
- Optimize is navigable without horizontal tab overflow.
- Formula/data regression check shows unchanged results for the imported reference build.
- 390px and 1728px screenshots show no overlap, clipping or horizontal page overflow.
- Lint and build pass; console is clean.

## Open Questions

None. Product direction, audience, density and default workspace are confirmed.

