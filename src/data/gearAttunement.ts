export type GearSubRole = "primary" | "additional" | "attunement";

export interface WeaponAttunementDefinition {
  id: string;
  family: string;
  statKey: string;
  weaponName: string;
  aliases: string[];
  displayName: string;
  panelKey?: "outerPen" | "pzPen" | "umbAll" | "fanAll";
  rotationBuild?: string;
  evidence?: "client" | "official" | "reported" | "reference";
}

// Player-facing names are drawn from the weapon names already present in the
// repository (WWM_DATA / build weapon definitions). Internal stat keys remain
// the existing SUB_MAP-compatible calculation keys.
export const WEAPON_ATTUNEMENTS: WeaponAttunementDefinition[] = [
  { id: "physical-penetration", family: "offensive", statKey: "Phys Pen", weaponName: "", aliases: ["physical penetration", "phys pen"], displayName: "Physical Penetration", panelKey: "outerPen", evidence: "official" },
  { id: "formless-penetration", family: "offensive", statKey: "Formless Penetration", weaponName: "", aliases: ["formless penetration", "formless pen"], displayName: "Formless Penetration", panelKey: "pzPen", evidence: "official" },
  { id: "art-of-umbrella", family: "offensive", statKey: "Art of Umbrella Boost", weaponName: "", aliases: ["art of umbrella boost"], displayName: "Art of Umbrella Boost", panelKey: "umbAll", evidence: "official" },
  { id: "art-of-fan", family: "offensive", statKey: "Art of Fan Boost", weaponName: "", aliases: ["art of fan boost"], displayName: "Art of Fan Boost", panelKey: "fanAll", evidence: "official" },
  { id: "strategic-sword-bleed", family: "sword", statKey: "Strategic Sword Bleed DMG Boost", weaponName: "Strategic Sword", aliases: ["strategic sword bleed dmg boost", "strategic sword bleeding dmg boost", "bleed dmg boost", "bleeding dmg boost", "bleed damage boost", "bleeding damage boost"], displayName: "Strategic Sword — Bleed DMG Boost", rotationBuild: "bellstrike-umbra", evidence: "reported" },
  { id: "nameless-sword-charged", family: "sword", statKey: "Nameless Sword Charged Skill DMG Boost", weaponName: "Nameless Sword", aliases: ["nameless sword charged skill dmg boost", "nameless sword charged skill damage boost"], displayName: "Nameless Sword — Charged Skill DMG Boost", rotationBuild: "bellstrike-splendor", evidence: "reference" },
  { id: "thundercry-blade-charged", family: "mo-blade", statKey: "Thundercry Blade Charged Skill DMG Boost", weaponName: "Thundercry Blade", aliases: ["thundercry blade charged skill dmg boost"], displayName: "Thundercry Blade — Charged Skill DMG Boost", rotationBuild: "stonesplit-might", evidence: "reference" },
  { id: "phalanxbane-blade-charged", family: "mo-blade", statKey: "Phalanxbane Blade Charged Skill DMG Boost", weaponName: "Phalanxbane Blade", aliases: ["phalanxbane blade charged skill dmg boost"], displayName: "Phalanxbane Blade — Charged Skill DMG Boost", rotationBuild: "stonesplit-awe", evidence: "reference" },
  { id: "snowparting-blade-derived", family: "heng-blade", statKey: "Snowparting Blade Varied Combo DMG Boost", weaponName: "Snowparting Blade", aliases: ["snowparting blade light heavy attack varied combo dmg boost", "snowparting blade varied combo dmg boost", "snowparting blade derivation dmg boost"], displayName: "Snowparting Blade - Light/Heavy Attack Varied Combo DMG Boost", rotationBuild: "stonesplit-pure-datang", evidence: "reference" },
  { id: "mortal-rope-dart-rat", family: "rope-dart", statKey: "Mortal Rope Dart Rat DMG Boost", weaponName: "Mortal Rope Dart", aliases: ["mortal rope dart rodent dmg boost", "mortal rope dart rat dmg boost", "rat dmg boost"], displayName: "Mortal Rope Dart - Rodent DMG Boost", rotationBuild: "bamboocut-wind", evidence: "reference" },
  { id: "panacea-fan-healing", family: "fan", statKey: "Panacea Fan Martial Art Skill Healing Boost", weaponName: "Panacea Fan", aliases: ["panacea fan martial art skill healing boost"], displayName: "Panacea Fan — Martial Art Skill Healing Boost", evidence: "reference" },
  { id: "everspring-umbrella", family: "umbrella", statKey: "Umb Martial Art Skill DMG Boost", weaponName: "Everspring Umbrella", aliases: ["everspring umbrella"], displayName: "Everspring Umbrella — Martial Art Skill DMG Boost" },
  { id: "vernal-umbrella", family: "umbrella", statKey: "Umb Martial Art Skill DMG Boost", weaponName: "Vernal Umbrella", aliases: ["vernal umbrella"], displayName: "Vernal Umbrella — Martial Art Skill DMG Boost" },
  { id: "vernal-frequent-projectile", family: "umbrella", statKey: "Vernal Frequent Projectile DMG Boost", weaponName: "Vernal Umbrella", aliases: ["vernal umbrella frequent projectile dmg boost", "frequent projectile dmg boost", "vernal umbrella frequent ballistic dmg boost", "frequent ballistic dmg boost", "vernal umbrella special skill dmg boost", "special skill damage boost", "ninefold spring special skill dmg bonus", "vernal umbrella charged skill dmg boost", "charged skill damage boost"], displayName: "Vernal Umbrella — Frequent Projectile DMG Boost" },
  { id: "vernal-light-heavy-derived", family: "umbrella", statKey: "Vernal Light Heavy Derived DMG Boost", weaponName: "Vernal Umbrella", aliases: ["vernal umbrella light heavy attack varied combo dmg boost", "vernal umbrella light heavy follow up dmg boost", "light heavy attack varied combo dmg boost"], displayName: "Vernal Umbrella — Light/Heavy Attack & Varied Combo DMG Boost" },
  { id: "soulshade-umbrella", family: "umbrella", statKey: "Umb Martial Art Skill DMG Boost", weaponName: "Soulshade Umbrella", aliases: ["soulshade umbrella"], displayName: "Soulshade Umbrella — Martial Art Skill DMG Boost" },

  { id: "unfettered-rope-dart", family: "rope-dart", statKey: "Rope Dart Martial Art Skill DMG Boost", weaponName: "Unfettered Rope Dart", aliases: ["unfettered rope dart"], displayName: "Unfettered Rope Dart — Martial Art Skill DMG Boost" },
  { id: "mortal-rope-dart", family: "rope-dart", statKey: "Rope Dart Martial Art Skill DMG Boost", weaponName: "Mortal Rope Dart", aliases: ["mortal rope dart"], displayName: "Mortal Rope Dart — Martial Art Skill DMG Boost" },

  { id: "nameless-sword", family: "sword", statKey: "Sword Martial Art Skill DMG Boost", weaponName: "Nameless Sword", aliases: ["nameless sword"], displayName: "Nameless Sword — Martial Art Skill DMG Boost" },
  { id: "strategic-sword", family: "sword", statKey: "Sword Martial Art Skill DMG Boost", weaponName: "Strategic Sword", aliases: ["strategic sword"], displayName: "Strategic Sword — Martial Art Skill DMG Boost" },
  { id: "thundercry-blade", family: "mo-blade", statKey: "Mo Blade Martial Art Skill DMG Boost", weaponName: "Thundercry Blade", aliases: ["thundercry blade", "thundercry"], displayName: "Thundercry Blade — Martial Art Skill DMG Boost" },
  { id: "snowparting-blade", family: "heng-blade", statKey: "Heng Blade Martial Art Skill DMG Boost", weaponName: "Snowparting Blade", aliases: ["snowparting blade", "snowparting"], displayName: "Snowparting Blade — Martial Art Skill DMG Boost" },

  { id: "nameless-spear", family: "spear", statKey: "Spear Martial Art Skill DMG Boost", weaponName: "Nameless Spear", aliases: ["nameless spear"], displayName: "Nameless Spear — Martial Art Skill DMG Boost" },
  { id: "stormbreaker-spear", family: "spear", statKey: "Spear Martial Art Skill DMG Boost", weaponName: "Stormbreaker Spear", aliases: ["stormbreaker spear", "stormbreaker"], displayName: "Stormbreaker Spear — Martial Art Skill DMG Boost" },
  { id: "heavenquaker-spear", family: "spear", statKey: "Spear Martial Art Skill DMG Boost", weaponName: "Heavenquaker Spear", aliases: ["heavenquaker spear", "heavenquaker"], displayName: "Heavenquaker Spear — Martial Art Skill DMG Boost" },
  { id: "phalanxbane-blade", family: "mo-blade", statKey: "Mo Blade Martial Art Skill DMG Boost", weaponName: "Phalanxbane Blade", aliases: ["phalanxbane blade", "phalanxbane"], displayName: "Phalanxbane Blade — Martial Art Skill DMG Boost" },

  { id: "inkwell-fan", family: "fan", statKey: "Fan Martial Art Skill DMG Boost", weaponName: "Inkwell Fan", aliases: ["inkwell fan"], displayName: "Inkwell Fan — Martial Art Skill DMG Boost" },
  { id: "panacea-fan", family: "fan", statKey: "Fan Martial Art Skill DMG Boost", weaponName: "Panacea Fan", aliases: ["panacea fan"], displayName: "Panacea Fan — Martial Art Skill DMG Boost" },

  { id: "infernal-twinblades", family: "twinblades", statKey: "Dual Blades Martial Art Skill DMG Boost", weaponName: "Infernal Twinblades", aliases: ["infernal twinblades", "infernal twin blades"], displayName: "Infernal Twinblades — Martial Art Skill DMG Boost" },
  { id: "heavenstrike-gauntlets", family: "gauntlets", statKey: "Gauntlets Martial Art Skill DMG Boost", weaponName: "Heavenstrike Gauntlets", aliases: ["heavenstrike gauntlets", "heavenstrike"], displayName: "Heavenstrike Gauntlets — Martial Art Skill DMG Boost" },
];

// Community catalog pinned at greydust/where-builds-meet 3f68a49.
// Names are candidates, not official roll caps or numeric calibration.
const COMMUNITY_ATTUNEMENT_NAMES = [
  "Physical Resistance",
  "Phalanxbane Blade - Charged Skill DMG Boost",
  "Phalanxbane Blade - Martial Art Skill DMG Boost",
  "Snowparting Blade - Charged Skill DMG Boost",
  "Snowparting Blade - Light/Heavy Attack Varied Combo DMG Boost",
  "Snowparting Blade - Martial Art Skill DMG Boost",
  "Thundercry Blade - Charged Skill DMG Boost",
  "Thundercry Blade - Shield Boost",
  "Thundercry Blade - Special Skill DMG Boost",
  "Stormbreaker Spear - Charged Skill DMG Boost",
  "Stormbreaker Spear - Special Skill DMG Boost",
  "Everspring Umbrella - Martial Art Skill DMG Boost",
  "Everspring Umbrella - Special Skill DMG Boost",
  "Unfettered Rope Dart - Charged Skill DMG Boost",
  "Unfettered Rope Dart - Special Skill DMG Boost",
  "Unfettered Rope Dart - Martial Art Skill DMG Boost",
  "Heavenwill Gauntlets - Charged Skill DMG Boost",
  "Heavenwill Gauntlets - Martial Art Skill DMG Boost",
  "Heavenwill Gauntlets - Light Attack and Varied Combo DMG Boost",
  "Skygrasp Rope Dart - Heavy Attack DMG Boost",
  "Skygrasp Rope Dart - Special Skill DMG Boost",
  "Panacea Fan - Martial Art Skill Healing Boost",
  "Panacea Fan - Special Skill Healing Boost",
  "Panacea Fan - Healing Skill Boost",
  "Soulshade Umbrella - Martial Art Skill Healing Boost",
  "Soulshade Umbrella - Special Skill Healing Boost",
  "Nameless Sword Martial Art Skill DMG Boost",
  "Nameless Sword Charged Skill DMG Boost",
  "Nameless Sword Special Skill DMG Boost",
  "Nameless Spear Charged Skill DMG Boost",
  "Nameless Spear Special Skill DMG Boost",
  "Strategic Sword Martial Art Skill DMG Boost",
  "Strategic Sword Special Skill DMG Boost",
  "Strategic Sword - Bleeding DMG Boost",
  "Heavenquaker Spear Martial Art Skill DMG Boost",
  "Heavenquaker Spear Charged Skill DMG Boost",
  "Inkwell Fan Charged Skill DMG Boost",
  "Inkwell Fan - Special and Pursuit Skill DMG Boost",
  "Vernal Umbrella Martial Art Skill DMG Boost",
  "Vernal Umbrella - Frequent Projectile DMG Boost",
  "Vernal Umbrella Frequent Projectile DMG Boost",
  "Vernal Umbrella - Light/Heavy Attack & Varied Combo DMG Boost",
  "Infernal Twinblades Martial Art Skill DMG Boost",
  "Infernal Twinblades Empowered Light Attack DMG Boost",
  "Infernal Twinblades Special Skill DMG Boost",
  "Mortal Rope Dart - Martial Art Skill DMG Boost",
  "Mortal Rope Dart - Rodent DMG Boost",
  "Driftcleave - Deepdaze Skill DMG Boost",
  "Skystrike Gauntlets - Special Skill DMG Boost",
  "Skystrike Gauntlets - Martial Art Skill DMG Boost",
  "Riven Twinblades - Light Attack DMG Boost",
  "Riven Twinblades - Martial Art Skill DMG Boost"
];
const catalogName = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
for (const name of COMMUNITY_ATTUNEMENT_NAMES) {
  const entry = WEAPON_ATTUNEMENTS.find((item) => catalogName(item.displayName) === catalogName(name) || item.aliases.some((alias) => catalogName(alias) === catalogName(name)));
  if (entry) { if (!entry.evidence) entry.evidence = "reference"; continue; }
  WEAPON_ATTUNEMENTS.push({ id: "community-" + catalogName(name).replaceAll(" ", "-"), family: "reference", statKey: name, weaponName: "", aliases: [name], displayName: name, evidence: "reference" });
}

// Penetration and Art-of boosts can also be ordinary rolls: role distinguishes them.
export const ATTUNEMENT_STAT_KEYS = new Set(WEAPON_ATTUNEMENTS.filter((entry) => !entry.panelKey).map((entry) => entry.statKey));

const CLIENT_IDS = new Set(["everspring-umbrella", "unfettered-rope-dart"]);
const OFFICIAL_IDS = new Set(["vernal-frequent-projectile", "vernal-light-heavy-derived"]);
for (const entry of WEAPON_ATTUNEMENTS) {
  if (CLIENT_IDS.has(entry.id)) entry.evidence = "client";
  if (OFFICIAL_IDS.has(entry.id)) entry.evidence = "official";
}
export const ATTUNEMENT_SELECT_OPTIONS = WEAPON_ATTUNEMENTS
  .filter((entry) => entry.evidence || CLIENT_IDS.has(entry.id) || OFFICIAL_IDS.has(entry.id))
  .map((entry) => ({
  value: entry.id,
  label: entry.displayName,
  group: entry.evidence === "reference" ? "Community / historical reference — confirm client" : entry.evidence === "reported" ? "Player-reported" : "Normal Attunement",
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
    .filter(({ entry }) => (!entry.panelKey && entry.statKey !== "Physical Resistance") || /attun/.test(value))
    .filter(({ entry, alias }) => entry.id !== "vernal-frequent-projectile" || !["special skill damage boost", "charged skill damage boost"].includes(alias) || /vernal|ninefold/.test(value))
    .filter(({ entry }) => !entry.statKey.includes("Martial Art Skill DMG Boost") || hasGenericMartialArtSkill),
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
    const attunement = migrated.role === "attunement" || (!migrated.role && isAttunementStatKey(migrated.type));
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

// The existing rotation's isDingyin mask owns event eligibility. Unknown identities
// stay stored, but cannot become a universal combat bonus by accident.
export const getAttunementContribution = (row: SemanticGearSubLike, buildKey: string): { key: "attunedBonus" | "outerPen" | "pzPen" | "umbAll" | "fanAll"; value: number } | null => {
  const value = Number.parseFloat(String(row.val ?? "").replace("%", ""));
  if (!Number.isFinite(value) || value <= 0) return null;
  const definition = getWeaponAttunementById(row.attunementId) ?? matchWeaponAttunementText(row.displayName || row.type);
  if (definition?.panelKey) return { key: definition.panelKey, value };
  if (definition?.rotationBuild === buildKey || (definition?.id === "everspring-umbrella" && buildKey === "bamboocut-dust")) return { key: "attunedBonus", value };
  // Legacy generic values have no weapon identity; preserve the saved contract.
  if (!row.attunementId && !definition && (row.type === "Attuned Bonus" || isAttunementStatKey(row.type))) return { key: "attunedBonus", value };
  return null;
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
