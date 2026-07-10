# Implementation Plan: WWM Build Lab Premium Rebuild

## Architecture Decisions

- App remains the calculation/state owner until all workspaces are migrated.
- New UI lives only under `src/product/` and cannot use legacy visual classes.
- Each workspace receives typed data and callbacks; no calculation is duplicated.
- Production remains untouched until the final regression checkpoint.

## Phase 1: Product Foundation

### Task 1: Product shell and tokens

**Acceptance criteria**
- New masthead, workspace navigation and context strip render from `src/product/`.
- New components contain no inline style and no legacy visual classes.
- App builds and existing calculations still initialize.

**Verification**
- `npm run lint`
- `npm run build`
- Browser screenshot at 390px and 1728px with no overflow.

**Files**
- `src/product/ProductShell.tsx`
- `src/product/components/ProductNavigation.tsx`
- `src/product/components/BuildContextStrip.tsx`
- `src/product/product.css`
- `src/App.tsx`

## Checkpoint: Foundation

- Shell responsive and keyboard accessible.
- No calculation output changes.

## Phase 2: Core Workspaces

### Task 2: Arsenal workspace

**Acceptance criteria**
- Equipped slot rail and gear table replace the legacy card grid.
- Existing filter, add, edit, equip and quick-swap actions work.
- Desktop table becomes structured rows on mobile.

**Verification**
- Equip one item, edit one item, filter each slot.
- Browser checks at 390, 768 and 1728px.

### Task 3: Build workspace

**Acceptance criteria**
- Path, weapons, sets, ring, Inner Ways and calibration use new product components.
- Verified/estimated/unverified statuses are explicit.
- No sidebar layout remains.

**Verification**
- Change build, scheme, ring and Inner Way without console errors.

### Task 4: Combat workspace

**Acceptance criteria**
- Assumptions precede results.
- Formula ceiling, Modeled estimate and Recorded parse are distinct.
- Stats and damage analysis use stable internal tabs.

**Verification**
- Toggle food and efficiency; outputs update from existing state.
- Formula values match legacy output for the same state.

### Task 5: Optimize workspace

**Acceptance criteria**
- Full-page workspace replaces graduation modal.
- Overview opens first; all existing tools remain reachable.
- Vertical navigation has no horizontal overflow.

**Verification**
- Open every analysis tool and run Best Build/Compare flows.

## Checkpoint: Core Workspaces

- All four workflows pass.
- Lint/build pass and console is clean.

## Phase 3: Migration and QC

### Task 6: Remove legacy presentation path

**Acceptance criteria**
- Legacy `workbench.css` and `rebuild-v2.css` are no longer imported.
- No user-visible screen depends on legacy sidebar/card classes.
- Data/import compatibility remains intact.

### Task 7: Product QA and preview

**Acceptance criteria**
- 390, 768, 1180 and 1728 screenshots pass visual review.
- No clipping, overlap, horizontal page overflow or console warnings.
- Preview deployment is verified before production merge.

## Risks

| Risk | Mitigation |
|---|---|
| App.tsx is 7,028 lines | Migrate presentation one workspace at a time through typed props |
| Formula regression | Never move calculation functions during UI migration |
| Legacy CSS specificity | Product components use isolated `product-` classes and legacy imports are removed only at Task 6 |
| Feature parity loss | Maintain a workspace-by-workspace interaction checklist |

