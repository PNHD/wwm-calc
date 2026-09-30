import fs from "node:fs";

const path = "src/App.tsx";
let app = fs.readFileSync(path, "utf8");
const stale = "const value = parseVal(sub.val);";
const fixed = 'const value = Number.parseFloat(String(sub.val ?? "").replace("%", ""));';

if (!app.includes(fixed)) {
  if (!app.includes(stale)) {
    throw new Error("[bamboocut-attunement-runtime] Attunement parse anchor missing");
  }
  app = app.replace(stale, fixed);
}

if (app.includes(stale)) {
  throw new Error("[bamboocut-attunement-runtime] undefined parseVal dependency remains in generated App");
}

if (!app.includes("  getAttunementContribution,")) {
  app = app.replace("  getWeaponAttunementById,", "  getWeaponAttunementById,\n  getAttunementContribution,");
}
app = app.replace("const sumGearSubs = (gear: GearItem[]):", 'const sumGearSubs = (gear: GearItem[], buildKey = "bamboocut-dust"):');
app = app.replace("const sums: Partial<Record<keyof PanelStats, number>> = {};", "const sums: Partial<Record<keyof PanelStats, number>> = { attunedBonus: 0 };");
app = app.replace('if (Number.isFinite(value)) sums.attunedBonus = (sums.attunedBonus || 0) + value;',
  'const contribution = getAttunementContribution(sub, buildKey);\n        if (Number.isFinite(value) && contribution) sums[contribution.key] = (sums[contribution.key] || 0) + contribution.value;');
app = app.replace('ownElement?: string): PanelStats => {\n  const gearSum = sumGearSubs(gear);',
  'ownElement?: string, buildKey = "bamboocut-dust"): PanelStats => {\n  const gearSum = sumGearSubs(gear, buildKey);');
app = app.replaceAll('activeScheme?.baseOverride, innerAttrName(selectedBuild))', 'activeScheme?.baseOverride, innerAttrName(selectedBuild), selectedBuild)');
app = app.replace('const gearSum = sumGearSubs(equipped);', 'const gearSum = sumGearSubs(equipped, selectedBuild);');
app = app.replace('const observedGearSum = sumGearSubs(observedEquipped);', 'const observedGearSum = sumGearSubs(observedEquipped, "bamboocut-dust");');

fs.writeFileSync(path, app, "utf8");
console.log("[bamboocut-attunement-runtime] PASS — Attunement uses a local numeric parse and cannot crash observed-load on undefined parseVal.");
