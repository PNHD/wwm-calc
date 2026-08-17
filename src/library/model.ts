export const LIBRARY_SCHEMA_VERSION = 1 as const;
export const BUILD_SHARE_SCHEMA_VERSION = 2 as const;
export const CURRENT_GAME_REGION = "Global";
export const CURRENT_GAME_PATCH = "2.0";
export const MAX_SHARED_PAYLOAD_BYTES = 48 * 1024;
export const MAX_LIBRARY_ITEMS = 100;
export const MAX_ROSTER = 30;
export const MAX_GEAR = 16;
export const MAX_INNER_WAYS = 8;
export const MAX_TEXT = 280;

export const LIBRARY_TYPES = [
  "PVE_BUILD",
  "GVG_BUILD",
  "REFERENCE_BUILD",
  "COMMUNITY_BUILD",
  "GUILD_WAR_ROSTER",
  "GUILD_WAR_STRATEGY",
] as const;

export const MATURITY = [
  "CALIBRATED",
  "CLIENT_VERIFIED",
  "OFFICIAL_REFERENCE",
  "COMMUNITY_REFERENCE",
  "MODELED",
  "EXPERIMENTAL",
  "OUTDATED",
] as const;

export type LibraryType = typeof LIBRARY_TYPES[number];
export type Maturity = typeof MATURITY[number];
export type LibraryWorkspaceKind = "PVE" | "GVG";

export interface LibrarySource {
  label: string;
  kind: "OFFICIAL_REFERENCE" | "COMMUNITY_GUIDE" | "USER_SHARED" | "WWM_CALC" | "TEMPLATE";
  url?: string;
  note?: string;
}

export interface PanelSummary {
  minOuter?: number;
  maxOuter?: number;
  outerPen?: number;
  prec?: number;
  crit?: number;
  aff?: number;
  attunedBonus?: number;
  set?: string;
}

export interface BuildSnapshot {
  buildKey?: string;
  path?: string;
  weapons?: string[];
  modeledDps?: number;
  confidence?: string;
  objective?: string;
  scenario?: string;
  panel?: PanelSummary;
  gear?: Array<{ slot: string; name: string; note?: string }>;
  sets?: string[];
  attunements?: string[];
  innerWays?: string[];
  why?: string[];
  assumptions?: string[];
  evidence?: string[];
  roleScores?: Record<string, number>;
  roster?: Array<{ id: string; name: string; role: string; team?: string; buildReference?: string; notes?: string }>;
  strategy?: { name: string; readiness?: string; doctrine?: string; phases?: string[]; notes?: string[] };
}

export interface LibraryEntry {
  id: string;
  type: LibraryType;
  workspace: LibraryWorkspaceKind;
  title: string;
  subtitle?: string;
  path?: string;
  weapons?: string[];
  role?: string;
  objective?: string;
  region: string;
  patch: string;
  tier: string;
  createdDate: string;
  lastReviewedDate: string;
  maturity: Maturity[];
  source: LibrarySource;
  buildSchemaVersion: number;
  librarySchemaVersion: number;
  featured?: boolean;
  tags?: string[];
  build: BuildSnapshot;
}

export interface LibraryDocument {
  schemaVersion: number;
  currentPatch: string;
  currentRegion: string;
  generatedAt: string;
  items: LibraryEntry[];
}

export interface SharedBuildEnvelope {
  schemaVersion: number;
  kind: "PVE_BUILD" | "GVG_PLAN";
  sharedAt: string;
  source: "USER_SHARED" | "LIBRARY";
  entry: LibraryEntry;
  privacy?: { playerNamesRedacted?: boolean; notesRedacted?: boolean };
}

const TYPE_SET = new Set<string>(LIBRARY_TYPES);
const MATURITY_SET = new Set<string>(MATURITY);
const SOURCE_KINDS = new Set(["OFFICIAL_REFERENCE", "COMMUNITY_GUIDE", "USER_SHARED", "WWM_CALC", "TEMPLATE"]);
const FORBIDDEN_KEYS = new Set(["__proto__", "prototype", "constructor"]);

const plainObject = (value: unknown): value is Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

function containsForbiddenKey(value: unknown, depth = 0): boolean {
  if (depth > 8 || value == null || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some((item) => containsForbiddenKey(item, depth + 1));
  if (!plainObject(value)) return true;
  return Object.entries(value).some(([key, child]) => FORBIDDEN_KEYS.has(key) || containsForbiddenKey(child, depth + 1));
}

const boundedString = (value: unknown, max = MAX_TEXT) => typeof value === "string" && value.length > 0 && value.length <= max;
const finiteBounded = (value: unknown, min = -1_000_000_000, max = 1_000_000_000) => typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
const stringArray = (value: unknown, maxItems: number, maxLength = 160) => Array.isArray(value) && value.length <= maxItems && value.every((item) => typeof item === "string" && item.length <= maxLength);

export function isSafeExternalUrl(value?: string): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

function validateSnapshot(snapshot: unknown, workspace: LibraryWorkspaceKind): string[] {
  const errors: string[] = [];
  if (!plainObject(snapshot)) return ["build must be an object"];
  if (containsForbiddenKey(snapshot)) errors.push("build contains forbidden object keys");
  if (snapshot.buildKey !== undefined && !boundedString(snapshot.buildKey, 80)) errors.push("invalid buildKey");
  if (snapshot.path !== undefined && !boundedString(snapshot.path, 80)) errors.push("invalid path");
  if (snapshot.weapons !== undefined && !stringArray(snapshot.weapons, 4, 80)) errors.push("invalid weapons");
  if (snapshot.modeledDps !== undefined && !finiteBounded(snapshot.modeledDps, 0, 10_000_000)) errors.push("invalid modeledDps");
  if (snapshot.confidence !== undefined && !boundedString(snapshot.confidence, 80)) errors.push("invalid confidence");
  if (snapshot.gear !== undefined) {
    if (!Array.isArray(snapshot.gear) || snapshot.gear.length > MAX_GEAR || snapshot.gear.some((item) => !plainObject(item) || !boundedString(item.slot, 60) || !boundedString(item.name, 120))) errors.push("invalid gear");
  }
  if (snapshot.innerWays !== undefined && !stringArray(snapshot.innerWays, MAX_INNER_WAYS, 100)) errors.push("invalid innerWays");
  for (const key of ["sets", "attunements", "why", "assumptions", "evidence"] as const) {
    if (snapshot[key] !== undefined && !stringArray(snapshot[key], 16, MAX_TEXT)) errors.push(`invalid ${key}`);
  }
  if (snapshot.panel !== undefined) {
    if (!plainObject(snapshot.panel) || Object.entries(snapshot.panel).some(([key, value]) => key !== "set" && !finiteBounded(value, -100_000, 1_000_000))) errors.push("invalid panel");
  }
  if (snapshot.roleScores !== undefined) {
    if (!plainObject(snapshot.roleScores) || Object.values(snapshot.roleScores).some((score) => !finiteBounded(score, 0, 100))) errors.push("invalid roleScores");
  }
  if (snapshot.roster !== undefined) {
    if (!Array.isArray(snapshot.roster) || snapshot.roster.length > MAX_ROSTER || snapshot.roster.some((member) => !plainObject(member) || !boundedString(member.id, 80) || !boundedString(member.name, 80) || !boundedString(member.role, 80))) errors.push("invalid roster");
  }
  if (workspace === "PVE" && snapshot.roster !== undefined) errors.push("PvE build cannot include a Guild War roster");
  return errors;
}

export function validateLibraryEntry(value: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!plainObject(value)) return { valid: false, errors: ["entry must be an object"] };
  if (containsForbiddenKey(value)) errors.push("entry contains forbidden object keys");
  if (!boundedString(value.id, 96) || !/^[a-z0-9-]+$/.test(String(value.id))) errors.push("invalid id");
  if (!TYPE_SET.has(String(value.type))) errors.push("invalid type");
  if (value.workspace !== "PVE" && value.workspace !== "GVG") errors.push("invalid workspace");
  if (!boundedString(value.title, 120)) errors.push("invalid title");
  if (!boundedString(value.region, 40)) errors.push("invalid region");
  if (!boundedString(value.patch, 40)) errors.push("invalid patch");
  if (!boundedString(value.tier, 40)) errors.push("invalid tier");
  if (!boundedString(value.createdDate, 40) || !boundedString(value.lastReviewedDate, 40)) errors.push("invalid review dates");
  if (!Array.isArray(value.maturity) || value.maturity.length < 1 || value.maturity.length > 4 || value.maturity.some((item) => !MATURITY_SET.has(String(item)))) errors.push("invalid maturity");
  if (!finiteBounded(value.buildSchemaVersion, 1, 20)) errors.push("invalid buildSchemaVersion");
  if (value.librarySchemaVersion !== LIBRARY_SCHEMA_VERSION) errors.push("unsupported librarySchemaVersion");
  if (!plainObject(value.source) || !boundedString(value.source.label, 180) || !SOURCE_KINDS.has(String(value.source.kind))) errors.push("invalid source");
  if (plainObject(value.source) && value.source.url !== undefined && !isSafeExternalUrl(String(value.source.url))) errors.push("unsafe source url");
  if (value.weapons !== undefined && !stringArray(value.weapons, 4, 80)) errors.push("invalid entry weapons");
  if (value.tags !== undefined && !stringArray(value.tags, 12, 60)) errors.push("invalid tags");
  errors.push(...validateSnapshot(value.build, value.workspace as LibraryWorkspaceKind));
  return { valid: errors.length === 0, errors };
}

export function validateLibraryDocument(value: unknown): { valid: boolean; errors: string[] } {
  if (!plainObject(value)) return { valid: false, errors: ["library document must be an object"] };
  const errors: string[] = [];
  if (containsForbiddenKey(value)) errors.push("library document contains forbidden object keys");
  if (value.schemaVersion !== LIBRARY_SCHEMA_VERSION) errors.push("unsupported library schema");
  if (!boundedString(value.currentPatch, 40) || !boundedString(value.currentRegion, 40)) errors.push("invalid current patch metadata");
  if (!Array.isArray(value.items) || value.items.length > MAX_LIBRARY_ITEMS) errors.push("invalid library items");
  if (Array.isArray(value.items)) {
    const ids = new Set<string>();
    value.items.forEach((item, index) => {
      const validation = validateLibraryEntry(item);
      validation.errors.forEach((error) => errors.push(`items[${index}]: ${error}`));
      if (plainObject(item) && typeof item.id === "string") {
        if (ids.has(item.id)) errors.push(`items[${index}]: duplicate id`);
        ids.add(item.id);
      }
    });
  }
  return { valid: errors.length === 0, errors };
}

function cloneWhitelistedEntry(entry: LibraryEntry): LibraryEntry {
  const source: LibrarySource = {
    label: String(entry.source.label),
    kind: entry.source.kind,
    ...(entry.source.url && isSafeExternalUrl(entry.source.url) ? { url: entry.source.url } : {}),
    ...(entry.source.note ? { note: String(entry.source.note).slice(0, MAX_TEXT) } : {}),
  };
  return JSON.parse(JSON.stringify({
    id: entry.id,
    type: entry.type,
    workspace: entry.workspace,
    title: entry.title,
    subtitle: entry.subtitle,
    path: entry.path,
    weapons: entry.weapons,
    role: entry.role,
    objective: entry.objective,
    region: entry.region,
    patch: entry.patch,
    tier: entry.tier,
    createdDate: entry.createdDate,
    lastReviewedDate: entry.lastReviewedDate,
    maturity: entry.maturity,
    source,
    buildSchemaVersion: entry.buildSchemaVersion,
    librarySchemaVersion: LIBRARY_SCHEMA_VERSION,
    featured: Boolean(entry.featured),
    tags: entry.tags,
    build: entry.build,
  })) as LibraryEntry;
}

export function createSharedBuildEnvelope(entry: LibraryEntry, privacy?: SharedBuildEnvelope["privacy"]): SharedBuildEnvelope {
  const validation = validateLibraryEntry(entry);
  if (!validation.valid) throw new Error(`Cannot share invalid build: ${validation.errors[0]}`);
  return {
    schemaVersion: BUILD_SHARE_SCHEMA_VERSION,
    kind: entry.workspace === "PVE" ? "PVE_BUILD" : "GVG_PLAN",
    sharedAt: new Date().toISOString(),
    source: "LIBRARY",
    entry: cloneWhitelistedEntry(entry),
    ...(privacy ? { privacy: { playerNamesRedacted: Boolean(privacy.playerNamesRedacted), notesRedacted: Boolean(privacy.notesRedacted) } } : {}),
  };
}

function textToBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlToText(value: string): string {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("Malformed share payload.");
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
  const binary = atob(padded);
  if (binary.length > MAX_SHARED_PAYLOAD_BYTES) throw new Error("Shared build payload is too large.");
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

export function encodeSharedBuild(envelope: SharedBuildEnvelope): string {
  const text = JSON.stringify(envelope);
  if (new TextEncoder().encode(text).byteLength > MAX_SHARED_PAYLOAD_BYTES) throw new Error("Shared build payload is too large.");
  return textToBase64Url(text);
}

function migrateLegacyEnvelope(value: Record<string, unknown>): SharedBuildEnvelope | null {
  if (value.schemaVersion !== 1 || !plainObject(value.entry)) return null;
  const candidate = value.entry as unknown as LibraryEntry;
  const validation = validateLibraryEntry(candidate);
  if (!validation.valid) return null;
  return {
    schemaVersion: BUILD_SHARE_SCHEMA_VERSION,
    kind: candidate.workspace === "PVE" ? "PVE_BUILD" : "GVG_PLAN",
    sharedAt: typeof value.sharedAt === "string" ? value.sharedAt.slice(0, 40) : new Date(0).toISOString(),
    source: "USER_SHARED",
    entry: cloneWhitelistedEntry(candidate),
  };
}

export function decodeSharedBuild(value: string): { valid: boolean; envelope?: SharedBuildEnvelope; error?: string; migrated?: boolean } {
  try {
    if (!value || value.length > Math.ceil(MAX_SHARED_PAYLOAD_BYTES * 1.5)) throw new Error("Shared build payload is too large.");
    const text = base64UrlToText(value);
    const parsed = JSON.parse(text) as unknown;
    if (!plainObject(parsed) || containsForbiddenKey(parsed)) throw new Error("Invalid shared build object.");
    if (parsed.schemaVersion === 1) {
      const migrated = migrateLegacyEnvelope(parsed);
      if (!migrated) throw new Error("This build uses an older schema that cannot be migrated safely.");
      return { valid: true, envelope: migrated, migrated: true };
    }
    if (parsed.schemaVersion !== BUILD_SHARE_SCHEMA_VERSION) throw new Error("This shared build uses an unsupported schema version.");
    if (parsed.kind !== "PVE_BUILD" && parsed.kind !== "GVG_PLAN") throw new Error("Invalid shared build type.");
    if (!plainObject(parsed.entry)) throw new Error("Shared build is missing its build payload.");
    const validation = validateLibraryEntry(parsed.entry);
    if (!validation.valid) throw new Error(validation.errors[0]);
    const envelope: SharedBuildEnvelope = {
      schemaVersion: BUILD_SHARE_SCHEMA_VERSION,
      kind: parsed.kind,
      sharedAt: typeof parsed.sharedAt === "string" ? parsed.sharedAt.slice(0, 40) : "",
      source: parsed.source === "LIBRARY" ? "LIBRARY" : "USER_SHARED",
      entry: cloneWhitelistedEntry(parsed.entry as unknown as LibraryEntry),
      ...(plainObject(parsed.privacy) ? { privacy: { playerNamesRedacted: Boolean(parsed.privacy.playerNamesRedacted), notesRedacted: Boolean(parsed.privacy.notesRedacted) } } : {}),
    };
    return { valid: true, envelope };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : "This shared build can no longer be loaded." };
  }
}

export function patchFreshness(entry: LibraryEntry, currentPatch = CURRENT_GAME_PATCH): "CURRENT" | "OUTDATED_REFERENCE" {
  return entry.patch === currentPatch && !entry.maturity.includes("OUTDATED") ? "CURRENT" : "OUTDATED_REFERENCE";
}

export function compareRoleScores(a?: Record<string, number>, b?: Record<string, number>) {
  const roles = Array.from(new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})]));
  return roles.map((role) => ({ role, a: a?.[role] ?? null, b: b?.[role] ?? null, delta: (b?.[role] ?? 0) - (a?.[role] ?? 0) }));
}

export type LibraryAnalyticsEvent =
  | "library_opened"
  | "library_filter_used"
  | "library_build_viewed"
  | "reference_compared"
  | "build_cloned"
  | "shared_build_opened"
  | "shared_build_cloned";

export function trackLibraryEvent(name: LibraryAnalyticsEvent, metadata: { itemId?: string; workspace?: LibraryWorkspaceKind; filter?: string } = {}) {
  window.dispatchEvent(new CustomEvent("wwm:analytics", { detail: { name, ...metadata } }));
}
