// English display labels for the CN rotation/skill names (e.g. "尘伞完美Q(失魂+5幻鸣+芳歌)").
// The CN strings stay as the functional SKILL_DB / rotation keys — this only prettifies
// what's SHOWN in the Rotations editor & Skill editor. Compositional token replacement
// (weapon + skill + stack notation), so new stack variants translate automatically.
//
// ponytail: covers the Bamboocut-Dust kit + common weapon/mechanic tokens; unknown CN
// chars pass through untouched (graceful partial). Add tokens as other builds need them.

// Longest tokens first so compounds match before their parts.
const TOKENS: [string, string][] = [
  ["骑龙回马打满", "Dragon's Breath Full Strike"],
  ["单次后续流星", "Single Follow-up Meteor"],
  ["首轮流星", "First Meteor"],
  ["箫吟千浪", "Flute of the Tides"],
  ["千营", "Thousand Camps"],
  ["易水歌", "Yishui Song"],
  ["尘绳标", "Rope Dart"],
  ["尘伞", "Umbrella"],
  ["完美", "Perfect"],
  ["共鸣", "Resonance"],
  ["绳舟", "Dart Song"],
  ["失魂", "Soul Loss"],
  ["幻鸣", "Echo"],
  ["芳歌", "Blossom Song"],
  ["气竭", "Exhausted"],
  ["远程", "Ranged"],
  ["流星", "Meteor"],
  ["流血", "Bleed"],
  ["绳标", "Rope Dart"],
  ["双刀", "Twinblades"],
  ["陌刀", "Modao"],
  ["横刀", "Hengdao"],
  ["拳甲", "Gauntlets"],
  ["大唐", "Datang"],
  ["伞", "Umbrella"],
  ["枪", "Spear"],
  ["扇", "Fan"],
  ["剑", "Sword"],
  ["笛", "Flute"],
  ["蓄", "Charge"],
  ["重", "Heavy"],
  ["满", "Max"],
  ["群", "AoE"],
  ["尘", ""], // leftover Bamboocut-Dust prefix
];

export function translateSkillName(cn: string): string {
  if (!cn) return cn;
  let s = cn;
  // Replace each token with a space-padded English word so adjacent CN tokens don't fuse.
  for (const [zh, en] of TOKENS) {
    if (s.includes(zh)) s = s.split(zh).join(" " + en + " ");
  }
  // Space out separators/brackets, collapse, then tighten inside parentheses.
  s = s.replace(/[（(]/g, " ( ").replace(/[）)]/g, " ) ").replace(/[～~]/g, " ~ ").replace(/\+/g, " + ");
  s = s.replace(/\s{2,}/g, " ").trim();
  s = s.replace(/\(\s+/g, "(").replace(/\s+\)/g, ")");
  return s || cn;
}

// ponytail self-check: a real rotation entry becomes readable English, parens kept.
export function demoCheck() {
  const out = translateSkillName("尘伞完美Q(失魂+5幻鸣+芳歌)");
  console.assert(out.includes("Umbrella") && out.includes("Perfect") && out.includes("Echo"), "tokens");
  console.assert(!/[一-鿿]/.test(out), "no CJK left: " + out);
  return out;
}
