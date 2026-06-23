# Handoff → Claude B (from the agent who just finished IW overhaul + set-ranking fix, near limit)

Read **CLAUDE.md** first (LOCKED DECISIONS — other agents have repeatedly reverted them
thinking they were bugs; they are correct). Read the two prior handoffs in this folder
(`2026-06-23-handoff-to-claude-c.md`) for the full project state — it's still accurate.

Shared working tree + `.git` with other agents. **`git pull --rebase` is currently blocked**
by an unstaged `.gitignore` that belongs to ANOTHER agent — do NOT touch/commit `.gitignore`,
do NOT touch `lottie-exports/` or `public/lottie-exports/` (untracked, not ours). Push works
fast-forward without the rebase. Commit ONLY files you actually edit. Respond to the user in
**Vietnamese**. Deploy = commit + push `main` (Cloudflare Pages auto-builds).

## What I just shipped (latest commits, all on `main`)
- `9b6ff41` — **IW overhaul DONE for bamboocut-dust + general inner ways.** Extended `iwStats`
  in App.tsx with `prec / minOuter / maxOuter` (memo bonus + sum, adjustedPanel apply,
  comboInCombat/bowCompare apply; Calibrate auto-handles via CALIB_FIELDS). Added game-verified
  "Attribute Buff" substats to T6 of 8 IWs (Phantom Rally crit8.2, Song of Tang critDmg→19+prec6.5,
  Light Anew minPz36.2, Towline minOuter63.8, Morale Chant/Seasonal Edge min23.6/max47.2,
  Invigorated all-dmg→8+minOuter63.8, Bitter Seasons prec6.5). **No ROTATION recalibration needed**
  — default state has NO IW selected, so DPS stayed 40,002 (the handoff's recalibration assumption
  was wrong; verified live). `InnerWayTier.stat` is a free-form map → no type change.
- `c4a978f` — **Set-ranking bug fix.** Hawkwing (key `eaglerise`) 4pc was modeled as
  `atkMult 1.10` on outer base (minO/maxO before def) → over-credited the dominant outer term and
  beat Stars Align (+15% MA, which only lands in the shared T-bucket ≈ +10.3% total). User caught
  it: "bamboocut dust xài hawkwing sao mạnh hơn star align". Fixed → Hawkwing now `setDmgBonus += 0.10`
  (into T like every other 4pc). Verified ranking: **Stars +10.3 > Jadeware +7.9 > Hawkwing +6.9
  > Ivorybloom +5.8 > Swallow/Shaken +3.5 > Rainwhisper +1.6 > none.** `ironweave` (defensive,
  not in DPS comparison) keeps atkMult 1.05.

## 🔜 PENDING — what the user will hand you
1. **Hawkwing 4pc tooltip (HIGHEST — user said they'll screenshot it).** Current model = +10%
   damage (`setDmgBonus += 0.10` at calc.ts ~line 500, `if (set === "eaglerise")`). When the user
   sends the in-game tooltip, confirm the real % and whether it's "ATK" vs "Damage" and any
   condition (ramp-up stacks). It's a ONE-LINE change. Do NOT go back to multiplying the outer
   base before def — that's the bug we just removed.
2. **IW substats for OTHER builds** (Bellstrike-Umbra/Splendor, Silkbind-Jade/Deluge,
   Stonesplit-Might/Strength) — user has NOT screenshotted these yet. The bamboocut-dust + general
   IWs are done. When the user sends per-build IW tooltips, add their Attribute-Buff substats to
   the matching IW's T6 `stat` in `src/data/innerways.ts` (same pattern as the 8 already done).
   **Paths in innerways.ts are CORRECT — do NOT reorder/rename them** (user confirmed repeatedly).
3. The user said "từ từ" (slow down) right before handing to you — so **wait for the user's next
   instruction**; don't proactively start big work. Confirm scope before editing App.tsx.

## Verify recipe (used this session — reuse it)
To rank sets or sanity-check DPS without the dev server, drop a temp `.ts` in repo root and run
`npx tsx file.ts` (must be IN the repo so it uses the project tsconfig — `/tmp` fails with an
ERR_INVALID_PACKAGE_CONFIG). Call `calcSkill(rot, panel, TIERS["350|0.45"], {set, datang, yishui})`.
**Gotchas:** tier key is `"350|0.45"` (NOT "95下"); `rot` must include `generalBonus` and
`tiaozhan` or you get NaN; skill name e.g. `"九剑Q"` (martial-art) lives in SKILL_DB. Delete the
temp file after. `tsc --noEmit` clean + `npm run build` green before every commit.

## Locked-decision reminders most relevant to this area
- #1 tier = 95下 / formula verified vs Excel — don't touch tier constants / pen / precision formulas.
- #2 inner ways are in-combat buffs added on top of basePanel via iwStats — don't ignore them.
- Set comparison labels everything "Weapon Set"; ALL compared sets are weapon EXCEPT `stormrain`
  (="Eaglerise", defensive armour). Note the naming trap: app key `eaglerise` = "Hawkwing" = WEAPON;
  app key `stormrain` = "Eaglerise" = armour. See [[set-4pc-data]] memory + CLAUDE.md.
