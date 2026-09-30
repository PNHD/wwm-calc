# Attunement audit — 2026-09-30

Technical verdict: PASS WITH CONDITIONS for catalog/OCR/effect correction. Complete current Global pool and calibration of other Paths remain UNKNOWN; no release acceptance claimed.

## Sources

- [Official April 30 patch](https://www.wherewindsmeetgame.com/news/official/430update.html): offensive Attuning Pen, Formless Pen replacement, Art of Fan/Umbrella Boost replacements. Minimum Attribute ATK removal concerns Retuning, not existing gear.
- [Publisher August 20 notes](https://steamcommunity.com/app/3564740/allnews/?l=english): current T96 Vernal Frequent Projectile combines Charged/Special coverage; Light/Heavy Attack & Varied Combo is separate. Supersedes temporary July wording; accepted Jade families retained.
- [Community catalog at immutable 3f68a49](https://github.com/greydust/where-builds-meet/blob/3f68a49d5f5daab033a7e1a4a4cbe8287a594b9d/data/attunement.json), [author audit](https://github.com/greydust/where-builds-meet/blob/3f68a49d5f5daab033a7e1a4a4cbe8287a594b9d/doc/attunement-audit.md): corroborates Bleeding; lists Charged, Special, Shield, Healing, Rodent and Draught variants. Candidate evidence, not confirmation of all current rolls/caps.
- Observed T96 Everspring/Unfettered fixtures and legacy CN rotations retain their existing acceptance boundaries.

## Correction

55 selectable identities: 8 official/observed Normal entries, 1 reported Bleed entry corroborated by the community catalog, 46 explicitly labeled community/historical candidates. Unsupported synthesized generic names are not confirmed Normal choices. Saved legacy identities remain editable. Mo/Heng Blade families and Rodent wording corrected; no roll caps or coefficients invented.

Matcher/OCR preserves exact identity, wrapped value and Attunement role. Weapon names alone cannot convert ordinary Critical to Attunement. Generic Special/Charged wording cannot identify another weapon as Vernal. Pen/Resistance need Attunement context to avoid ordinary-row misclassification. Explicit ordinary Martial rolls remain ordinary/selectable; Retuned stays separate.

Shared gear contribution routes Physical/Formless Pen to Pen buckets and Art-of boosts to weapon buckets. Bleed uses only the existing Umbra Bleed/Bloodburst mask, never Dust. Unknown identities, unsupported Shield/Healing/Draught effects and mismatched Paths are stored without universal DPS bonuses; editor discloses model coverage. All panel/Compare/Best Build callers pass the active Path. Removing final damage Attunement clears a stale scalar. Identity-less legacy scalar compatibility remains without current-client provenance.

Build migrations accept new signatures/imports and preserve changes on repetition. No formulas, tier constants, dependencies or non-WWM code changed.

## Verification

Raw local evidence: `.local-evidence/backlog-20260930/` (ignored).

- `attunement-build.log`, `attunement-lint.log`: full migrations/validators, Vite and TypeScript PASS; existing chunk advisory remains.
- `attunement-effects.log`: 45 Bleed/Bloodburst reference events increase, 67 other events unchanged; Healing cannot inflate DPS.
- `attunement-regression.log`: 25/25 existing browser checks PASS, including observed T96 panel, all Path selections, Compare, storage, workspaces and responsive surfaces.
- `attunement-runtime.log`: 2/2 focused browser checks PASS: save/reload Bleed identity/role; Pen/Shield/Healing/Draught catalog/reference labels.
- `attunement-idempotency.json`: normalized App/parser/catalog hashes unchanged by another full migration/build.
- `attunement-responsive.json`, `attunement-1440.png`, `attunement-390.png`: editor desktop/mobile; no document overflow.
- Runnable checks: `node scripts/validate-attunement-effects.mjs`, `npm run validate:ocr-runtime`, `npx playwright test scripts/runtime-attunement-acceptance.spec.mjs` (optional WWM_TEST_ORIGIN environment variable).

## Remaining gates

Complete current pool, slot availability and native maxima need verified Global client evidence. Shield/Healing and many secondary skill families lack a matching product evaluator and are explicitly disclosed. Umbra checks validate reference event eligibility, not Global numerical calibration.

Task-branch push follows the existing owner instruction for this continuing backlog repair. Independent/PO acceptance, main merge and deployment remain separate. Airtable AI Ops Hub / WWM-BUILD holds operational navigation; Git/raw evidence are authoritative.
