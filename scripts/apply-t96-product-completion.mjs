import fs from "node:fs";

const appPath = "src/App.tsx";
const timelinePath = "src/utils/rotationTimeline.ts";
let app = fs.readFileSync(appPath, "utf8");
let timeline = fs.readFileSync(timelinePath, "utf8");

function replaceRequired(source, from, to, label) {
  if (source.includes(to)) return source;
  if (!source.includes(from)) throw new Error(`[t96-product] Missing patch anchor: ${label}`);
  return source.replace(from, to);
}

function replaceRegexRequired(source, pattern, to, label) {
  if (typeof to === "string" && source.includes(to)) return source;
  if (!pattern.test(source)) throw new Error(`[t96-product] Missing regex anchor: ${label}`);
  return source.replace(pattern, to);
}

// The timeline owns conditional Starweave, Yi River and Tang Melody for the T96
// Bamboocut path. Disable calcSkill's legacy permanent-max toggles inside it.
timeline = replaceRequired(
  timeline,
  'const eventOpts: CalcOpts = isT96Bamboocut ? { ...opts, yishui: false, datang: false } : opts;',
  'const eventOpts: CalcOpts = isT96Bamboocut ? { ...opts, yishui: false, datang: false, weaponStars: false } : opts;',
  "timeline legacy max-stack suppression",
);
fs.writeFileSync(timelinePath, timeline, "utf8");

// Starweave 2pc is deterministic menu-panel data at Global T96. It belongs in
// gear aggregation so calibration subtracts it and every candidate recomputes it.
app = replaceRequired(
  app,
  '  sums.aff = (sums.aff || 0)\n    + momentum * GLOBAL_ATTRIBUTE_CONVERSIONS.momentum.affinityRatePerPoint;\n\n  return sums;',
  '  sums.aff = (sums.aff || 0)\n    + momentum * GLOBAL_ATTRIBUTE_CONVERSIONS.momentum.affinityRatePerPoint;\n\n  const starweavePieces = gear.filter((item) => ["Umbrella", "Rope Dart", "Pendant", "Disc"].includes(item.slot) && item.set === "stars").length;\n  if (starweavePieces >= 2) sums.minOuter = (sums.minOuter || 0) + 78;\n\n  return sums;',
  "Global T96 Starweave 2pc aggregation",
);

// Player-facing set evidence: remove the stale T91 name/value from the active set.
app = app.replace('name: "Stars Align",\n    stat2pc: { minOuter: 64 },           // ✅ confirmed T91\n    desc2pc: "2/4: Min Physical ATK +64",', 'name: "Starweave",\n    stat2pc: { minOuter: 78 },           // ✅ confirmed Global T96 client\n    desc2pc: "2/4: Min Physical ATK +78",');
app = app.replaceAll("Stars Align stack", "Starweave stack");
app = app.replaceAll("Stars Align 4pc", "Starweave 4pc");
app = app.replaceAll("Stars Align's", "Starweave's");

// Complete-build evaluator. Bamboocut-Dust uses the same event timeline for the
// current build, Gear Compare, stat priority and Best Build. Other paths retain
// their previous static evaluator until equivalent Global evidence exists.
app = replaceRegexRequired(
  app,
  /  const comboInCombat = \(combo: GearItem\[\], bowOverride\?: string\): \{ total: number; crit: number \} => \{[\s\S]*?\n  \};\n\n  const gradRateForGearCombo/,
  `  const comboInCombat = (combo: GearItem[], bowOverride?: string): { total: number; crit: number } => {
    let p = computeGearPanel(panel, combo, activeScheme?.baseOverride, innerAttrName(selectedBuild));
    if (food) { p.minOuter += activeTier.foodMin; p.maxOuter += activeTier.foodMax; }
    const bow = bowOverride ?? bowSelect;
    if (bow === "crit") p.crit += 3.7; else if (bow === "prec") p.prec += 3.3; else if (bow === "aff") p.aff += 1.8;
    const { weaponSet, armorSet } = detectSet4pc(combo);
    p.set = weaponSet;
    (p as any).armorSet = armorSet;
    (p as any).weaponStars = weaponSet === "stars";

    if (selectedBuild === "bamboocut-dust") {
      p.iwGeneralDmg = 0; p.iwOuterPen = 0; p.iwPzPen = 0; p.iwPzDmg = 0;
      const buffs = buildTimelineBuffs(selectedInnerWays, innerWayTiers);
      const window = getRotationTimeForBuild(selectedBuild);
      const timelineResult = simulateTimeline(
        getRotationForBuild(selectedBuild),
        p,
        buffs,
        activeTier,
        { set: p.set, datang: false, yishui: false, buildKey: selectedBuild, weaponStars: (p as any).weaponStars, armorSet: (p as any).armorSet } as any,
        window,
      );
      return { total: timelineResult.total, crit: p.crit + iwStats.crit };
    }

    p.outerPen += iwStats.outerPen; p.pzPen += iwStats.pzPen; p.crit += iwStats.crit; p.aff += iwStats.aff;
    p.dcrit += iwStats.dcrit; p.critDmg += iwStats.critDmg; p.affDmg += iwStats.affDmg;
    p.outerDmg += iwStats.outerDmg; p.pzDmg += iwStats.pzDmg; p.iwGeneralDmg = iwStats.generalDmg;
    p.prec += iwStats.prec; p.minOuter += iwStats.minOuter; p.maxOuter += iwStats.maxOuter;
    let totalDmg = 0;
    getRotationForBuild(selectedBuild).forEach(item => {
      totalDmg += calcSkill(item, p, activeTier, { set: p.set, datang, yishui, buildKey: selectedBuild, weaponStars: (p as any).weaponStars, armorSet: (p as any).armorSet } as any).total;
    });
    return { total: totalDmg, crit: p.crit };
  };

  const gradRateForGearCombo`,
  "timeline complete-build evaluator",
);

// Ranking must be modeled damage only. Remove the old over-cap tie penalty; if two
// builds truly have equal damage, their order is immaterial and no hidden stat
// preference should override the rotation objective.
app = replaceRegexRequired(
  app,
  /  const gradRateForGearCombo = \(combo: GearItem\[\]\): number => \{[\s\S]*?\n  \};\n\n  const \[bestBuildResult/,
  `  const gradRateForGearCombo = (combo: GearItem[]): number => {
    const { total: totalDmg } = comboInCombat(combo);
    return baselineScore > 0 ? (totalDmg / baselineScore) * 100 : 0;
  };

  const [bestBuildResult`,
  "DPS-only Best Build objective",
);

// Primary current-build DPS must use the same T96 event model as candidate builds.
app = replaceRegexRequired(
  app,
  /  \/\/ 4\. Compute Rotation list damage[\s\S]*?\n  \/\/ ── Skill Damage Preview/,
  `  // 4. Compute rotation damage. Global T96 Bamboocut-Dust uses the same event
  // timeline as Gear Compare / Best Build so ranking and the displayed DPS cannot drift.
  const rotationStats = useMemo(() => {
    const rotation = getRotationForBuild(selectedBuild);
    const window = getRotationTimeForBuild(selectedBuild);
    const comp = { crit: 0, aff: 0, normal: 0, abrasion: 0 };

    if (selectedBuild === "bamboocut-dust") {
      const simBase: PanelStats = { ...adjustedPanel };
      const d = iwStats;
      simBase.outerPen -= d.outerPen; simBase.pzPen -= d.pzPen; simBase.crit -= d.crit; simBase.aff -= d.aff;
      simBase.dcrit -= d.dcrit; simBase.daff -= d.daff; simBase.critDmg -= d.critDmg; simBase.affDmg -= d.affDmg;
      simBase.outerDmg -= d.outerDmg; simBase.pzDmg -= d.pzDmg; simBase.prec -= d.prec;
      simBase.minOuter -= d.minOuter; simBase.maxOuter -= d.maxOuter;
      simBase.iwGeneralDmg = 0; simBase.iwOuterPen = 0; simBase.iwPzPen = 0; simBase.iwPzDmg = 0;
      const buffs = buildTimelineBuffs(selectedInnerWays, innerWayTiers);
      const timelineResult = simulateTimeline(
        rotation,
        simBase,
        buffs,
        activeTier,
        { set: adjustedPanel.set, datang: false, yishui: false, buildKey: selectedBuild, weaponStars: (adjustedPanel as any).weaponStars, armorSet: (adjustedPanel as any).armorSet } as any,
        window,
      );
      const byName = new Map(timelineResult.perSkill.map((row) => [row.name, row]));
      const items = rotation.map((item) => {
        const row = byName.get(item.name);
        return { ...item, perHit: row && row.casts ? row.dmg / row.casts : 0, total: row?.dmg || 0, breakdown: { crit: 0, aff: 0, normal: 0, abrasion: 0 } };
      });

      // Damage Composition remains a damage-share diagnostic only. It is never an
      // outcome-frequency calibration target and never changes optimizer ranking.
      rotation.forEach((item) => {
        const result = calcSkill(item, adjustedPanel, activeTier, {
          set: adjustedPanel.set,
          datang: false,
          yishui: false,
          buildKey: selectedBuild,
          weaponStars: false,
          armorSet: (adjustedPanel as any).armorSet,
          skillOverride: skillOverrides[item.name],
        } as any);
        comp.crit += result.breakdown.crit; comp.aff += result.breakdown.aff;
        comp.normal += result.breakdown.normal; comp.abrasion += result.breakdown.abrasion;
      });
      const cTot = comp.crit + comp.aff + comp.normal + comp.abrasion || 1;
      return {
        items,
        totalDmg: timelineResult.total,
        dps: timelineResult.dps,
        gradRate: baselineScore > 0 ? timelineResult.total / baselineScore * 100 : 0,
        composition: comp,
        compositionPct: { crit: comp.crit / cTot * 100, aff: comp.aff / cTot * 100, normal: comp.normal / cTot * 100, abrasion: comp.abrasion / cTot * 100 },
      };
    }

    let totalDmg = 0;
    const items = rotation.map((item) => {
      const { perHit, total, breakdown } = calcSkill(item, adjustedPanel, activeTier, {
        set: adjustedPanel.set, datang, yishui, buildKey: selectedBuild,
        weaponStars: (adjustedPanel as any).weaponStars,
        armorSet: (adjustedPanel as any).armorSet,
        skillOverride: skillOverrides[item.name],
      } as any);
      totalDmg += total;
      comp.crit += breakdown.crit; comp.aff += breakdown.aff; comp.normal += breakdown.normal; comp.abrasion += breakdown.abrasion;
      return { ...item, perHit, total, breakdown };
    });
    const cTot = comp.crit + comp.aff + comp.normal + comp.abrasion || 1;
    return {
      items, totalDmg, dps: window > 0 ? totalDmg / window : 0,
      gradRate: baselineScore > 0 ? totalDmg / baselineScore * 100 : 0,
      composition: comp,
      compositionPct: { crit: comp.crit / cTot * 100, aff: comp.aff / cTot * 100, normal: comp.normal / cTot * 100, abrasion: comp.abrasion / cTot * 100 },
    };
  }, [adjustedPanel, activeTier, datang, yishui, selectedBuild, baselineScore, skillOverrides, selectedInnerWays, innerWayTiers, iwStats]);

  // ── Skill Damage Preview`,
  "primary T96 modeled DPS timeline",
);

// Product copy: modeled DPS is the primary metric; Graduation is retained only as
// a secondary legacy reference elsewhere.
app = app.replaceAll("finds the highest-graduation set", "finds the highest modeled-DPS set");
app = app.replaceAll("finds the highest graduation rate", "finds the highest modeled rotation DPS");
app = app.replaceAll("highest graduation rate", "highest modeled rotation DPS");
app = app.replaceAll("which one raises your graduation rate the most", "which replacement raises modeled DPS the most");
app = app.replaceAll("lowest contribution = your weakest piece", "largest negative DPS delta = your weakest slot");
app = app.replaceAll("Re-check Graduation Rate went up.", "Re-check modeled rotation DPS went up.");
app = app.replace('>{best.rate.toFixed(2)}% graduation</span>', '>{Math.round(best.rate / 100 * baselineScore / getRotationTimeForBuild(selectedBuild)).toLocaleString()} DPS</span>');
app = app.replace('>{r.rate.toFixed(2)}%</span>', '>{Math.round(r.rate / 100 * baselineScore / getRotationTimeForBuild(selectedBuild)).toLocaleString()} DPS</span>');
app = app.replace("Runs in the background — you can switch tabs or apps; it won't pause.", "Chunked search keeps the UI responsive while combinations are evaluated.");
app = app.replaceAll("Food buff adds +90/+180 Phys ATK", "Attack food adds +120/+240 Physical ATK");

if (!app.includes("starweavePieces >= 2")) throw new Error("[t96-product] Starweave 2pc was not generated");
if (!app.includes("timelineResult.total")) throw new Error("[t96-product] T96 timeline did not reach product ranking");
if (app.includes("Subtract a tiny penalty per overcap point")) throw new Error("[t96-product] Hidden over-cap ranking penalty remains");
if (app.includes('name: "Stars Align"')) throw new Error("[t96-product] Legacy player-facing Stars Align name remains in set definition");

fs.writeFileSync(appPath, app, "utf8");
console.log("[t96-product] Global T96 panel/set aggregation and event-driven optimizer integration applied.");
