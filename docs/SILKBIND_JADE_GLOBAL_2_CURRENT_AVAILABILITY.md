# Silkbind-Jade Global 2.0 — current availability addendum

Evidence cutoff: 2026-08-10.

The July 23 Global 2.0 balance notes describe the intended T96 Vernal Umbrella redesign: legacy Special/Charged coverage was intended to merge into a Frequent Ballistic family and a Light/Heavy + derived family was intended to be added.

The July 24 official fix then states that the actual effect/display/pool state did not match that intended design. The incorrectly displayed Frequent Ballistic and Light/Heavy + derived rows were corrected to Charged and Special, while Frequent Ballistic and Light/Heavy + derived were explicitly reported as not yet included in the Attunement pool and under urgent repair.

No later official Global note found during this task confirms that those two missing families have since become obtainable. Therefore the runtime model now treats:

- `vernal-special`: current/obtainable T96 evidence = YES
- `vernal-charged`: current/obtainable T96 evidence = YES
- `vernal-high-frequency-ballistic`: semantic/intended family retained, current pool = NOT CONFIRMED (`OFFICIAL_POOL_FIX_PENDING`)
- `vernal-light-heavy-derived`: semantic/intended family retained, current pool = NOT CONFIRMED (`OFFICIAL_POOL_FIX_PENDING`)

The two pending families remain resolvable for non-destructive saved-data/legacy/intended-design compatibility, but are removed from the current manual T96 Attunement selector until positive evidence exists.

## Forsaken Fame

Official 1.7 gives Inkwell Fan Light Attack Charged Skill **Forsaken Fame** an extra **45% PvE damage** and Endurance recovery against non-player enemies. The Jade event contract now records both effects. No trustworthy current base coefficient/app-skill mapping exists in the repository, so the event remains `priced:false`: the optimizer does not invent a base damage number merely to force it into DPS.
