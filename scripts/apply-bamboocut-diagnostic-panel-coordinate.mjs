import fs from "node:fs";

const path = "src/App.tsx";
let app = fs.readFileSync(path, "utf8");

const replaceRequired = (from, to, label) => {
  if (app.includes(to)) return;
  if (!app.includes(from)) throw new Error(`[bamboocut-diagnostic-panel] Missing anchor: ${label}`);
  app = app.replace(from, to);
};

// Build the exact pre-timeline panel used by comboInCombat. Diagnostic reverts
// must use this coordinate system directly; deriving it from the rendered menu
// panel is unsafe because the observed preset and Inner Way presentation can
// contain already-resolved/static contributions.
if (!app.includes("const comparePanelForDiagnostics = (combo: GearItem[])")) {
  replaceRequired(
    "  const currentSkillDps = aggregateSkillDps(currentCompareCombat.perSkill);\n  const compareRows: GearCompareRow[] = activeGear.map((item) => {",
    `  const currentSkillDps = aggregateSkillDps(currentCompareCombat.perSkill);
  const comparePanelForDiagnostics = (combo: GearItem[]): PanelStats => {
    const p = computeGearPanel(panel, combo, activeScheme?.baseOverride, innerAttrName(selectedBuild));
    if (food) { p.minOuter += activeTier.foodMin; p.maxOuter += activeTier.foodMax; }
    if (bowSelect === "crit") p.crit += 3.7;
    else if (bowSelect === "prec") p.prec += 3.3;
    else if (bowSelect === "aff") p.aff += 1.8;
    const { weaponSet, armorSet } = detectSet4pc(combo);
    p.set = weaponSet;
    (p as any).armorSet = armorSet;
    (p as any).weaponStars = weaponSet === "stars";
    return p;
  };
  const currentDiagnosticPanel = comparePanelForDiagnostics(equippedGear);
  const compareRows: GearCompareRow[] = activeGear.map((item) => {`,
    "exact diagnostic panel helper",
  );
}

replaceRequired(
  "Number(currentMenuPanel[field.key] || 0) - Number((iwStats as any)[field.key] || 0)",
  "Number(currentDiagnosticPanel[field.key] || 0)",
  "single-factor exact panel coordinate",
);
replaceRequired(
  "prec: currentMenuPanel.prec - iwStats.prec, crit: currentMenuPanel.crit - iwStats.crit, aff: currentMenuPanel.aff - iwStats.aff",
  "prec: currentDiagnosticPanel.prec, crit: currentDiagnosticPanel.crit, aff: currentDiagnosticPanel.aff",
  "joint outcome exact panel coordinate",
);

if (!app.includes("const currentDiagnosticPanel = comparePanelForDiagnostics(equippedGear)")) {
  throw new Error("[bamboocut-diagnostic-panel] exact current diagnostic panel missing");
}
if (app.includes("currentMenuPanel[field.key] || 0) - Number((iwStats as any)[field.key]")) {
  throw new Error("[bamboocut-diagnostic-panel] inferred UI-coordinate revert remains");
}

fs.writeFileSync(path, app, "utf8");
console.log("[bamboocut-diagnostic-panel] PASS — marginal attribution now reverts against the exact pre-timeline combat panel.");
