// Per-skill cast-time / cooldown data for the rotation timeline engine.
//
// Source: extracted from the competitor calculator wherewindsmath.pages.dev
// (by Ruricon). These are CN-client values (~8% off Global on some coefficients,
// but TIMING is version-stable), used only for rotation TIMING (how long a skill
// locks you / how often it can be cast) — NOT for damage (damage stays on the
// verified calcSkill formula). This is the data layer for the Rotations editor /
// Team builder; the engine maps a rotation skill to its timing via lookupTiming().
//
// Standalone data module — no import of calc/App, so it's safe to extend without
// touching the verified formula or shared UI.

export type WeaponKey =
  | "umb" | "rope" | "sword" | "spear" | "fan"
  | "twinblades" | "modao" | "hengdao" | "gauntlets" | "general";

export interface SkillTiming {
  /** Animation / cast lock in seconds (time the skill occupies in the rotation). */
  castTime: number;
  /** Hits per cast, where the source specifies it. */
  hits?: number;
  /** Cooldown in seconds, if the skill is cooldown-gated (not just cast-locked). */
  cooldown?: number;
  /** Per-second/channel duration for DoT/channel skills (e.g. drone, rope charge). */
  duration?: number;
  weapon: WeaponKey;
  note?: string;
}

// Canonical timing table (keys = competitor skill ids). castTime in seconds.
export const SKILL_TIMING: Record<string, SkillTiming> = {
  // ── Umbrella (bamboocut family) ─────────────────────────────────────────
  UmbQ:               { castTime: 0.55, hits: 1, weapon: "umb", note: "basic Q" },
  UmbQ_Catch:         { castTime: 0.6,  hits: 1, weapon: "umb", note: "empowered catch" },
  UmbQ_Perfect:       { castTime: 0.55, hits: 1, weapon: "umb", note: "perfect catch" },
  UmbQ_Martial_1BW:   { castTime: 0.3,  hits: 1, weapon: "umb" },
  UmbQ_Martial_2BW:   { castTime: 1.5,  hits: 1, weapon: "umb" },
  UmbQ_Main_3BW:      { castTime: 3.766, hits: 2, weapon: "umb", note: "2BW main, 2 hits" },
  UmbCharged:         { castTime: 2.45, hits: 6, weapon: "umb", note: "windUp 0.833 + recovery 0.617" },
  UmbEmpoweredCharged:{ castTime: 1.25, hits: 1, weapon: "umb" },
  UmbSpecial:         { castTime: 0.817, hits: 1, weapon: "umb", note: "R derivation" },
  UmbDrone:           { castTime: 0,    hits: 10, duration: 7, weapon: "umb", note: "drone, ticks over 7s" },
  SoulshadeMartial_2h:{ castTime: 2.7,  hits: 2, weapon: "umb" },
  SoulshadeMartial_3h:{ castTime: 1.6667, hits: 3, weapon: "umb" },
  Resonance:          { castTime: 0.6,  hits: 1, weapon: "umb", note: "共鸣; injected proc, short lock estimate" },

  // ── Rope Dart ───────────────────────────────────────────────────────────
  RopeDartCharged:    { castTime: 0, hits: 10, duration: 10, weapon: "rope", note: "channel, 10 ticks / 10s" },
  RopeDartSpecial:    { castTime: 0.8, hits: 1, weapon: "rope", note: "dart song; lock estimate" },

  // ── Other weapons (for future builds; CN basics) ─────────────────────────
  FanAttack:          { castTime: 0.1,  hits: 1, weapon: "fan" },
  FanLightCharged:    { castTime: 1.2,  hits: 2, weapon: "fan" },
  FanQ:               { castTime: 0.85, hits: 1, weapon: "fan" },
  FanSpecial:         { castTime: 0.95, hits: 4, weapon: "fan" },
  SwordAttack:        { castTime: 0.5,  hits: 1, weapon: "sword" },
  SwordCharged:       { castTime: 1.1,  hits: 4, weapon: "sword" },
  SwordQ:             { castTime: 0.85, hits: 1, weapon: "sword" },
  SwordHeavy:         { castTime: 2.0,  hits: 6, weapon: "sword" },
  SpearAttack:        { castTime: 0.4333, hits: 1, weapon: "spear" },
  SpearQ:             { castTime: 1.1333, hits: 1, weapon: "spear" },
  SpearHeavy:         { castTime: 0.817, hits: 1, weapon: "spear" },
  SpearSpecial:       { castTime: 0.867, hits: 1, weapon: "spear" },
  MoBladeAttack:      { castTime: 0.7,  hits: 1, weapon: "modao" },
};

// Default lock used when a rotation skill has no timing entry (GCD-ish estimate).
export const DEFAULT_CAST_TIME = 0.6;

// Keyword rules mapping a rotation skill's CORE name (English OR CN) → a canonical
// timing key. The app's rotation names embed conditions in parentheses, e.g.
// "尘伞完美Q(失魂+5幻鸣+远程笛)" or "Scarlet Spin (5 Echo)" — those tokens (失魂
// soul, 幻鸣 echo, Echo) are MODIFIERS, not the skill identity, so lookupTiming
// strips the "(...)" part before matching. Best-effort; the Rotations editor
// (Phase 2) will use an explicit per-build map instead of this heuristic.
// Order matters (first match wins) — most specific first.
const NAME_RULES: { match: RegExp; key: keyof typeof SKILL_TIMING }[] = [
  { match: /resonance|共鸣/i, key: "Resonance" },
  { match: /rope dart special|尘绳标/i, key: "RopeDartSpecial" },
  { match: /rope dart charged|响指/i, key: "RopeDartCharged" },
  { match: /flute|笛|tides/i, key: "UmbSpecial" },
  { match: /soul (sweep|break)|soulshade|嗟夫/i, key: "SoulshadeMartial_3h" },
  { match: /perfect|完美/i, key: "UmbQ_Perfect" },
  { match: /charged|dragon'?s breath|蓄力|蓄/i, key: "UmbCharged" },
  { match: /scarlet spin|尘伞|umbrella.*q|伞q/i, key: "UmbQ" },
  { match: /drone|幻伞/i, key: "UmbDrone" },
];

/**
 * Best-effort timing lookup for a rotation skill name (English or CN).
 * Strips the "(...)" condition suffix, then keyword-matches the core name.
 * Falls back to a default GCD-ish lock if unmatched.
 */
export function lookupTiming(skillName: string): SkillTiming {
  if (skillName in SKILL_TIMING) return SKILL_TIMING[skillName]; // exact canonical key
  const core = skillName.replace(/[（(].*$/s, "").trim(); // drop "(...)" / "（...）" conditions
  for (const r of NAME_RULES) {
    if (r.match.test(core)) return SKILL_TIMING[r.key];
  }
  return { castTime: DEFAULT_CAST_TIME, hits: 1, weapon: "general", note: "default (unmatched)" };
}
