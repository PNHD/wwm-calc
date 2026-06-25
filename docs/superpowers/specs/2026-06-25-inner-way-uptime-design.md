# Inner-Way Uptime (conditional buffs) — Design

**Date:** 2026-06-25
**Status:** Approved design, pending plan

## Problem

The app sums each selected inner way's **full max-stack stat** onto the panel
(LOCKED #2 — inner ways are in-combat buffs added on top of `basePanel` in
`adjustedPanel`). But ~21 of the 24 attack inner ways are **conditional**:
stack-ramp, HP threshold, "3+ enemies", or proc effects. Their max value is not
held 100% of the time. Crediting the full max inflates DPS.

**Evidence (Bamboocut-Dust, this user's best-build gear):**
- panel + gear + 4pc set, no inner ways → **32,870** DPS
- + 6 recommended inner ways at full max → **54,467** DPS
- `breaking_point` alone contributes **+8,171** (+25%), the single largest jump.
- `breaking_point` requires the enemy to be under Spirit Depletion (boss
  "Exhausted"). User-measured uptime on a 60s dummy: Exhausted procs **once for
  ~10s → ≈17% uptime**, not 100%. The app credits +25 Pen / +25% Crit DMG for
  the whole 60s.

In-game, this build with everything on tops out around **40k**, not 54k. The gap
is over-credited conditional inner-way uptime.

## Goal

Make conditional inner-way stats reflect realistic **uptime**, so displayed DPS
tracks real parses, **without** abandoning LOCKED #2 (inner ways still add on top
of the base panel; we only scale a conditional buff by its uptime fraction).

Scope of THIS spec: the uptime mechanism + applying it to **`breaking_point`**
(the heaviest, with measured data). The same field generalizes to other
conditional inner ways later (one data value each) — not done here (YAGNI; we
verify the mechanism against a known number first).

## Non-goals

- NOT removing LOCKED #2. A static inner way (no condition) still adds its full
  stat. Uptime only scales inner ways that carry an explicit uptime value.
- NOT re-deriving every inner way's uptime now. Only `breaking_point` gets a real
  default this round; others default to `1.0` (unchanged behavior) until measured.
- NOT touching the damage formula, tier constants, or rotations (LOCKED #1, #7).
- NOT a per-stack stacking simulator. Uptime is a single 0–1 multiplier on the
  inner way's stat block — the laziest model that captures the real effect.

## Design

### Data: `uptime` field on inner-way tiers (or inner-way)

Add an optional `uptime?: number` (0–1) to the inner-way definition in
`src/data/innerways.ts`. Default semantics: **absent ⇒ 1.0** (full, current
behavior — so every inner way except the ones we annotate is unchanged).

`breaking_point` gets `uptime: 0.17` (the measured ~10/60s), with a comment
citing the dummy measurement so it's not mistaken for a guess.

> Note found during investigation: `breaking_point.cat` is `"BAMBOOCUT-WIND"` but
> its note says "Best T91 for Bamboocut-Dust". That mis-categorization is out of
> scope here (it affects the recommended-filter, not DPS) — flag it, fix
> separately if desired.

### State: per-inner-way uptime override (slider)

Mirror the existing `innerWayTiers: Record<string, number>` pattern in `App.tsx`:
add `innerWayUptime: Record<string, number>` (id → 0–1), persisted in the same
config blob (`selectedInnerWays` / `innerWayTiers` already persist there).

- Effective uptime for an inner way = `innerWayUptime[id] ?? def.uptime ?? 1.0`.
- The slider writes `innerWayUptime[id]`; default shown = the data `uptime`.

### Calc: scale conditional stats in `iwStats`

In the `iwStats` memo (`App.tsx:2391-2433`), where each selected inner way's
tier `stat` is summed, multiply every stat field by the effective uptime before
adding:

```ts
const up = innerWayUptime[id] ?? iw.uptime ?? activeTierObj.uptime ?? 1;
if (s.outerPen) bonus.outerPen += s.outerPen * up;
if (s.critDmg)  bonus.critDmg  += s.critDmg  * up;
// …same `* up` on every stat field…
```

`adjustedPanel` and the DPS formula are untouched — they just receive a smaller,
realistic `iwStats`. (LOCKED #2 path preserved: still base + gear + iwStats.)

### UI: uptime slider per conditional inner way

In the inner-way row UI (where the tier selector already renders, ~`App.tsx:3811`),
for an inner way whose `def.uptime` is present (i.e. conditional), show a small
`uptime` slider (0–100%) next to the tier control, defaulting to the data value.
Label it e.g. "Uptime %". Static inner ways (no `uptime` in data) show no slider
— their behavior is unchanged. Tooltip: "How often this buff's condition is
active (e.g. boss Exhausted). Tune to match your parse."

### Data flow

```
innerWayUptime[id] (slider)  ──┐
def.uptime (data, e.g. 0.17) ──┤→ effective up ─┐
                                                 ├→ iwStats += stat * up  (App.tsx:2391)
selectedInnerWays + tier ───────────────────────┘
   → adjustedPanel = base + gear + iwStats  (unchanged)
   → calcSkill (unchanged) → DPS
```

## Verification (no test runner — repo convention)

- `npx tsc --noEmit` clean.
- Reproduce the investigation numbers via an ad-hoc esbuild harness (already used
  during debugging): Bamboocut-Dust best-build gear + 6 recommended inner ways,
  with `breaking_point` uptime 1.0 → ~54.5k; uptime 0.17 → ~45.4k. Plus food/bow
  the in-app number should land near the user's ~40k in-game parse (remaining gap
  is the other conditional inner ways, still at 1.0 — expected, documented).
- Manual: open the app, select Bamboocut-Dust + recommended inner ways, confirm
  `breaking_point` shows a slider defaulting to 17%, and dragging it 17%→100%
  raises DPS by ~+8k (matches the isolated measurement).

## What this deliberately leaves out (YAGNI)

- Per-stack ramp simulation (model as a single uptime multiplier instead).
- Uptime values for the other ~20 conditional inner ways (add one number each,
  later, as measured).
- Fixing `breaking_point.cat` mis-categorization (separate, non-DPS).
- The Adjustment528 finding that Umbrella Resonance should count as a Martial Art
  Skill (separate calc question; it's a buff the app currently under-applies, not
  part of this over-credit fix).
