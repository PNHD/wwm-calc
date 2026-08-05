import fs from "node:fs";

const files = {
  app: "src/App.tsx",
  calc: "src/utils/calc.ts",
  preset: "src/data/globalT96Preset.ts",
};

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function write(path, content) {
  fs.writeFileSync(path, content, "utf8");
}

function replaceRequired(source, from, to, label) {
  if (source.includes(to)) return source;
  if (!source.includes(from)) throw new Error(`[video-evidence] Missing patch anchor: ${label}`);
  return source.replace(from, to);
}

let app = read(files.app);
app = replaceRequired(app, 'name: "Stars Align"', 'name: "Starweave"', "current Starweave name");
app = replaceRequired(
  app,
  'stat2pc: { minOuter: 64 },           // ✅ confirmed T91',
  'stat2pc: { minOuter: 78 },           // ✅ Global T96 client tooltip',
  "Starweave T96 two-piece value",
);
app = replaceRequired(
  app,
  'desc2pc: "2/4: Min Physical ATK +64"',
  'desc2pc: "2/4: Min Physical ATK +78 (effective from Lv.96)"',
  "Starweave two-piece description",
);
app = app.replaceAll("Stars Align", "Starweave");
app = app.replaceAll("Stars align", "Starweave");
write(files.app, app);

let calc = read(files.calc);
calc = replaceRequired(
  calc,
  '// Stars Align is a WEAPON set (2pc on weapons) — independent of armor 4pc.\n  // Apply if user-selected armor set is "stars" OR if opts.weaponStars=true (auto-detected from equipped weapons).\n  const csBonus = (set === "stars" || (opts as any).weaponStars) ? 0.15 : 0;',
  '// Starweave is the current Global name for the legacy internal key "stars".\n  // Five stacks of the explicit +3% Martial Art Skill component = +15%.\n  // The separate distance component (above 4m, up to +1% at 8m per tooltip)\n  // is intentionally not hidden inside this constant; target distance needs an\n  // explicit scenario input before it can be credited safely.\n  const csBonus = (set === "stars" || (opts as any).weaponStars) ? 0.15 : 0;',
  "Starweave combat-model note",
);
write(files.calc, calc);

let preset = read(files.preset);
for (const id of ["t96-observed-helmet", "t96-observed-chest", "t96-observed-greaves", "t96-observed-bracers"]) {
  const from = `id: "${id}",`;
  const start = preset.indexOf(from);
  if (start < 0) throw new Error(`[video-evidence] Missing observed item ${id}`);
  const next = preset.indexOf("  {\n    id:", start + from.length);
  const end = next < 0 ? preset.indexOf("] as const;", start) : next;
  const block = preset.slice(start, end);
  if (!block.includes('set: "calmwaters"')) {
    if (!block.includes('set: "none"')) throw new Error(`[video-evidence] Missing set anchor for ${id}`);
    preset = preset.slice(0, start) + block.replace('set: "none"', 'set: "calmwaters"') + preset.slice(end);
  }
}

const spareChest = `  {
    id: "t96-observed-chest-1129",
    slot: "Chest",
    name: "Nightfarer Armor 1129",
    quality: "gold",
    set: "calmwaters",
    mastery: 1129,
    isEquipped: false,
    subs: [
      { type: "Crit Rate", val: "7.3%" },
      { type: "Agility", val: "46.4" },
      { type: "Min Phys Atk", val: "61.4" },
      { type: "Max Phys Atk", val: "67.3", isTuned: true },
      { type: "Min Bamboocut Atk", val: "35.6" },
      { type: "Attuned Bonus", val: "5.2%" },
    ],
  },
`;
if (!preset.includes('id: "t96-observed-chest-1129"')) {
  const anchor = `  {
    id: "t96-observed-greaves",`;
  if (!preset.includes(anchor)) throw new Error("[video-evidence] Missing observed greaves insertion anchor");
  preset = preset.replace(anchor, spareChest + anchor);
}

preset = replaceRequired(
  preset,
  'note: "Captured without food, medicine, party, guild, or temporary buffs. Static Inner Way attributes are included in the raw panel; keep Inner Ways empty until the exact four tooltips are imported.",',
  'note: "The default panel is the unbuffed 1106-chest capture. The preset also contains the observed 1129 chest as a spare candidate. Phantom Rally, Morale Chant, Towline Sweep, Song of Tang, Starweave, and Calmwaters are all backed by current Global client evidence.",',
  "observed preset evidence note",
);
write(files.preset, preset);

console.log("[video-evidence] Starweave naming, T96 set tooltip values, Calmwaters ownership, and the 1129 A/B candidate applied.");
