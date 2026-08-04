import fs from "node:fs";

const files = {
  calc: "src/utils/calc.ts",
  app: "src/App.tsx",
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
app = app.replaceAll('"350|0.45-t96"', '"405|0.65b"');

// Do not relabel legacy numeric presets as T96 when their values remain T91.
app = app.replaceAll('Everspring Umbrella (Tier 96 Basic)', 'Everspring Umbrella (Legacy T91 Basic)');
app = app.replaceAll('Everspring Umbrella (Tier 96 Grad +10)', 'Everspring Umbrella (Legacy T91 Grad +10)');
app = app.replaceAll('Nameless Sword (Tier 96 Grad +10)', 'Nameless Sword (Legacy T91 Grad +10)');

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
app = app.replaceAll(
  'Edition: Global (T91 now / T96 preview)',
  'Edition: Global 2.0 · Tier 96',
);
app = app.replaceAll(
  'Global (T91 now / T96 preview)',
  'Global 2.0 · Tier 96',
);
app = app.replaceAll(
  'General Theorycrafting Guide · T91 Global (http://spongem.com/yysls/)',
  'General Theorycrafting Guide · T96 Global 2.0',
);
app = app.replaceAll(
  'e.g., 51.2% for T91',
  'use the selected T96 boss resistance; exact dungeon caps remain encounter-specific',
);
app = app.replaceAll(
  'Caps use the verified Global T91 graduated panel from the official sheet. Progress over 100% means you already exceed the target for that stat. Attribute tiles track gear substats.',
  'The remaining graduation caps are legacy T91 references while verified T96 class targets are being collected. Do not treat a 100% score as an authoritative T96 graduation threshold yet.',
);
app = app.replaceAll(
  'Counts are shown as substat units: current = your gear\'s summed value divided by the Global T91 maximum roll; target = the verified Global T91 graduation count for this path. Tuned penetration is tracked separately.',
  'Counts currently use legacy T91 roll units until the full T96 roll table is verified. Tuned penetration is tracked separately.',
);
app = app.replaceAll(
  'Gear Set 1: Basic T91 (Newbie)',
  'Gear Set 1: Legacy T91 Sample (Newbie)',
);
write(files.app, app);

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
  '"note": "Global screenshots verify 100上 for current T96 base/effective-rate constants. Class graduation panels and encounter resistance values remain legacy/CN-derived references until validated with Global dummy parses."',
  "data calibration caveat",
);
write(files.data, data);

console.log("[global-t96-live] Lv100 Upper constants and observed Global thresholds applied.");
