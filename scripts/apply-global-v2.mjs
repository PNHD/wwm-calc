import fs from "node:fs";

const files = {
  calc: "src/utils/calc.ts",
  app: "src/App.tsx",
  innerways: "src/data/innerways.ts",
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
  if (!source.includes(from)) {
    throw new Error(`[global-v2] Missing patch anchor: ${label}`);
  }
  return source.replace(from, to);
}

function replaceRegexRequired(source, pattern, replacement, label) {
  if (!pattern.test(source)) {
    if (typeof replacement === "string" && source.includes(replacement)) return source;
    throw new Error(`[global-v2] Missing regex patch anchor: ${label}`);
  }
  return source.replace(pattern, replacement);
}

// Tier model: make the existing 95上/T96 dataset the current Global default,
// retain T91 only as a legacy comparison, and stop calling T96 a preview.
let calc = read(files.calc);
calc = replaceRequired(
  calc,
  '"350|0.45": makeTier(t95, 350, 20, 24, "Tier 91 / Lv95 Global", "Excel 各等级模板: 95下"),\n  "350|0.45-t96": makeTier(t96, 350, 20, 24, "Tier 96 / Lv95 Global Preview", "Excel 各等级模板: 95上", true),',
  '"350|0.45": makeTier(t95, 350, 20, 24, "Tier 91 / Lv95 Global (Legacy)", "Excel 各等级模板: 95下", true),\n  "350|0.45-t96": makeTier(t96, 350, 20, 24, "Tier 96 Global 2.0", "Excel 各等级模板: 95上 / Global 2.0", false),',
  "tier labels",
);
calc = replaceRequired(
  calc,
  '// T91 Global parses run 60s on training dummy. Override CN\'s 78.5s default\n  // so DPS expectation matches user-side parses.\n  const T91_OVERRIDE_TIME: Record<string, number> = { "破竹尘": 60.0 };\n  if (T91_OVERRIDE_TIME[cnClass]) return T91_OVERRIDE_TIME[cnClass];',
  '// Global training-dummy parses use a 60s comparison window.\n  const GLOBAL_OVERRIDE_TIME: Record<string, number> = { "破竹尘": 60.0 };\n  if (GLOBAL_OVERRIDE_TIME[cnClass]) return GLOBAL_OVERRIDE_TIME[cnClass];',
  "rotation calibration label",
);
calc = replaceRequired(
  calc,
  '// Global T91 calibration: off-element attribute attack uses the physical ratio.',
  '// Global calibration: off-element attribute attack uses the physical ratio.',
  "off-element calibration label",
);
calc = replaceRequired(
  calc,
  '// T91 Global graduated DPS per build, extracted DIRECTLY from the source spreadsheet\n// (sheet "95级常见流派非竞速养成计算 2025.9.1") that spongem.com is based on.\n// These are the AUTHORITATIVE "fully graduated T91" DPS numbers for each class.\nconst T91_GRAD_DPS: Record<string, number> = {',
  '// Legacy T91 graduated DPS anchors from the source spreadsheet.\n// Global 2.0/T96 does not publish authoritative graduation DPS, so these are\n// normalized against the active tier and shown as an estimate rather than fact.\nconst LEGACY_T91_GRAD_DPS: Record<string, number> = {',
  "graduation baseline declaration",
);
calc = replaceRequired(calc, 'const t91 = TIERS["350|0.45"];', 'const t96 = TIERS["350|0.45-t96"];', "baseline tier variable");
calc = replaceRequired(calc, 'if (!tier || tier.name === t91.name) return 1;', 'if (!tier || tier.name === t96.name) return 1;', "baseline current tier");
calc = replaceRequired(calc, 'const t91Outer = t91.baseMinOuter + t91.baseMaxOuter;', 'const t96Outer = t96.baseMinOuter + t96.baseMaxOuter;', "baseline outer variable");
calc = replaceRequired(calc, 'const outerScale = t91Outer > 0 ? tierOuter / t91Outer : 1;', 'const outerScale = t96Outer > 0 ? tierOuter / t96Outer : 1;', "baseline outer scale");
calc = replaceRequired(calc, 'const t91ElemDmg = 1 + t91.pzDmgBase / 100;', 'const t96ElemDmg = 1 + t96.pzDmgBase / 100;', "baseline element variable");
calc = replaceRequired(calc, 'const elemDmgScale = t91ElemDmg > 0 ? tierElemDmg / t91ElemDmg : 1;', 'const elemDmgScale = t96ElemDmg > 0 ? tierElemDmg / t96ElemDmg : 1;', "baseline element scale");
calc = replaceRequired(calc, 'const t91Pen = penMultiplier(t91.pzPenBase, t91.attrRes);', 'const t96Pen = penMultiplier(t96.pzPenBase, t96.attrRes);', "baseline pen variable");
calc = replaceRequired(calc, 'const penScale = t91Pen > 0 ? tierPen / t91Pen : 1;', 'const penScale = t96Pen > 0 ? tierPen / t96Pen : 1;', "baseline pen scale");
calc = replaceRequired(
  calc,
  'const dps = T91_GRAD_DPS[key] || T91_GRAD_DPS["bamboocut-dust"];\n  // T91 uses exact workbook DPS. Preview/reference tiers use a normalized baseline\n  // so graduation percent compares against the active tier instead of silently\n  // retaining the T91 denominator.',
  'const dps = LEGACY_T91_GRAD_DPS[key] || LEGACY_T91_GRAD_DPS["bamboocut-dust"];\n  // This remains an estimated benchmark until a verified Global T96 graduation\n  // dataset is available. Never present it as an authoritative parse target.',
  "baseline disclaimer",
);
write(files.calc, calc);

// Default the product to T96, including reset and fallback flows. Existing users
// with an explicitly saved tier retain their choice.
let app = read(files.app);
app = app.replaceAll('config?.tierKey ?? "350|0.45"', 'config?.tierKey ?? "350|0.45-t96"');
app = app.replaceAll('setTierKey("350|0.45")', 'setTierKey("350|0.45-t96")');
app = app.replaceAll('TIERS[tierKey] || TIERS["350|0.45"]', 'TIERS[tierKey] || TIERS["350|0.45-t96"]');
app = app.replaceAll('Tier 91 Basic', 'Tier 96 Basic');
app = app.replaceAll('Tier 91 Grad +10', 'Tier 96 Grad +10');
app = app.replaceAll('at T91', 'at T96');
app = app.replaceAll('At T91', 'At T96');
app = app.replaceAll('Best T91 inner way', 'Global 2.0 inner way');
app = app.replaceAll('Mid-tier Optimized T91', 'Legacy T91 Sample (replace with T96 stats)');
app = app.replaceAll('// Naked character-menu panel ("base trần") for a T91/Lv95 Bamboocut-Dust example,', '// Legacy character-menu sample retained only as an editable starting point;');
app = app.replaceAll('// taken directly from the in-game Combat Attributes screen. Inner ways are NOT', '// replace it with the player\'s T96 Combat Attributes. Inner ways are NOT');
write(files.app, app);

// Official Global 2.0 mechanics and Inner Way changes. Descriptions are updated;
// no unpublished coefficient is invented or silently credited to flat panel stats.
let iw = read(files.innerways);
iw = replaceRequired(
  iw,
  'desc:"After casting a Dual-Weapon Skill, gain one of four effects: Crit Rate +10%, Phys Pen +10, Phys DMG +10%, or Min Phys ATK +200. Lasts 10s.",',
  'desc:"After casting a Dual-Weapon Skill, gain one of four effects: Crit Rate +10%, Phys Pen +10, Phys DMG +10%, or Min Phys ATK +200 for 10s. Global 2.0: completing Serene Breeze can also trigger the effect at Tier 4; at Tier 6 Serene Breeze cannot roll Winter.",',
  "Seasonal Edge description",
);
iw = replaceRequired(
  iw,
  'desc:"For Nine-Bend Spirit-Stealing Spear\'s Sorrow Without Wine: Combo count required for buff reduced from 5/10 to 4/8. Each time Sorrow Without Wine hits target with your Bleed, 60/70/80/90/100% chance (based on Bleed stacks) to add 1 extra Combo count.",',
  'desc:"For Nine-Bend Spirit-Stealing Spear\'s Sorrow Without Wine, the combo requirement is reduced. Global 2.0 Tier 6: Sober Sorrow inflicts Soul-Shaken without requiring an existing stack; Wine Gu now requires 3 hits within 3s instead of 5, and further hits refresh duration.",',
  "Wolfchaser description",
);
iw = replaceRequired(
  iw,
  'note:"Core Bellstrike-Umbra. Requires precise timing input.",',
  'note:"Core Bellstrike-Umbra. Global 2.0 Tier 3 guaranteed-Affinity High Bleeding extends eligible active DoTs by 10s, capped at 16s remaining.",',
  "Sword Horizon note",
);
iw = replaceRequired(
  iw,
  'desc:"Vernal Umbrella\'s Spring Sorrow Martial Art Skill can hold up to 2 stacks. Hitting a target applies Combo effect: target takes +10% damage from your Ballistic Skills for 10s. Affected Skills: Let Spring Go, Everbloom, Umbrella Light Attack, Spring Away.",',
  'desc:"Vernal Umbrella\'s Spring Sorrow can hold up to 2 stacks and applies Combo. Global 2.0: Tier 4 Spring Away and Unfading Flower deal +5% damage to Combo-marked non-Arena targets, increased to +10% while Exhausted; Tier 5 was changed from Critical DMG Bonus to Direct Critical Rate.",',
  "Blossom Barrage description",
);
iw = replaceRequired(
  iw,
  'desc:"When hitting 3 or more enemies at once, apply Candle Flicker for 3s (max 5 stacks). Each stack: -4% enemy Movement Speed, +2% damage taken from caster. Triggers once per 0.5s, 1 stack per 0.5s per source.",',
  'desc:"When hitting 3 or more enemies at once, apply Candle Flicker for 3s (max 5 stacks). Each stack: -4% enemy Movement Speed, +2% damage taken from caster. Global 2.0 classifies Exhaustion/Qi-Imbalance vulnerability with boss mechanism DMG boosts; do not add it to the ordinary general-damage bucket.",',
  "vulnerability bucket note",
);
write(files.innerways, iw);

let data = read(files.data);
data = replaceRequired(
  data,
  '// Auto-extracted from 燕云调律计算器 (NGA Violetta). Where Winds Meet Global Lv95/Tier91.',
  '// Auto-extracted from 燕云调律计算器 (NGA Violetta), migrated for Global 2.0 / Tier 96.',
  "data header",
);
data = replaceRequired(
  data,
  '"extractedFor": "Where Winds Meet Global — Lv95 character / Tier 91 gear (column 95下), plus provisional Tier 96 preview from column 95上",',
  '"extractedFor": "Where Winds Meet Global 2.0 — Tier 96 current dataset (column 95上), with Tier 91 legacy comparison (95下)",',
  "data metadata",
);
data = replaceRequired(
  data,
  '"note": "Class graduation panels & marginal gains computed at native CN level (100/105). Tier constants below cover 95下 (T91 Global) and 95上 (provisional T96 preview)."',
  '"note": "Class graduation panels remain legacy/CN-derived references. Tier constants cover 95上 as current Global T96 and 95下 as legacy T91; unpublished Global coefficients must be verified in game before being treated as authoritative."',
  "data caveat",
);
write(files.data, data);

console.log("[global-v2] T96 and official 2.0 mechanics applied.");
