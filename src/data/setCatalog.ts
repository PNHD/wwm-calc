export type GlobalSetFamily = "weapon-accessory" | "armor";
export type SetNumericalAvailability = "modeled" | "reference-only" | "unavailable";

export interface GlobalSetDefinition {
  id: string;
  name: string;
  family: GlobalSetFamily;
  numericalAvailability: SetNumericalAvailability;
  provenance: string;
  stat2pc?: Partial<Record<"minOuter" | "maxOuter" | "crit" | "aff" | "prec", number>>;
  desc2pc?: string;
  desc4pc?: string;
}

const PO_SWITCH_SET_FIXTURE = "Product Owner current Global-client Switch Set screenshots, 2026-09-14";
const REPO_EFFECT_EVIDENCE = "Accepted baseline repository effect metadata; identity retained only where the player-facing name matches";
const T96_SET_STAT_EVIDENCE = "Global T96 roll-cap table; independently corroborated by current public set data at pinned 2026-09-15 revisions";

export const CURRENT_GLOBAL_SET_CATALOG: readonly GlobalSetDefinition[] = [
  { id: "hawkwing", name: "Hawkwing", family: "weapon-accessory", numericalAvailability: "reference-only", provenance: `${PO_SWITCH_SET_FIXTURE}; ${T96_SET_STAT_EVIDENCE}`, stat2pc: { aff: 4.5 }, desc2pc: "2/4: +4.5% Affinity Rate", desc4pc: "4/4 effect retained as reference only; no event-uptime model is verified." },
  { id: "starweave", name: "Starweave", family: "weapon-accessory", numericalAvailability: "modeled", provenance: `${PO_SWITCH_SET_FIXTURE}; ${T96_SET_STAT_EVIDENCE}; current Global tooltip evidence in the accepted baseline`, stat2pc: { minOuter: 77.8 }, desc2pc: "2/4: Min Physical ATK +77.8", desc4pc: "4/4: modeled only for the verified five-stack Martial Art Skill component." },
  { id: "jadeware", name: "Jadeware", family: "weapon-accessory", numericalAvailability: "reference-only", provenance: `${PO_SWITCH_SET_FIXTURE}; ${T96_SET_STAT_EVIDENCE}; 4/4 target-Qi gate and uptime remain unresolved`, stat2pc: { maxOuter: 77.8 }, desc2pc: "2/4: Max Physical ATK +77.8", desc4pc: "4/4 is reference only until player/target Qi, trigger uptime, and effect scope are explicit." },
  { id: "rainwhisper", name: "Rainwhisper", family: "weapon-accessory", numericalAvailability: "modeled", provenance: `${PO_SWITCH_SET_FIXTURE}; ${T96_SET_STAT_EVIDENCE}; ${REPO_EFFECT_EVIDENCE}`, stat2pc: { prec: 8 }, desc2pc: "2/4: +8.0% Precision Rate" },
  { id: "cleftpeak", name: "Cleftpeak", family: "weapon-accessory", numericalAvailability: "unavailable", provenance: `${PO_SWITCH_SET_FIXTURE}; ${T96_SET_STAT_EVIDENCE}`, stat2pc: { minOuter: 77.8 }, desc2pc: "2/4: Min Physical ATK +77.8" },
  { id: "mistwillow", name: "Mistwillow", family: "weapon-accessory", numericalAvailability: "reference-only", provenance: `${PO_SWITCH_SET_FIXTURE}; ${T96_SET_STAT_EVIDENCE}`, stat2pc: { prec: 8 }, desc2pc: "2/4: +8.0% Precision Rate" },
  { id: "ivorybloom", name: "Ivorybloom", family: "weapon-accessory", numericalAvailability: "modeled", provenance: `${PO_SWITCH_SET_FIXTURE}; ${T96_SET_STAT_EVIDENCE}; ${REPO_EFFECT_EVIDENCE}`, stat2pc: { crit: 9 }, desc2pc: "2/4: +9.0% Critical Rate" },
  { id: "swallowcall", name: "Swallowcall", family: "weapon-accessory", numericalAvailability: "reference-only", provenance: `${PO_SWITCH_SET_FIXTURE}; ${T96_SET_STAT_EVIDENCE}; 4/4 needs action tags and target-Qi state`, stat2pc: { minOuter: 77.8 }, desc2pc: "2/4: Min Physical ATK +77.8", desc4pc: "4/4 is reference only until Light/Rodent tagging and target-Qi state are modeled." },
  { id: "etherwrath", name: "Etherwrath", family: "weapon-accessory", numericalAvailability: "unavailable", provenance: `${PO_SWITCH_SET_FIXTURE}; ${T96_SET_STAT_EVIDENCE}`, stat2pc: { minOuter: 77.8 }, desc2pc: "2/4: Min Physical ATK +77.8" },
  { id: "swift-gale", name: "Swift Gale", family: "weapon-accessory", numericalAvailability: "reference-only", provenance: `${PO_SWITCH_SET_FIXTURE}; ${T96_SET_STAT_EVIDENCE}`, stat2pc: { maxOuter: 77.8 }, desc2pc: "2/4: Max Physical ATK +77.8" },
  { id: "swaying-heights", name: "Swaying Heights", family: "weapon-accessory", numericalAvailability: "reference-only", provenance: `${PO_SWITCH_SET_FIXTURE}; ${T96_SET_STAT_EVIDENCE}; 4/4 needs target-HP state`, stat2pc: { minOuter: 77.8 }, desc2pc: "2/4: Min Physical ATK +77.8", desc4pc: "4/4 is reference only until target HP is evaluated per damage action." },
  { id: "tiltrim", name: "Tiltrim", family: "weapon-accessory", numericalAvailability: "unavailable", provenance: `${PO_SWITCH_SET_FIXTURE}; ${T96_SET_STAT_EVIDENCE}; official Global Version 2.1 update establishes current Bamboocut-Draught availability, but no 4/4 effect values were supplied`, stat2pc: { minOuter: 77.8 }, desc2pc: "2/4: Min Physical ATK +77.8" },

  { id: "eaglerise", name: "Eaglerise", family: "armor", numericalAvailability: "unavailable", provenance: `${PO_SWITCH_SET_FIXTURE}; accepted baseline contains conflicting numerical hooks, so the effect model is closed` },
  { id: "formbend", name: "Formbend", family: "armor", numericalAvailability: "unavailable", provenance: `${PO_SWITCH_SET_FIXTURE}; accepted baseline description and numerical hook conflict` },
  { id: "moonflare", name: "Moonflare", family: "armor", numericalAvailability: "reference-only", provenance: `${PO_SWITCH_SET_FIXTURE}; ${REPO_EFFECT_EVIDENCE}` },
  { id: "ebonward", name: "Ebonward", family: "armor", numericalAvailability: "unavailable", provenance: PO_SWITCH_SET_FIXTURE },
  { id: "beyond-the-chill", name: "Beyond the Chill", family: "armor", numericalAvailability: "reference-only", provenance: `${PO_SWITCH_SET_FIXTURE}; ${REPO_EFFECT_EVIDENCE}` },
  { id: "whirlsnow", name: "Whirlsnow", family: "armor", numericalAvailability: "reference-only", provenance: `${PO_SWITCH_SET_FIXTURE}; ${REPO_EFFECT_EVIDENCE}` },
  { id: "calmwaters", name: "Calmwaters", family: "armor", numericalAvailability: "reference-only", provenance: `${PO_SWITCH_SET_FIXTURE}; ${REPO_EFFECT_EVIDENCE}` },
  { id: "jadeclasp", name: "Jadeclasp", family: "armor", numericalAvailability: "unavailable", provenance: PO_SWITCH_SET_FIXTURE },
  { id: "honorbound", name: "Honorbound", family: "armor", numericalAvailability: "unavailable", provenance: PO_SWITCH_SET_FIXTURE },
  { id: "ripple-step", name: "Ripple Step", family: "armor", numericalAvailability: "unavailable", provenance: PO_SWITCH_SET_FIXTURE },
  { id: "flawless-guardian", name: "Flawless Guardian", family: "armor", numericalAvailability: "unavailable", provenance: PO_SWITCH_SET_FIXTURE },
  { id: "brimflow", name: "Brimflow", family: "armor", numericalAvailability: "unavailable", provenance: `${PO_SWITCH_SET_FIXTURE}; official Global Version 2.1 update establishes current Bamboocut-Draught availability, but no effect values were supplied` },
] as const;

export const WEAPON_ACCESSORY_SETS = CURRENT_GLOBAL_SET_CATALOG.filter((set) => set.family === "weapon-accessory");
export const ARMOR_SETS = CURRENT_GLOBAL_SET_CATALOG.filter((set) => set.family === "armor");

export interface LegacySetAlias {
  from: string;
  family: GlobalSetFamily;
  to: string;
  provenance: string;
}

export const LEGACY_SET_ALIASES: readonly LegacySetAlias[] = [
  { from: "stars", family: "weapon-accessory", to: "starweave", provenance: "accepted baseline metadata names internal stars as Starweave" },
  { from: "eaglerise", family: "weapon-accessory", to: "hawkwing", provenance: "accepted baseline metadata names weapon-family internal eaglerise as Hawkwing" },
  { from: "stormrain", family: "armor", to: "eaglerise", provenance: "accepted baseline metadata names armor-family internal stormrain as Eaglerise" },
  { from: "swiftgale", family: "weapon-accessory", to: "swift-gale", provenance: "exact player-facing name match" },
  { from: "swallowreturn", family: "weapon-accessory", to: "swaying-heights", provenance: "accepted baseline metadata names internal swallowreturn as Swaying Heights" },
  { from: "beyondchill", family: "armor", to: "beyond-the-chill", provenance: "exact player-facing name match" },
] as const;

export const UNMAPPED_LEGACY_SET_IDS = [
  "shakenhill",
  "obsidian",
  "jadeembrace",
  "agilesteps",
  "flawlessdef",
  "ironweave",
] as const;

export const setFamilyForSlot = (slot: string): GlobalSetFamily =>
  ["Umbrella", "Rope Dart", "Pendant", "Disc"].includes(slot) ? "weapon-accessory" : "armor";

export const getCurrentGlobalSet = (id?: string): GlobalSetDefinition | undefined =>
  CURRENT_GLOBAL_SET_CATALOG.find((set) => set.id === id);

export const canonicalizeSetId = (id: string, family: GlobalSetFamily): string => {
  const current = getCurrentGlobalSet(id);
  if (current?.family === family) return current.id;
  return LEGACY_SET_ALIASES.find((alias) => alias.from === id && alias.family === family)?.to ?? id;
};

export const setEffectModelUnavailable = (id?: string): boolean => {
  if (!id || id === "none") return false;
  const set = getCurrentGlobalSet(id);
  return !set || set.numericalAvailability !== "modeled";
};
