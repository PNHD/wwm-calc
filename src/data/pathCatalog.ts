export type PathCapability = "MODELED" | "UNMODELED";

export interface ProductPath {
  id: string;
  label: string;
  weapons: string;
  tier: string;
  estimated: boolean;
  capability: PathCapability;
  currentGlobal?: true;
  knownMartialArts?: readonly string[];
}

export type NumericalPathAvailability =
  | { capability: "MODELED"; numericalModelAvailable: true }
  | { capability: "UNMODELED"; numericalModelAvailable: false; reason: "CURRENT_GLOBAL_MODEL_UNAVAILABLE" };

type ModeledProfile = Pick<ProductPath, "label" | "weapons" | "tier">;

export const UNMODELED_CURRENT_GLOBAL_PATHS: readonly ProductPath[] = [
  {
    id: "bamboocut-draught",
    label: "Bamboocut - Draught",
    weapons: "Skystrike Gauntlets + Riven Twinblades",
    tier: "Current Global · numerical model unavailable",
    estimated: false,
    capability: "UNMODELED",
    currentGlobal: true,
    knownMartialArts: ["Skystrike Gauntlets", "Riven Twinblades"],
  },
];

export function createProductPathCatalog(profiles: Record<string, ModeledProfile>, estimatedPaths: ReadonlySet<string>): ProductPath[] {
  return [
    ...Object.entries(profiles).map(([id, profile]) => ({ id, ...profile, estimated: estimatedPaths.has(id), capability: "MODELED" as const })),
    ...UNMODELED_CURRENT_GLOBAL_PATHS,
  ];
}

export function getPathCapability(pathKey?: string): PathCapability {
  return UNMODELED_CURRENT_GLOBAL_PATHS.some((path) => path.id === pathKey) ? "UNMODELED" : "MODELED";
}

export function isPathModeled(pathKey?: string): boolean {
  return getPathCapability(pathKey) === "MODELED";
}

/**
 * The boundary all numerical surfaces share.  A path without a numerical model
 * must stop here; callers must not turn its absence into a zero-valued result.
 */
export function getNumericalPathAvailability(pathKey?: string): NumericalPathAvailability {
  return isPathModeled(pathKey)
    ? { capability: "MODELED", numericalModelAvailable: true }
    : { capability: "UNMODELED", numericalModelAvailable: false, reason: "CURRENT_GLOBAL_MODEL_UNAVAILABLE" };
}

export function isBestBuildEligible(pathKey?: string): boolean {
  return getNumericalPathAvailability(pathKey).numericalModelAvailable;
}

export function canRenderBestBuildResult(selectedPathKey: string | undefined, resultPathKey: string | undefined): boolean {
  return isBestBuildEligible(selectedPathKey) && selectedPathKey === resultPathKey;
}
