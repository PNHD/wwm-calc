# Inner-Way Conditional-Stat Fix — Design

**Date:** 2026-06-25
**Status:** Approved design, pending plan
**Supersedes:** `2026-06-25-inner-way-uptime-design.md` (uptime-slider approach —
dropped in favor of this simpler data fix per user decision).

## Problem (root cause of the "50k DPS" inflation)

Each inner way in `src/data/innerways.ts` carries a `tiers[].stat` block that
`adjustedPanel` sums onto the panel (LOCKED #2). For ~7 inner ways, that `stat`
block holds the **Basic Buff** — the conditional, stack-ramped effect that only
applies under a game condition (Collapse stacks, "Spirit Depletion / Exhausted",
"3+ enemies", HP threshold) — instead of (or mixed with) the **Attribute Buff**,
the always-on line.

In-game, the Inner Way detail screen shows two sections:
- **Basic Buff** — conditional. e.g. Breaking Point: "*Each stack of Collapse:
  +5 Phys Pen, +5% Crit DMG… up to 5 times*" → +25/+25% only while the enemy is
  Spirit-Depleted.
- **Attribute Buff** — always on. e.g. Breaking Point: "*Precision Rate +6.5%,
  Direct Critical Rate +4.1%*".

The app currently credits the **Basic Buff** (e.g. `breaking_point` stat
`{outerPen:25, critDmg:25, dcrit:4.1, prec:6.5}` — the +25/+25% is conditional).
That inflated this user's Bamboocut-Dust best-build from ~33k (panel+gear) to
**54k**, while the real in-game ceiling with everything on is ~40k. The
community guide (Yoka-derived) corroborates: optimal Affinity spreads are quoted
"*100-78-17 (without using Breaking Point)*" — Breaking Point is treated as a
conditional, not an always-on stat.

This also **distorts gear ranking** (the app's actual purpose: help over-geared
players pick the optimal, non-redundant stat layout). If a conditional +25% Crit
DMG is credited as permanent, the app over-values Crit-DMG / Pen sub-stats.

## Goal

Make each inner way contribute **only its always-on Attribute Buff** to the panel.
Drop the conditional Basic Buff from the summed stats. An inner way that is *purely*
conditional (no Attribute Buff) contributes **0** to the panel — correct for this
app, which ranks gear on stable, always-available stats.

No uptime slider, no toggle, no formula change — just correct the data each inner
way feeds into the existing `adjustedPanel` sum.

## Non-goals

- NOT changing the damage formula, tiers, or rotations (LOCKED #1, #7).
- NOT removing LOCKED #2 — inner ways still add their (now-correct) stat on top of
  the base panel. We only fix *which* stat that is.
- NOT modeling partial uptime (rejected: the always-on/conditional split is the
  real game mechanic; uptime guessing is noise).
- NOT re-deriving every inner way — only those whose `stat` currently holds a
  conditional Basic Buff. Static inner ways are already correct and untouched.
- The per-sect stat-priority improvements from the community guide are a SEPARATE
  follow-up spec (Đợt 2), not this one.

## Scope: the 7 mixed inner ways

Investigation flagged 7 inner ways whose T6 `stat` mixes/holds a conditional Basic
Buff (each needs its Attribute Buff verified against an in-game tooltip or the
wwmdb crawl, like the Breaking Point screenshot the user provided):

| inner way | current stat | conditional part to DROP | keep (Attribute Buff) |
|---|---|---|---|
| `breaking_point` | `{outerPen:25, critDmg:25, dcrit:4.1, prec:6.5}` | `outerPen:25, critDmg:25` (Collapse) | `dcrit:4.1, prec:6.5` (verified from screenshot) |
| `song_of_tang` | `{critDmg:19, prec:6.5}` | `critDmg:19` (Tang Song stacks) — **verify** | `prec:6.5` |
| `light_anew` | `{minPz:36.2, pzPen:6}` | `pzPen:6` (3+ enemies) — **verify** | `minPz:36.2`? — **verify** |
| `morale_chant` | `{outerPen:10, outerDmg:5, dcrit:4.6, minOuter:23.6, maxOuter:47.2}` | `outerPen:10` (Yi River stacks) — **verify** | rest — **verify** |
| `sword_horizon` | `{generalDmg:8, daff:2.3, maxOuter:70.8}` | `generalDmg:8`? — **verify** | rest — **verify** |
| `bitter_seasons` | `{outerPen:10, outerDmg:2.5, prec:6.5}` | `outerPen:10` (boss def-shred) — **verify** | `prec:6.5`, `outerDmg:2.5`? — **verify** |
| `throat_piercing_art` | `{critDmg:3, pzPen:6, minPz:11.9, maxPz:24.1}` | `pzPen:6`? — **verify** | rest — **verify** |

Each row's split MUST be confirmed against a source (in-game Inner Way detail
screen — Basic Buff vs Attribute Buff sections — or the wwmdb dynamicAttributes
crawl from commit e19b08a) before editing. Breaking Point is already confirmed
from the user's screenshot. **Do not guess a split** — an unverified row stays as
a documented TODO rather than a wrong edit (this is verified-data territory,
LOCKED #1 spirit).

## Design

Pure data edit in `src/data/innerways.ts`. For each confirmed inner way, set every
tier's `stat` to the **Attribute Buff only**. The conditional values move into the
`effect`/`desc` text (so the info isn't lost — the UI still shows what the buff
does), but they no longer enter the `stat` object the panel sums.

```ts
// before
{tier:6, effect:"Tang Melody +3% Crit DMG/stack ×5 = +15% …", stat:{outerPen:25, critDmg:25, dcrit:4.1, prec:6.5}}
// after (Breaking Point — confirmed from in-game tooltip)
{tier:6, effect:"Basic Buff (conditional, Spirit Depletion): +25 Pen / +25% Crit DMG at 5 Collapse stacks — NOT summed. Attribute Buff: Precision +6.5%, Direct Crit +4.1%.", stat:{dcrit:4.1, prec:6.5}}
```

No code change to `iwStats` / `adjustedPanel` / `calcSkill` — they already sum
whatever `stat` holds. Fixing the data is the whole fix.

Also fix the mis-categorization found during investigation: `breaking_point.cat`
is `"BAMBOOCUT-WIND"` but it's recommended for Bamboocut-Dust — correct the `cat`
or the recommend list so the filter is right (non-DPS, but in the same file).

## Verification (no test runner — repo convention)

- `npx tsc --noEmit` clean.
- Ad-hoc esbuild harness (already used in debugging) on Bamboocut-Dust best-build
  + the 6 recommended inner ways: with the fix, `breaking_point` drops the +8.2k
  conditional contribution → total should fall from ~54.5k toward the ~40k
  in-game ceiling (remaining inner ways' fixes close the rest of the gap).
- Per fixed inner way: confirm the new `stat` equals the Attribute-Buff line from
  its source (screenshot/wwmdb), and that the dropped values appear in `effect`
  text (not lost).
- Manual: select Bamboocut-Dust + recommended inner ways; the displayed DPS lands
  near the user's real ~40k parse, and Crit-DMG / Pen sub-stat rankings no longer
  assume the conditional buff is permanent.

## Follow-up (separate specs, not this plan)

- **Đợt 2 — per-sect stat priority:** encode the community guide (Max Phys >
  Attribute; per-sect Crit/Aff/Prec caps like Hengdao 70% final-crit, Nameless
  40% Crit / skip Precision, Tank 56% Crit; God-stat lines; Min-vs-Max Physical
  for Affinity) into the gear-ranking advice. Big; its own brainstorm.
- The Adjustment528 finding (Umbrella Resonance should count as a Martial Art
  Skill → should eat `umbMartial`) — separate calc question, currently
  under-applied, not part of this over-credit fix.
