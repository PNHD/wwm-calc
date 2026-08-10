import fs from "node:fs";

const path = "src/App.tsx";
let source = fs.readFileSync(path, "utf8");

const replacement = `  const compareRotationTime = getRotationTimeForBuild(selectedBuild);
  const currentCompareDps = compareRotationTime > 0
    ? comboInCombat(equippedGear).total / compareRotationTime
    : 0;
  const menuPanelForCombo = (combo: GearItem[]) => {
    const p = computeGearPanel(panel, combo, activeScheme?.baseOverride, innerAttrName(selectedBuild));
    p.outerPen += iwStats.outerPen; p.pzPen += iwStats.pzPen; p.crit += iwStats.crit; p.aff += iwStats.aff;
    p.dcrit += iwStats.dcrit; p.daff += iwStats.daff; p.critDmg += iwStats.critDmg; p.affDmg += iwStats.affDmg;
    p.outerDmg += iwStats.outerDmg; p.pzDmg += iwStats.pzDmg; p.prec += iwStats.prec;
    p.minOuter += iwStats.minOuter; p.maxOuter += iwStats.maxOuter;
    p.iwGeneralDmg = 0; p.iwOuterPen = iwStats.outerPen; p.iwPzPen = iwStats.pzPen; p.iwPzDmg = iwStats.pzDmg;
    const sets = detectSet4pc(combo);
    p.set = sets.weaponSet; (p as any).armorSet = sets.armorSet; (p as any).weaponStars = sets.weaponSet === "stars";
    return p;
  };
  const currentMenuPanel = menuPanelForCombo(equippedGear);
  const setSummaryForCombo = (combo: GearItem[]) => {
    const sets = detectSet4pc(combo);
    return \`Weapon: \${getSetName(sets.weaponSet)} · Armor: \${getSetName(sets.armorSet)}\`;
  };
  const currentSetSummary = setSummaryForCombo(equippedGear);
  const attunementSummary = (gear?: GearItem) => {
    if (!gear) return "None";
    const rows = gear.subs.filter((sub) => (sub as any).role === "attunement" || /martial art skill dmg boost|attunement/i.test((sub as any).displayName || sub.type));
    return rows.length ? rows.map((sub) => \`\${(sub as any).displayName || sub.type} \${sub.val}\`).join("; ") : "None";
  };
  const PANEL_COMPARE_FIELDS: { key: keyof PanelStats; label: string }[] = [
    { key: "minOuter", label: "Min Physical ATK" }, { key: "maxOuter", label: "Max Physical ATK" },
    { key: "minPz", label: "Min Attribute ATK" }, { key: "maxPz", label: "Max Attribute ATK" },
    { key: "prec", label: "Precision" }, { key: "crit", label: "Critical" }, { key: "aff", label: "Affinity" },
    { key: "outerPen", label: "Physical Pen" }, { key: "critDmg", label: "Crit DMG" }, { key: "allArts", label: "All Martial Arts" },
  ];
  const compareRows: GearCompareRow[] = activeGear.map((item) => {
    const candidateCombo = [
      ...equippedGear.filter((candidate) => candidate.slot !== item.slot),
      item,
    ];
    const candidateDps = compareRotationTime > 0
      ? comboInCombat(candidateCombo).total / compareRotationTime
      : 0;
    const deltaDps = candidateDps - currentCompareDps;
    const deltaPct = currentCompareDps > 0 ? deltaDps / currentCompareDps * 100 : 0;
    const current = activeGear.find((candidate) => candidate.slot === item.slot && isItemEquipped(candidate, activeGear));
    const candidateMenu = menuPanelForCombo(candidateCombo);
    const panelDelta = PANEL_COMPARE_FIELDS.map(({ key, label }) => {
      const currentValue = Number(currentMenuPanel[key] || 0);
      const candidateValue = Number(candidateMenu[key] || 0);
      return { label, current: currentValue, candidate: candidateValue, delta: candidateValue - currentValue };
    }).filter((row) => Math.abs(row.delta) >= 0.05).sort((left, right) => Math.abs(right.delta) - Math.abs(left.delta));
    const candidateSetSummary = setSummaryForCombo(candidateCombo);
    const currentAttunement = attunementSummary(current);
    const candidateAttunement = attunementSummary(item);
    const reasonStats = panelDelta.slice(0, 3).map((row) => \`\${row.label} \${row.delta >= 0 ? "+" : ""}\${row.delta.toFixed(1)}\`).join(", ");
    const reason = item.id === current?.id
      ? "Current complete-build baseline."
      : \`\${deltaDps >= 0 ? "Rotation gain" : "Rotation loss"} after the same 60s combat timeline\${reasonStats ? \`; largest menu-panel changes: \${reasonStats}\` : ""}.\`;
    return {
      id: item.id,
      slot: item.slot,
      slotLabel: getSlotLabel(item.slot),
      name: item.name,
      image: (item.slot === "Umbrella" || item.slot === "Rope Dart") ? getWeaponIconUrlByType(item.weaponType, item.slot, selectedBuild) : SLOT_IMAGES[item.slot],
      setName: getSetName(item.set),
      subs: item.subs.map((sub) => ({ type: (sub as any).displayName || sub.type, value: sub.val, tuned: Boolean((sub as any).isRetuned ?? sub.isTuned) })),
      modeledDps: candidateDps,
      deltaDps,
      deltaPct,
      panelDelta,
      setChange: candidateSetSummary === currentSetSummary ? "No 4pc ownership change" : \`\${currentSetSummary} → \${candidateSetSummary}\`,
      attunementChange: currentAttunement === candidateAttunement ? "No slot Attunement change" : \`\${currentAttunement} → \${candidateAttunement}\`,
      reason,
      equipped: current?.id === item.id,
    };
  });
  const gearAnalysis`;

if (!source.includes("const menuPanelForCombo = (combo: GearItem[])")) {
  const pattern = /  const compareRotationTime = getRotationTimeForBuild\(selectedBuild\);[\s\S]*?\n  const gearAnalysis/;
  if (!pattern.test(source)) throw new Error("[t96-compare] Generated complete-build compare block not found");
  source = source.replace(pattern, replacement);
}

if (!source.includes("panelDelta,")) throw new Error("[t96-compare] Panel delta was not generated");
if (!source.includes("setChange:")) throw new Error("[t96-compare] Set change explanation was not generated");
if (!source.includes("attunementChange:")) throw new Error("[t96-compare] Attunement explanation was not generated");

fs.writeFileSync(path, source, "utf8");
console.log("[t96-compare] PASS — complete-build Gear Compare exposes menu-panel, set, Attunement and DPS reasoning.");
