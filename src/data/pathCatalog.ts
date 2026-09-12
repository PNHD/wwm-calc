export type PathCapability = "MODELED" | "UNMODELED";

export const PATH_MATURITIES = ["VALIDATED_BOUNDED", "MODELED_PROVISIONAL", "REFERENCE_ONLY", "UNMODELED", "UNKNOWN"] as const;
export type PathMaturity = typeof PATH_MATURITIES[number];

export const PRODUCT_CAPABILITIES = [
  "headlineDps", "rotationDps", "skillPreview", "gearPathFit", "statPriority", "gearCompare",
  "bestBuild", "simulation", "customRotation", "arenaNumerical", "referenceGuides",
] as const;
export type ProductCapability = typeof PRODUCT_CAPABILITIES[number];
export type CapabilityState = "ALLOW" | "PROVISIONAL" | "REFERENCE_ONLY" | "DISABLED";

export interface PathCapabilityRecord {
  pathKey: string;
  maturity: PathMaturity;
  capabilities: Record<ProductCapability, CapabilityState>;
}

export interface ProductPath {
  id: string;
  label: string;
  family: string;
  weapon1: string;
  weapon2: string;
  weapons: string;
  tier: string;
  estimated: boolean;
  capability: PathCapability;
  currentGlobal: true;
  knownMartialArts: readonly string[];
}

type CanonicalGlobalPath = Omit<ProductPath, "weapons" | "tier" | "estimated">;
type ModeledProfile = Pick<ProductPath, "tier">;

export const CANONICAL_GLOBAL_PATHS: readonly CanonicalGlobalPath[] = [
  { id: "bellstrike-splendor", label: "Bellstrike - Splendor", family: "Bellstrike", weapon1: "Nameless Sword", weapon2: "Nameless Spear", capability: "MODELED", currentGlobal: true, knownMartialArts: ["Nameless Sword", "Nameless Spear"] },
  { id: "bellstrike-umbra", label: "Bellstrike - Umbra", family: "Bellstrike", weapon1: "Strategic Sword", weapon2: "Heavenquaker Spear", capability: "MODELED", currentGlobal: true, knownMartialArts: ["Strategic Sword", "Heavenquaker Spear"] },
  { id: "silkbind-jade", label: "Silkbind - Jade", family: "Silkbind", weapon1: "Vernal Umbrella", weapon2: "Inkwell Fan", capability: "MODELED", currentGlobal: true, knownMartialArts: ["Vernal Umbrella", "Inkwell Fan"] },
  { id: "silkbind-deluge", label: "Silkbind - Deluge", family: "Silkbind", weapon1: "Soulshade Umbrella", weapon2: "Panacea Fan", capability: "MODELED", currentGlobal: true, knownMartialArts: ["Soulshade Umbrella", "Panacea Fan"] },
  { id: "stonesplit-might", label: "Stonesplit - Might", family: "Stonesplit", weapon1: "Thundercry Blade", weapon2: "Stormbreaker Spear", capability: "UNMODELED", currentGlobal: true, knownMartialArts: ["Thundercry Blade", "Stormbreaker Spear"] },
  { id: "stonesplit-strength", label: "Stonesplit - Strength", family: "Stonesplit", weapon1: "Snowparting Blade", weapon2: "Phalanxbane Blade", capability: "UNMODELED", currentGlobal: true, knownMartialArts: ["Snowparting Blade", "Phalanxbane Blade"] },
  { id: "bamboocut-wind", label: "Bamboocut - Wind", family: "Bamboocut", weapon1: "Infernal Twinblades", weapon2: "Mortal Rope Dart", capability: "MODELED", currentGlobal: true, knownMartialArts: ["Infernal Twinblades", "Mortal Rope Dart"] },
  { id: "bamboocut-dust", label: "Bamboocut - Dust", family: "Bamboocut", weapon1: "Everspring Umbrella", weapon2: "Unfettered Rope Dart", capability: "MODELED", currentGlobal: true, knownMartialArts: ["Everspring Umbrella", "Unfettered Rope Dart"] },
  { id: "bamboocut-kite", label: "Bamboocut - Kite", family: "Bamboocut", weapon1: "Heavenwill Gauntlets", weapon2: "Skygrasp Rope Dart", capability: "UNMODELED", currentGlobal: true, knownMartialArts: ["Heavenwill Gauntlets", "Skygrasp Rope Dart"] },
  { id: "bamboocut-draught", label: "Bamboocut - Draught", family: "Bamboocut", weapon1: "Skystrike Gauntlets", weapon2: "Riven Twinblades", capability: "UNMODELED", currentGlobal: true, knownMartialArts: ["Skystrike Gauntlets", "Riven Twinblades"] },
];

const DISABLED_CAPABILITIES: Record<ProductCapability, CapabilityState> = Object.fromEntries(
  PRODUCT_CAPABILITIES.map((capability) => [capability, "DISABLED"]),
) as Record<ProductCapability, CapabilityState>;

const pathCapabilities = (maturity: PathMaturity, capabilities: Partial<Record<ProductCapability, CapabilityState>>): Omit<PathCapabilityRecord, "pathKey"> => ({
  maturity,
  capabilities: { ...DISABLED_CAPABILITIES, ...capabilities },
});

/** The single product-authorization registry. Canonical path identity remains above. */
export const PATH_CAPABILITY_REGISTRY: Record<string, PathCapabilityRecord> = {
  "bellstrike-splendor": { pathKey: "bellstrike-splendor", ...pathCapabilities("MODELED_PROVISIONAL", { headlineDps: "PROVISIONAL", rotationDps: "PROVISIONAL", skillPreview: "PROVISIONAL", gearCompare: "PROVISIONAL", customRotation: "PROVISIONAL", arenaNumerical: "REFERENCE_ONLY", referenceGuides: "ALLOW" }) },
  "bellstrike-umbra": { pathKey: "bellstrike-umbra", ...pathCapabilities("MODELED_PROVISIONAL", { headlineDps: "PROVISIONAL", rotationDps: "PROVISIONAL", skillPreview: "PROVISIONAL", gearCompare: "PROVISIONAL", customRotation: "PROVISIONAL", arenaNumerical: "REFERENCE_ONLY", referenceGuides: "ALLOW" }) },
  "silkbind-jade": { pathKey: "silkbind-jade", ...pathCapabilities("MODELED_PROVISIONAL", { headlineDps: "PROVISIONAL", rotationDps: "PROVISIONAL", skillPreview: "PROVISIONAL", statPriority: "PROVISIONAL", gearCompare: "PROVISIONAL", bestBuild: "PROVISIONAL", arenaNumerical: "REFERENCE_ONLY", referenceGuides: "ALLOW" }) },
  "silkbind-deluge": { pathKey: "silkbind-deluge", ...pathCapabilities("MODELED_PROVISIONAL", { headlineDps: "PROVISIONAL", rotationDps: "PROVISIONAL", skillPreview: "PROVISIONAL", customRotation: "PROVISIONAL", referenceGuides: "ALLOW" }) },
  "stonesplit-might": { pathKey: "stonesplit-might", ...pathCapabilities("UNMODELED", { arenaNumerical: "REFERENCE_ONLY", referenceGuides: "REFERENCE_ONLY" }) },
  "stonesplit-strength": { pathKey: "stonesplit-strength", ...pathCapabilities("UNMODELED", { referenceGuides: "REFERENCE_ONLY" }) },
  "bamboocut-wind": { pathKey: "bamboocut-wind", ...pathCapabilities("REFERENCE_ONLY", { skillPreview: "REFERENCE_ONLY", arenaNumerical: "REFERENCE_ONLY", referenceGuides: "REFERENCE_ONLY" }) },
  "bamboocut-dust": { pathKey: "bamboocut-dust", ...pathCapabilities("MODELED_PROVISIONAL", { headlineDps: "PROVISIONAL", rotationDps: "PROVISIONAL", skillPreview: "PROVISIONAL", customRotation: "PROVISIONAL", arenaNumerical: "REFERENCE_ONLY", referenceGuides: "ALLOW" }) },
  "bamboocut-kite": { pathKey: "bamboocut-kite", ...pathCapabilities("UNMODELED", { referenceGuides: "REFERENCE_ONLY" }) },
  "bamboocut-draught": { pathKey: "bamboocut-draught", ...pathCapabilities("UNMODELED", { referenceGuides: "REFERENCE_ONLY" }) },
};

const UNKNOWN_PATH_CAPABILITY_RECORD: PathCapabilityRecord = {
  pathKey: "UNKNOWN",
  maturity: "UNKNOWN",
  capabilities: DISABLED_CAPABILITIES,
};

export type NumericalPathAvailability =
  | { capability: "MODELED"; numericalModelAvailable: true }
  | { capability: PathCapability; numericalModelAvailable: false; reason: "CURRENT_GLOBAL_MODEL_UNAVAILABLE" }
  | { capability: "UNSUPPORTED"; numericalModelAvailable: false; reason: "UNSUPPORTED_LEGACY_PATH" };

export function getCanonicalGlobalPath(pathKey?: string): CanonicalGlobalPath | undefined {
  return CANONICAL_GLOBAL_PATHS.find((path) => path.id === pathKey);
}

export function createProductPathCatalog(profiles: Record<string, ModeledProfile>, estimatedPaths: ReadonlySet<string>): ProductPath[] {
  return CANONICAL_GLOBAL_PATHS.map((path) => ({ ...path, weapons: `${path.weapon1} + ${path.weapon2}`, tier: profiles[path.id]?.tier ?? "Current Global · numerical model unavailable", estimated: estimatedPaths.has(path.id) }));
}

export function getPathCapability(pathKey?: string): PathCapability | "UNSUPPORTED" {
  return getCanonicalGlobalPath(pathKey)?.capability ?? "UNSUPPORTED";
}

/** Local coefficient/table presence only. Never use this as product authorization. */
export function isPathModeled(pathKey?: string): boolean {
  return getPathCapability(pathKey) === "MODELED";
}

export function getPathCapabilityRecord(pathKey?: string): PathCapabilityRecord {
  const key = pathKey ?? "";
  return Object.hasOwn(PATH_CAPABILITY_REGISTRY, key) ? PATH_CAPABILITY_REGISTRY[key] : UNKNOWN_PATH_CAPABILITY_RECORD;
}

export function getPathMaturity(pathKey?: string): PathMaturity {
  return getPathCapabilityRecord(pathKey).maturity;
}

export function getCapabilityState(pathKey: string | undefined, capability: ProductCapability): CapabilityState {
  const capabilities = getPathCapabilityRecord(pathKey).capabilities;
  return Object.hasOwn(capabilities, capability) ? capabilities[capability] : "DISABLED";
}

/** Product numerical authorization: only ALLOW or PROVISIONAL may execute. */
export function isProductCapabilityEnabled(pathKey: string | undefined, capability: ProductCapability): boolean {
  const state = getCapabilityState(pathKey, capability);
  return state === "ALLOW" || state === "PROVISIONAL";
}

/** Reference surfaces may additionally expose explicitly non-authoritative material. */
export function isReferenceCapabilityAvailable(pathKey: string | undefined, capability: ProductCapability): boolean {
  return getCapabilityState(pathKey, capability) !== "DISABLED";
}

/** UI profile metadata is never available for a recognized but unmodeled path. */
export function getModeledPathMetadata<T>(pathKey: string | undefined, profiles: Record<string, T>): T | undefined {
  return isPathModeled(pathKey) ? profiles[pathKey ?? ""] : undefined;
}

/** Unknown or retired saved ids are never converted to a live path. */
export function getNumericalPathAvailability(pathKey?: string): NumericalPathAvailability {
  const capability = getPathCapability(pathKey);
  if (isProductCapabilityEnabled(pathKey, "headlineDps")) return { capability: "MODELED", numericalModelAvailable: true };
  if (capability !== "UNSUPPORTED") return { capability, numericalModelAvailable: false, reason: "CURRENT_GLOBAL_MODEL_UNAVAILABLE" };
  return { capability, numericalModelAvailable: false, reason: "UNSUPPORTED_LEGACY_PATH" };
}

export function isBestBuildEligible(pathKey?: string): boolean { return isProductCapabilityEnabled(pathKey, "bestBuild"); }

export function canRenderBestBuildResult(selectedPathKey: string | undefined, resultPathKey: string | undefined): boolean {
  return isBestBuildEligible(selectedPathKey) && selectedPathKey === resultPathKey;
}
