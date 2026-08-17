# Bamboocut Damage-Zone + Soulbreak Settlement Cross-Audit

Date: 2026-08-17  
Scope: Global T96, Bamboocut-Dust, exact 1106 vs 1129 observed-panel fixture  
Status: bounded mechanics audit; community sources are corroboration only

## Evidence categories

This audit uses these categories exactly:

- `CONFIRMED_CLIENT` — current Global client tooltip/panel evidence already captured by this repository.
- `CONFIRMED_OFFICIAL` — current official Global patch/balance notes.
- `COMMUNITY_CORROBORATED` — more than one community mechanics/formula source agrees, but the claim is not official.
- `COMMUNITY_ONLY` — present only in community material or an old/reference calculator.
- `MODELED` — deterministic calculator interpretation or bounded sensitivity hypothesis.
- `UNKNOWN` — current evidence is insufficient to select a production rule.

M1zuke/community calculator material is never treated as official or as current Global build data.

## Source handling

The supplied M1zuke GitHub wiki could not be fetched directly through the available GitHub API during this audit. Its user-supplied mechanics claims were therefore treated as hypotheses, then cross-checked against:

1. current Global client evidence already captured in `GLOBAL_T96_MODEL.md`;
2. current official Global Version 1.7 balance notes;
3. this repository's workbook/formula provenance in `SOURCE-CROSSCHECK.md`;
4. public community damage-formula and Bamboocut calculator material;
5. a public community knowledge-base archive with a source masterlist and formula notes.

No Lv100/CN target constants, old build identity, old weapon recommendations, old Inner Ways, graduation targets, translation mappings, or fixed community rotation were imported into Global T96.

## Audit A — Everspring Attunement / Tuning zone

### Current production rule

For an eligible Martial Art event, production computes ordinary damage first and then applies:

`damage *= (1 + attunementPct / 100)`

The controlled fixture is deliberately evaluated with a pre-existing +50% additive damage zone:

- Attunement 0%: 150.0 damage
- Attunement +5%, independent zone: 157.5 damage
- ratio: exactly `1.05`
- Attunement +5%, ineligible event: unchanged at 150.0
- competing additive-zone interpretation would be 155 / 150 = `1.033333...`, and is rejected by the production-source fixture.

### Evidence conclusion

| Claim | Evidence | Conclusion |
|---|---|---|
| Resonance is treated as Scarlet Spin Martial Art Skill damage and can receive Everspring Umbrella Martial Art Skill DMG Boost | `CONFIRMED_OFFICIAL` | confirmed eligibility |
| 1106 Attunement 20.0 and 1129 Attunement 20.2 are distinct from the 5.8 menu Martial row | `CONFIRMED_CLIENT` | preserve PR #21 semantics |
| Tuning/Attunement is numerically an independent multiplicative damage zone | `COMMUNITY_CORROBORATED` + `MODELED` | preserve current rule; not promoted to official truth |
| Attunement should be merged into the ordinary additive skill-damage bucket | not supported by current Global evidence | rejected for production |

**Production change:** none. The existing independent multiplier is retained.

## Audit B — Physical / attribute penetration vs resistance

### Current production branch

The current scorer uses residual `penetration - resistance` and the legacy Global-T91-calibrated branch:

- residual < 0: `residual / 100`
- residual = 0: `0`
- residual > 0: `residual / 200`

Boundary fixture with target resistance 20:

| Pen | Residual | Current zone delta |
|---:|---:|---:|
| 10 | -10 | -0.10 |
| 20 | 0 | 0.00 |
| 30 | +10 | +0.05 |

### Evidence conclusion

The repository source itself labels this as **Global T91 calibration**, not current Global T96 truth. Community formula material agrees that penetration/resistance has special residual behavior but is internally inconsistent or does not independently establish which denominator belongs on which side of zero.

| Claim | Evidence | Conclusion |
|---|---|---|
| current code has an asymmetric residual branch | `MODELED` | deterministic current behavior |
| exact `/100` vs `/200` side assignment is independently verified for current Global T96 | `UNKNOWN` | not established |
| community formula alone is sufficient to flip the production branch | `COMMUNITY_ONLY` / conflicting | rejected |

**Production change:** none. Boundary tests lock the current branch so future changes must be deliberate, while documentation keeps exact T96 denominator behavior `UNKNOWN`.

## Audit C — Soulbreak settlement

### What is established

- Current client evidence: Soulbreak/Soul Return duration, T6 10% settlement multiplier, and Burn and Bury refresh/recalculation behavior are captured in the existing T96 model. `CONFIRMED_CLIENT`.
- Official Version 1.7 notes explicitly refer to Soulbreak's **extra settled DMG** and state that non-innate skills acquired within game modes are no longer included. `CONFIRMED_OFFICIAL`.
- Official notes also confirm the current Burn and Bury / Soulbreak lifecycle interaction and the Towline balance changes. `CONFIRMED_OFFICIAL`.
- Public community calculators represent `Settlement` as a separate timeline damage event and show multiple settlement events during a Bamboocut rotation. `COMMUNITY_CORROBORATED` as event representation only.

Together, these support **accumulated qualifying damage → later settlement** as a plausible mechanics model. They do **not** establish the complete qualifying-source set or a second Crit/Affinity/Precision roll.

### Still unknown

The audit found no current official/client evidence sufficient to decide all of the following:

- whether settlement itself can independently Critical/Affinity/graze;
- whether Precision gates settlement as a new hit;
- whether Direct Critical is re-read at settlement time;
- whether Boss DMG, Physical DMG, Physical Pen, All Martial Arts, Everspring, or Towline-specific modifiers are re-resolved on the settlement event versus already inherited through accumulated damage-as-dealt;
- the complete inclusion/exclusion set beyond the official non-innate-mode-skill exclusion;
- whether all buffs snapshot on application, accumulate actual dealt damage continuously, or are re-evaluated at settlement;
- whether every Burn and Bury refresh should create a distinct settlement window in the model.

These remain `UNKNOWN`. Production therefore continues to mark Soulbreak as `special-resolution` and does not force it through the ordinary outcome roll.

## Event-tag architecture

`src/utils/bamboocutMechanicsAudit.mjs` centralizes explicit eligibility tags for auditable Bamboocut event classes. Current tags include:

- `bamboocut`
- `martial-art`
- `everspring-eligible`
- `boss-bonus-eligible`
- `standard-outcome`
- `guaranteed-crit`
- `special-resolution`
- `settlement`
- `divinecraft`

Soulbreak intentionally has `settlement` + `special-resolution` and **does not** receive `standard-outcome`. This avoids introducing skill-name conditionals into damage-zone code while evidence is unresolved.

## 1106 / 1129 settlement sensitivity

Runtime-derived per-source pools come from the exact PR #21 60-second 1106/1129 fixture. No observed parse result is used as a calibration target.

The following are bounded sensitivity hypotheses, not production selections:

| Hypothesis | 1106 DPS | 1129 DPS | 1106 lead | Winner | Evidence |
|---|---:|---:|---:|---|---|
| CURRENT — settlement unresolved / no added settlement event | 61,266.44 | 60,673.88 | +0.977% | 1106 | `MODELED` + `UNKNOWN` |
| 10% of broad modeled final-damage pool, no second outcome roll | 67,393.09 | 66,741.26 | +0.977% | 1106 | `CONFIRMED_CLIENT` + `CONFIRMED_OFFICIAL` + `COMMUNITY_CORROBORATED` + `MODELED` |
| 10% of Martial/weapon + Resonance final-damage pool | 66,324.04 | 65,682.60 | +0.977% | 1106 | `CONFIRMED_CLIENT` + `COMMUNITY_CORROBORATED` + `MODELED` |
| 10% of Rope Dart-only applier final-damage pool | 61,764.40 | 61,166.57 | +0.977% | 1106 | `COMMUNITY_ONLY` + `MODELED` |

### Ranking conclusion

None of the evidence-bounded source-scope hypotheses changes the winner. Settlement scope changes absolute modeled DPS materially, but for this chest swap it behaves almost entirely as a common-mode multiplier because the source mix is extremely similar.

Therefore the one-run observed 1129 advantage is **not explained by settlement source scope alone**. The recommendation remains `CLOSE CALL`; no hypothesis is selected because it makes the parse fit better.

A hypothetical **second independent outcome roll** for settlement remains `UNKNOWN` and is not assigned a false precise DPS value: current evidence does not identify the pre-outcome settlement base needed to distinguish a true second roll from inherited damage-as-dealt. This is intentionally left unresolved rather than reverse-engineered to the observed parse.

## Production decision

- Attunement: preserve current independent multiplicative placement.
- Penetration: preserve current residual branch; do not promote its T91-calibrated denominators to confirmed T96 mechanics.
- Soulbreak: preserve `special-resolution`; add sensitivity diagnostics and explicit tags only.
- 1106 vs 1129: preserve current modeled ordering and `CLOSE CALL` confidence; do not force 1129 to win.

## References used for mechanics cross-check

- Official Global Version 1.7 Path Balance Adjustment Announcement, May 28, 2026.
- Repository `docs/GLOBAL_T96_MODEL.md` and `docs/SOURCE-CROSSCHECK.md`.
- Supplied M1zuke/where-winds-meet-dps wiki claims, treated as community hypotheses because direct wiki retrieval was unavailable during this audit.
- Public Where Winds Meet community damage-formula / Bamboocut calculator pages, used only for corroboration.
- `CodeOfVirtue/where_winds_meet-knowledge-base`, especially its source masterlist and formula/penetration notes, used only for provenance and community corroboration.
