import fs from "node:fs";

const appPath = "src/App.tsx";
let app = fs.readFileSync(appPath, "utf8");

function replaceRequired(source, from, to, label) {
  if (source.includes(to)) return source;
  if (!source.includes(from)) throw new Error(`[bamboocut-trust] Missing patch anchor: ${label}`);
  return source.replace(from, to);
}

function replaceRegexRequired(source, pattern, to, label) {
  if (typeof to === "string" && source.includes(to)) return source;
  if (!pattern.test(source)) throw new Error(`[bamboocut-trust] Missing regex anchor: ${label}`);
  return source.replace(pattern, to);
}

if (!app.includes('from "./data/modelTrust"')) {
  app = `import { BAMBOOCUT_AB_FIXTURES, BAMBOOCUT_MODEL_UNKNOWNS, BAMBOOCUT_SKILL_EVIDENCE, PATH_MODEL_MATURITY, recommendationConfidence } from "./data/modelTrust";\n${app}`;
}

// Attunement is a combat-only mechanic. It must never leak into the menu-panel
// "Specified Weapon Martial" row merely because its semantic displayName contains
// "Martial Art Skill DMG Boost". Legacy Attuned Bonus rows and normalized role
// rows both aggregate into PanelStats.attunedBonus instead.
app = replaceRegexRequired(
  app,
  /(const sumGearSubs = \(gear: GearItem\[\]\)[\s\S]*?item\.subs\.forEach\(?sub\)? => \{\n)(\s*const key = SUB_MAP\[sub\.type\];)/,
  `$1      const semanticRole = (sub as any).role;
      const isAttunementRow = semanticRole === "attunement" || sub.type === "Attuned Bonus" || Boolean((sub as any).attunementId);
      if (isAttunementRow) {
        const rawAttunement = parseVal(sub.val);
        if (Number.isFinite(rawAttunement)) sums.attunedBonus = (sums.attunedBonus || 0) + rawAttunement;
        return;
      }
$2`,
  "attunement aggregation boundary",
);

if (!/const computeGearPanel[\s\S]*?next\.attunedBonus = Number\(gearSum\.attunedBonus\)/.test(app)) {
  app = replaceRegexRequired(
    app,
    /(const computeGearPanel = \([\s\S]*?)(\n\s*return next;\n\s*};)/,
    `$1
  if (gearSum.attunedBonus !== undefined) next.attunedBonus = Number(gearSum.attunedBonus);
$2`,
    "computed panel attunement assignment",
  );
}

// Diagnostic evaluator: ranking remains the exact same timeline. The optional
// overrides are only used to calculate leave-one-factor-out explanations and do
// not alter the winning objective.
app = replaceRequired(
  app,
  'const comboInCombat = (combo: GearItem[], bowOverride?: string): { total: number; crit: number } => {',
  'const comboInCombat = (combo: GearItem[], bowOverride?: string, diagnostics?: { panelOverride?: Partial<PanelStats>; excludedBuffIds?: string[]; disableStarweave?: boolean; excludeSkillName?: string }): { total: number; crit: number; perSkill?: { name: string; dmg: number }[] } => {',
  "diagnostic combo signature",
);

app = replaceRequired(
  app,
  '    (p as any).weaponStars = weaponSet === "stars";\n\n    if (selectedBuild === "bamboocut-dust") {',
  '    (p as any).weaponStars = weaponSet === "stars";\n    if (diagnostics?.panelOverride) p = { ...p, ...diagnostics.panelOverride };\n\n    if (selectedBuild === "bamboocut-dust") {',
  "panel override hook",
);

app = replaceRequired(
  app,
  '      const buffs = buildTimelineBuffs(selectedInnerWays, innerWayTiers);\n      const window = getRotationTimeForBuild(selectedBuild);\n      const timelineResult = simulateTimeline(\n        getRotationForBuild(selectedBuild),',
  '      const buffs = buildTimelineBuffs(selectedInnerWays, innerWayTiers).filter((buff) => !diagnostics?.excludedBuffIds?.includes(buff.id));\n      const window = getRotationTimeForBuild(selectedBuild);\n      const diagnosticRotation = diagnostics?.excludeSkillName\n        ? getRotationForBuild(selectedBuild).filter((item) => item.name !== diagnostics.excludeSkillName)\n        : getRotationForBuild(selectedBuild);\n      const timelineResult = simulateTimeline(\n        diagnosticRotation,',
  "timeline diagnostic filters",
);

app = replaceRequired(
  app,
  '{ set: p.set, datang: false, yishui: false, buildKey: selectedBuild, weaponStars: (p as any).weaponStars, armorSet: (p as any).armorSet } as any,\n        window,\n      );\n      return { total: timelineResult.total, crit: p.crit + iwStats.crit };',
  '{ set: p.set, datang: false, yishui: false, buildKey: selectedBuild, weaponStars: diagnostics?.disableStarweave ? false : (p as any).weaponStars, armorSet: (p as any).armorSet } as any,\n        window,\n      );\n      return { total: timelineResult.total, crit: p.crit + iwStats.crit, perSkill: timelineResult.perSkill.map((row) => ({ name: row.name, dmg: row.dmg })) };',
  "timeline diagnostic result",
);

// Compare gets deterministic confidence and exact marginal diagnostics. Marginal
// stat effects are leave-one-factor-out and intentionally are not presented as
// additive/static weights because outcome interactions exist.
app = replaceRequired(
  app,
  '  const currentCompareDps = compareRotationTime > 0\n    ? comboInCombat(equippedGear).total / compareRotationTime\n    : 0;',
  '  const currentCompareCombat = comboInCombat(equippedGear);\n  const currentCompareDps = compareRotationTime > 0\n    ? currentCompareCombat.total / compareRotationTime\n    : 0;',
  "current compare combat snapshot",
);

app = replaceRequired(
  app,
  '    { key: "outerPen", label: "Physical Pen" }, { key: "critDmg", label: "Crit DMG" }, { key: "allArts", label: "All Martial Arts" },\n  ];',
  '    { key: "outerPen", label: "Physical Pen" }, { key: "critDmg", label: "Crit DMG" }, { key: "allArts", label: "All Martial Arts" },\n    { key: "bossDmg", label: "Boss DMG" }, { key: "attunedBonus", label: "Everspring Attunement" },\n  ];',
  "compare factor fields",
);

if (!app.includes("const modeledSkillLabel = (name: string)")) {
  app = replaceRequired(
    app,
    '  const compareRows: GearCompareRow[] = activeGear.map((item) => {',
    `  const modeledSkillLabel = (name: string) => {
    const lowered = name.toLowerCase();
    if (lowered.includes("resonance") || name.includes("共鸣")) return "Resonance";
    if (lowered.includes("scarlet spin") || name.includes("完美Q")) return "Scarlet Spin";
    if (lowered.includes("burn and bury") || name.includes("绳标")) return "Burn and Bury";
    if (lowered.includes("flute") || name.includes("箫")) return "Flute Chanting a Thousand Waves";
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
    "skill differential helpers",
  );
}

app = replaceRequired(
  app,
  '    const candidateDps = compareRotationTime > 0\n      ? comboInCombat(candidateCombo).total / compareRotationTime\n      : 0;',
  '    const candidateCombat = comboInCombat(candidateCombo);\n    const candidateDps = compareRotationTime > 0\n      ? candidateCombat.total / compareRotationTime\n      : 0;',
  "candidate combat snapshot",
);

if (!app.includes("const factorDeltas = marginalPanelRows.map")) {
  app = replaceRequired(
    app,
    '    const candidateSetSummary = setSummaryForCombo(candidateCombo);',
    `    const marginalPanelRows = (item.mastery === 1106 || item.mastery === 1129) ? panelDelta : panelDelta.slice(0, 4);
    const factorDeltas = marginalPanelRows.map((row) => {
      const field = PANEL_COMPARE_FIELDS.find((entry) => entry.label === row.label);
      if (!field || compareRotationTime <= 0) return { label: row.label, dpsDelta: 0, evidence: "MODELED" };
      const reverted = comboInCombat(candidateCombo, undefined, { panelOverride: { [field.key]: Number(currentMenuPanel[field.key] || 0) } });
      return {
        label: row.label,
        dpsDelta: candidateDps - reverted.total / compareRotationTime,
        evidence: row.label === "Everspring Attunement" ? "OFFICIAL + MODELED" : "VERIFIED_PANEL + MODELED",
        note: "Leave-one-factor-out marginal effect. Interactions mean marginal rows are not additive static weights.",
      };
    });
    if (compareRotationTime > 0 && selectedBuild === "bamboocut-dust" && (item.mastery === 1106 || item.mastery === 1129)) {
      const outcomeReverted = comboInCombat(candidateCombo, undefined, { panelOverride: { prec: currentMenuPanel.prec, crit: currentMenuPanel.crit, aff: currentMenuPanel.aff } });
      factorDeltas.push({
        label: "Outcome probability (Precision/Critical/Affinity)",
        dpsDelta: candidateDps - outcomeReverted.total / compareRotationTime,
        evidence: "VERIFIED_PANEL + MODELED",
        note: "Joint marginal. Do not add it to the individual Precision/Critical/Affinity rows.",
      });
      const candidateSkillDps = aggregateSkillDps(candidateCombat.perSkill);
      const skillNames = new Set([...currentSkillDps.keys(), ...candidateSkillDps.keys()]);
      for (const skillName of skillNames) {
        const delta = (candidateSkillDps.get(skillName) || 0) - (currentSkillDps.get(skillName) || 0);
        if (Math.abs(delta) < 0.5) continue;
        const evidence = BAMBOOCUT_SKILL_EVIDENCE.find((row) => row.source === skillName)?.evidence || "MODELED";
        factorDeltas.push({ label: skillName, dpsDelta: delta, evidence, note: "Per-source modeled DPS differential; overlaps stat marginals by design." });
      }
      const fullRankingDelta = candidateDps - currentCompareDps;
      const mechanicChecks = [
        { id: "song_of_tang:tang-melody", label: "Song of Tang" },
        { id: "morale_chant:yi-river", label: "Morale Chant" },
        { id: "phantom_rally:phantom-chime", label: "Phantom Chime" },
        { id: "starweave:stacks", label: "Starweave" },
      ];
      for (const mechanic of mechanicChecks) {
        const disableStarweave = mechanic.id === "starweave:stacks";
        const currentWithout = comboInCombat(equippedGear, undefined, { excludedBuffIds: [mechanic.id], disableStarweave });
        const candidateWithout = comboInCombat(candidateCombo, undefined, { excludedBuffIds: [mechanic.id], disableStarweave });
        const deltaWithout = (candidateWithout.total - currentWithout.total) / compareRotationTime;
        factorDeltas.push({
          label: mechanic.label,
          dpsDelta: fullRankingDelta - deltaWithout,
          evidence: mechanic.label === "Starweave" ? "VERIFIED_CLIENT + MODELED" : "OFFICIAL + MODELED",
          note: "Differential ranking impact: full build delta minus the delta with this mechanic removed from both builds.",
        });
      }
    }
    const confidence = recommendationConfidence({
      pathKey: selectedBuild,
      deltaPct,
      panelCalibrated: selectedBuild === "bamboocut-dust" || Boolean(activeScheme?.baseOverride),
      materialUnknowns: selectedBuild === "bamboocut-dust" ? BAMBOOCUT_MODEL_UNKNOWNS : [],
    });
    const fixtureKey = selectedBuild === "bamboocut-dust" && item.mastery === 1106 ? "1106" : selectedBuild === "bamboocut-dust" && item.mastery === 1129 ? "1129" : null;
    const fixture = fixtureKey ? BAMBOOCUT_AB_FIXTURES[fixtureKey] : null;
    const fixtureDiagnostic = fixture ? {
      label: fixtureKey as string,
      observedDps: fixture.observedDps,
      modeledDps: candidateDps,
      panelRows: [
        { label: "Min Physical ATK", predicted: candidateMenu.minOuter, observed: fixture.panel.minOuter },
        { label: "Max Physical ATK", predicted: candidateMenu.maxOuter, observed: fixture.panel.maxOuter },
        { label: "Min Attribute ATK", predicted: candidateMenu.minPz, observed: fixture.panel.minPz },
        { label: "Max Attribute ATK", predicted: candidateMenu.maxPz, observed: fixture.panel.maxPz },
        { label: "Precision", predicted: candidateMenu.prec, observed: fixture.panel.prec },
        { label: "Critical", predicted: candidateMenu.crit, observed: fixture.panel.crit },
        { label: "Affinity", predicted: candidateMenu.aff, observed: fixture.panel.aff },
        { label: "Specified Weapon Martial", predicted: candidateMenu.umbMartial, observed: fixture.panel.umbMartial },
      ],
    } : undefined;
    const candidateSetSummary = setSummaryForCombo(candidateCombo);`,
    "marginal and fixture diagnostics",
  );
}

app = replaceRequired(
  app,
  '      panelDelta,\n      setChange:',
  '      panelDelta,\n      factorDeltas,\n      confidence: confidence.label,\n      confidenceWhy: confidence.reason,\n      unknowns: confidence.unknowns,\n      fixtureDiagnostic,\n      setChange:',
  "compare trust payload",
);

// Best Build remains modeled-DPS ordered. Add a trust summary next to the winner
// without changing ranking or introducing Mastery/roll-cap tie breakers.
if (!app.includes("Best Build recommendation confidence")) {
  app = app.replace(
    'const best = bestBuildResult[0];',
    `const best = bestBuildResult[0];
                          const bestModeledDps = best ? best.rate / 100 * baselineScore / getRotationTimeForBuild(selectedBuild) : 0;
                          const bestDeltaPct = rotationStats.dps > 0 ? (bestModeledDps - rotationStats.dps) / rotationStats.dps * 100 : 0;
                          const bestConfidence = recommendationConfidence({ pathKey: selectedBuild, deltaPct: bestDeltaPct, panelCalibrated: selectedBuild === "bamboocut-dust" || Boolean(activeScheme?.baseOverride), materialUnknowns: selectedBuild === "bamboocut-dust" ? BAMBOOCUT_MODEL_UNKNOWNS : [] });
                          const pathMaturity = PATH_MODEL_MATURITY[selectedBuild];
                          // Best Build recommendation confidence`,
  );
  app = app.replace(
    '>{Math.round(best.rate / 100 * baselineScore / getRotationTimeForBuild(selectedBuild)).toLocaleString()} DPS</span>',
    `>{Math.round(bestModeledDps).toLocaleString()} DPS</span>
                              <div className="text-[11px] text-slate-500 mt-1">Delta vs current: {bestDeltaPct >= 0 ? "+" : ""}{bestDeltaPct.toFixed(2)}% · Confidence: <strong>{bestConfidence.label}</strong>{pathMaturity ? <> · {pathMaturity.ownership} · {pathMaturity.maturity}</> : null}</div>`,
  );
}

if (!app.includes("factorDeltas,")) throw new Error("[bamboocut-trust] factor diagnostics missing");
if (!app.includes("fixtureDiagnostic,")) throw new Error("[bamboocut-trust] observed-vs-modeled fixture diagnostics missing");
if (!app.includes("next.attunedBonus = Number(gearSum.attunedBonus)")) throw new Error("[bamboocut-trust] attunement was not separated from menu rows");
if (!app.includes("Best Build recommendation confidence")) throw new Error("[bamboocut-trust] Best Build confidence missing");

fs.writeFileSync(appPath, app, "utf8");
console.log("[bamboocut-trust] PASS — attunement boundary, confidence, marginal DPS, fixture diagnostics and Best Build trust applied.");
