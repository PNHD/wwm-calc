export interface GlobalT96GearLineLike {
  type: string;
  val?: string;
  isTuned?: boolean;
}

export interface GlobalT96StatOptionLike {
  value: string;
  label: string;
  group?: string;
}

export type GlobalT96GearOrigin =
  | "native-t96"
  | "relaid"
  | "mixed"
  | "standard"
  | "unknown";

export interface GlobalT96GearValidation {
  origin: GlobalT96GearOrigin;
  label: string;
  errors: string[];
  warnings: string[];
}

export const GLOBAL_T96_WEAPON_SLOTS = new Set(["Umbrella", "Rope Dart"]);
export const GLOBAL_T96_ACCESSORY_SLOTS = new Set(["Disc", "Pendant"]);
export const GLOBAL_T96_ARMOR_SLOTS = new Set(["Helmet", "Chest", "Greaves", "Bracers"]);

const normalize = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, "");

const isVoidType = (type: string): boolean => {
  const key = normalize(type);
  return key.includes("voidatk") || key.includes("voidattack");
};

const isPathSpecificType = (type: string): boolean => {
  const key = normalize(type);
  const hasPath = ["bamboocut", "silkbind", "bellstrike", "stonesplit"].some((path) => key.includes(path));
  const hasPathStat = key.includes("atk") || key.includes("attack") || key.includes("pen") || key.includes("dmg") || key.includes("damage");
  return hasPath && hasPathStat;
};

const hasUsableValue = (line: GlobalT96GearLineLike): boolean => {
  if (!line.val) return false;
  const match = line.val.match(/-?\d+(?:\.\d+)?/);
  return Boolean(match && Number(match[0]) > 0);
};

export const isGlobalT96WeaponSlot = (slot: string): boolean => GLOBAL_T96_WEAPON_SLOTS.has(slot);

/**
 * Native Tier 96 weapons use universal Void Attack lines. Relaid weapons retain
 * their historical Path-specific attribute types. Relics and armor never use
 * the native-weapon Void label.
 */
export function classifyGlobalT96GearOrigin(
  slot: string,
  lines: GlobalT96GearLineLike[],
): GlobalT96GearOrigin {
  if (slot === "Auto" || !slot) return "unknown";
  if (!isGlobalT96WeaponSlot(slot)) return "standard";
  const active = lines.filter((line) => line.type !== "Other" && hasUsableValue(line));
  const hasVoid = active.some((line) => isVoidType(line.type));
  const hasPath = active.some((line) => isPathSpecificType(line.type));
  if (hasVoid && hasPath) return "mixed";
  if (hasVoid) return "native-t96";
  if (hasPath) return "relaid";
  return "unknown";
}

export function globalT96GearOriginLabel(origin: GlobalT96GearOrigin): string {
  switch (origin) {
    case "native-t96": return "Native T96 weapon";
    case "relaid": return "Relaid weapon";
    case "mixed": return "Mixed weapon stat pool";
    case "standard": return "T96 relic / armor";
    default: return "Source not identified";
  }
}

export function validateGlobalT96GearLines(
  slot: string,
  lines: GlobalT96GearLineLike[],
): GlobalT96GearValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  const active = lines.filter((line) => line.type !== "Other");
  const origin = classifyGlobalT96GearOrigin(slot, lines);

  if (!slot || slot === "Auto") {
    errors.push("Choose the gear slot before importing; unknown slots are no longer sent to Weapon 1 by default.");
  }
  if (active.some((line) => !hasUsableValue(line))) {
    errors.push("Every selected stat needs a positive numeric value.");
  }
  if (lines.filter((line) => line.isTuned).length > 1) {
    errors.push("A gear piece can have only one Tuned / Attuned line.");
  }
  if (!isGlobalT96WeaponSlot(slot) && active.some((line) => isVoidType(line.type))) {
    errors.push("Void Attack is a native Tier 96 weapon label and cannot be used on relic or armor slots.");
  }
  if (origin === "mixed") {
    errors.push("A weapon cannot be both native T96 Void gear and Relaid Path-stat gear. Recheck the screenshot or split the item source correctly.");
  }
  if (origin === "relaid") {
    warnings.push("Relaid gear keeps historical Path stat types, but its Modulating cap is lower than standard Tier 96 gear. Roll-quality percentage stays provisional until the white cap values are supplied.");
  }
  if (isGlobalT96WeaponSlot(slot) && origin === "unknown") {
    warnings.push("No Void or historical Path line was detected. This is valid for a physical-only weapon, but confirm the source manually.");
  }
  if (lines.some((line) => line.type === "Other" && hasUsableValue(line))) {
    warnings.push("One or more values have no stat type and will not be imported.");
  }

  return {
    origin,
    label: globalT96GearOriginLabel(origin),
    errors,
    warnings,
  };
}

/**
 * Non-weapon slots hide native T96 Void Attack. Weapon slots keep both Void and
 * Path options because historical/Relaid weapons legitimately preserve Path
 * lines. `Auto` keeps every option until the user confirms the slot.
 */
export function filterGlobalT96StatOptions<T extends GlobalT96StatOptionLike>(
  options: T[],
  slot: string,
): T[] {
  if (!slot || slot === "Auto" || isGlobalT96WeaponSlot(slot)) return options;
  return options.filter((option) => !isVoidType(option.value));
}

export function isGlobalT96VoidStat(type: string): boolean {
  return isVoidType(type);
}

export function isGlobalT96PathStat(type: string): boolean {
  return isPathSpecificType(type);
}
