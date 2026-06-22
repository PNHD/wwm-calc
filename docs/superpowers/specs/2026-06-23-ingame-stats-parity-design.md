# In-game Damage Stats + Feature Parity — Design

Reference app: **Where Winds Math** (Ruricon, wherewindsmath.pages.dev). Goal: bring its
analysis features into our app (Wonton, wonton-wwm.pages.dev), **except cloud sync** (later).
Add clear English usage docs per feature (users are confused by the share link).

Built **incrementally**, one batch per spec→build cycle. `App.tsx` is shared with another
agent — re-read before each edit, keep diffs localized.

## Gap map (reference → our app)

| Reference feature | Our app | Action |
|---|---|---|
| Total DMG + DPS | Have (DPS Expectation) | Optimize: add Total + Breakdown |
| Damage Composition (Crit/Aff/Norm/Abrasion) | Missing | Build (Batch 1) |
| Inner Ways "DPS loss if removed" | Missing | Build (Batch 1) |
| Set Bonuses comparison (DPS/option) | Partial (Best Build) | Build (Batch 2) |
| Character Stats / Attunements / Damage Bonuses | Have (Panel Sim) | — |
| Stat Priority ranking | Have (grad-%) | Optimize: add DPS gain (Batch 1) |
| Gear Analyzer (per-slot DPS contribution) | Partial | Optimize (Batch 2) |
| Gear Compare (current vs new + advisor) | Partial | Build (Batch 2) |
| Monte Carlo Simulation (percentile + hit dist) | Missing | Build (Batch 3) |
| Team Builder | Missing | Build (Batch 4) |
| Rotations editor | Removed on purpose (locked #7) | Build (Batch 4, needs override) |
| Skill Editor | Missing | Build (Batch 4) |
| Settings (enemy lvl, teammate buffs) | Partial | Optimize (Batch 4) |
| Profile export/import | Have | — (cloud: skip) |
| Per-feature help + share-link explainer | Sparse | Build (cross-cutting) |

## Batches

1. **Quick wins** — Damage Composition donut + Inner Ways DPS-loss + Stat Priority DPS-gain + Total DMG + help.
2. **Set Bonus & Gear** — Set comparison table, per-slot DPS contribution, Gear Compare advisor.
3. **Monte Carlo Simulation** — random crit/aff/norm/abrasion rolls, percentiles, hit distribution.
4. **Big systems (override CLAUDE.md #5/#6/#7)** — Team Builder, Rotations editor, Skill Editor.
   Re-confirm with user + update CLAUDE.md locked decisions before building.

## Batch 1 detail (this build)

**calc.ts** — `calcSkill` returns extra `breakdown {crit, aff, normal, abrasion}`, each summed
across outer+fixed+pz with the same `count·tiaozhan·attuned` multipliers as `total`:
- `crit = pCrit·(dC_O+dC_F+dC_PZ)` · `aff = pAff·(dA_O+dA_F+dA_PZ)`
- `normal = pWhite·(dN_O+dN_F+dN_PZ)` · `abrasion = pGraze·(dGl_O+dN_F+dN_PZ)`
- The four sum to `total` (verifiable). Abrasion = graze (擦伤). `total`/`perHit` unchanged.

**App.tsx**
- `rotationStats` accumulates `composition {crit, aff, normal, abrasion}` + percentages.
- Damage Output card: show Total DMG; "Damage Statistics" button opens a game-style overlay
  (Total DMG + DPS/s, CSS `conic-gradient` donut, 4 labelled %, Buff Effect chips from real
  state: datang/yishui/set 4pc/Stars/food). Esc / click-outside to close.
- Inner Ways area: "DPS loss if removed" — per equipped IW, recompute rotation with that IW's
  `iwStats` removed from `adjustedPanel`; show −DPS and −%.
- Stat Priority: add DPS-gain-per-roll column beside grad-%.
- Help: ⓘ tooltips per section + a "How to use · Share link" explainer block. English.

**Ponytail:** no chart lib (conic-gradient), no game icon assets (text chips), abrasion=graze
(no DoT model), reuse existing calc/state. No new dependencies.

## Usage docs (English, to embed)

- **Damage Statistics** — expected damage split by hit outcome over one rotation. Critical =
  crit hits, Affinity = 会心 hits, Normal = ordinary hits, Abrasion = graze hits. Buff chips
  show which buffs the calc currently assumes active.
- **DPS loss if removed** — how much rotation DPS each inner way contributes. Bigger loss = more
  important to keep that way leveled.
- **Stat Priority (DPS gain)** — DPS added by one more max roll of each substat. Pair with the
  graduation-% column to decide what to chase next.
- **Share link** — copies your full build into the URL. Send it; the recipient opens it and sees
  the exact same stats/build. Nothing is uploaded — it all lives in the link.
