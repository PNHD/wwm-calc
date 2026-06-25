# DPS Compare — Engine 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only "DPS Compare" sub-tab that runs wherewindsmath community rotations through the app's *own* `calcSkill` formula and shows DPS side-by-side with the app default, for the 6 builds the bundle covers.

**Architecture:** Three data/util files + one render block. Bundle rotations (`{ability,numUse,dmgInstances}`) are translated into app `RotationItem[]` via an explicit per-build ability map, then summed with the **unchanged** `calcSkill`. The damage formula, tier constants, and existing rotations are never touched.

**Tech Stack:** React + TypeScript + Vite (existing). No new deps. No test runner (repo convention — verify via `npx tsc --noEmit` + ad-hoc `node`/`tsx` self-check + browser).

## Global Constraints

- **UI text is English** (locked #9).
- **Do NOT touch** `calc.ts` damage formula, tier constants, `getRotationForBuild`, or any data file feeding the existing calculation (locked #1, #7). Engine 2 *calls* `calcSkill` unchanged.
- **No reverse-engineered bundle formula.** Reuse app formula; only the rotation sequence comes from the bundle.
- **No fuzzy matching.** Unmapped ability → reported unmapped, contributes 0, never silently approximated.
- **Verify = `npx tsc --noEmit` clean** + browser. Do NOT add vitest/jest.
- **Deploy = commit + push `main`** (Cloudflare Pages). Worker untouched.
- Source data: `C:\Users\phamn\.openclaw-autoclaw\workspace\scratch\wwm\rotations_full.json` and `skills.json` (already crawled).
- Build→bundle path key map (verified from crawl):
  `bamboocut-dust→bamboocut_dust`, `bellstrike-umbra→bellstrike_umbra`, `bellstrike-splendor→bellstrike_splendor`, `stonesplit-might→stonesplit_might`, `silkbind-jade→silkbind_jade`, `stonesplit-pure-datang→stonesplit_strength`. (`silkbind-deluge` excluded — 1-entry placeholder.)

---

## File Structure

- `src/data/rotationsWWM.ts` — the 6 crawled rotation tables as a typed const. One responsibility: hold bundle data.
- `src/data/abilityMapWWM.ts` — explicit `bundleAbility → {appName, mechanic fields}` per build. The hand-mapping. One responsibility: translation table.
- `src/utils/engine2.ts` — pure functions: translate bundle steps → `RotationItem[]` (+ unmapped list), and compute DPS via `calcSkill`. One responsibility: the engine-2 pipeline.
- `src/App.tsx` — add a `"dps-compare"` entry to the `grad-tabs` group + a render block. Additive only.

---

### Task 1: Bundle rotation data file

**Files:**
- Create: `src/data/rotationsWWM.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `export interface WwmStep { ability: string; numUse: number; dmgInstances: number; isFightStart?: boolean; delay?: number }` and `export const ROTATIONS_WWM: Record<string /*bundlePathKey*/, Record<string /*tier*/, WwmStep[]>>`.

- [ ] **Step 1: Generate the data file from the crawl JSON**

Run this one-off node script (writes the TS file directly — do NOT hand-copy 1500 entries):

```bash
node -e '
const fs=require("fs");
const src="C:/Users/phamn/.openclaw-autoclaw/workspace/scratch/wwm/rotations_full.json";
const r=JSON.parse(fs.readFileSync(src,"utf8"));
const keep=["bamboocut_dust","bellstrike_umbra","bellstrike_splendor","stonesplit_might","silkbind_jade","stonesplit_strength"];
const out={};
for(const k of keep){ if(r[k]) out[k]=r[k]; }
const header=`// AUTO-GENERATED from wherewindsmath optimizer bundle (rotations_full.json).
// Do not hand-edit. Bundle rotations for the 6 builds the optimizer covers.
// Used ONLY by the read-only DPS Compare tab (src/utils/engine2.ts).
export interface WwmStep { ability: string; numUse: number; dmgInstances: number; isFightStart?: boolean; delay?: number }
export const ROTATIONS_WWM: Record<string, Record<string, WwmStep[]>> = `;
fs.writeFileSync("src/data/rotationsWWM.ts", header+JSON.stringify(out,null,2)+";\n");
console.log("wrote src/data/rotationsWWM.ts, builds:",Object.keys(out).join(", "));
'
```
Expected: `wrote src/data/rotationsWWM.ts, builds: bamboocut_dust, bellstrike_umbra, bellstrike_splendor, stonesplit_might, silkbind_jade, stonesplit_strength`

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean (the file is a typed const literal).

- [ ] **Step 3: Commit**

```bash
git add src/data/rotationsWWM.ts
git commit -m "feat(dps-compare): bundle rotation data for 6 builds (auto-gen)"
```

---

### Task 2: Ability mapping table (the hand work)

**Files:**
- Create: `src/data/abilityMapWWM.ts`

**Interfaces:**
- Consumes: app skill names from `SKILL_DB` / build skill data (by inspection).
- Produces: `export interface AppMapping { appName: string; isDingyin?: boolean; generalBonus?: number; yishui?: number; tiaozhan?: number }` and `export const ABILITY_MAP_WWM: Record<string /*bundlePathKey*/, Record<string /*bundleAbility*/, AppMapping>>`.

This task fills the map for **bamboocut_dust first (verifiable), then the other 5**. Mechanic field values are copied from the app's existing default rotation for the same build — never invented. An ability with no app equivalent gets NO entry (→ engine reports it unmapped).

- [ ] **Step 1: Dump the app's existing rotation for each build, to copy mechanic fields from**

Run (prints each build's app rotation: name + the 4 mechanic fields):
```bash
node -e '
const fs=require("fs");const c=fs.readFileSync("src/data/referenceData.ts","utf8");
const cn={"破竹尘":"bamboocut-dust","鸣金影":"bellstrike-umbra","鸣金虹":"bellstrike-splendor","裂石威":"stonesplit-might","牵丝玉":"silkbind-jade","裂石钧（纯唐）":"stonesplit-pure-datang"};
for(const [zh,en] of Object.entries(cn)){
  const i=c.indexOf(`"${zh}":{`); if(i<0){console.log(en,"NOT FOUND");continue;}
  const j=c.indexOf("rotation:[",i); const k=c.indexOf("]",j);
  console.log("\n=== "+en+" ("+zh+") ===");
  console.log(c.slice(j+9,k+1).replace(/\},\{/g,"},\n{"));
}
'
```
Expected: prints 6 blocks of `{name,count,isDingyin,generalBonus,yishui,tiaozhan}` rows. Keep this output open — it is the source for `appName` + mechanic fields.

- [ ] **Step 2: Dump the bundle ability names per build (the keys to map)**

```bash
node -e '
const r=require("C:/Users/phamn/.openclaw-autoclaw/workspace/scratch/wwm/rotations_full.json");
for(const k of ["bamboocut_dust","bellstrike_umbra","bellstrike_splendor","stonesplit_might","silkbind_jade","stonesplit_strength"]){
  const s=new Set(); for(const seq of Object.values(r[k])) for(const x of seq) s.add(x.ability);
  console.log("\n=== "+k+" ("+s.size+" unique) ===\n"+[...s].join("\n"));
}
'
```
Expected: per-build list of unique bundle ability names.

- [ ] **Step 3: Write `src/data/abilityMapWWM.ts`**

Using the two dumps, map each bundle ability to its app skill. Start with the shape and the bamboocut_dust block fully filled; fill the other 5 by matching ability semantics to the app rotation rows from Step 1. Leave a bundle ability OUT if no app skill matches (do not invent). Example shape (bamboocut_dust rows illustrative — use the real dumps to finalize names/values):

```ts
export interface AppMapping {
  appName: string;        // must exist in SKILL_DB or the build skill data
  isDingyin?: boolean;
  generalBonus?: number;
  yishui?: number;
  tiaozhan?: number;
}

// bundleAbility -> app RotationItem fields, per build. Mechanic fields copied
// from the app's verified default rotation (Step 1 dump), NOT guessed.
export const ABILITY_MAP_WWM: Record<string, Record<string, AppMapping>> = {
  bamboocut_dust: {
    "Umbrella Q Perfect Catch":          { appName: "Scarlet Spin (5 Echo)", isDingyin: true, generalBonus: 0.315, yishui: 10, tiaozhan: 1 },
    "Umbrella Q Empowered Perfect Catch":{ appName: "Scarlet Spin (5 Echo + Blossom Song)", isDingyin: true, generalBonus: 0.515, yishui: 10, tiaozhan: 1 },
    // ... rest of bamboocut_dust, then the other 5 builds ...
  },
  bellstrike_umbra: { /* ... */ },
  bellstrike_splendor: { /* ... */ },
  stonesplit_might: { /* ... */ },
  silkbind_jade: { /* ... */ },
  stonesplit_strength: { /* ... */ },
};
```

> Note: `appName` does NOT need to pre-exist in the 13-entry `SKILL_DB` — `calcSkill` also resolves names via the build's CN `skillDatabase` (see calc.ts:408-431). If a mapped `appName` still resolves to 0 damage at runtime, Task 4's UI reports it as unmapped. That is the honesty gate; do not pad the map to hide it.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add src/data/abilityMapWWM.ts
git commit -m "feat(dps-compare): ability->app-skill mapping table (6 builds)"
```

---

### Task 3: Engine-2 pipeline

**Files:**
- Create: `src/utils/engine2.ts`

**Interfaces:**
- Consumes: `ROTATIONS_WWM`, `WwmStep` (Task 1); `ABILITY_MAP_WWM`, `AppMapping` (Task 2); `calcSkill`, `SKILL_DB` from `./calc`; `RotationItem`, `PanelStats`, `TierConstants` from `../types`.
- Produces:
  - `export const BUILD_TO_WWM: Record<string,string>` (app build key → bundle path key).
  - `export function translateTier(buildKey: string, tier: string): { items: RotationItem[]; unmapped: string[] }`.
  - `export function engine2Dps(buildKey: string, tier: string, panel: PanelStats, activeTier: TierConstants, opts: { set: string; datang: boolean; yishui: boolean }, rotationTimeSec: number): { dps: number; total: number; steps: number; mapped: number; unmapped: string[] }`.

- [ ] **Step 1: Write `src/utils/engine2.ts`**

```ts
import { ROTATIONS_WWM } from "../data/rotationsWWM";
import { ABILITY_MAP_WWM } from "../data/abilityMapWWM";
import { calcSkill, SKILL_DB } from "./calc";
import { RotationItem, PanelStats, TierConstants } from "../types";

// App build key -> wherewindsmath bundle path key.
export const BUILD_TO_WWM: Record<string, string> = {
  "bamboocut-dust": "bamboocut_dust",
  "bellstrike-umbra": "bellstrike_umbra",
  "bellstrike-splendor": "bellstrike_splendor",
  "stonesplit-might": "stonesplit_might",
  "silkbind-jade": "silkbind_jade",
  "stonesplit-pure-datang": "stonesplit_strength",
};

// Translate one bundle tier into app RotationItem[], collecting unmapped abilities.
export function translateTier(buildKey: string, tier: string): { items: RotationItem[]; unmapped: string[] } {
  const wwmKey = BUILD_TO_WWM[buildKey];
  const steps = (wwmKey && ROTATIONS_WWM[wwmKey]?.[tier]) || [];
  const map = (wwmKey && ABILITY_MAP_WWM[wwmKey]) || {};
  const items: RotationItem[] = [];
  const unmapped: string[] = [];
  for (const s of steps) {
    const m = map[s.ability];
    if (!m) { unmapped.push(s.ability); continue; }
    items.push({
      name: m.appName,
      count: s.numUse,
      isDingyin: m.isDingyin ?? false,
      generalBonus: m.generalBonus ?? 0,
      yishui: m.yishui ?? 0,
      tiaozhan: m.tiaozhan ?? 0,
    });
  }
  return { items, unmapped };
}

// Sum DPS for one tier using the UNCHANGED app formula.
export function engine2Dps(
  buildKey: string,
  tier: string,
  panel: PanelStats,
  activeTier: TierConstants,
  opts: { set: string; datang: boolean; yishui: boolean },
  rotationTimeSec: number,
): { dps: number; total: number; steps: number; mapped: number; unmapped: string[] } {
  const wwmKey = BUILD_TO_WWM[buildKey];
  const rawSteps = (wwmKey && ROTATIONS_WWM[wwmKey]?.[tier]) || [];
  const { items, unmapped } = translateTier(buildKey, tier);
  let total = 0;
  let priced = 0;
  for (const item of items) {
    const sk = SKILL_DB[item.name];
    const { total: t } = calcSkill(item, panel, activeTier, {
      set: opts.set,
      datang: opts.datang,
      yishui: opts.yishui,
      buildKey,
    });
    // A mapped-but-unpriced skill (0 total AND not in SKILL_DB after calc) is
    // treated as unmapped — "mapped" must mean mapped AND priced.
    if (t <= 0 && !SKILL_DB[item.name] && !sk) { unmapped.push(item.name); continue; }
    total += t * item.count;
    priced++;
  }
  const dps = rotationTimeSec > 0 ? total / rotationTimeSec : 0;
  return { dps, total, steps: rawSteps.length, mapped: priced, unmapped };
}
```

> Note: `calcSkill` already multiplies internally per its own model; we additionally apply `* item.count` to match how `computeTotalDamage` in App.tsx sums `getRotationForBuild` items (each item carries its own `count`). If the app's own loop does NOT multiply by count (verify against App.tsx:1545-1553), drop the `* item.count`. **Verify this against the app loop before trusting numbers** — see Task 5 Step 2.

- [ ] **Step 2: Write a runnable self-check**

Create `src/utils/engine2.selfcheck.mjs`:
```js
// Ad-hoc self-check: translateTier shape + sum logic. Run: node src/utils/engine2.selfcheck.mjs
// (Pure-logic check with stubs — no app runtime, no framework. ponytail: one check on the
//  non-trivial translate/sum path.)
import assert from "node:assert";

// Minimal re-impl of the sum contract to lock behavior (mirrors engine2Dps's loop).
function sumContract(items, priceFn, timeSec) {
  let total = 0, mapped = 0;
  for (const it of items) {
    const t = priceFn(it.name);
    if (t <= 0) continue;
    total += t * it.count; mapped++;
  }
  return { dps: timeSec > 0 ? total / timeSec : 0, total, mapped };
}

const items = [{ name: "A", count: 2 }, { name: "B", count: 1 }, { name: "Unpriced", count: 5 }];
const price = (n) => ({ A: 100, B: 50, Unpriced: 0 }[n] ?? 0);
const r = sumContract(items, price, 10);
assert.strictEqual(r.total, 100 * 2 + 50 * 1, "total should be 250");
assert.strictEqual(r.mapped, 2, "Unpriced should not count as mapped");
assert.strictEqual(r.dps, 25, "dps = 250/10");
console.log("engine2 self-check OK", r);
```

- [ ] **Step 3: Run the self-check**

Run: `node src/utils/engine2.selfcheck.mjs`
Expected: `engine2 self-check OK { dps: 25, total: 250, mapped: 2 }`

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add src/utils/engine2.ts src/utils/engine2.selfcheck.mjs
git commit -m "feat(dps-compare): engine2 — translate bundle rotation + DPS via app formula"
```

---

### Task 4: DPS Compare render block in App.tsx

**Files:**
- Modify: `src/App.tsx` (add import; add `"dps-compare"` to the grad-tabs tab list; add render block alongside the other `gradModalActiveTab === "..."` blocks)

**Interfaces:**
- Consumes: `engine2Dps`, `BUILD_TO_WWM` (Task 3); `ROTATIONS_WWM` (Task 1); in-scope state `selectedBuild`, `adjustedPanel`, `activeTier`, `datang`, `yishui`, `gradModalActiveTab`.
- Produces: a read-only table rendered when `gradModalActiveTab === "dps-compare"`.

- [ ] **Step 1: Add imports near the other util/data imports**

```tsx
import { engine2Dps, BUILD_TO_WWM } from "./utils/engine2";
import { ROTATIONS_WWM } from "./data/rotationsWWM";
```

- [ ] **Step 2: Add the tab to the grad-tabs list**

Find the array of grad sub-tabs near `src/App.tsx:4588` (the `.grad-tabs` block mapping `tab.key`). Add an entry (English label, locked #9):
```tsx
{ key: "dps-compare", label: "DPS Compare" },
```
(Match the exact object shape the existing tab list uses — `{ key, label }` or similar; copy the neighbor's shape.)

- [ ] **Step 3: Add the render block**

Insert next to the other `gradModalActiveTab === "..."` blocks (e.g. after the `"rotations"` one near `src/App.tsx:4614`):

```tsx
{gradModalActiveTab === "dps-compare" && (() => {
  const wwmKey = BUILD_TO_WWM[selectedBuild];
  if (!wwmKey || !ROTATIONS_WWM[wwmKey]) {
    return <div style={{ padding: 16, color: "#8b949e" }}>No WWMath data for this build.</div>;
  }
  // App default DPS for the same inputs (sanity anchor).
  const appTotal = computeTotalDamage(adjustedPanel);
  const appTime = getRotationTimeForBuild(selectedBuild);
  const appDps = appTime > 0 ? appTotal / appTime : 0;
  const tiers = Object.keys(ROTATIONS_WWM[wwmKey]);
  const opts = { set: adjustedPanel.set || "gold", datang, yishui };
  return (
    <div style={{ padding: 12 }}>
      <div style={{ marginBottom: 8, color: "#e6edf3" }}>
        <b>{selectedBuild}</b> — App default DPS: <b>{Math.round(appDps).toLocaleString()}</b> (rotation {appTime}s)
      </div>
      <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
        <thead><tr>
          {["WWMath rotation", "Steps", "Mapped", "DPS (app formula)", "vs app"].map((h) => (
            <th key={h} style={{ border: "1px solid #30363d", padding: "5px 9px", textAlign: "left", background: "#161b22" }}>{h}</th>
          ))}
        </tr></thead>
        <tbody>
          {tiers.map((tier) => {
            const r = engine2Dps(selectedBuild, tier, adjustedPanel, activeTier, opts, appTime);
            const partial = r.unmapped.length > 0;
            const pct = appDps > 0 ? ((r.dps - appDps) / appDps) * 100 : 0;
            return (
              <tr key={tier} style={{ opacity: partial ? 0.7 : 1 }}>
                <td style={{ border: "1px solid #30363d", padding: "5px 9px" }}>{tier}</td>
                <td style={{ border: "1px solid #30363d", padding: "5px 9px" }}>{r.steps}</td>
                <td style={{ border: "1px solid #30363d", padding: "5px 9px" }}>{r.mapped}/{r.steps}</td>
                <td style={{ border: "1px solid #30363d", padding: "5px 9px" }}>
                  {Math.round(r.dps).toLocaleString()}{partial ? " (partial)" : ""}
                </td>
                <td style={{ border: "1px solid #30363d", padding: "5px 9px", color: pct >= 0 ? "#3fb950" : "#ff7b72" }}>
                  {pct >= 0 ? "+" : ""}{pct.toFixed(1)}%{partial ? ` ⚠ ${r.unmapped.length} unmapped` : ""}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
})()}
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean. (If `adjustedPanel.set` typing complains, use the same accessor the existing `computeTotalDamage` uses — `p.set || "gold"`.)

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat(dps-compare): read-only DPS Compare sub-tab"
```

---

### Task 5: Verify against the benchmark + fix count semantics

**Files:**
- Modify (only if Step 2 finds the count bug): `src/utils/engine2.ts`

**Interfaces:** none new.

- [ ] **Step 1: Build + run dev**

Run: `npm run dev`, open the app, pass the UID gate, open the grad modal → DPS Compare sub-tab, select **Bamboocut-Dust**.

- [ ] **Step 2: Confirm count semantics match the app loop**

Read `src/App.tsx:1543-1555` (`computeTotalDamage`). It sums `calcSkill(item, ...).total` **once per item** (the item's `count` is consumed *inside* `calcSkill`, NOT multiplied outside). If so, the `* item.count` in `engine2Dps` (Task 3) is a **double-count bug** — remove it:

```ts
// change
total += t * item.count;
// to
total += t;
```
Re-run `node src/utils/engine2.selfcheck.mjs` is unaffected (it tests the contract, not calcSkill). Re-typecheck, re-commit if changed:
```bash
git add src/utils/engine2.ts && git commit -m "fix(dps-compare): match app per-item sum (count handled inside calcSkill)"
```

- [ ] **Step 3: Sanity-check the numbers**

Expected on Bamboocut-Dust:
- "App default DPS" shown in the tab roughly matches the app's own main-screen DPS for the same gear/panel (they share inputs — small differences only from rotation-time source).
- At least one tier (e.g. the simplest, likely "Default" / lowest) maps a high fraction of steps and lands within a believable band (say ±25%) of the app number. A 10× gap means the count bug (Step 2) or a broken map — fix before trusting.
- Builds with many `⚠ N unmapped` are expected and honest; note which builds are well-covered.

- [ ] **Step 4: Record coverage in the spec**

Append a short "Coverage (as built)" note to `docs/superpowers/specs/2026-06-25-dps-compare-engine2-design.md`: per build, mapped/total for the main tier, so future work knows which builds need more mapping. Commit:
```bash
git add docs/superpowers/specs/2026-06-25-dps-compare-engine2-design.md
git commit -m "docs(dps-compare): record per-build mapping coverage"
```

- [ ] **Step 5: Push**

```bash
git push origin main
```

---

## Self-Review

- **Spec coverage:** read-only tab → Task 4; bundle data → Task 1; explicit map (no fuzzy) → Task 2; reuse app formula → Task 3; 6 builds → Tasks 1-2 keep-list; honesty gate (unmapped surfaced) → Task 3 `unmapped` + Task 4 "(partial)/⚠"; bamboocut-dust verify anchor → Task 5; non-goals (no formula/rotation change) → no task touches calc.ts. All covered.
- **Placeholder scan:** Task 2's map body is the legitimate hand-work product of Steps 1-2 dumps, not a placeholder — the shape + a real example + the fill procedure are given. No "TBD"/"add error handling" left.
- **Type consistency:** `WwmStep` (T1) ↔ used in T3; `AppMapping`/`ABILITY_MAP_WWM` (T2) ↔ used in T3; `RotationItem` fields `{name,count,isDingyin,generalBonus,yishui,tiaozhan}` match `src/types.ts:117`; `engine2Dps`/`translateTier`/`BUILD_TO_WWM` signatures consistent T3↔T4.
- **Known sharp edge:** the `* item.count` question is resolved by Task 5 Step 2 against the real app loop, not assumed.
