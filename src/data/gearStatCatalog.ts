const CURRENT_WEAPON_ART_LABELS = [
  "Art of Umbrella DMG Boost",
  "Art of Rope Dart DMG Boost",
  "Art of Sword DMG Boost",
  "Art of Spear DMG Boost",
  "Art of Fan DMG Boost",
  "Art of Dual Blades DMG Boost",
  "Art of Mo Blade DMG Boost",
  "Art of Heng Blade DMG Boost",
  "Art of Gauntlets DMG Boost",
] as const;

const LEGACY_STAT_ALIASES: Record<string, string> = Object.fromEntries([
  ["Max Phys Atk", "Max Physical Attack"],
  ["Min Phys Atk", "Min Physical Attack"],
  ["Phys Pen", "Physical Penetration"],
  ...CURRENT_WEAPON_ART_LABELS.map((label) => [label.replace(" DMG Boost", " Boost"), label]),
]);

export const canonicalGearStatType = (type: string): string => LEGACY_STAT_ALIASES[type] ?? type;

export const isPercentageGearStat = (type: string): boolean => {
  const canonical = canonicalGearStatType(type);
  return CURRENT_WEAPON_ART_LABELS.includes(canonical as typeof CURRENT_WEAPON_ART_LABELS[number])
    || canonical.includes("Skill DMG Boost");
};

export const formatGearStatValue = (type: string, value: string): string => {
  const trimmed = value.trim();
  return trimmed && isPercentageGearStat(type) && !trimmed.endsWith("%") ? `${trimmed}%` : trimmed;
};

export { CURRENT_WEAPON_ART_LABELS };
