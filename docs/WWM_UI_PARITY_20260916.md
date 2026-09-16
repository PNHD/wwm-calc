# WWM UI parity audit — 2026-09-16

## Scope and method

Lane A compares the live, public interaction patterns of `greydust/where-builds-meet` (Reference A) and `M1zuke/where-winds-meet-dps` (Reference B) with the WWM candidate rooted at `f4a0be48881f4b16f419a857ef890c6f8a5269e1`. Reference A is GPL-3.0-or-later; both references were used for product interaction research only. No source, CSS, assets, formulas, or data were copied.

The candidate was run through the pinned Node 22.23.2 runtime and inspected with an isolated existing Chrome DevTools session. The final raw browser evidence is retained in the review bundle under `raw-browser/`:

- Desktop: `1440×1000` CSS viewport, DPR `1`, document `scrollWidth 1430`.
- Mobile: `390×844` CSS viewport, DPR `1`, document `scrollWidth 390`.
- Captures: Dust Overview; Jade Build; Jade Gear; Dust mobile Overview; Jade mobile Build; Jade mobile Gear; mobile navigation.
- Browser result: no page exceptions and no failed local resource loads. The recorded console contains only Vite connect/connected and React DevTools informational messages.

`ALREADY_HAVE_VERIFIED` means an equivalent current product surface was reached interactively in this candidate, not merely found by source search. `NUMERICAL_DEPENDENCY` means the requested experience would assert unverified model-owned values, mechanics, or lifecycle state and is intentionally not represented by decorative UI. `REJECT` means the reference pattern is incompatible with product scope or licensing.

| # | Reference feature / UX pattern | Reference | Current WWM surface observed | Decision | Lane A outcome / evidence |
| ---: | --- | --- | --- | --- | --- |
| 1 | Persistent planner shell | A, B | Product masthead, context strip, PvE rail | ALREADY_HAVE_VERIFIED | Desktop Dust and Jade captures show the persistent shell. |
| 2 | Selected-build identity in the header | A, B | Context strip identifies build, Inner Ways, model status | ALREADY_HAVE_VERIFIED | Dust/Jade capture text includes build and model state. |
| 3 | DPS / total / duration / graduation KPI header | B | Headline reports only currently authorized modeled DPS | NUMERICAL_DEPENDENCY | No total, duration, or graduation KPI was added because those values are not universally modeled or verified. |
| 4 | First-run class selection | A, B | Safe-start/blank/reference/import choices | ALREADY_HAVE_VERIFIED | Existing onboarding actions remain in the masthead. |
| 5 | Martial-path chooser | A, B | Build workspace martial-path list | ADAPT | Each path now shows registry-backed maturity in the picker. Jade mobile Build capture shows all ten states. |
| 6 | Explicit weapon pair | B | Selected path metadata | ADAPT | Overview now shows the current path plus both canonical weapons. |
| 7 | Planner-only / WIP path marker | A, B | Capability registry and unavailable routes | ADAPT | Picker and selected-path band now expose canonical maturity without deriving numeric capability. |
| 8 | Disabled unsupported calculations | A, B | Capability-gated Compare, Best Build, Simulation | ALREADY_HAVE_VERIFIED | Dust Overview reports unavailable actions rather than placeholder results. |
| 9 | Global tier / version context | A, B | Product context and Build health | ALREADY_HAVE_VERIFIED | Captures show current Global tier context. |
| 10 | Main character stat form | A | Combat workspace separates menu and combat values | ALREADY_HAVE_VERIFIED | Combat is a reachable named PvE route; it remains its data owner. |
| 11 | Attunement stat form | A | Existing Build/Gear and model-owned paths | NUMERICAL_DEPENDENCY | No additional attunement scoring or conversion was introduced. |
| 12 | Global buffs/debuffs | A | Existing combat inputs | ALREADY_HAVE_VERIFIED | Retained in the current combat-owned flow; no synthetic summary was created. |
| 13 | Breakthrough control | A, B | Existing build context | ALREADY_HAVE_VERIFIED | Existing current product control retained; no reference mechanics copied. |
| 14 | Inner Ways selector | A, B | Four-slot searchable Inner Ways picker | ALREADY_HAVE_VERIFIED | Jade build retains the existing configurable Inner Ways section. |
| 15 | Inner Ways priority | A | Current data/model priority ownership | NUMERICAL_DEPENDENCY | A priority rank would be a numerical claim; Lane A adds none. |
| 16 | Weapon set controls | A, B | Existing Build configuration controls | ALREADY_HAVE_VERIFIED | Existing set choices are retained under the selected path. |
| 17 | Armor set controls | A, B | Existing Build/Gear controls | ALREADY_HAVE_VERIFIED | Gear and Build are separate, reachable surfaces. |
| 18 | Bow/ring set controls | A | Existing Build/Gear controls | ALREADY_HAVE_VERIFIED | Retained; no set mechanics changed. |
| 19 | Food configuration | A, B | Existing build-owned settings | ALREADY_HAVE_VERIFIED | Existing configuration retained; not reimplemented in the shell. |
| 20 | Script configuration | A, B | Existing build-owned settings | ALREADY_HAVE_VERIFIED | Retained without adding an unrelated planner copy. |
| 21 | Divinecraft / specialty configuration | A, B | Existing build-owned settings | ALREADY_HAVE_VERIFIED | Retained where currently supported. |
| 22 | Encounter configuration | B | Existing Combat workspace | ALREADY_HAVE_VERIFIED | Current Combat route remains the owner of combat context. |
| 23 | Team buffs | B | Existing Team route under More & Advanced | ALREADY_HAVE_VERIFIED | Advanced navigation retains Team as a real route. |
| 24 | Qi-break override | B | No current verified Global model contract | NUMERICAL_DEPENDENCY | No control was imitated without a current-model owner. |
| 25 | Panel statistics | A, B | Combat workspace, menu-vs-combat view | ALREADY_HAVE_VERIFIED | PvE rail exposes the real Combat route. |
| 26 | Gear-stat lift | B | Existing gear diagnostics | ALREADY_HAVE_VERIFIED | Jade Gear capture shows panel-first diagnostics and path-independent roll diagnostic. |
| 27 | Equipped slot strip | B | Gear workspace equipped section | ALREADY_HAVE_VERIFIED | Jade Gear capture shows eight equipped slots. |
| 28 | Gear inventory | B | Gear workspace inventory and slot rail | ALREADY_HAVE_VERIFIED | Gear is an explicit primary PvE route. |
| 29 | Gear import | B | Existing Import game / Scan gear actions | ALREADY_HAVE_VERIFIED | Actions remain visible in captures. |
| 30 | Create gear | B | Existing Add gear flow | ALREADY_HAVE_VERIFIED | Jade Gear capture shows Add gear. |
| 31 | Gear analysis | B | Selected gear diagnostic panel | ALREADY_HAVE_VERIFIED | Jade Gear capture shows selected-gear roll diagnostic. |
| 32 | Retunement / reattunement simulator | B | No verified universal result contract | NUMERICAL_DEPENDENCY | Left to the numerical evidence lane; no score, reroll gain, or mechanic was invented. |
| 33 | Gear comparison deltas | A, B | Capability-gated Compare surface | ALREADY_HAVE_VERIFIED | Jade has Compare; Dust truthfully shows unavailable. |
| 34 | Best-build optimization | A | Capability-gated Best Build surface | ALREADY_HAVE_VERIFIED | Jade has Best Build; Dust truthfully shows unavailable. |
| 35 | DPS breakdown | A, B | Rotations / Combat model detail | ALREADY_HAVE_VERIFIED | Existing advanced route retained through the ProductShell map. |
| 36 | Rotation editor | A, B | Rotations under More & Advanced | ALREADY_HAVE_VERIFIED | Existing advanced route retained; this is not the removed Swap Sim. |
| 37 | Cast timeline | B | Existing rotation detail owner | ALREADY_HAVE_VERIFIED | Existing rotation route retained; no timeline values duplicated. |
| 38 | Simulation summary | A, B | Capability-gated Simulation | ALREADY_HAVE_VERIFIED | Unsupported Dust simulation is explicitly unavailable. |
| 39 | Skill editor | A, B | Skill Editor under More & Advanced | ALREADY_HAVE_VERIFIED | Existing route is grouped in the advanced menu. |
| 40 | Talent / enhancement view | B | Current Build/Skill surfaces | ALREADY_HAVE_VERIFIED | Current product retains its own supported controls rather than importing reference taxonomy. |
| 41 | Profiles | B | Profile route and masthead profile actions | ALREADY_HAVE_VERIFIED | Existing profile flow remains visible in captures. |
| 42 | Save/discard dirty-state affordance | B | Current persistence contract | NUMERICAL_DEPENDENCY | No fake dirty indicator or discard behavior was added. |
| 43 | Calculation-in-progress indication | B | Existing calculation lifecycle | NUMERICAL_DEPENDENCY | No cosmetic progress bar; it requires model-owned progress/ETA state. |
| 44 | Stale-result retention during calculation | B | Existing result invalidation lifecycle | NUMERICAL_DEPENDENCY | Not presented until the data owner can expose truthful stale/current state. |
| 45 | Reference-only class exposure | A, B | `REFERENCE_ONLY` maturity | ALREADY_HAVE_VERIFIED | Jade mobile Build capture shows Bamboocut - Wind as `REFERENCE_ONLY`. |
| 46 | Unmodeled current-Global path exposure | A, B | Selectable path with a no-results explanation | ADAPT | Unmodeled state now receives a clear, bordered unavailable treatment. |
| 47 | Current-path overview identity | A, B | PvE Overview cards | ADAPT | Added a compact current-path card with label, weapons, maturity, and existing Build action. |
| 48 | Direct tab/deep-link navigation | A, B | `#pve/<view>` hash routes | ADAPT | Shared hash handler now switches the underlying legacy view through existing `TAB_FOR_PVE`; direct Build/Gear/Compare/Best Build/Combat routes render their matching surface. |
| 49 | Desktop dense planner layout | A, B | Existing responsive product layout | ALREADY_HAVE_VERIFIED | `1440×1000` captures have no horizontal document overflow (`scrollWidth 1430`). |
| 50 | Mobile primary navigation | A, B | Bottom Build/Gear/Compare/Best/More navigation | ALREADY_HAVE_VERIFIED | `390×844` captures show the bottom navigation. |
| 51 | Mobile responsive build picker | A, B | Single-column martial-path list | ALREADY_HAVE_VERIFIED | Mobile Jade Build capture shows readable cards and `scrollWidth 390`. |
| 52 | Mobile responsive gear inspection | B | Gear workspace responsive layout | ALREADY_HAVE_VERIFIED | Mobile Jade Gear capture is at true `390×844`, `scrollWidth 390`. |
| 53 | Keyboard native controls | A, B | Native buttons, selects, inputs, focus-visible styling | ALREADY_HAVE_VERIFIED | Lane changes add text to existing buttons; no custom click-only control was introduced. |
| 54 | Accessible unavailable state | A, B | Native disabled affordances and status content | ADAPT | Unmodeled explanation remains a semantic `role=status` section and does not pretend a result exists. |
| 55 | Reference app visual style/source reuse | A, B | WWM's existing visual system | REJECT | Copying GPL reference code/CSS/assets or cloning either planner would violate the research-only boundary. |
| 56 | Cross-path coefficient fallback | A, B | Path capability registry | REJECT | A path never receives another path's DPS, graduation, comparison, or Best Build result. |

## Implemented Lane A seams

Five small, presentation-only adaptations were retained after the audit:

1. The Overview exposes the selected canonical path, weapon pair, maturity, and an existing action to edit it.
2. Every path in Build exposes its canonical maturity; the selected-path band repeats that state without new data.
3. An unmodeled path's existing truthful unavailable copy receives a clear local visual boundary.
4. Direct PvE hash routes now synchronize the legacy content via the existing shared `TAB_FOR_PVE` map.
5. The new maturity labels keep the original buttons and native keyboard behavior rather than replacing controls with a custom picker.

No coefficients, timings, set effects, path registry values, calculator code, capability authorization, dependencies, account actions, release actions, or external references were changed.
