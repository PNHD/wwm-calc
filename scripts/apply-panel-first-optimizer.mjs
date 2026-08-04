import fs from "node:fs";

const files = {
  app: "src/App.tsx",
  scorer: "src/utils/globalT96Gear.ts",
  arsenal: "src/product/workspaces/ArsenalWorkspace.tsx",
};

const read = (path) => fs.readFileSync(path, "utf8");
const write = (path, content) => fs.writeFileSync(path, content, "utf8");

function replaceRequired(source, from, to, label) {
  if (source.includes(to)) return source;
  if (!source.includes(from)) throw new Error(`[panel-first] Missing patch anchor: ${label}`);
  return source.replace(from, to);
}

function replaceRegexRequired(source, pattern, to, label) {
  if (typeof to === "string" && source.includes(to)) return source;
  if (!pattern.test(source)) throw new Error(`[panel-first] Missing regex anchor: ${label}`);
  return source.replace(pattern, to);
}

let app = read(files.app);
app = replaceRequired(
  app,
  'import { SPEEDRUN_BOSSES, SPEEDRUN_PLAYBOOK } from "./data/speedrunGuide";',
  'import { SPEEDRUN_BOSSES, SPEEDRUN_PLAYBOOK } from "./data/speedrunGuide";\nimport { GLOBAL_ATTRIBUTE_CONVERSIONS, PANEL_MODEL_VERSION } from "./data/panelOptimizationEvidence";',
  "panel evidence import",
);

app = replaceRequired(
  app,
  '  baseOverride?: Partial<PanelStats>;\n}',
  '  baseOverride?: Partial<PanelStats>;\n  /** Version of the gear-to-panel projection used to derive baseOverride. */\n  panelModelVersion?: number;\n}',
  "scheme panel model version",
);

app = replaceRegexRequired(
  app,
  /const sumGearSubs = \(gear: GearItem\[\]\): Partial<Record<keyof PanelStats, number>> => \{[\s\S]*?\n\};\n\n\/\/ Back-calculated/,
  `const sumGearSubs = (gear: GearItem[]): Partial<Record<keyof PanelStats, number>> => {
  const sums: Partial<Record<keyof PanelStats, number>> = {};
  gear.forEach(item => {
    item.subs.forEach(sub => {
      const key = SUB_MAP[sub.type];
      if (!key) return;
      const v = parseSubValue(sub.val);
      sums[key] = (sums[key] || 0) + v;
    });
  });

  // Project five-attribute gear lines into the actual menu-panel stats they
  // change. Calibration learns the character-specific residual; subsequent gear
  // swaps then move both the attribute and its converted panel values.
  const power = sums.power || 0;
  const momentum = sums.momentum || 0;
  const agility = sums.agility || 0;
  sums.minOuter = (sums.minOuter || 0)
    + power * GLOBAL_ATTRIBUTE_CONVERSIONS.power.minOuterPerPoint
    + agility * GLOBAL_ATTRIBUTE_CONVERSIONS.agility.minOuterPerPoint;
  sums.maxOuter = (sums.maxOuter || 0)
    + power * GLOBAL_ATTRIBUTE_CONVERSIONS.power.maxOuterPerPoint
    + momentum * GLOBAL_ATTRIBUTE_CONVERSIONS.momentum.maxOuterPerPoint;
  sums.crit = (sums.crit || 0)
    + agility * GLOBAL_ATTRIBUTE_CONVERSIONS.agility.critRatePerPoint;
  sums.aff = (sums.aff || 0)
    + momentum * GLOBAL_ATTRIBUTE_CONVERSIONS.momentum.affinityRatePerPoint;

  return sums;
};

// Back-calculated`,
  "attribute conversion in gear panel",
);

app = replaceRequired(
  app,
  '(data as { chars?: { schemes?: { baseOverride?: Partial<PanelStats> }[] }[] })?.chars?.forEach(c =>',
  '(data as { chars?: { schemes?: { baseOverride?: Partial<PanelStats>; panelModelVersion?: number }[] }[] })?.chars?.forEach(c =>',
  "sanitize calibration version type",
);
app = replaceRequired(
  app,
  '      const b = s?.baseOverride;\n      if (b && ((b.minOuter ?? 0) > (b.maxOuter ?? 0) * 2 || (b.minPz ?? 0) > (b.maxPz ?? 0) * 2)) delete s.baseOverride;',
  '      const b = s?.baseOverride;\n      if (b && s.panelModelVersion !== PANEL_MODEL_VERSION) {\n        delete s.baseOverride;\n        return;\n      }\n      if (b && ((b.minOuter ?? 0) > (b.maxOuter ?? 0) * 2 || (b.minPz ?? 0) > (b.maxPz ?? 0) * 2)) delete s.baseOverride;',
  "invalidate legacy calibration",
);

app = replaceRequired(
  app,
  '{ ...s, baseOverride: override }',
  '{ ...s, baseOverride: override, panelModelVersion: PANEL_MODEL_VERSION }',
  "persist panel model version",
);
app = replaceRequired(
  app,
  '          const { baseOverride, ...rest } = s; return rest as Scheme;',
  '          const { baseOverride, panelModelVersion, ...rest } = s; void baseOverride; void panelModelVersion; return rest as Scheme;',
  "clear panel model version",
);

app = replaceRegexRequired(
  app,
  /  const compareRows: GearCompareRow\[\] = activeGear\.map\(\(item\) => \{[\s\S]*?\n  \}\);\n  const gearAnalysis/,
  `  const compareRotationTime = getRotationTimeForBuild(selectedBuild);
  const currentCompareDps = compareRotationTime > 0
    ? comboInCombat(equippedGear).total / compareRotationTime
    : 0;
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
    return {
      id: item.id,
      slot: item.slot,
      slotLabel: getSlotLabel(item.slot),
      name: item.name,
      image: (item.slot === "Umbrella" || item.slot === "Rope Dart") ? getWeaponIconUrlByType(item.weaponType, item.slot, selectedBuild) : SLOT_IMAGES[item.slot],
      setName: getSetName(item.set),
      subs: item.subs.map((sub) => ({ type: sub.type, value: sub.val, tuned: Boolean(sub.isTuned) })),
      modeledDps: candidateDps,
      deltaDps,
      deltaPct,
      equipped: current?.id === item.id,
    };
  });
  const gearAnalysis`,
  "full replacement gear comparison",
);

write(files.app, app);

let scorer = read(files.scorer);
scorer = replaceRegexRequired(
  scorer,
  /  const overall = gearOrigin === "relaid"[\s\S]*?modeledContribution \* 0\.15;/,
  '  // Item caps are diagnostic only. Build selection is driven by the modeled\n  // panel/rotation contribution, with build-fit used only as a small tie-breaker.\n  const overall = modeledContribution * 0.85 + buildFit * 0.15;',
  "remove cap weighting from item score",
);
scorer = scorer.replace(
  '${unknownLines} line(s) are excluded because no verified Global T96 cap is available.',
  '${unknownLines} line(s) have no cap diagnostic; their entered values still contribute to the panel and optimizer.',
);
scorer = scorer.replace(
  'sourceLabel: gearOrigin === "relaid" ? "Relaid gear · cap pending" : `Global T96 verified · 100上 · ${globalT96GearOriginLabel(gearOrigin)}`',
  'sourceLabel: `Panel-first Global T96 · ${globalT96GearOriginLabel(gearOrigin)}`',
);
write(files.scorer, scorer);

let arsenal = read(files.arsenal);
arsenal = arsenal.replace(
  '{selectedItem.rollQualityAvailable === false ? "Roll quality N/A (Relaid cap needed)" : `Roll quality ${(selectedItem.rollQuality ?? 0).toFixed(1)}%`} · Build fit {(selectedItem.buildFit ?? 0).toFixed(1)}% · Modeled contribution {(selectedItem.modeledContribution ?? 0).toFixed(1)}%',
  'Modeled contribution {(selectedItem.modeledContribution ?? 0).toFixed(1)}% · Build fit {(selectedItem.buildFit ?? 0).toFixed(1)}% · {selectedItem.rollQualityAvailable === false ? "Roll diagnostic N/A" : `Roll diagnostic ${(selectedItem.rollQuality ?? 0).toFixed(1)}%`}',
);
arsenal = arsenal.replaceAll('% graduation contribution', ' panel/rotation contribution');
write(files.arsenal, arsenal);

console.log("[panel-first] Attribute conversion, calibration versioning, full replacement compare, and cap-independent scoring applied.");
