# WWM Calc V1 Release Readiness

Product version: **1.0.0**  
Game context: **Global 2.0**  
Release-hardening review date: **2026-08-18**

## Supported first-class workspaces

### PvE

Purpose: build, gear, compare and simulate modeled boss/combat performance.

Primary surfaces: Overview, Build, Gear, Compare, Best Build, Combat, Simulation. Advanced surfaces retain Rotations, Skill Editor, Team and Import/Export.

### Arena

Purpose: optimize player-vs-player matchup tools and profile choices without ranking by PvE DPS.

Primary surfaces: Overview, Build, Matchups, Compare, Simulation, History. Arena Attunement, mechanic evidence, reference builds and Import/Export remain available as secondary surfaces. Arena Best Build is an explicit run inside the Arena Build surface and ranks bounded Arena dimensions/objectives, not PvE DPS.

### Guild War

Purpose: plan roster roles, builds, strategy, objective timelines, commander resources, duelists/healers and structured match observations for 30-player operations.

Primary surfaces: Overview, Roster, Builds, Strategy, Timeline, Objectives and Match Log. Commander/Fun Coin, Duelist/Healer and Share Plan remain secondary planning surfaces.

### Community Library

Purpose: discover curated reference/community builds and Guild War templates, inspect source/freshness/maturity, compare, clone a separate local copy and open read-only shared payloads.

Community references are inputs to a decision, not authoritative rankings.

### Training Terrace

Purpose: record current-client controlled calibration observations with explicit target/context, categorical Attunement state, before/after values, notes, and provenance snapshots. It is observational only: it does not fabricate normalization coefficients and it is not ranked Arena truth by default. One-mode measurements do not establish another mode; current-client provenance remains required.

Training Terrace persists independently in `wwm_training_terrace_state_v1`. A corrupt or future primary payload is preserved in a bounded backup and held until the user either recovers a valid backup or explicitly replaces it with a blank calibration. Authoritative acceptance is the dedicated Training Terrace Chromium contract plus its exact-SHA production smoke extension; neither is marked passed until CI evidence exists.

## Patch, tier and evidence assumptions

- Global product context is **2.0**.
- Arena evidence is pinned to the existing `2.0 / 2026-08-07` evidence catalog where that catalog is the source of a mechanic.
- PvE tier/scenario remains explicit in the active build context; calibrated T96 fixtures do not silently become another tier.
- Library entries retain their own patch, tier, last-reviewed date, source and maturity. `OUTDATED REFERENCE` is shown when an entry is not current for the active Library patch.
- Guild War unknown/configurable timings remain configurable rather than promoted to official facts.

## Calibrated versus reference/model-only coverage

### Calibrated / client-verified acceptance

- **Bamboocut-Dust PvE T96** — current 1106/1129 regression family, Menu Panel contract and deterministic Chromium acceptance fixtures.
- Existing client-verified constants/fixtures remain governed by their dedicated validators.

### Modeled / reference-only

- **Silkbind-Jade** — modeled path with explicit evidence/availability handling; not promoted to the Bamboocut calibration class.
- Other PvE Paths not covered by a calibrated acceptance fixture remain model/evidence scoped.
- **Arena** matchup dimensions, Best Build scores and simulations are modeled decision support, with official/client/community facts labeled separately.
- **Guild War** role suitability, objective scenarios and strategy guidance are modeled/contextual decision support.
- **Community Library** items retain `CALIBRATED`, `CLIENT_VERIFIED`, `OFFICIAL_REFERENCE`, `COMMUNITY_REFERENCE`, `MODELED`, `EXPERIMENTAL` and `OUTDATED` maturity independently.

No formula was changed by V1 hardening merely to make implementations look simpler.

## Known UNKNOWN mechanics and limitations

- Unknown or league-dependent Guild War timings/DR values stay manual or unknown until evidence supports a stronger claim.
- Arena matchup output is not calibrated from a sufficiently controlled empirical match dataset to claim win probability.
- Community reference gear/build recommendations may become stale before the calculator model itself becomes stale; patch and review metadata must be checked separately.
- Local browser storage remains device/browser scoped; V1 does not provide account/cloud sync.
- Browser storage quotas are finite. Recovery backups are bounded and cannot guarantee preservation of arbitrarily oversized/corrupt values.
- Performance measurements are release regression evidence from representative Chromium runs, not a universal hardware benchmark.

## Storage and migration policy

Canonical registry: `src/product/storage-registry.js`.

Policy:

1. each persistent key has one owner domain;
2. corruption is recovered per key/domain rather than by clearing all application data;
3. Arena and Guild War untrusted stored object graphs receive depth/array/object/string/number bounds;
4. future unsupported Arena/Guild War schemas fail closed instead of being silently interpreted as current;
5. recoverable legacy forms use deterministic migration paths;
6. bounded local recovery backups use `<key>__recovery_backup_v1`;
7. a recovered Guild War fallback is not immediately written over the original corrupt/future value on first mount;
8. duplicate live IDs and orphan live references are repaired or rejected deterministically;
9. historical match snapshots remain historical and are not rewritten merely because a live roster member is deleted.

CI scans literal app-owned storage keys in `src/` and fails if a key is not represented in the registry.

## Share, import and privacy model

### PvE / Library share

- versioned Library/public envelopes;
- bounded encoded payload size;
- plain-object and forbidden prototype-key checks;
- finite/bounded numeric validation;
- safe HTTPS source URL validation;
- read-only landing before clone;
- React text rendering prevents supplied strings from becoming arbitrary HTML.

### Arena share

- Arena schema/version/type/Path/mode/Attunement allowlists;
- encoded-size bounds;
- prototype-key rejection;
- local Match History is excluded from the share payload;
- shared builds are read-only until clone;
- clone creates a new profile and does not activate/replace the existing profile automatically.

### Guild War share

- schema/version/kind plus deep bounded object inspection;
- forbidden prototype-key, size/depth/array/object/string/number checks;
- roster maximum and duplicate/missing roster-ID rejection;
- all editable JSON clone paths are passed through bounded workspace migration/sanitization;
- optional deterministic player-name redaction before serialization;
- read-only landing does not mutate the live plan;
- Library/shared clones remain separate from the active plan until a deliberate import/apply action.

Report-issue context includes app version, patch, workspace, page and non-private Path/tier context only. It does **not** automatically attach player names, private notes, local match history, full gear inventory or local identifiers.

## Stale computation / cache policy

Release acceptance preserves existing dedicated cache-key/model validators and adds cross-workspace state assertions. Relevant modeled inputs must participate in their domain's cache/model inputs; UI-only navigation state must not become a model input.

V1 hardening specifically does **not** merge optimizer domains:

- PvE Best Build remains PvE/scenario/objective driven.
- Arena Best Build remains Arena mode/my build/opponent/Arena Attunement/objective driven and never uses PvE DPS as its winner metric.
- Guild War role/objective calculations remain scenario/roster/role/build/objective/timeline scoped.

Any future cache optimization must add a regression proving that changing one relevant input invalidates/recomputes while an irrelevant UI-only change does not cause a needless expensive model run.

## Loading, empty, error and recovery states

Release acceptance requires major routes to avoid blank white screens, raw stack traces, unexplained empty tables and infinite loading. Current task-specific recovery states include:

- `Some saved Arena data could not be loaded.`
- `Some saved Guild War data could not be loaded.`
- `This shared build can no longer be loaded.`
- `This shared plan can no longer be loaded.`
- existing action-oriented PvE/Arena/Guild War/Library empty states.

Minor lists such as Saved/Recent safely fall back to an empty state when their isolated key is malformed.

## Responsive and accessibility release bar

Representative Chromium acceptance covers **390 × 844**, **1024** and **1440** layouts. V1 requires:

- no document/body horizontal overflow on audited routes;
- mobile navigation visible and usable on core PvE/Arena/Guild War routes;
- 30-member Guild War roster remains reachable on mobile/tablet;
- required visual QA screenshots are generated for PvE, Arena, Guild War and Library;
- existing keyboard/focus acceptance remains green;
- active navigation exposes current state via `aria-current` where applicable;
- Model & About uses native keyboard-focusable disclosure semantics;
- critical maturity/state information is textual and not color-only.

This is a release usability bar, not a claim of full WCAG certification.

## Performance release bar

`runtime-v1-release-acceptance.spec.mjs` records browser operation timings rather than using fragile runner-specific millisecond budgets. Representative scale includes:

- PvE stored gear sets at 50 / 100 / 250 items;
- Arena Best Build with the bounded 12-profile state limit and Top 3 output;
- Guild War 30-member roster with populated strategy, timeline and commander events;
- Library 80 validated synthetic references for filtering/render behavior.

Functional bounds, candidate counts, no-overflow, runtime-error cleanliness and completion of the interaction are hard gates. Timing values are retained as regression evidence and should be compared between releases before imposing a stable threshold.

## Dependency and production security gate

Authoritative CI runs `npm audit --omit=dev --audit-level=high`. High/critical production dependency findings are release blockers unless independently shown non-applicable and documented. Broad dependency upgrades are not part of V1 hardening.

Public share sanitization/validation is exercised by static and browser regression tests. No external analytics dependency is introduced. Existing Library analytics remains a typed in-browser custom event surface with no raw gear-stat payload.

## Production verification method

A V1 release is production-complete only when all of the following are proven from live state:

1. latest PR head SHA is known;
2. authoritative PR `Validate` is completed/success;
3. PR is merged using the expected-head guard;
4. actual merge SHA equals live `refs/heads/main`;
5. push `Validate` for that exact merge SHA completes successfully;
6. production `build-info.json` reports that exact merge SHA;
7. production Chromium smoke passes on PvE, Arena, Guild War, Library, mobile/recovery/share checks;
8. main is re-read after smoke to prove no race moved it during verification;
9. generated `V1_RELEASE_VERIFICATION.json` contains `success: true` only after all required gates above are true.

## Maintenance / update procedure

When game data or a model changes:

1. identify the owning workspace and evidence source;
2. update explicit patch/review metadata;
3. update only the affected formula/model when supported by evidence;
4. add or update a deterministic regression fixture;
5. update Library freshness/maturity rather than silently rewriting historical references;
6. update storage schema/migration only when persisted shape changes;
7. keep old safe migrations needed by existing users;
8. run all authoritative validations and V1 release acceptance;
9. merge with exact head guard;
10. verify production exact SHA again.

## WHAT V1 DOES NOT CLAIM

- Arena matchup output is **not** a calibrated win probability.
- Guild War role output is **not** a guaranteed match outcome.
- Community builds are **not** authoritative best builds.
- Modeled DPS is only as accurate as the documented mechanics, evidence, scenario and assumptions that feed it.
- A calibrated T96 fixture does **not** make every Path/tier calibrated.
- An `OFFICIAL_REFERENCE` mechanic does **not** make every composite recommendation official.
- Local Match History does **not** auto-learn or change formulas.
- V1 does **not** provide account/cloud sync, social ranking, leaderboard, marketplace backend or AI recommendation service.

## Release-candidate decision rule

V1 can be recommended publicly only when:

- no known P0/P1 remains;
- PvE, Arena and Guild War state stay isolated;
- sharing/import/export reject malformed/untrusted data without runtime failure or silent active-state overwrite;
- corrupt/old local data cannot brick the app;
- optimizer state changes do not leave known stale results;
- 390 mobile acceptance is usable on required workflows;
- representative Chromium `pageErrors` and unexpected `consoleErrors` are empty;
- all authoritative CI is green;
- Cloudflare production is tied to the exact final `main` SHA.
