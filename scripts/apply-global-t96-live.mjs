import fs from "node:fs";

const files = {
  calc: "src/utils/calc.ts",
  app: "src/App.tsx",
  arsenal: "src/product/workspaces/ArsenalWorkspace.tsx",
  data: "src/data/wwmData.ts",
};

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function write(path, content) {
  fs.writeFileSync(path, content, "utf8");
}

function replaceRequired(source, from, to, label) {
  if (source.includes(to)) return source;
  if (!source.includes(from)) throw new Error(`[global-t96-live] Missing patch anchor: ${label}`);
  return source.replace(from, to);
}

// User-provided Global screenshots prove that current Tier 96 uses the Lv100
// Upper (100上) stat sheet:
// - Judgment Resistance 65%
// - base Affinity 17.8%
// - Attribute Penetration 22
// - Attribute DMG Bonus 11%
let calc = read(files.calc);
calc = replaceRequired(
  calc,
  '  "350|0.45-t96": makeTier(t96, 350, 20, 24, "Tier 96 Global 2.0", "Excel 各等级模板: 95上 / Global 2.0", false),',
  '  "350|0.45-t96": makeTier(t96, 350, 20, 24, "Lv95 Upper Legacy Reference (not current Global T96)", "Excel 各等级模板: 95上", true),',
  "retire incorrect 95-upper mapping",
);
calc = replaceRequired(
  calc,
  '  "405|0.65b": makeTier(t100U, 405, 26, 28, "Tier 96 / Lv100 Upper CN Ref", "Excel 各等级模板: 100上", true, 131, 263, 120, 240, 150),',
  '  "405|0.65b": makeTier(t100U, 405, 26, 28, "Tier 96 / Lv100 Global 2.0", "Global in-game calibration + Excel 各等级模板: 100上", false, 131, 263, 120, 240, 150),',
  "activate 100-upper Global tier",
);
calc = replaceRequired(
  calc,
  'const t96 = TIERS["350|0.45-t96"];',
  'const t96 = TIERS["405|0.65b"];',
  "baseline current tier",
);
write(files.calc, calc);

let app = read(files.app);
app = replaceRequired(
  app,
  'import { WWM_DATA } from "./data/wwmData";',
  'import { WWM_DATA } from "./data/wwmData";\nimport { GLOBAL_T96_OBSERVED_GEAR, GLOBAL_T96_OBSERVED_PANEL, GLOBAL_T96_OBSERVED_PRESET_META } from "./data/globalT96Preset";\nimport { scoreGlobalT96Gear } from "./utils/globalT96Gear";',
  "T96 data imports",
);
app = app.replaceAll('"350|0.45-t96"', '"405|0.65b"');

// Do not relabel legacy numeric presets as T96 when their values remain T91.
app = app.replaceAll('Everspring Umbrella (Tier 96 Basic)', 'Everspring Umbrella (Legacy T91 Basic)');
app = app.replaceAll('Everspring Umbrella (Tier 96 Grad +10)', 'Everspring Umbrella (Legacy T91 Grad +10)');
app = app.replaceAll('Nameless Sword (Tier 96 Grad +10)', 'Nameless Sword (Legacy T91 Grad +10)');

// Keep old graduation allocation/panel targets available, but make their legacy
// status explicit. They are not used as verified T96 roll caps.
app = app.replaceAll('GRAD95_COUNTS', 'LEGACY_GRAD95_COUNTS');
app = app.replaceAll('GRAD95_PANEL', 'LEGACY_GRAD95_PANEL');
app = app.replaceAll('ROLL_95', 'ROLL_T96');
app = app.replaceAll('Max single-substat roll at 95下', 'Verified max single-substat roll at Global T96 / 100上');
app = app.replaceAll('95下 max single-roll per gear substat', 'Global T96 / 100上 max single-roll per gear substat');
app = app.replaceAll('legacy T91 roll units until the full T96 roll table is verified', 'verified Global T96 / 100上 roll units');
app = app.replaceAll('Global T91 maximum roll', 'Global T96 maximum roll');

app = replaceRequired(
  app,
  'const ROLL_T96: Record<string, number> = { strength: 40.4, agility: 40.4, power: 40.4 };',
  'const ROLL_T96: Record<string, number> = { strength: 49.4, agility: 49.4, power: 49.4 };',
  "T96 five-attribute rolls",
);
app = replaceRequired(
  app,
  'const MAX_ROLL_T96: Partial<Record<keyof PanelStats, number>> = {\n  maxOuter: 63.8, minOuter: 63.8,\n  crit: 7.4, aff: 3.6, prec: 6.6,\n  outerPen: 9.0, pzPen: 10.8,\n  maxPz: 36.2, minPz: 36.2,\n  strength: 40.4, agility: 40.4, power: 40.4,\n  bossDmg: 2.6, allArts: 2.6,\n  umbMartial: 5.0, ropeMartial: 5.0, swordMartial: 5.0, spearMartial: 5.0,\n  fanMartial: 5.0, twinbladesMartial: 5.0, modaoMartial: 5.0, hengdaoMartial: 5.0,\n  gauntletsMartial: 5.0,\n};',
  'const MAX_ROLL_T96: Partial<Record<keyof PanelStats, number>> = {\n  maxOuter: 77.8, minOuter: 77.8,\n  crit: 9.0, aff: 4.4, prec: 8.0,\n  outerPen: 11.0, pzPen: 13.0,\n  maxPz: 44.2, minPz: 44.2,\n  strength: 49.4, agility: 49.4, power: 49.4,\n  bossDmg: 3.2, allArts: 3.2,\n  umbMartial: 6.2, ropeMartial: 6.2, swordMartial: 6.2, spearMartial: 6.2,\n  fanMartial: 6.2, twinbladesMartial: 6.2, modaoMartial: 6.2, hengdaoMartial: 6.2,\n  gauntletsMartial: 6.2, attunedBonus: 6.0,\n};',
  "T96 complete roll table",
);

// Update every stat-priority/transmute candidate that still carried a T91 roll.
app = app.replaceAll('roll: 63.8', 'roll: 77.8');
app = app.replaceAll('roll: 9.0, unit: "%"', 'roll: 11.0, unit: "%"');
app = app.replaceAll('roll: 7.4, unit: "%"', 'roll: 9.0, unit: "%"');
app = app.replaceAll('roll: 3.6, unit: "%"', 'roll: 4.4, unit: "%"');
app = app.replaceAll('roll: 6.6, unit: "%"', 'roll: 8.0, unit: "%"');
app = app.replaceAll('roll: 36.2, unit: ""', 'roll: 44.2, unit: ""');
app = app.replaceAll('roll: 2.6, unit: "%"', 'roll: 3.2, unit: "%"');
app = app.replaceAll('{ key: "prec", label: "Precision", roll: 6.6, isPct: true }', '{ key: "prec", label: "Precision", roll: 8.0, isPct: true }');
app = app.replaceAll('{ key: "maxPz", label: "Bamboocut Atk", roll: 36.2, isPct: false }', '{ key: "maxPz", label: "Bamboocut Atk", roll: 44.2, isPct: false }');
app = app.replaceAll('{ key: "bossDmg", label: "Boss DMG", roll: 2.6, isPct: true }', '{ key: "bossDmg", label: "Boss DMG", roll: 3.2, isPct: true }');
app = app.replaceAll('{ key: "allArts", label: "All Martial Arts", roll: 2.6, isPct: true }', '{ key: "allArts", label: "All Martial Arts", roll: 3.2, isPct: true }');
app = app.replaceAll('"Max Phys Atk": "63.8", "Min Phys Atk": "63.8",', '"Max Phys Atk": "77.8", "Min Phys Atk": "77.8",');
app = app.replaceAll('"Crit Rate": "7.4%",', '"Crit Rate": "9.0%",');
app = app.replaceAll('"Phys Pen": "9.0%", "Affinity Rate": "3.6%",', '"Phys Pen": "11.0%", "Affinity Rate": "4.4%",');
app = app.replaceAll('"Precision": "6.6%",', '"Precision": "8.0%",');
app = app.replaceAll('"Strength": "40.4", "Power": "40.4", "Agility": "40.4",', '"Strength": "49.4", "Power": "49.4", "Agility": "49.4",');

// Confirmed from the observed Global T96 panel and the 65% resistance formula.
app = app.replaceAll(
  '⚡ Crit Rate → need 116%+ panel to cap at 80% eff (÷1.45)',
  '⚡ Crit Rate → need about 132% panel to cap at 80% effective (÷1.65)',
);
app = app.replaceAll(
  '🍖 Food buff adds +90/+180 Phys ATK — always use before raids',
  '🍖 T96 model: food adds +120/+240 Phys ATK before percentage scaling',
);
app = app.replaceAll(
  '🎯 Affinity Rate → aim for 58%+ panel to cap 40% eff at T96',
  '🎯 Affinity Rate → aim for about 66% panel to cap 40% effective at T96',
);
app = app.replaceAll(
  'Physical Penetration. Net pen = panel - boss phys resist (20 at T96). Target net: 31.2%+',
  'Physical Penetration. The T96 reference target currently uses 26 Physical Resistance; confirm against the selected boss.',
);
app = app.replaceAll(
  'Critical Rate. Effective crit = panel ÷ (1 + Judge Resist). At T96: need 116%+ panel for 80% eff cap.',
  'Critical Rate. Effective crit = panel ÷ 1.65 at current Global T96; about 132% panel reaches the 80% cap.',
);
app = app.replaceAll(
  'Affinity Rate. Cap: 40% effective. At T96 need ~58% panel.',
  'Affinity Rate. Cap: 40% effective. At current Global T96, about 66% panel reaches the cap.',
);
app = app.replaceAll(
  'Precision Rate. Base 65% not reduced by resist. Panel 116% → ~100% effective. Cap = 100%.',
  'Precision Rate. Effective = 65% + (panel − 65%) ÷ 1.65. About 122.8% panel reaches 100% at Global T96.',
);
app = app.replaceAll('Edition: Global (T91 now / T96 preview)', 'Edition: Global 2.0 · Tier 96');
app = app.replaceAll('Global (T91 now / T96 preview)', 'Global 2.0 · Tier 96');
app = app.replaceAll('General Theorycrafting Guide · T91 Global (http://spongem.com/yysls/)', 'General Theorycrafting Guide · T96 Global 2.0');
app = app.replaceAll('e.g., 51.2% for T91', 'use the selected T96 boss resistance; exact dungeon caps remain encounter-specific');
app = app.replaceAll(
  'Caps use the verified Global T91 graduated panel from the official sheet. Progress over 100% means you already exceed the target for that stat. Attribute tiles track gear substats.',
  'Class graduation targets are still legacy T91 references. T96 gear quality now uses verified 100上 roll caps; a 100% class-graduation score is not yet an authoritative T96 target.',
);
app = app.replaceAll(
  'Counts are shown as substat units: current = your gear\'s summed value divided by the Global T91 maximum roll; target = the verified Global T91 graduation count for this path. Tuned penetration is tracked separately.',
  'Current substat units use verified Global T96 / 100上 roll caps. Target allocation counts remain a labeled legacy T91 reference until Global T96 graduation distributions are verified.',
);
app = app.replaceAll('Gear Set 1: Basic T91 (Newbie)', 'Gear Set 1: Legacy T91 Sample (Newbie)');

// Attuned armor lines are a separate multiplier from ordinary Umbrella Martial
// Art boost. Keeping them separate prevents the observed 20% attunement total
// from being incorrectly added to the 5.8% weapon line.
app = replaceRequired(
  app,
  '  "All Martial Arts": "allArts",',
  '  "Attuned Bonus": "attunedBonus",\n  "All Martial Arts": "allArts",',
  "attuned stat mapping",
);
app = replaceRequired(
  app,
  '    "All Martial Arts": 1,',
  '    "Attuned Bonus": 1,\n    "All Martial Arts": 1,',
  "attuned stat step",
);

// Explainable T96 gear score: 50% verified roll quality, 35% build fit,
// 15% modeled contribution. Existing DPS removal analysis remains separate.
app = replaceRequired(
  app,
  '      const score = getGearItemCompareStats(item).totalGradDelta;\n      const grade = score >= 7 ? "S" : score >= 5.5 ? "A" : score >= 4 ? "B" : score >= 2 ? "C" : "D";',
  '      const contribution = getGearItemCompareStats(item).totalGradDelta;\n      const quality = scoreGlobalT96Gear(item.subs, selectedBuild, contribution);\n      const score = quality.overall;\n      const grade = score >= 90 ? "S" : score >= 80 ? "A" : score >= 68 ? "B" : score >= 52 ? "C" : "D";',
  "arsenal T96 score",
);
app = replaceRequired(
  app,
  '        grade,\n        score,',
  '        grade,\n        score,\n        rollQuality: quality.rollQuality,\n        buildFit: quality.buildFit,\n        modeledContribution: quality.modeledContribution,\n        recognizedLines: quality.recognizedLines,\n        usefulLines: quality.usefulLines,\n        unknownLines: quality.unknownLines,\n        sourceLabel: quality.sourceLabel,\n        warnings: quality.warnings,',
  "arsenal score details",
);
app = app.replaceAll(
  'score: getGearItemCompareStats(item).totalGradDelta,\n      dpsLoss,',
  'score: scoreGlobalT96Gear(item.subs, selectedBuild, getGearItemCompareStats(item).totalGradDelta).overall,\n      dpsLoss,',
);

// Add an explicit observed preset without making it the graduation target.
app = replaceRequired(
  app,
  '            <button type="button" onClick={() => setIsGameImportOpen(true)}>Import game</button>',
  '            <button type="button" onClick={() => {\n              const now = Date.now();\n              const character: Character = {\n                id: `char-t96-${now}`,\n                name: GLOBAL_T96_OBSERVED_PRESET_META.name,\n                schemes: [{\n                  id: `scheme-t96-${now}`,\n                  name: GLOBAL_T96_OBSERVED_PRESET_META.scheme,\n                  panel: { ...GLOBAL_T96_OBSERVED_PANEL } as PanelStats,\n                  gear: GLOBAL_T96_OBSERVED_GEAR.map((item) => ({ ...item, subs: item.subs.map((sub) => ({ ...sub })) })) as GearItem[],\n                }],\n              };\n              const next = { ...charsData, chars: [...charsData.chars, character], activeCharId: character.id, activeSchemeId: character.schemes[0].id };\n              setCharsData(next);\n              setPanel({ ...GLOBAL_T96_OBSERVED_PANEL } as PanelStats);\n              setSelectedBuild(GLOBAL_T96_OBSERVED_PRESET_META.buildKey);\n              setTierKey(GLOBAL_T96_OBSERVED_PRESET_META.tierKey);\n              setSelectedInnerWays(["", "", "", ""]);\n              localStorage.setItem("wwm_chars_v3", JSON.stringify(next));\n            }}>Load observed T96</button>\n            <button type="button" onClick={() => setIsGameImportOpen(true)}>Import game</button>',
  "observed preset action",
);
write(files.app, app);

let arsenal = read(files.arsenal);
arsenal = replaceRequired(
  arsenal,
  '  score: number;\n}',
  '  score: number;\n  rollQuality?: number;\n  buildFit?: number;\n  modeledContribution?: number;\n  recognizedLines?: number;\n  usefulLines?: number;\n  unknownLines?: number;\n  sourceLabel?: string;\n  warnings?: string[];\n}',
  "arsenal row score fields",
);
arsenal = replaceRequired(
  arsenal,
  '<header><div><span className="product-kicker">Selected gear</span><h2>{selectedItem.name}</h2><p>{selectedItem.slotLabel} / {selectedItem.setName} / {selectedItem.quality}</p></div><strong>{selectedItem.grade}<small>{selectedItem.score.toFixed(2)}%</small></strong></header>',
  '<header><div><span className="product-kicker">Selected gear</span><h2>{selectedItem.name}</h2><p>{selectedItem.slotLabel} / {selectedItem.setName} / {selectedItem.quality}</p></div><strong>{selectedItem.grade}<small>{selectedItem.score.toFixed(1)} T96 score</small></strong></header>',
  "selected item score label",
);
arsenal = replaceRequired(
  arsenal,
  '        <div className="gear-inspector-layout">\n          <div className="gear-inspector-stats">',
  '        <div className="gear-inspector-layout">\n          <div className="gear-inspector-advice"><small>{selectedItem.sourceLabel ?? "Gear score"}</small><strong>{selectedItem.usefulLines ?? 0}/{selectedItem.recognizedLines ?? selectedItem.subs.length} useful verified lines</strong><span>Roll quality {(selectedItem.rollQuality ?? 0).toFixed(1)}% · Build fit {(selectedItem.buildFit ?? 0).toFixed(1)}% · Modeled contribution {(selectedItem.modeledContribution ?? 0).toFixed(1)}%</span>{selectedItem.warnings?.map((warning) => <span key={warning}>{warning}</span>)}</div>\n          <div className="gear-inspector-stats">',
  "score explanation panel",
);
arsenal = arsenal.replaceAll('% graduation contribution', ' T96 gear score');
write(files.arsenal, arsenal);

let data = read(files.data);
data = replaceRequired(
  data,
  '"extractedFor": "Where Winds Meet Global 2.0 — Tier 96 current dataset (column 95上), with Tier 91 legacy comparison (95下)",',
  '"extractedFor": "Where Winds Meet Global 2.0 — current Tier 96 uses column 100上; columns 95下/95上 remain legacy references",',
  "data current tier metadata",
);
data = replaceRequired(
  data,
  '"note": "Class graduation panels remain legacy/CN-derived references. Tier constants cover 95上 as current Global T96 and 95下 as legacy T91; unpublished Global coefficients must be verified in game before being treated as authoritative."',
  '"note": "Global screenshots verify 100上 for current T96 base/effective-rate constants and the workbook supplies verified 100上 roll caps. Class graduation panels and encounter resistance values remain legacy/CN-derived references until validated with Global dummy parses."',
  "data calibration caveat",
);
write(files.data, data);

console.log("[global-t96-live] Lv100 Upper constants, T96 rolls, observed preset, and explainable gear scoring applied.");
