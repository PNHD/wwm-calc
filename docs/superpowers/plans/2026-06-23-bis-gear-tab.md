# BiS Gear Tab Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a read-only "BiS Gear" sub-tab to the grad-tabs group that shows, per build, an 8-slot table of recommended Set (dynamic) + main-stat + top-4 priority substats.

**Architecture:** Pure aggregation of existing data — `armorSetCompare` memo (set rec), a new static `SLOT_MAIN_STAT` const (main-stat per slot), and `GRAD95_COUNTS` (substat priority). One new memo + one JSX pane + one tab entry. No new state, no persistence, no data crawl.

**Tech Stack:** Vite + React + TypeScript (existing). esbuild build, `npx tsc --noEmit` lint.

## Global Constraints

- In-app text is English (CLAUDE.md #9).
- Do NOT alter tier constants / pen / precision formulas (CLAUDE.md #1).
- Do NOT touch `.gitignore`, `lottie-exports/`, `public/lottie-exports/` (other agents).
- `npx tsc --noEmit` clean + `npm run build` green before commit.
- `git pull --rebase` may be blocked by others' unstaged `.gitignore`; push fast-forwards anyway.
- Commit message ends with: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`
- Build's 8 slots (App.tsx `SLOTS`): Umbrella, Rope Dart, Disc, Pendant, Helmet, Chest, Greaves, Bracers.
- Cultivate-class key mapping: the Cultivate tab maps `selectedBuild` → a `GRAD95_COUNTS` key (e.g. "Bamboocut-Dust"). Reuse that same variable (`cultivateClass`), do NOT re-derive.

---

### Task 1: BiS Gear tab (const + memo + JSX + tab entry + help line)

**Files:**
- Modify: `src/App.tsx` (add `SLOT_MAIN_STAT` const near other gear consts ~line 404; add `bisGear` memo near `armorSetCompare` ~line 2877; add tab entry in the grad-tabs bar where `{ key: "transmute", label: "Transmute Advice" }` lives ~line 4382; add JSX pane after the transmute pane ~line 5561+; add one `<li>` to the in-app help list ~line 4651).

**Interfaces:**
- Consumes: `armorSetCompare` (memo, already returns `{key,name,dps,delta,active,modeled}[]` sorted by dps desc — `[0]` is the top set); `GRAD95_COUNTS` (`Record<string, Record<string,number>>`); `cultivateClass` (string, the GRAD95 key for the selected build); `gradModalActiveTab` / `setGradModalActiveTab` (existing tab state); the existing stat-label map used by Cultivate (`STAT_LABELS` at ~line 5379 — if it's scoped inside a render block, lift a module-level `BIS_STAT_LABELS` instead; see Step 3).
- Produces: nothing consumed elsewhere (terminal feature).

- [ ] **Step 1: Add the static main-stat map**

In `src/App.tsx`, right after the `GRAD95_COUNTS` const block (ends ~line 413), add:

```ts
// Main-stat (first affix) recommendation per slot, from the community stat guide:
// weapon + accessories want Max Phys Atk; Helmet/Chest want Crit (Aff for aff-builds);
// Greaves/Bracers want Power. Keyed by the app's SLOTS names.
const SLOT_MAIN_STAT: Record<string, string> = {
  "Umbrella":  "maxOuter",
  "Rope Dart": "maxOuter",
  "Disc":      "maxOuter",
  "Pendant":   "maxOuter",
  "Helmet":    "crit",
  "Chest":     "crit",
  "Greaves":   "power",
  "Bracers":   "power",
};
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no new errors (clean, same as before).

- [ ] **Step 3: Add a module-level stat-label map**

The Cultivate pane has a local `STAT_LABELS` (~line 5379) scoped inside its render closure, so it can't be reused from a memo. Add a module-level map near `SLOT_MAIN_STAT` (covering every key used by GRAD95_COUNTS + SLOT_MAIN_STAT):

```ts
// Human labels for the substat keys used by BiS Gear (GRAD95_COUNTS keys + main-stats).
const BIS_STAT_LABELS: Record<string, string> = {
  maxOuter: "Max Phys Atk", minOuter: "Min Phys Atk",
  crit: "Crit Rate", aff: "Affinity Rate", prec: "Precision",
  strength: "Strength", agility: "Agility", power: "Power",
  boss: "Boss DMG", ownWeapon: "Weapon Skill DMG",
};
```

- [ ] **Step 4: Add the `bisGear` memo**

After the `armorSetCompare` memo (closing `}, [...]);` ~line 2877), add:

```ts
// BiS gear recommendation per slot: static main-stat + top-4 priority substats
// (from the build's graduated 条 counts). Set rec is read live from armorSetCompare
// in the JSX. Pure derivation — no state.
const bisGear = useMemo(() => {
  const counts = GRAD95_COUNTS[cultivateClass] || GRAD95_COUNTS["Bamboocut-Dust"];
  // Priority = stats with the highest graduated 条 count (desc), label via BIS_STAT_LABELS.
  const subPriority = Object.entries(counts)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([k]) => BIS_STAT_LABELS[k] || k);
  return SLOTS.map(slot => ({
    slot: slot.name,
    mainStat: BIS_STAT_LABELS[SLOT_MAIN_STAT[slot.name]] || SLOT_MAIN_STAT[slot.name],
    subPriority,
  }));
}, [cultivateClass]);
```

- [ ] **Step 5: Verify the memo compiles and `cultivateClass` is in scope**

Run: `npx tsc --noEmit`
Expected: clean. If `cultivateClass` is not in scope at the memo location, search for its definition (`grep -n "cultivateClass" src/App.tsx`) and place the `bisGear` memo AFTER it (it's defined in the component body for the Cultivate tab).

- [ ] **Step 6: Add the tab entry**

Find the grad-tabs bar array containing `{ key: "transmute", label: "Transmute Advice" }` (~line 4382). Add immediately after it:

```tsx
                    { key: "bis", label: "BiS Gear" },
```

- [ ] **Step 7: Add the JSX pane**

After the transmute pane's closing (the block guarded by `gradModalActiveTab === "transmute"`, ~line 5561+, find its closing `)}`), add:

```tsx
                  {gradModalActiveTab === "bis" && (
                    <div style={{ padding: '4px 0' }}>
                      <div className="text-[13px] text-[#8b949e] mb-3">
                        Ideal gear per slot for <b className="text-[#f0b400]">{cultivateClass}</b>.
                        Set is the current top DPS weapon set (updates with your panel); main-stat and
                        substat priority come from the verified 95下 graduated build.
                      </div>
                      <table className="w-full text-[13px]" style={{ borderCollapse: 'collapse' }}>
                        <thead>
                          <tr className="text-[#8b949e] text-left">
                            <th className="py-2 pr-3">Slot</th>
                            <th className="py-2 pr-3">Set</th>
                            <th className="py-2 pr-3">Main-stat</th>
                            <th className="py-2">Substat priority</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bisGear.map((row, i) => {
                            const isWeaponSide = i < 4;
                            const topSet = armorSetCompare[0];
                            return (
                              <tr key={row.slot} style={{ borderTop: '1px solid #21262d' }}>
                                <td className="py-2 pr-3 text-white">{row.slot}</td>
                                <td className="py-2 pr-3">
                                  {isWeaponSide && topSet
                                    ? <span className="text-[#7ee787]">{topSet.name}</span>
                                    : <span className="text-[#8b949e]">—</span>}
                                </td>
                                <td className="py-2 pr-3 text-slate-200">{row.mainStat}</td>
                                <td className="py-2 text-slate-300">{row.subPriority.join(" · ")}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      <div className="text-[12px] text-[#8b949e] mt-3">
                        Armour slots (Helmet/Chest/Greaves/Bracers) use defensive armour sets — the
                        DPS-relevant set choice is the weapon set shown on the weapon-side rows.
                      </div>
                    </div>
                  )}
```

- [ ] **Step 8: Add the help line**

In the in-app help `<ul>` (where the `<li>` for "Transmute Advice" lives ~line 4651), add after it:

```tsx
                            <li><b>BiS Gear</b> — per-slot ideal config for the selected build: recommended weapon set (live), main-stat, and the top substats worth prioritising.</li>
```

- [ ] **Step 9: Verify build + tsc**

Run: `npx tsc --noEmit && npm run build`
Expected: tsc clean, `✓ built`.

- [ ] **Step 10: Manual dev-server verify**

Run: `npm run dev` (note the port; 5173+ may be taken by other agents).
Open the app → open the graduation modal → click "BiS Gear" tab. Confirm:
- 8 rows (Umbrella…Bracers).
- Weapon-side rows show the same top set as the live Weapon-Set comparison panel (e.g. for crit bamboocut-dust: Stars Align, NOT Hawkwing — verifies the affinity-scaling fix).
- Bamboocut-Dust substat priority starts with "Max Phys Atk" and has 4 entries (Max Phys Atk · Strength · Crit Rate · Precision).
- Armour rows show "—" for set.
Stop the dev server (Ctrl-C, or `pkill -f vite` ONLY if no other agent's server is running).

- [ ] **Step 11: Commit**

```bash
git add src/App.tsx docs/superpowers/specs/2026-06-23-bis-gear-tab-design.md docs/superpowers/plans/2026-06-23-bis-gear-tab.md
git commit -m "$(cat <<'EOF'
Add BiS Gear tab: per-slot set/main-stat/substat priority by build

New read-only sub-tab in grad-tabs. Aggregates existing data: live top weapon
set from armorSetCompare, static main-stat per slot (community guide), and top-4
graduated substat counts from GRAD95_COUNTS. No new state or data crawl.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
EOF
)"
git push
```

## Self-Review

**1. Spec coverage:** spec's 3 data sources → Step 1/3 (main-stat + labels), Step 4 (GRAD95 priority), Step 7 (armorSetCompare set rec). 8-slot table → Step 7. Tab entry → Step 6. Help line → Step 8. Out-of-scope items (no crawl/picker/persistence) honoured. ✓
**2. Placeholder scan:** all steps show real code; no TBD. ✓
**3. Type consistency:** `bisGear` returns `{slot,mainStat,subPriority}[]`; JSX in Step 7 reads exactly those fields. `armorSetCompare[0].name` matches the memo's returned shape (`{name,...}`). `SLOT_MAIN_STAT`/`BIS_STAT_LABELS` keys align with `GRAD95_COUNTS` stat keys. ✓
**Risk noted:** `cultivateClass` scope (Step 5 handles it) and local-vs-module `STAT_LABELS` (Step 3 sidesteps by adding `BIS_STAT_LABELS`).
