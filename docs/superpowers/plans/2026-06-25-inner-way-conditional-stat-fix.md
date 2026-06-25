# Inner-Way Conditional-Stat Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop crediting conditional "Basic Buff" stats (stack-ramp / "all-damage%" / non-boss) onto the panel for inner ways, so DPS reflects always-on "Attribute Buff" stats only — fixing the ~50k over-inflation on Bamboocut-Dust and the distorted gear ranking.

**Architecture:** Pure data edit in `src/data/innerways.ts`. Each affected inner way's per-tier `stat` is reduced to its always-on Attribute Buff; conditional values move to the `effect` text (not lost). No code/formula change — `iwStats`/`adjustedPanel`/`calcSkill` already sum whatever `stat` holds.

**Tech Stack:** React + TypeScript + Vite (existing). No new deps. No test runner — verify via `npx tsc --noEmit` + an ad-hoc esbuild DPS harness + browser.

## Global Constraints

- **Do NOT touch** the damage formula, tier constants, `calc.ts`, or rotations (LOCKED #1, #7). This is a data-only fix.
- **Keep LOCKED #2:** inner ways still add their stat onto `basePanel` in `adjustedPanel`. We only fix *which* stat (Attribute Buff, not Basic Buff).
- **Source of truth for the split:** the in-game Inner Way detail screen (Basic Buff vs Attribute Buff sections), the hand-verified list in `docs/superpowers/specs/2026-06-23-autoclaw-wwmdb-innerway.md` (§"Đã verify tay", lines 51-58), and the wwmdb `dynamicAttributes` crawl (commit e19b08a). **Do NOT guess a split** — an inner way whose split isn't covered by these sources stays unchanged with a `// TODO verify` note.
- **Rule for `generalDmg`:** the `generalDmg` key always represents a conditional "+X% all damage" Basic Buff (Attribute Buff lines are never all-damage%). **Remove `generalDmg` from every `stat`.** (Per autoclaw spec line 48-49: generalDmg only counts on boss and only when not gated by 3+ enemies / non-boss — for a single-target graduation calc we drop it.)
- **Keep boss-debuffs and easy-ramp pen (user decision):** Bitter Seasons `-10 PhysRes` (= boss def-shred, always effective on boss) and Morale Chant `+10 Pen` (Yi River ramp, held in combat) are KEPT — they match the community speedrun meta. Only drop true conditional stacks (Collapse, Tang Song crit-DMG stacks) and `generalDmg`.
- **UI text English** (LOCKED #9).
- **Deploy = commit + push `main`** (Cloudflare Pages).

## Affected inner ways (13) and the exact split

Each row: current `stat` → new `stat` (Attribute Buff only) + what's dropped and why.
"Drop" values move into the `effect` string so the info stays visible.

| inner way | current stat | NEW stat (keep) | drop (reason) |
|---|---|---|---|
| `breaking_point` | `{outerPen:25,critDmg:25,dcrit:4.1,prec:6.5}` | `{dcrit:4.1,prec:6.5}` | `outerPen:25,critDmg:25` = Collapse 5-stack (Spirit Depletion). Confirmed: in-game screenshot + autoclaw spec L52. |
| `song_of_tang` | `{critDmg:19,prec:6.5}` | `{critDmg:4,prec:6.5}` | `critDmg` 19→4: 15 of it is Tang Song MA-stacks (conditional); +4% is the always-on Attribute Buff. Autoclaw spec L56: "+15% CDmg(MA) +4% +Precision 6.5%". |
| `morale_chant` | `{outerPen:10,outerDmg:5,dcrit:4.6,minOuter:23.6,maxOuter:47.2}` | `{outerPen:10,dcrit:4.6,minOuter:23.6,maxOuter:47.2}` | drop `outerDmg:5` (conditional Yi-River dmg). KEEP `outerPen:10` (ramp pen, user decision) + Attr Buff min/max/dcrit. |
| `seasonal_edge` | `{generalDmg:5,outerDmg:2.8,minOuter:23.6,maxOuter:47.2}` | `{outerDmg:2.8,minOuter:23.6,maxOuter:47.2}` | drop `generalDmg:5` (one-of-four random buff, conditional). Keep Attr Buff (autoclaw L57). |
| `invigorated_warrior` | `{generalDmg:8,outerPen:5.1,minOuter:63.8}` | `{outerPen:5.1,minOuter:63.8}` | drop `generalDmg:8` (+8% all-dmg T4 buff). Keep Pen 5.1 + Min 63.8 (autoclaw L57). |
| `sword_morph` | `{generalDmg:30,daff:2.3,maxOuter:70.8}` | `{daff:2.3,maxOuter:70.8}` | drop `generalDmg:30` (Max +30% DMG, conditional). Keep Direct Affinity 2.3 + Max 70.8 (autoclaw L54). |
| `battle_anthem` | `{generalDmg:15,affDmg:5.2,aff:3.8}` | `{affDmg:5.2,aff:3.8}` | drop `generalDmg:15` (charged-skill +2%/10-endurance, conditional). Keep Affinity Attr Buff. |
| `sword_horizon` | `{generalDmg:8,daff:2.3,maxOuter:70.8}` | `{daff:2.3,maxOuter:70.8}` | drop `generalDmg:8` (follow-up/bleed AoE). Keep Direct Affinity + Max. |
| `adaptive_steel` | `{generalDmg:8,pzDmg:3,maxPz:36.2}` | `{pzDmg:3,maxPz:36.2}` | drop `generalDmg:8` (Sword/Dual/Heng ATK%, conditional/stance). Keep Bellstrike DMG 3 + Max 36.2. |
| `divine_roulette` | `{generalDmg:4,outerPen:5.1,maxOuter:63.9}` | `{outerPen:5.1,maxOuter:63.9}` | drop `generalDmg:4` (random buff 25s CD 10s). Keep Pen + Max. |
| `fivefold_bleed` | `{generalDmg:2,critDmg:3.5,maxOuter:56.8}` | `{critDmg:3.5,maxOuter:56.8}` | drop `generalDmg:2` (piercing burst AoE). Keep Crit DMG 3.5 + Max 56.8. |
| `shadow_assault` | `{generalDmg:10,outerDmg:2.2,minOuter:56.8}` | `{outerDmg:2.2,minOuter:56.8}` | drop `generalDmg:10` (range/+10% dmg conditional). Keep Phys DMG 2.2 + Min 56.8. |
| `blossom_barrage` | `{generalDmg:10,critDmg:4.4,crit:8.2}` | `{critDmg:4.4,crit:8.2}` | drop `generalDmg:10` (combo +10% 10s). Keep Crit DMG 4.4 + Crit 8.2. |
| `thunderous_bloom` | `{generalDmg:15,outerDmg:2.5,minOuter:21.2,maxOuter:42.5}` | `{outerDmg:2.5,minOuter:21.2,maxOuter:42.5}` | drop `generalDmg:15` (3-stack +15% HP dmg). Keep Phys DMG 2.5 + Min/Max. |
| `art_of_resistance` | `{generalDmg:10,minPz:11.9,maxPz:24.1}` | `{minPz:11.9,maxPz:24.1}` | drop `generalDmg:10` (shield dmg boost). Keep Min/Max element. |

> 15 rows (the survey's 13 + `battle_anthem` confirmed has generalDmg). `light_anew` (`{minPz:36.2,pzPen:6}`) is **already Attribute Buff only** (Min Bamboocut 36.2 + element Pen 6 — autoclaw L58) → NO CHANGE. `phantom_rally` (`{crit:8.2,outerDmg:2.8}`) is already static (autoclaw L56) → NO CHANGE.

Also: fix `breaking_point.cat` `"BAMBOOCUT-WIND"` → its recommend context is Bamboocut-Dust; align `cat` or recommend list (non-DPS, same file).

---

### Task 1: Drop `generalDmg` from every inner-way stat (12 inner ways)

**Files:**
- Modify: `src/data/innerways.ts`

**Interfaces:** none (data only).

- [ ] **Step 1: Baseline DPS harness (record the "before" number)**

Create `./_iwfix_harness.mjs` at repo root:
```js
import { build } from 'esbuild';
import { readFileSync } from 'fs';
await build({ entryPoints:['src/utils/calc.ts'], bundle:true, format:'esm', platform:'node', outfile:'./_cb.mjs', logLevel:'error' });
await build({ entryPoints:['src/data/innerways.ts'], bundle:true, format:'esm', platform:'node', outfile:'./_iwb.mjs', logLevel:'error' });
const { calcSkill, getRotationForBuild, getRotationTimeForBuild, TIERS } = await import('./_cb.mjs');
const { INNER_WAYS } = await import('./_iwb.mjs');
const best = JSON.parse(readFileSync('WWM_Builds_2026-06-25.json','utf8')).chars[0].schemes[0];
const tier=TIERS['350|0.45'], buildKey='bamboocut-dust', rotTime=getRotationTimeForBuild(buildKey);
const base={...best.panel,set:'stars',armorSet:'stormrain'};
const rec=['phantom_rally','song_of_tang','light_anew','breaking_point','seasonal_edge','morale_chant'];
function applyIW(p,ids){ p={...p}; for(const id of ids){const iw=INNER_WAYS.find(i=>i.id===id);if(!iw)continue;const t6=iw.tiers.find(t=>t.tier===6)||iw.tiers.at(-1);const s={...(t6?.stat||{})};for(const k in s){ if(k==='generalDmg'){p.iwGeneralDmg=(p.iwGeneralDmg||0)+s[k];} else p[k]=(p[k]||0)+s[k]; } } return p; }
function dps(p){let total=0;for(const item of getRotationForBuild(buildKey)){const{total:t}=calcSkill(item,p,tier,{set:p.set||'stars',datang:false,yishui:true,buildKey,armorSet:p.armorSet,weaponStars:true});total+=t;}return total/rotTime;}
const f={...applyIW(base,rec)}; f.minOuter+=tier.foodMin; f.maxOuter+=tier.foodMax; f.crit+=3.7;
console.log('recommended IW, food+bow:', Math.round(dps(f)).toLocaleString());
```
Run: `node ./_iwfix_harness.mjs`
Expected (before any edit): `recommended IW, food+bow: 53,065` (or near — the inflated number).

- [ ] **Step 2: Remove every `generalDmg:` key from `stat` objects**

**Only the T6 (highest) tier's `stat` is summed by the app** (`iwStats` reads `innerWayTiers[id] ?? 6`; lower tiers are intermediate and never summed — autoclaw spec L63). So edit **the T6 `stat` of each of these 12 inner ways**: delete the `generalDmg:N` key and prepend the dropped value into the T6 `effect` string as `"Basic Buff (conditional, NOT summed): +N% all DMG. "`. (Lower-tier `generalDmg` can be left as-is — it has no DPS effect — but if trivially easy, clearing it too keeps the data honest; not required.)

The 12 inner ways and their T6 generalDmg value to drop:
`sword_morph` (30), `battle_anthem` (15), `sword_horizon` (8), `adaptive_steel` (8), `seasonal_edge` (5), `invigorated_warrior` (8), `divine_roulette` (4), `fivefold_bleed` (2), `shadow_assault` (10), `blossom_barrage` (10), `thunderous_bloom` (15), `art_of_resistance` (10).

Example (sword_morph T6):
```ts
// before
{tier:6,effect:"Max +30% DMG + Direct Affinity Rate +2.3% + Max Phys Atk +70.8 (Attr Buff)",stat:{generalDmg:30,daff:2.3,maxOuter:70.8}},
// after
{tier:6,effect:"Basic Buff (conditional, NOT summed): Max +30% DMG. Attr Buff: Direct Affinity +2.3%, Max Phys Atk +70.8",stat:{daff:2.3,maxOuter:70.8}},
```

> Find each with: search the file for `generalDmg`. After this step, the **T6** `stat` of all 12 must have no `generalDmg`. (Lower tiers may still show it harmlessly.)

- [ ] **Step 3: Verify no generalDmg in any T6 stat**

Run (Bash):
```bash
node -e '
const fs=require("fs");const c=fs.readFileSync("src/data/innerways.ts","utf8");
const hits=[...c.matchAll(/tier:6,effect:"[^"]*",stat:(\{[^}]*\})/g)].filter(m=>/generalDmg/.test(m[1]));
console.log("T6 stats still containing generalDmg:", hits.length);
'
```
Expected: `T6 stats still containing generalDmg: 0`.

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 5: Re-run the harness, record the drop**

Run: `node ./_iwfix_harness.mjs`
Expected: a LOWER number than Step 1 (generalDmg removed from seasonal_edge in the recommended set drops a few %). Note the value.

- [ ] **Step 6: Commit**

```bash
git add src/data/innerways.ts
git commit -m "fix(inner-way): drop conditional generalDmg from summed stats (12 IW)"
```

---

### Task 2: Split stack-conditional pen/crit-DMG (breaking_point, song_of_tang, morale_chant)

**Files:**
- Modify: `src/data/innerways.ts`

**Interfaces:** none.

- [ ] **Step 1: `breaking_point` — drop Collapse, keep Attribute Buff + fix cat**

Change EVERY tier's `stat` from `{outerPen:25,critDmg:25,...}` to keep only the Attribute Buff. T6 confirmed = `{dcrit:4.1,prec:6.5}` (in-game screenshot; autoclaw spec L52). For lower tiers that only had `{outerPen:25,critDmg:25}` (no Attr Buff yet), set `stat:{}` and note the Collapse in `effect`. T6 example:
```ts
// before
{tier:6,...,stat:{outerPen:25,critDmg:25,dcrit:4.1,prec:6.5}},
// after
{tier:6,effect:"Basic Buff (conditional, Spirit Depletion): +25 Pen / +25% Crit DMG at 5 Collapse stacks — NOT summed. Attr Buff: Precision +6.5%, Direct Crit +4.1%",stat:{dcrit:4.1,prec:6.5}},
```
Also change `cat:"BAMBOOCUT-WIND"` → `cat:"BAMBOOCUT-DUST"` (it is recommended for and belongs to Dust per its note).

- [ ] **Step 2: `song_of_tang` — critDmg 19 → 4**

The 19 = 15 (Tang Song MA-stacks, conditional) + 4 (always-on). Keep 4:
```ts
// before T6: stat:{critDmg:19,prec:6.5}
// after  T6: stat:{critDmg:4,prec:6.5}, effect adds "Basic Buff (conditional): +15% Crit DMG to MA skills at 5 Tang Song stacks — NOT summed."
```
(Adjust lower tiers similarly if they carry the stacked value; keep only the +4 portion that the breakthrough screen lists as the flat Crit DMG Bonus.)

- [ ] **Step 3: `morale_chant` — drop outerDmg:5, keep the rest (incl. ramp pen 10)**

Per user decision, KEEP `outerPen:10` (Yi River ramp). Drop only `outerDmg:5` (conditional Yi-River damage bonus):
```ts
// before T6: stat:{outerPen:10,outerDmg:5,dcrit:4.6,minOuter:23.6,maxOuter:47.2}
// after  T6: stat:{outerPen:10,dcrit:4.6,minOuter:23.6,maxOuter:47.2}, effect adds "Basic Buff (conditional): +5% Yi-River DMG — NOT summed."
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: clean.

- [ ] **Step 5: Re-run harness — expect the big drop toward ~40k**

Run: `node ./_iwfix_harness.mjs`
Expected: now near the in-game ~40k ceiling (breaking_point's +8k conditional removed is the bulk). Record the value; it should be a large drop from Task 1's number (roughly mid-40s k or lower with food+bow).

- [ ] **Step 6: Commit**

```bash
git add src/data/innerways.ts
git commit -m "fix(inner-way): drop Collapse/Tang-Song conditional stacks; keep Attribute Buff + ramp pen"
```

---

### Task 3: Full-file audit + verification

**Files:**
- Modify (only if audit finds a missed stack-conditional stat): `src/data/innerways.ts`

**Interfaces:** none.

- [ ] **Step 1: Audit every inner-way stat for remaining conditional values**

Run this audit script (Bash):
```bash
node -e '
const fs=require("fs");const c=fs.readFileSync("src/data/innerways.ts","utf8");
const ids=[...c.matchAll(/id:"([^"]+)"/g)].map(m=>m[1]);
for(const id of ids){
  const i=c.indexOf("id:\""+id+"\"");const b=c.slice(i,i+1800);
  const t6=b.match(/tier:6,effect:"([^"]*)",stat:(\{[^}]*\})/);
  if(!t6)continue;
  const eff=t6[1],stat=t6[2];
  // flag any stat key whose value looks like a stacked Basic Buff not reflected as Attr Buff in the effect text
  if(/generalDmg/.test(stat)) console.log("STILL HAS generalDmg:",id,stat);
}
'
```
Expected: NO `STILL HAS generalDmg` lines. If any appear, remove them (missed in Task 1).

- [ ] **Step 2: Cross-check each edited stat against the verified source list**

Open `docs/superpowers/specs/2026-06-23-autoclaw-wwmdb-innerway.md` lines 51-58. For each inner way edited in Tasks 1-2, confirm the kept `stat` matches the hand-verified Attribute Buff there (e.g. Song of Tang +4% CDmg +Prec 6.5; Phantom Rally unchanged 8.2/2.8; Invigorated Pen 5.1 + Min 63.8). List any mismatch and fix it to the verified value. Inner ways NOT in that list and NOT touched by Tasks 1-2 stay unchanged.

- [ ] **Step 3: Full DPS sanity across builds**

Extend the harness to print DPS (recommended IW + food + bow) for each build that has a `WWM_Builds` panel — but since only bamboocut-dust panel is exported, just re-run for bamboocut-dust and confirm it landed near the user's real ~40k. Record the final number in the commit message.

Run: `node ./_iwfix_harness.mjs`
Expected: a believable Bamboocut-Dust number near ~40k (down from 53k).

- [ ] **Step 4: Typecheck + clean up harness**

Run: `npx tsc --noEmit` (expected clean), then `rm -f ./_iwfix_harness.mjs ./_cb.mjs ./_iwb.mjs`.

- [ ] **Step 5: Browser spot-check**

Run: `npm run dev`. Open app → Bamboocut-Dust → select the recommended inner ways → confirm the displayed DPS is near ~40k (not ~50k), and that selecting Breaking Point no longer adds a huge chunk (it now contributes only Precision + Direct Crit).

- [ ] **Step 6: Commit + push**

```bash
git add src/data/innerways.ts
git commit -m "fix(inner-way): audit pass — Attribute-Buff-only stats; Bamboocut-Dust ~40k matches parse"
git push origin main
```

---

## Self-Review

- **Spec coverage:** "keep Attribute Buff only" → Tasks 1-2; "generalDmg always conditional → drop" → Task 1; stack-conditional pen/critDmg split → Task 2; breaking_point.cat fix → Task 2 Step 1; "don't guess, use verified sources" → Task 3 Step 2 cross-check; verification by harness + browser → Tasks 1/2/3; LOCKED #1/#2/#7 untouched (data-only) → Global Constraints + no calc.ts in any task. Covered.
- **Placeholder scan:** every inner-way edit has its exact before/after `stat` in the table or task step; the generalDmg list is explicit (12 ids). The user-decision edge cases (keep Bitter -10 PhysRes, Morale +10 Pen) are encoded as "keep" in the table/Task 2 Step 3. No TBD.
- **Consistency:** the 15-row table is the authority; Task 1 handles the 12 generalDmg rows, Task 2 the 3 stack rows (breaking_point, song_of_tang, morale_chant), Task 3 audits the rest. `light_anew`/`phantom_rally` explicitly NO-CHANGE. `bitter_seasons` KEEP (boss debuff) — not in the edit tasks, confirmed in Task 3 cross-check.
- **Known sharp edge:** Bamboocut-Dust is the only build with an exported panel to verify against ~40k; other builds get the same data fix but are sanity-checked only structurally (their conditional stats dropped by the same rule), not against a parse — acceptable, noted.
