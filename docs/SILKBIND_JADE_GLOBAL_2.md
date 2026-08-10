# Silkbind-Jade — Global 2.0 model evidence

Model: `src/pathModels/silkbindJade.mjs`  
Status vocabulary: `CONFIRMED_CLIENT`, `CONFIRMED_OFFICIAL`, `COMMUNITY_GUIDE`, `COMMUNITY_MEASURED`, `MODELED_ASSUMPTION`, `UNRESOLVED`.

## Evidence order

1. Current English Global client evidence already committed in this repository.
2. Current official Global patch notes.
3. Mun, **Ultimate Umbrella Guide**, Patch 2.0 (community / speedrun evidence).
4. Current community measurements/tooltips.
5. Legacy/CN data only when compatible and explicitly marked.

Official references used:
- Version 1.7 Path Balance Adjustment — Silkbind-Jade: https://www.wherewindsmeetgame.com/news/official/Adjustment528.html
- Global 2.0 update/fix notes, including the July 24 Vernal Umbrella Attunement correction.

Community primary source:
- Mun, Ultimate Umbrella Guide: https://docs.google.com/document/d/1ij69aOcPbZ4fmwkImY4eet9PYmvoWre6Z0P_SeMVCR0/edit

## Existing-model audit before this change

- The repository already knew the `silkbind-jade` path, Vernal Umbrella/Inkwell Fan weapon identity, old fixed Jade rotation bundles, and legacy skill coefficients.
- Jade was still evaluated by the generic fixed-rotation branch in `App.tsx`; only Bamboocut-Dust owned a T96 event timeline.
- `Blossom Barrage` still described the old Combo values and exposed old Crit-DMG/Crit stat data.
- `Thunderous Bloom` still described the old movement-distance trigger even though official 1.7 changed activation to Martial Art Skill completion and affected skill categories.
- Player-facing Vernal Attunement text still included the legacy `Ninefold Spring: Special Skill DMG Bonus` label.
- Old Jade rotations are retained as compatibility/debug references; they are not used by the new Best Build objective.

## Evidence matrix

| Mechanic | Model treatment | Provenance | Notes |
|---|---|---|---|
| Spring Away PvE +15% | eligible skill event multiplier | CONFIRMED_OFFICIAL | 1.7 non-player target change |
| Unfading Flower PvE +15% | eligible Drone tick multiplier | CONFIRMED_OFFICIAL | 1.7 non-player target change |
| End Unfading Flower refunds 15 Blossoms, 5s trigger interval | explicit resource refund on Drone end | CONFIRMED_OFFICIAL | resource stored in Petal units using the guide/client convention 10 Blossoms = 1 Petal |
| Heavy Umbrella throw tracked separately from projectile damage | separate event/tag family | CONFIRMED_OFFICIAL | no blanket projectile modifier |
| Lingering Bone source/refresh behavior | source-aware own mark; multi-Jade bridging opt-in | CONFIRMED_OFFICIAL + COMMUNITY_GUIDE | solo never assumes perfect external bridging |
| Forsaken Fame PvE increase / Endurance recovery | evidence retained, not numerically priced in first Jade planner | CONFIRMED_OFFICIAL | no fabricated coefficient |
| Thunderous Bloom activation | Martial Art completion produces Spring Thunder; eligible events consume charges | CONFIRMED_OFFICIAL | replaces old movement-only model |
| Vernal Frequent Ballistic family | semantic family, aliases + coverage | CONFIRMED_OFFICIAL | Spring Away + Unfading Flower coverage |
| Vernal Special family | semantic family retained | CONFIRMED_OFFICIAL | July 24 display/effect mismatch requires compatibility |
| Vernal Charged family | semantic family retained | CONFIRMED_OFFICIAL | July 24 display/effect mismatch requires compatibility |
| Vernal Light/Heavy + derived family | semantic family retained | CONFIRMED_OFFICIAL | July 24 library mismatch preserved as provenance |
| Blossom Barrage T5 Crit-DMG → Direct Crit | Jade-only scenario stat, default numeric `0` until exact current client value is supplied | CONFIRMED_OFFICIAL + UNRESOLVED numeric | never leaks to Bamboocut |
| Blossom own-Combo Spring Away / Unfading Flower bonus | +5%, +10% while Qi-broken/Exhausted, eligible skills only | CONFIRMED_OFFICIAL | event eligibility, not global damage |
| Jadebreak | +40% Projectile, 15s separate modifier | COMMUNITY_GUIDE | exact bucket remains community/model provenance |
| Combo | +20% Projectile, 15s separate modifier | COMMUNITY_GUIDE | exact bucket remains community/model provenance |
| Q Petals: ~1 no Combo / 2.5 with Combo | discrete resource generation | COMMUNITY_MEASURED | not a global DPS multiplier |
| Heavy→Light ~2.4 Petals | discrete resource generation | COMMUNITY_MEASURED | same |
| Blossom T6 Q-on-Combo cooldown refund 5s | Q charge/recharge event | COMMUNITY_GUIDE | enables Ground Jade cycling |
| Ground Jade default | priority planner strategy | COMMUNITY_GUIDE | T96 default |
| Flying Jade | alternate planner strategy | COMMUNITY_GUIDE / legacy | not T96 default |
| Drone as primary damage engine | uptime/redrone/resource diagnostics | COMMUNITY_GUIDE | optimizer sees opportunity cost |
| Qi-break White Body extension | Petal-refill/Drone-extension events | COMMUNITY_MEASURED + MODELED_ASSUMPTION cadence | guide's ~2.5x is validation context, never hard-coded |
| Star Reacher | conditional Physical Attack / own Lingering Bone state | COMMUNITY current tooltip + repository breakthrough data | only verified/identified state is priced |
| Morale Chant | 2s stack ramp, +2 Pen/+1% damage per stack | CONFIRMED_CLIENT repository data | static breakthrough stats remain common-panel data |
| Breaking Point | explicit Qi-break / Perfect-Dodge windows | COMMUNITY_GUIDE; numeric window multiplier MODELED_ASSUMPTION | no permanent average; compare scenarios rather than claiming exact current value |
| Bitter Seasons | target resistance-reduction state; teammate supply suppresses duplicate | CONFIRMED_CLIENT repository data + COMMUNITY strategy | personal vs team duty explicit |
| Pursuit / Shattered Spring | animation time + stack benefit + redrone opportunity cost | COMMUNITY_GUIDE | `maintain-5` is a negative-control strategy, not a hard ban |
| Precision 100 / Crit 80 / final rate-budget heuristic | diagnostics/advisor only | COMMUNITY_GUIDE | ranking continues to use product outcome math |
| Max Physical speedrun preference | separate `speedrun-ceiling` Max endpoint objective | COMMUNITY_GUIDE | not Expected DPS; not called P95 |
| Attack food +120/+240 | shared Global T96 scenario, unchanged | CONFIRMED_CLIENT | preserved |
| Flute distance exact bonus | disabled | UNRESOLVED | guide contains contradictory values |
| Exact Min↔Max roll distribution | unresolved | UNRESOLVED | ceiling is endpoint heuristic, not percentile |
| Dragonhead exact Jade filler coefficient | not priced unless verified | UNRESOLVED | Vitality reservation/state exists without invented coefficient |

## Path Model contract

```text
PathModel {
  id
  menuPanelRules
  skillTags
  stateFactory
  eventRules
  rotationPlanner
  objectives
  scenarioDefaults
  buildDiagnostics
  gearAdvice
}
```

`Bamboocut-Dust` keeps its existing `rotationTimeline` implementation. `Silkbind-Jade` owns the new resource/state/priority planner. Common gear aggregation, panel math, `calcSkill` outcome engine, inventory, Gear Compare and Best Build search are shared.

## Jade objective semantics

- **Expected DPS** — default. Damage events are priced by the current shared `calcSkill` engine.
- **Short-fight Burst** — same stat engine with shorter/Qi-break-sensitive scenario and Breaking Point windows.
- **Speedrun Ceiling** — community objective. Candidate event pricing uses the Max-Physical endpoint. It is not a statistically exact percentile.
- **Team DPS / Bitter Duty** — exposes teammate-supplied Bitter and prevents duplicate full debuff benefit.

## Remaining unknowns intentionally not fabricated

- Exact current numeric Direct Critical Rate granted by Blossom Barrage after the 2.0 stat-type change.
- Exact Global damage-bucket interaction for community-described Jadebreak/Combo projectile bonuses; model keeps them explicit with provenance.
- Exact White Body refill cadence; modeled as event-level refill/extension, never a fixed 2.5x multiplier.
- Exact current Breaking Point damage/window values beyond the modeled scenario abstraction.
- Exact Flute distance bonus.
- Full Mystic filler coefficients for Dragonhead/Flute/Frog/Smolder/Poet/Soaring/Tornado where current Global values are not already trustworthy.
- Exact physical attack random-roll distribution needed to claim a real P95/P99.
