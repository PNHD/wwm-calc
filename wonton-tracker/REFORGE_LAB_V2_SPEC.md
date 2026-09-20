# Wonton Reforge Lab v2 — Audit, Product Boundary, and Implementation Spec

Status: implementation-ready
Base branch: `feature/wonton-tracker`
Base SHA: `716a2c9c1d45638b3ab473152c3a1e1ff5c9b1ef`
Implementation branch: `refactor/wonton-unified-reforge-lab`

## 1. Why this refactor exists

The current product has two separate surfaces:

- `/wonton-tracker/` — called a tracker, but its Reforge button generates random qualities/attributes.
- `/wonton-tracker/simulator/` — a second random reforge engine with seed, batch simulation, goals, and saved plans.

These are not cleanly separated products. They duplicate slot rendering, reforge rules, plans, pricing, persistence, history, setup, and cost calculations. This duplication has already caused drift: unlock behavior, pricing display, and saved-plan behavior needed separate fixes.

The v2 goal is to remove the conceptual duplication without losing any useful capability.

## 2. Product decision

Create one product:

# Wonton Reforge Lab

with two explicit modes inside the same application shell:

### Live Tracker

Purpose: accompany a real in-game reforge session.

Rules:

- MUST NOT generate random qualities, attributes, Gold hits, or unlocks.
- Reforge recording increments only deterministic counters/costs.
- User records what actually happened in game.
- Live pity/progress is authoritative user-entered/recorded data.
- Saved plans are appearance snapshots; applying one must not invent a pity reset/carry rule.
- Live state is stored separately from Practice state.

### Practice Simulator

Purpose: practice strategy and model possible outcomes.

Rules:

- Uses seeded RNG.
- Supports Official and Community model labels.
- Sequential unlock simulation.
- Batch simulation and goals.
- Clearly marked as simulation, not server RNG prediction.

The two modes SHOULD share visual components and pure utility/core functions where behavior is genuinely common.

## 3. URL compatibility

Preferred canonical URL:

- `/wonton-tracker/` → unified app, default mode = Live Tracker.
- Query or local UI mode switch → Practice.
- Existing `/wonton-tracker/simulator/` MUST remain functional, but may become a lightweight compatibility redirect to `../?mode=practice`.

Do not break existing bookmarks unnecessarily.

## 4. Sources reviewed

### Original WWMReforge 1.3

Live:
https://chowiemon.github.io/WWMReforge/Temple/reforge.html

Repository:
https://github.com/chowiemon/WWMReforge

Observed behavior/features:

- five slots
- Slot 1 starts active
- Slots 2 → 3 → 4 → 5 activate sequentially
- active unlocked slots reroll together
- activation meter + community early-activation model
- Gold pity display up to 90
- locks
- custom settings
- attribute guide
- reset
- total reforge cost
- saved schemes, max 5
- temporary save and Gold-triggered save
- Gold result confirmation dialog
- localStorage persistence
- activity history
- TXT export

Do not copy source expression verbatim. The upstream repository does not expose a license in the inspected root.

### Official probability disclosure

https://www.yysls.cn/news/update/20250106/40412_1204508.html

Officially supported:

- 5 reforge nodes
- Blue 82%
- Purple 15%
- Gold 3%
- Gold hard pity 90

Officially NOT supported by that disclosure:

- 3% → 4% → 5% soft-rate tiers
- 2% → 3.5% → 5% early unlock rates
- saved-plan pity carry/reset semantics

Those must stay labeled community/unverified.

### Shadovex Reforge Tracker

User-provided/public sheet:
https://docs.google.com/spreadsheets/d/18ridWD3WfpJdw95_EgwCQJPZExJfOvY-N25YClTsedM/edit

Useful features not present in the original calculator:

- region-based Echo Bead package pricing
- weapon selector
- desired appearance targets
- starting Echo Beads
- starting Taiyi Stones
- full spend tracking
- pull/base-weapon acquisition tracking
- hard-pity percentage
- observed legendary roll counts
- observed average soft-pity line
- lock-aware pity counters
- maintained weapon/color library

Important sheet update:
- 2026-08-02: pity counters adjusted so locked parts do not increase.

## 5. Audit findings

### A. Tracker vs Simulator duplication

Current code sizes are similar and share equivalent concepts:

- Tracker: slot cards, pity, sequential activation, locks, random reforge, saved plans, history, pricing, setup.
- Simulator: slot cards, pity, sequential activation, locks, random reforge, saved plans, history, pricing, setup, plus seed/batch/goals.

Conclusion: separate full implementations are unnecessary.

### B. Current Tracker has the wrong semantic boundary

A real tracker should not fabricate an outcome.

Current Tracker `reforge()` chooses random qualities/attributes. Therefore a user trying to track a real game session can immediately diverge from the real weapon.

Required change: Live mode records counters and user-observed events only.

### C. Original WWMReforge contains behavior worth keeping

Keep/recreate:

- Gold-result prompt with quick Save Plan action
- rich attribute guide
- custom/manual state editing
- TXT/history export
- plans max 5
- local persistence
- sequential unlock visualization

### D. Original WWMReforge also contains code/UI we should NOT reproduce

1. Value / Profit panel is not trustworthy.

The inspected v1.3 source defines a detailed `calculateWeaponValue()`, but `updateValueAndProfit()` currently contains effectively broken placeholder logic:

- `const value = 0();`
- `const profit = 0;`

Do not recreate this as a meaningful financial/value model.

2. Cost code is internally inconsistent.

Rendered instructions show approximately:

- 0 locks: $2.78
- 1 lock: $5.56
- 2 locks: $13.89
- 3 locks: $27.78

But inspected `reforgeAction()` uses stale values for some lock counts.

Our canonical resource rule remains:

- 0 / 1 / 2 / 3 locked slots = 1 / 2 / 5 / 10 Taiyi Stones.

Price assumption currently approved by Product Owner:

- 1 Taiyi Stone = 200 Echo Beads
- best-value reference ≈ $100 = 7,200 Echo Beads
- therefore 1 Stone ≈ $2.78

Resource counts are primary; USD is a secondary estimate.

### E. Saved-plan pity behavior is currently contested

Community reports in 2026 conflict about whether applying/restoring plans affects hidden/soft pity after later game patches.

Therefore:

- Live Tracker MUST never silently reset or preserve a hidden server state as a factual game mechanic.
- Its visible counters are a user-maintained ledger.
- Applying an appearance plan should leave counters unchanged unless the user explicitly edits/resets them.
- Practice mode can model appearance restoration separately from pity, but must label the assumption.

## 6. Unified data model

Avoid one giant mutable object with mode-specific conditionals everywhere.

Recommended conceptual split:

### Shared appearance snapshot

- slot id
- active
- quality
- attribute

### Live tracker state

- slots
- pity count per Slot 1–4
- activation progress / attempts
- locks
- total Taiyi Stones
- total Echo Beads
- approximate money
- actual reforge count
- actual observed Gold interval history
- saved appearance plans
- selected weapon / desired target
- budget settings
- activity log

No RNG state.

### Practice state

- slots
- pity
- activation progress / attempts
- locks
- cost
- RNG seed/state
- selected rate model
- goals
- saved plans
- batch settings/history
- activity log

### Pricing/preferences

May be shared user preference:

- region
- package table selection
- display currency
- custom exchange override if desired

## 7. Live Tracker interaction design

Primary action should be:

# Record actual reforge

When clicked:

1. Calculate Taiyi cost from current locks.
2. Increment total stone/bead spend.
3. Increment pity ONLY for active + unlocked Slot 1–4.
4. Increment next inactive slot activation attempt/progress deterministically.
5. Open a lightweight “What happened in game?” sheet.

The result sheet should allow:

- no special event
- mark one or more active slots as Gold → reset that slot visible pity to 0
- set observed quality/attribute for any changed slot
- mark next slot as unlocked early
- if progress reaches 30 attempts / 100%, auto-activate it
- when Slot 2–4 unlocks, its visible pity starts at 0
- Slot 5 unlocks as fixed Gold / Sunlight
- Undo last recorded reforge

Do not generate random qualities in Live mode.

Also support direct per-slot correction through Edit State.

## 8. Practice mode

Preserve existing useful features:

- seeded RNG
- Official quality mode
- Community quality mode
- sequential unlock
- lock cost
- goals
- 100 / 1,000 / 10,000 batch runs
- saved plans
- Undo
- Restart
- separate localStorage

Enhance:

- when new Gold occurs, show a non-blocking result prompt:
  - Continue
  - Save current plan
- expose attribute guide from the shared shell
- allow TXT/JSON export
- show target match score if a target is selected

## 9. Saved Plans

Use one shared plan component, separate plan collections per mode.

Rules:

- max 5 saved plans per mode
- rename plan
- apply
- delete
- show 5-slot mini preview
- show target-match summary
- allow Save Current at any time
- Practice: offer Save when Gold appears
- Live: user may save a real in-game appearance at any time

Apply semantics:

- appearance only
- do NOT mutate current pity
- do NOT mutate activation progress
- do NOT mutate locks
- do NOT mutate spend
- do NOT activate currently inactive slots
- Slot 5 remains fixed when active

## 10. High-value additions from Shadovex

### 10.1 Budget & pricing panel

Keep collapsed by default to avoid clutter.

Inputs:

- Region
- Starting Echo Beads
- Starting Taiyi Stones
- optional starting pull/base-weapon spend

Show:

- Taiyi Stones used
- Echo Beads equivalent
- approximate monetary spend
- remaining stones/beads
- current roll cost
- package reference table

Initial supported regions from the user-provided Shadovex sheet:

- Brazil
- Japan
- Malaysia
- Mexico
- Philippines
- South Korea
- Thailand
- United Kingdom
- United States
- Other / custom

US package reference currently includes 7,200 Echo Beads = $99.99.

Resource arithmetic must be primary. Currency conversion must be clearly labeled estimate/reference.

### 10.2 Desired appearance target

Add optional target setup:

- Weapon
- Color target
- Part 1 target
- Part 2 target
- Part 3 target

Use this to evaluate Saved Plans and current state.

Do not invent missing weapon/color data. Source initial library from the Shadovex sheet or other verified game data and mark dataset version/date.

### 10.3 Observed pity analytics

Live Tracker only.

Record every observed Gold interval per slot.

Show:

- current pity / 90
- % to hard pity
- user-observed average Gold interval
- median if enough observations
- sample count

Do NOT label the observed average as an official soft pity.

If showing community “35–40” context, label it as community observation and never as a guarantee.

### 10.4 Worst-case spend helper

For each active unlocked slot:

- remaining rolls to hard pity = 90 - visible pity

Show the deterministic cost of one future roll under current locks.

A multi-slot “worst-case to desired outcome” must not pretend to know which Gold attribute will appear. Keep it as a resource upper-bound for reaching the next guaranteed Gold trigger, not a guarantee of the desired set/color.

### 10.5 Backup / restore

Add:

- Export JSON backup
- Import JSON backup
- human-readable TXT export

Import must validate schema/version and never execute imported HTML/script.

## 11. Weapon library

Do not hard-code a single generic Set 1 / Set 2 forever.

The Shadovex file tracks multiple Silent Voice weapons and their named set/color options, including entries for:

- Cloudsplitter
- Phoenix Cry
- Kun Umbra
- Cosmos Sweep
- Dawnriven
- Beyond All Forms
- Aeon's Dirge
- Sunstriking
- Phoenix Ascent
- Dragon's Vault
- Crest Aria

The library is known to evolve.

Implementation should isolate weapon/color data into a versioned JSON module rather than mixing it into UI logic.

Do not block v2 completion on perfectly complete custom-color data.

## 12. Features intentionally NOT added

### Fake resale/value/profit estimator

Rejected because upstream value/profit code is not operational/reliable and no authoritative valuation source exists.

### Exact in-game “Top 5 Optimal” scoring clone

Community sources state the game auto-saves top-rated plans, but the exact score formula is not verified.

We may rank plans against the USER'S selected target, but must not claim to reproduce the game's proprietary optimal-plan score.

### Automatic server pity inference

No server/API access is available. Live mode is a ledger.

## 13. UI organization

Avoid two nearly identical pages.

Recommended shell:

Header:
- Live Tracker | Practice
- weapon/target summary
- assumptions/source button

Main:
1. five slot cards
2. primary action area
3. cost/budget metrics
4. Saved Plans
5. Live analytics OR Practice batch/goal tools
6. history
7. collapsible reference panels:
   - Attribute Guide
   - Budget & Pricing
   - Assumptions / Sources
   - Backup / Restore

Mobile:
- one-column slot cards
- sticky primary action allowed if it does not obscure content
- no horizontal overflow
- Saved Plans mini slots may horizontally scroll inside the card if needed

## 14. Existing state migration

Preserve user data.

Known current keys:

- Tracker: `wonton-tracker-state-v1`
- Practice: `wontonSimulatorState.v2`
- Practice baseline: `wontonSimulatorBaseline.v2`

Migration requirements:

- first v2 load imports existing state into the correct mode
- migration is idempotent
- old keys are not deleted until successful migration is confirmed
- corrupted state falls back safely
- do not mix Live and Practice states

## 15. Test requirements

Create deterministic tests for at least:

### Shared

- cost 1 / 2 / 5 / 10
- 200 Echo Beads / Stone conversion
- plans max 5
- plan apply preserves pity/progress/locks/spend
- plan cannot activate a locked/unopened slot
- storage migration

### Live

- Record actual reforge never calls RNG
- active unlocked pity increments
- locked pity does not increment
- inactive pity does not increment
- Gold event resets only selected slot
- unlock event starts new slot at pity 0
- Slot 5 fixed Gold
- undo restores prior actual ledger state
- observed Gold intervals calculated correctly

### Practice

- seeded determinism
- hard pity 90
- sequential unlock
- inactive slot not rerolled
- lock cost
- batch determinism
- Official vs Community labels/models
- saved plans

### Import

- invalid JSON rejected
- unsupported version rejected or migrated explicitly
- strings rendered escaped, no HTML execution

## 16. CI requirements

The existing GitHub Action must continue to run on:

- PRs targeting `feature/wonton-tracker`
- pushes to `feature/wonton-tracker`

It must run:

- JS syntax validation
- Live core tests
- Practice core tests
- migration tests
- pricing/plan tests

Cloudflare deploy remains conditional on configured credentials.

## 17. Runtime QA requirements

Before acceptance, Codex should verify in a real browser:

### Live Tracker

- starts with Slot 1 active only
- Record actual reforge changes counters/cost but not appearance randomly
- mark Gold resets correct pity
- mark unlock activates only next sequential slot
- locks stop pity increment
- plan save/apply/delete
- target selector
- budget calculations
- refresh persistence
- migration from current tracker key

### Practice

- same slot shell
- random outcomes work
- seed replay works
- batch works
- Gold save prompt works
- refresh persistence
- migration from current simulator key

### Compatibility

- `/wonton-tracker/`
- `/wonton-tracker/simulator/`

both remain usable.

Check desktop and 390px mobile.

## 18. Git / rollout strategy

Do not edit production branch directly.

Recommended implementation sequence inside `refactor/wonton-unified-reforge-lab`:

1. Shared data/core + migration tests.
2. Unified shell + Live Tracker behavior.
3. Move Practice mode onto shared shell.
4. Saved plans / history / export consolidation.
5. Budget/target/analytics additions.
6. Compatibility redirect.
7. Browser QA.
8. Fresh-context review.
9. PR to `feature/wonton-tracker`.

Keep commits coherent and reviewable.

Do not deploy until the PR is reviewed/merged and Product Owner authorizes the deployment step.

## 19. Acceptance criteria

This milestone is acceptance-ready only when all are true:

1. Tracker and Simulator are no longer two independent reforge implementations.
2. Live Tracker does not fabricate RNG results.
3. Practice retains seeded simulation and batch features.
4. Shared Saved Plans work in both modes with separate data.
5. Existing user state migrates.
6. Pricing is resource-first and uses approved 200 beads/Stone basis.
7. Weapon/target and budget panels are functional or explicitly deferred with a documented reason.
8. User-observed pity analytics are clearly distinguished from official/community models.
9. Original useful features remain: custom edit, attribute guide, plans, history/export, reset/persistence.
10. Upstream broken Value/Profit logic is not reproduced.
11. All automated tests pass.
12. Browser QA passes for both modes and mobile.
13. `/simulator/` remains compatible.
14. No secrets or external dependencies are introduced unnecessarily.
