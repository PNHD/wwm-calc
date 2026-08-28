export type GearSubRole = "primary" | "additional" | "attunement";

export interface WeaponAttunementDefinition {
  id: string;
  family: string;
  statKey: string;
  weaponName: string;
  aliases: string[];
  displayName: string;
}

// Player-facing names are drawn from the weapon names already present in the
// repository (WWM_DATA / build weapon definitions). Internal stat keys remain
// the existing SUB_MAP-compatible calculation keys.
export const WEAPON_ATTUNEMENTS: WeaponAttunementDefinition[] = [
  { id: "everspring-umbrella", family: "umbrella", statKey: "Umb Martial Art Skill DMG Boost", weaponName: "Everspring Umbrella", aliases: ["everspring umbrella"], displayName: "Everspring Umbrella — Martial Art Skill DMG Boost" },
  { id: "vernal-umbrella", family: "umbrella", statKey: "Umb Martial Art Skill DMG Boost", weaponName: "Vernal Umbrella", aliases: ["vernal umbrella"], displayName: "Vernal Umbrella — Martial Art Skill DMG Boost" },
  { id: "vernal-frequent-projectile", family: "umbrella", statKey: "Vernal Frequent Projectile DMG Boost", weaponName: "Vernal Umbrella", aliases: ["vernal umbrella frequent projectile dmg boost", "frequent projectile dmg boost", "vernal umbrella frequent ballistic dmg boost", "frequent ballistic dmg boost", "vernal umbrella special skill dmg boost", "special skill damage boost", "ninefold spring special skill dmg bonus", "vernal umbrella charged skill dmg boost", "charged skill damage boost"], displayName: "Vernal Umbrella — Frequent Projectile DMG Boost" },
  { id: "vernal-light-heavy-derived", family: "umbrella", statKey: "Vernal Light Heavy Derived DMG Boost", weaponName: "Vernal Umbrella", aliases: ["vernal umbrella light heavy attack varied combo dmg boost", "vernal umbrella light heavy follow up dmg boost", "light heavy attack varied combo dmg boost"], displayName: "Vernal Umbrella — Light/Heavy Attack & Varied Combo DMG Boost" },
  { id: "soulshade-umbrella", family: "umbrella", statKey: "Umb Martial Art Skill DMG Boost", weaponName: "Soulshade Umbrella", aliases: ["soulshade umbrella"], displayName: "Soulshade Umbrella — Martial Art Skill DMG Boost" },

  { id: "unfettered-rope-dart", family: "rope-dart", statKey: "Rope Dart Martial Art Skill DMG Boost", weaponName: "Unfettered Rope Dart", aliases: ["unfettered rope dart"], displayName: "Unfettered Rope Dart — Martial Art Skill DMG Boost" },
  { id: "mortal-rope-dart", family: "rope-dart", statKey: "Rope Dart Martial Art Skill DMG Boost", weaponName: "Mortal Rope Dart", aliases: ["mortal rope dart"], displayName: "Mortal Rope Dart — Martial Art Skill DMG Boost" },

  { id: "nameless-sword", family: "sword", statKey: "Sword Martial Art Skill DMG Boost", weaponName: "Nameless Sword", aliases: ["nameless sword"], displayName: "Nameless Sword — Martial Art Skill DMG Boost" },
  { id: "strategic-sword", family: "sword", statKey: "Sword Martial Art Skill DMG Boost", weaponName: "Strategic Sword", aliases: ["strategic sword"], displayName: "Strategic Sword — Martial Art Skill DMG Boost" },
  { id: "thundercry-blade", family: "sword", statKey: "Sword Martial Art Skill DMG Boost", weaponName: "Thundercry Blade", aliases: ["thundercry blade", "thundercry"], displayName: "Thundercry Blade — Martial Art Skill DMG Boost" },
  { id: "snowparting-blade", family: "sword", statKey: "Sword Martial Art Skill DMG Boost", weaponName: "Snowparting Blade", aliases: ["snowparting blade", "snowparting"], displayName: "Snowparting Blade — Martial Art Skill DMG Boost" },

  { id: "nameless-spear", family: "spear", statKey: "Spear Martial Art Skill DMG Boost", weaponName: "Nameless Spear", aliases: ["nameless spear"], displayName: "Nameless Spear — Martial Art Skill DMG Boost" },
  { id: "stormbreaker-spear", family: "spear", statKey: "Spear Martial Art Skill DMG Boost", weaponName: "Stormbreaker Spear", aliases: ["stormbreaker spear", "stormbreaker"], displayName: "Stormbreaker Spear — Martial Art Skill DMG Boost" },
  { id: "heavenquaker-spear", family: "spear", statKey: "Spear Martial Art Skill DMG Boost", weaponName: "Heavenquaker Spear", aliases: ["heavenquaker spear", "heavenquaker"], displayName: "Heavenquaker Spear — Martial Art Skill DMG Boost" },
  { id: "phalanxbane-blade", family: "spear", statKey: "Spear Martial Art Skill DMG Boost", weaponName: "Phalanxbane Blade", aliases: ["phalanxbane blade", "phalanxbane"], displayName: "Phalanxbane Blade — Martial Art Skill DMG Boost" },

  { id: "inkwell-fan", family: "fan", statKey: "Fan Martial Art Skill DMG Boost", weaponName: "Inkwell Fan", aliases: ["inkwell fan"], displayName: "Inkwell Fan — Martial Art Skill DMG Boost" },
  { id: "panacea-fan", family: "fan", statKey: "Fan Martial Art Skill DMG Boost", weaponName: "Panacea Fan", aliases: ["panacea fan"], displayName: "Panacea Fan — Martial Art Skill DMG Boost" },

  { id: "infernal-twinblades", family: "twinblades", statKey: "Dual Blades Martial Art Skill DMG Boost", weaponName: "Infernal Twinblades", aliases: ["infernal twinblades", "infernal twin blades"], displayName: "Infernal Twinblades — Martial Art Skill DMG Boost" },
  { id: "heavenstrike-gauntlets", family: "gauntlets", statKey: "Gauntlets Martial Art Skill DMG Boost", weaponName: "Heavenstrike Gauntlets", aliases: ["heavenstrike gauntlets", "heavenstrike"], displayName: "Heavenstrike Gauntlets — Martial Art Skill DMG Boost" },
];

export const ATTUNEMENT_STAT_KEYS = new Set(WEAPON_ATTUNEMENTS.map((entry) => entry.statKey));

export const ATTUNEMENT_SELECT_OPTIONS = WEAPON_ATTUNEMENTS.map((entry) => ({
  value: entry.id,
  label: entry.displayName,
  group: "Attunement",
}));

const normalize = (value: string): string => value
  .toLowerCase()
  .replace(/[‐‑‒–—]/g, "-")
  .replace(/[^a-z0-9]+/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const LEGACY_VERNAL_ATTUNEMENT_IDS: Record<string, string> = {
  "vernal-high-frequency-ballistic": "vernal-frequent-projectile",
  "vernal-special": "vernal-frequent-projectile",
  "vernal-special-t96": "vernal-frequent-projectile",
  "vernal-charged": "vernal-frequent-projectile",
  "vernal-charged-t96": "vernal-frequent-projectile",
};

const VERNAL_FREQUENT_PROJECTILE_STAT_KEY = "Vernal Frequent Projectile DMG Boost";
const LEGACY_VERNAL_ATTUNEMENT_TEXT = new Set([
  VERNAL_FREQUENT_PROJECTILE_STAT_KEY,
  "Vernal Frequent Ballistic DMG Boost",
  "Vernal Special Skill DMG Boost",
  "Vernal Charged Skill DMG Boost",
  "Vernal Umbrella Frequent Ballistic DMG Boost",
  "Vernal Umbrella Special Skill DMG Boost",
  "Vernal Umbrella Charged Skill DMG Boost",
  "Ninefold Spring: Special Skill DMG Bonus",
].map(normalize));

const migrateLegacyVernalAttunement = <T extends SemanticGearSubLike>(row: T): T => {
  const migratedId = row.attunementId ? LEGACY_VERNAL_ATTUNEMENT_IDS[row.attunementId] : undefined;
  const legacyText = LEGACY_VERNAL_ATTUNEMENT_TEXT.has(normalize(row.type));
  if (!migratedId && !legacyText) return row;
  return {
    ...row,
    type: VERNAL_FREQUENT_PROJECTILE_STAT_KEY,
    attunementId: "vernal-frequent-projectile",
  };
};

export const getWeaponAttunementById = (id?: string): WeaponAttunementDefinition | undefined =>
  id ? WEAPON_ATTUNEMENTS.find((entry) => entry.id === (LEGACY_VERNAL_ATTUNEMENT_IDS[id] ?? id)) : undefined;

export const getDefaultWeaponAttunementForStatKey = (statKey: string): WeaponAttunementDefinition | undefined =>
  WEAPON_ATTUNEMENTS.find((entry) => entry.statKey === statKey);

export const isAttunementStatKey = (statKey: string): boolean => ATTUNEMENT_STAT_KEYS.has(statKey);

export const matchWeaponAttunementText = (text: string): WeaponAttunementDefinition | null => {
  const value = normalize(text);
  const hasGenericMartialArtSkill = value.includes("martial art skill dmg") || value.includes("martial art skill damage");
  const matches = WEAPON_ATTUNEMENTS.flatMap((entry) => entry.aliases
    .map((alias) => ({ entry, alias: normalize(alias) }))
    .filter(({ alias }) => value.includes(alias))
    .filter(({ entry }) => entry.statKey !== "Umb Martial Art Skill DMG Boost" || hasGenericMartialArtSkill),
  );
  matches.sort((a, b) => b.alias.length - a.alias.length);
  return matches[0]?.entry ?? null;
};

export interface SemanticGearSubLike {
  type: string;
  val: string;
  role?: GearSubRole;
  isRetuned?: boolean;
  isTuned?: boolean;
  sourceOrder?: number;
  attunementId?: string;
  displayName?: string;
}

export const applyGearRowSemantics = <T extends SemanticGearSubLike>(rows: T[]): T[] => {
  let normalIndex = 0;
  return rows.map((row, index) => {
    const migrated = migrateLegacyVernalAttunement(row);
    const definition = getWeaponAttunementById(migrated.attunementId);
    const attunement = migrated.role === "attunement" || isAttunementStatKey(migrated.type);
    const role: GearSubRole = attunement ? "attunement" : normalIndex++ === 0 ? "primary" : "additional";
    const isRetuned = attunement ? false : Boolean(migrated.isRetuned ?? migrated.isTuned);
    return {
      ...migrated,
      role,
      sourceOrder: migrated.sourceOrder ?? index,
      isRetuned,
      // Keep the legacy field synchronized so existing calculation/import code
      // can remain untouched while saved profiles migrate non-destructively.
      isTuned: isRetuned,
      // Never guess a specific weapon for legacy family-level stat keys. Exact
      // player-facing identity is retained only when OCR/manual input provided it.
      attunementId: attunement ? migrated.attunementId : undefined,
      displayName: attunement ? migrated.displayName ?? definition?.displayName : migrated.displayName,
    };
  });
};

export const toGearFormRows = <T extends SemanticGearSubLike>(rows: T[]): SemanticGearSubLike[] => {
  const semantic = applyGearRowSemantics(rows)
    .filter((row) => row.type !== "Other" || Boolean(row.val));
  const normal = semantic.filter((row) => row.role !== "attunement").slice(0, 5);
  const attunement = semantic.find((row) => row.role === "attunement");

  const form: SemanticGearSubLike[] = normal.map((row, index) => ({
    ...row,
    role: index === 0 ? "primary" : "additional",
    sourceOrder: row.sourceOrder ?? index,
  }));
  while (form.length < 5) {
    const index = form.length;
    form.push({
      type: "Other",
      val: "",
      role: index === 0 ? "primary" : "additional",
      isRetuned: false,
      isTuned: false,
      sourceOrder: index,
    });
  }
  form.push(attunement ? {
    ...attunement,
    role: "attunement",
    isRetuned: false,
    isTuned: false,
  } : {
    type: "Other",
    val: "",
    role: "attunement",
    isRetuned: false,
    isTuned: false,
    sourceOrder: 5,
  });
  return form;
};
