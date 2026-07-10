# Guided Gear-First Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rework the calculator into a Gear-first guided workspace without changing formulas, game data, import/OCR behavior, or optimizer calculations.

**Architecture:** Keep `src/App.tsx` as the state owner. Add a UI-only workspace state (`gear | build | simulation | analysis`) and use existing calculator blocks behind task navigation. Calculation inputs and outputs retain their current sources.

**Tech Stack:** React, TypeScript, Vite, existing CSS tokens and installed Lucide icons.

## Global Constraints

- Preserve calculation and Worker code exactly.
- Add no dependencies.
- Default to Gear workspace.
- Keep formula ceiling, reference estimate, and in-game parse distinct.
- Verify at 390px, 768px, 1180px, and 1728px with no horizontal overflow.

---

### Task 1: Workspace Navigation

**Files:**
- Modify: `src/App.tsx:1232-1255, 3600-3730`
- Modify: `src/index.css`

- [ ] Add `type Workspace = "gear" | "build" | "simulation" | "analysis"` plus state defaulting to `"gear"`.
- [ ] Render a semantic `.workspace-nav` after the header with Gear, Build, Simulation, and Analysis buttons.
- [ ] Add an `openWorkspace(next: Workspace)` handler that updates state and scrolls `#workspace-${next}` into view.
- [ ] Add focus-visible and active styles using existing semantic tokens.
- [ ] Run `npm run lint`; expected exit code 0.
- [ ] Commit: `git commit -m "feat: add guided workspace navigation"`.

### Task 2: Gear-First Workspace

**Files:**
- Modify: `src/App.tsx:3450-3730`
- Modify: `src/index.css`

- [ ] Wrap the existing slot filter and equipment inventory in `#workspace-gear`; preserve all filter, add, edit, equip, and quick-swap handlers.
- [ ] Add a compact heading showing `Inventory and equipped gear` and the current `x/8 equipped` count.
- [ ] Keep existing gear cards and DPS-delta behavior; only change grouping, spacing, and responsive grid behavior.
- [ ] Run a browser check: slot filter, add gear, edit gear, equip, and quick swap continue to work.
- [ ] Commit: `git commit -m "feat: make gear the primary workspace"`.

### Task 3: Build and Simulation Workspaces

**Files:**
- Modify: `src/App.tsx:3730-4310`
- Modify: `src/index.css`

- [ ] Move build select, scheme controls, calibration, Inner Ways, ring, and set controls into `#workspace-build`.
- [ ] Move food, efficiency, DPS summary, Damage Statistics, and Simulate controls into `#workspace-simulation`.
- [ ] Label sections `Path, equipment set, and Inner Ways` and `Rotation assumptions and DPS reference`.
- [ ] Keep Custom Rotation, WWMath Coverage, and Skill Editor under a closed `Advanced rotation tools` details section by default.
- [ ] Keep existing calculation state and results untouched.
- [ ] Run `npm run lint` and `npm run build`; expected exit code 0.
- [ ] Commit: `git commit -m "feat: separate build and simulation workspaces"`.

### Task 4: Analysis Workspace

**Files:**
- Modify: `src/App.tsx:4664-5700`
- Modify: `src/index.css`

- [ ] Restyle the existing graduation modal into an `.analysis-sheet` with vertical side navigation on desktop and a horizontal scroll-safe nav on mobile.
- [ ] Keep existing tab keys and calculation bodies; make the manual/overview tab the default landing view.
- [ ] Surface graduation rate, reference estimate, and top analysis actions before deep tables.
- [ ] Verify Compare, Stat Priority, Best Build, Custom Rotation, and Team still open their current calculations.
- [ ] Commit: `git commit -m "feat: redesign analysis workspace navigation"`.

### Task 5: Responsive and Release Verification

**Files:**
- Modify: `src/index.css`

- [ ] Hide inactive workspace sections instead of allowing stacked, duplicate configuration surfaces.
- [ ] On mobile make workspace navigation sticky and evenly sized; do not create horizontal page overflow.
- [ ] Verify visible focus rings and semantic labels for changed controls.
- [ ] Browser-check 390px, 768px, 1180px, and 1728px, plus console warnings/errors.
- [ ] Run `npm run lint` and `npm run build`; expected exit code 0.
- [ ] Commit, push, and deploy with `npx wrangler pages deploy dist --project-name=wonton-wwm --branch=main`.

