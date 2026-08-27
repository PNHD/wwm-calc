# Silkbind-Jade Global 2.1 — current availability addendum

Evidence cutoff: 2026-08-22.

The July 23 Global 2.0 balance notes describe the intended T96 Vernal Umbrella redesign: legacy Special/Charged coverage was intended to merge into a Frequent Ballistic family and a Light/Heavy + derived family was intended to be added.

The July 24 official fix is retained as historical provenance for the temporary pool/display mismatch. Accepted Global 2.1 evidence supersedes that availability state: the merged Frequent Projectile family and Light/Heavy + derived family are current/obtainable at T96.

Therefore the runtime model now treats:

- `vernal-frequent-projectile`: current/obtainable T96 evidence = YES; covers Spring Away and Unfading Flower
- `vernal-light-heavy-derived`: current/obtainable T96 evidence = YES; covers the modeled umbrella Light/Heavy-derived events only
- legacy Special/Charged identities: migrated/resolved to `vernal-frequent-projectile`; not current selector rows

Older Frequent Ballistic wording remains a compatibility alias. No numeric Attunement coefficient is inferred by this availability update.

## Forsaken Fame

Official 1.7 gives Inkwell Fan Light Attack Charged Skill **Forsaken Fame** an extra **45% PvE damage** and Endurance recovery against non-player enemies. The Jade event contract now records both effects. No trustworthy current base coefficient/app-skill mapping exists in the repository, so the event remains `priced:false`: the optimizer does not invent a base damage number merely to force it into DPS.
