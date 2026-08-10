import fs from "node:fs";

const path = "src/App.tsx";
let app = fs.readFileSync(path, "utf8");

const required = (from, to, label) => {
  if (app.includes(to)) return;
  if (!app.includes(from)) throw new Error(`[bamboocut-trust] Missing patch anchor: ${label}`);
  app = app.replace(from, to);
};
const requiredRegex = (re, to, label) => {
  if (typeof to === "string" && app.includes(to)) return;
  if (!re.test(app)) throw new Error(`[bamboocut-trust] Missing regex anchor: ${label}`);
  app = app.replace(re, to);
};

if (!app.includes('from "./data/modelTrust"')) {
  app = `import { BAMBOOCUT_AB_FIXTURES, BAMBOOCUT_MODEL_UNKNOWNS, BAMBOOCUT_SKILL_EVIDENCE, PATH_MODEL_MATURITY, recommendationConfidence } from "./data/modelTrust";\n${app}`;
}

// Combat-only Attunement must not be summed into the displayed Specified Weapon
// Martial row merely because its semantic display name contains the same words.
requiredRegex(
  /(const sumGearSubs = \(gear: GearItem\[\]\)[\s\S]*?item\.subs\.forEach\(?sub\)? => \{\n)(\s*const key = SUB_MAP\[sub\.type\];)/,
  `$1      const isAttunementRow = (sub as any).role === "attunement" || sub.type === "Attuned Bonus" || Boolean((sub as any).attunementId);
      if (isAttunementRow) {
        const value = parseVal(sub.val);
        if (Number.isFinite(value)) sums.attunedBonus = (sums.attunedBonus || 0) + value;
        return;
      }
$2`,
  "attunement aggregation boundary",
);

if (!/const computeGearPanel[\s\S]*?next\.attunedBonus = Number\(gearSum\.attunedBonus\)/.test(app)) {
  requiredRegex(
    /(const computeGearPanel = \([\s\S]*?)(\n\s*return next;\n\s*};)/,
    `$1
  if (gearSum.attunedBonus !== undefined) next.attunedBonus = Number(gearSum.attunedBonus);
$2`,
    "candidate attunement assignment",
  );
}

required(
  'const comboInCombat = (combo: GearItem[], bowOverride?: string): { total: number; crit: number } => {',
  'const comboInCombat = (combo: GearItem[], bowOverride?: string, diagnostics?: { panelOverride?: Partial<PanelStats>; excludedBuffIds?: string[]; disableStarweave?: boolean }): { total: number; crit: number; perSkill?: { name: string; dmg: number }[] } => {',
  "diagnostic evaluator signature",
);
required(
  '    (p as any).weaponStars = weaponSet === "stars";\n\n    if (selectedBuild === "bamboocut-dust") {',
  '    (p as any).weaponStars = weaponSet === "stars";\n    if (diagnostics?.panelOverride) p = { ...p, ...diagnostics.panelOverride };\n\n    if (selectedBuild === "bamboocut-dust") {',
  "panel override hook",
);
required(
  '      const buffs = buildTimelineBuffs(selectedInnerWays, innerWayTiers);\n      const window = getRotationTimeForBuild(selectedBuild);',
  '      const buffs = buildTimelineBuffs(selectedInnerWays, innerWayTiers).filter((buff) => !diagnostics?.excludedBuffIds?.includes(buff.id));\n      const window = getRotationTimeForBuild(selectedBuild);',
  "conditional mechanic exclusion",
);
required(
  '{ set: p.set, datang: false, yishui: false, buildKey: selectedBuild, weaponStars: (p as any).weaponStars, armorSet: (p as any).armorSet, starweaveDistanceBonusPct } as any,\n        window,\n      );\n      return { total: timelineResult.total, crit: p.crit + iwStats.crit };',
  '{ set: p.set, datang: false, yishui: false, buildKey: selectedBuild, weaponStars: diagnostics?.disableStarweave ? false : (p as any).weaponStars, armorSet: (p as any).armorSet, starweaveDistanceBonusPct } as any,\n        window,\n      );\n      return { total: timelineResult.total, crit: p.crit + iwStats.crit, perSkill: timelineResult.perSkill.map((row) => ({ name: row.name, dmg: row.dmg })) };',
  "Bamboocut per-source diagnostics",
);

required(
  '  const currentCompareDps = compareRotationTime > 0\n    ? comboInCombat(equippedGear).total / compareRotationTime\n    : 0;',
  '  const currentCompareCombat = comboInCombat(equippedGear);\n  const currentCompareDps = compareRotationTime > 0 ? currentCompareCombat.total / compareRotationTime : 0;',
  "current combat snapshot",
);
required(
  '    { key: "outerPen", label: "Physical Pen" }, { key: "critDmg", label: "Crit DMG" }, { key: "allArts", label: "All Martial Arts" },\n  ];',
  '    { key: "outerPen", label: "Physical Pen" }, { key: "critDmg", label: "Crit DMG" }, { key: "allArts", label: "All Martial Arts" },\n    { key: "bossDmg", label: "Boss DMG" }, { key: "attunedBonus", label: "Everspring Attunement" },\n  ];',
  "expanded factor fields",
);

if (!app.includes("const modeledSkillLabel = (name: string)")) {
  required(
    '  const compareRows: GearCompareRow[] = activeGear.map((item) => {',
    `  const modeledSkillLabel = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("resonance") || name.includes("共鸣")) return "Resonance";
    if (lower.includes("scarlet spin") || name.includes("完美Q")) return "Scarlet Spin";
    if (lower.includes("burn and bury") || name.includes("绳标")) return "Burn and Bury";
    if (lower.includes("flute") || name.includes("箫")) return "Flute Chanting a Thousand Waves";
    return name;
  };
  const aggregateSkillDps = (rows: { name: string; dmg: number }[] | undefined) => {
    const out = new Map<string, number>();
    for (const row of rows || []) {
      const label = modeledSkillLabel(row.name);
      out.set(label, (out.get(label) || 0) + (compareRotationTime > 0 ? row.dmg / compareRotationTime : 0));
    }
    return out;
  };
  const currentSkillDps = aggregateSkillDps(currentCompareCombat.perSkill);
  const compareRows: GearCompareRow[] = activeGear.map((item) => {`,
    "per-source compare helpers",
  );
}
required(
  '    const candidateDps = compareRotationTime > 0\n      ? comboInCombat(candidateCombo).total / compareRotationTime\n      : 0;',
  '    const candidateCombat = comboInCombat(candidateCombo);\n    const candidateDps = compareRotationTime > 0 ? candidateCombat.total / compareRotationTime : 0;',
  "candidate combat snapshot",
);

if (!app.includes("const factorDeltas = marginalPanelRows.map")) {
  required(
    '    const candidateSetSummary = setSummaryForCombo(candidateCombo);',
    `    const isKnownAB = selectedBuild === "bamboocut-dust" && (item.mastery === 1106 || item.mastery === 1129);
    const marginalPanelRows = isKnownAB ? panelDelta : panelDelta.slice(0, 4);
    const factorDeltas = marginalPanelRows.map((row) => {
      const field = PANEL_COMPARE_FIELDS.find((entry) => entry.label === row.label);
      if (!field || compareRotationTime <= 0) return { label: row.label, dpsDelta: 0, evidence: "MODELED" };
      const reverted = comboInCombat(candidateCombo, undefined, { panelOverride: { [field.key]: Number(currentMenuPanel[field.key] || 0) } });
      return { label: row.label, dpsDelta: candidateDps - reverted.total / compareRotationTime,
        evidence: row.label === "Everspring Attunement" ? "OFFICIAL + MODELED" : "VERIFIED_PANEL + MODELED",
        note: "Leave-one-factor-out marginal effect; interactions mean rows are not additive static weights." };
    });
    if (isKnownAB && compareRotationTime > 0) {
      const outcomeReverted = comboInCombat(candidateCombo, undefined, { panelOverride: { prec: currentMenuPanel.prec, crit: currentMenuPanel.crit, aff: currentMenuPanel.aff } });
      factorDeltas.push({ label: "Outcome probability (Precision/Critical/Affinity)", dpsDelta: candidateDps - outcomeReverted.total / compareRotationTime, evidence: "VERIFIED_PANEL + MODELED", note: "Joint marginal; do not add to individual outcome-stat rows." });

      const candidateSkillDps = aggregateSkillDps(candidateCombat.perSkill);
      const skillNames = new Set([...currentSkillDps.keys(), ...candidateSkillDps.keys()]);
      for (const skillName of skillNames) {
        const dpsDelta = (candidateSkillDps.get(skillName) || 0) - (currentSkillDps.get(skillName) || 0);
        if (Math.abs(dpsDelta) < 0.5) continue;
        factorDeltas.push({ label: skillName, dpsDelta, evidence: BAMBOOCUT_SKILL_EVIDENCE.find((row) => row.source === skillName)?.evidence || "MODELED", note: "Per-source modeled DPS differential; overlaps stat marginals." });
      }

      const fullRankingDelta = candidateDps - currentCompareDps;
      for (const mechanic of [
        { id: "song_of_tang:tang-melody", label: "Song of Tang" },
        { id: "morale_chant:yi-river", label: "Morale Chant" },
        { id: "phantom_rally:phantom-chime", label: "Phantom Chime" },
        { id: "starweave:stacks", label: "Starweave" },
      ]) {
        const disableStarweave = mechanic.id === "starweave:stacks";
        const currentWithout = comboInCombat(equippedGear, undefined, { excludedBuffIds: [mechanic.id], disableStarweave });
        const candidateWithout = comboInCombat(candidateCombo, undefined, { excludedBuffIds: [mechanic.id], disableStarweave });
        const deltaWithout = (candidateWithout.total - currentWithout.total) / compareRotationTime;
        factorDeltas.push({ label: mechanic.label, dpsDelta: fullRankingDelta - deltaWithout, evidence: mechanic.label === "Starweave" ? "VERIFIED_CLIENT + MODELED" : "OFFICIAL + MODELED", note: "Ranking differential with this mechanic removed from both builds." });
      }
    }

    const confidence = recommendationConfidence({ pathKey: selectedBuild, deltaPct,
      panelCalibrated: selectedBuild === "bamboocut-dust" || Boolean(activeScheme?.baseOverride),
      materialUnknowns: selectedBuild === "bamboocut-dust" ? BAMBOOCUT_MODEL_UNKNOWNS : [] });
    const fixtureKey = selectedBuild === "bamboocut-dust" && item.mastery === 1106 ? "1106" : selectedBuild === "bamboocut-dust" && item.mastery === 1129 ? "1129" : null;
    const fixture = fixtureKey ? BAMBOOCUT_AB_FIXTURES[fixtureKey] : null;
    const fixtureDiagnostic = fixture ? { label: fixtureKey as string, observedDps: fixture.observedDps, modeledDps: candidateDps, panelRows: [
      { label: "Min Physical ATK", predicted: candidateMenu.minOuter, observed: fixture.panel.minOuter },
      { label: "Max Physical ATK", predicted: candidateMenu.maxOuter, observed: fixture.panel.maxOuter },
      { label: "Min Attribute ATK", predicted: candidateMenu.minPz, observed: fixture.panel.minPz },
      { label: "Max Attribute ATK", predicted: candidateMenu.maxPz, observed: fixture.panel.maxPz },
      { label: "Precision", predicted: candidateMenu.prec, observed: fixture.panel.prec },
      { label: "Critical", predicted: candidateMenu.crit, observed: fixture.panel.crit },
      { label: "Affinity", predicted: candidateMenu.aff, observed: fixture.panel.aff },
      { label: "Specified Weapon Martial", predicted: candidateMenu.umbMartial, observed: fixture.panel.umbMartial },
    ] } : undefined;
    const candidateSetSummary = setSummaryForCombo(candidateCombo);`,
    "factor/confidence/fixture diagnostics",
  );
}
required(
  '      panelDelta,\n      setChange:',
  '      panelDelta,\n      factorDeltas,\n      confidence: confidence.label,\n      confidenceWhy: confidence.reason,\n      unknowns: confidence.unknowns,\n      fixtureDiagnostic,\n      setChange:',
  "trust payload",
);

// Best Build ranking stays modeled-DPS-only; this is presentation metadata.
if (!app.includes("Best Build recommendation confidence")) {
  if (!app.includes('const best = bestBuildResult[0];')) throw new Error("[bamboocut-trust] Best Build anchor missing");
  app = app.replace('const best = bestBuildResult[0];', `const best = bestBuildResult[0];
                          const bestModeledDps = best ? best.rate / 100 * baselineScore / getRotationTimeForBuild(selectedBuild) : 0;
                          const bestDeltaPct = rotationStats.dps > 0 ? (bestModeledDps - rotationStats.dps) / rotationStats.dps * 100 : 0;
                          const bestConfidence = recommendationConfidence({ pathKey: selectedBuild, deltaPct: bestDeltaPct, panelCalibrated: selectedBuild === "bamboocut-dust" || Boolean(activeScheme?.baseOverride), materialUnknowns: selectedBuild === "bamboocut-dust" ? BAMBOOCUT_MODEL_UNKNOWNS : [] });
                          const pathMaturity = PATH_MODEL_MATURITY[selectedBuild];
                          // Best Build recommendation confidence`);
  app = app.replace('>{Math.round(best.rate / 100 * baselineScore / getRotationTimeForBuild(selectedBuild)).toLocaleString()} DPS</span>', `>{Math.round(bestModeledDps).toLocaleString()} DPS</span>
                              <div className="text-[11px] text-slate-500 mt-1">Delta vs current: {bestDeltaPct >= 0 ? "+" : ""}{bestDeltaPct.toFixed(2)}% · Confidence: <strong>{bestConfidence.label}</strong>{pathMaturity ? <> · {pathMaturity.ownership} · {pathMaturity.maturity}</> : null}</div>`);
}

for (const marker of ["factorDeltas,", "fixtureDiagnostic,", "next.attunedBonus = Number(gearSum.attunedBonus)", "Best Build recommendation confidence"]) {
  if (!app.includes(marker)) throw new Error(`[bamboocut-trust] generated marker missing: ${marker}`);
}

fs.writeFileSync(path, app, "utf8");
console.log("[bamboocut-trust] PASS — trust/confidence hardening applied.");
