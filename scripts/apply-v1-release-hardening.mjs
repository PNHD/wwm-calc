import fs from "node:fs";

function read(path) { return fs.readFileSync(path, "utf8"); }
function write(path, value) { fs.writeFileSync(path, value, "utf8"); }
function replaceOnce(source, from, to, label) {
  if (!source.includes(from)) throw new Error(`V1 hardening anchor missing: ${label}`);
  return source.replace(from, to);
}

function patchArenaCore() {
  const path = "src/arena/arena-core.mjs";
  let source = read(path);
  if (source.includes("V1_STORAGE_HARDENING_ARENA")) return;
  source = `import { cloneBoundedJson, isPlainRecord, readJsonStorage } from "../product/storage-registry.js";\n\n// V1_STORAGE_HARDENING_ARENA\n${source}`;
  source = replaceOnce(source,
`export function loadArenaState(storage = globalThis?.localStorage) {
  try {
    const raw = storage?.getItem?.(ARENA_STORAGE_KEY);
    if (!raw) return defaultArenaState();
    return sanitizeArenaState(JSON.parse(raw));
  } catch { return defaultArenaState(); }
}`,
`let arenaStorageRecovery = "";
export function consumeArenaStorageRecovery() {
  const message = arenaStorageRecovery;
  arenaStorageRecovery = "";
  return message;
}

export function loadArenaState(storage = globalThis?.localStorage) {
  const result = readJsonStorage(ARENA_STORAGE_KEY, {
    storage,
    ownerLabel: "Arena",
    recoveryMessage: "Some saved Arena data could not be loaded.",
    fallback: defaultArenaState,
    maxChars: 256 * 1024,
    bounds: { maxDepth: 8, maxArray: 300, maxKeys: 120, maxString: 32 * 1024 },
    validate: (value) => {
      if (!isPlainRecord(value)) return "Arena state must be an object.";
      const version = value.schemaVersion == null ? 0 : Number(value.schemaVersion);
      if (!Number.isInteger(version) || version < 0) return "Invalid Arena schema version.";
      if (version > ARENA_SCHEMA_VERSION) return "Unsupported future Arena schema v" + version + ".";
      return "";
    },
    migrate: (value) => {
      const version = value.schemaVersion == null ? 0 : Number(value.schemaVersion);
      const safe = sanitizeArenaState(value);
      if (version === 0) {
        return { value: safe, migrated: true, backup: true, message: "Saved Arena data was migrated to schema v1." };
      }
      const normalized = JSON.stringify(safe) !== JSON.stringify(value);
      return {
        value: safe,
        recovered: normalized,
        backup: normalized,
        message: normalized ? "Some saved Arena data was normalized to the supported V1 schema." : "",
        reason: normalized ? "Arena state contained unsupported or invalid fields." : "ok",
      };
    },
  });
  arenaStorageRecovery = result.recoveryMessage;
  return result.value;
}`,
"Arena state loader");
  source = replaceOnce(source,
`function cleanText(value, max = 120) { return String(value ?? "").replace(/[<>]/g, "").slice(0, max); }
function allowedPath(path) { return PATH_PROFILES[path] ? path : "Bamboocut-Dust"; }
function sanitizeArenaState(input) {`,
`function cleanText(value, max = 120) { return String(value ?? "").replace(/[<>]/g, "").slice(0, max); }
function allowedPath(path) { return PATH_PROFILES[path] ? path : "Bamboocut-Dust"; }
function safeArenaGearSnapshot(value) {
  if (!isPlainRecord(value)) return null;
  try { return cloneBoundedJson(value, { maxDepth: 6, maxArray: 80, maxKeys: 80, maxString: 4_000, maxChars: 96 * 1024 }); }
  catch { return null; }
}
function sanitizeArenaState(input) {`,
"Arena snapshot sanitizer");
  source = replaceOnce(source,
`      gearSnapshot: p?.gearSnapshot && typeof p.gearSnapshot === "object" ? JSON.parse(JSON.stringify(p.gearSnapshot)) : null,`,
`      gearSnapshot: safeArenaGearSnapshot(p?.gearSnapshot),`,
"Arena gear snapshot");
  source = replaceOnce(source,
`      arenaDimensions: sanitizeDimensions(p?.arenaDimensions),
    };
  });
  return { schemaVersion: ARENA_SCHEMA_VERSION, patch: ARENA_PATCH, activeProfileId: profiles.some((p) => p.id === input.activeProfileId) ? input.activeProfileId : profiles[0]?.id, profiles, opponentPath: allowedPath(input.opponentPath || base.opponentPath), objective: cleanText(input.objective || base.objective, 40), onboardingComplete: Boolean(input.onboardingComplete) };`,
`      arenaDimensions: sanitizeDimensions(p?.arenaDimensions),
    };
  }).filter((profile, index, rows) => rows.findIndex((other) => other.id === profile.id) === index);
  const safeProfiles = profiles.length ? profiles : base.profiles;
  return { schemaVersion: ARENA_SCHEMA_VERSION, patch: ARENA_PATCH, activeProfileId: safeProfiles.some((p) => p.id === input.activeProfileId) ? input.activeProfileId : safeProfiles[0]?.id, profiles: safeProfiles, opponentPath: allowedPath(input.opponentPath || base.opponentPath), objective: cleanText(input.objective || base.objective, 40), onboardingComplete: Boolean(input.onboardingComplete) };`,
"Arena duplicate IDs");
  write(path, source);
}

function patchArenaWorkspace() {
  const path = "src/arena/ArenaWorkspace.tsx";
  let source = read(path);
  if (source.includes("V1_STORAGE_RECOVERY_ARENA_UI")) return;
  source = replaceOnce(source,
`  defaultArenaState, encodeArenaShare, loadArenaHistory, loadArenaState, matchupCompare,`,
`  consumeArenaStorageRecovery, defaultArenaState, encodeArenaShare, loadArenaHistory, loadArenaState, matchupCompare,`,
"Arena recovery import");
  source = replaceOnce(source,
`  const [state, setStateRaw] = useState<ArenaState>(() => loadArenaState());
  const [moreOpen, setMoreOpen] = useState(false);`,
`  const [state, setStateRaw] = useState<ArenaState>(() => loadArenaState());
  const [storageRecovery] = useState(() => consumeArenaStorageRecovery()); // V1_STORAGE_RECOVERY_ARENA_UI
  const [moreOpen, setMoreOpen] = useState(false);`,
"Arena recovery state");
  source = replaceOnce(source,
`      <main className="arena-main">{content[route]}</main><Inspector route={route} profile={profile} state={state} />`,
`      <main className="arena-main">{storageRecovery && <div className="arena-validation" role="status"><Info size={16} /><span>{storageRecovery}</span></div>}{content[route]}</main><Inspector route={route} profile={profile} state={state} />`,
"Arena recovery banner");
  write(path, source);
}

function patchGvgModel() {
  const path = "src/gvg/model.js";
  let source = read(path);
  if (source.includes("V1_STORAGE_HARDENING_GVG")) return;
  source = `import { cloneBoundedJson, inspectBoundedJson, isPlainRecord } from "../product/storage-registry.js";\n\n// V1_STORAGE_HARDENING_GVG\n${source}`;
  source = replaceOnce(source,
`export function validateShareEnvelope(envelope) {
  if (!envelope || envelope.schema !== "wwm-gvg-share") return { valid: false, error: "Not a WWM GvG share payload." };
  if (Number(envelope.version) !== SHARE_SCHEMA_VERSION) return { valid: false, error: \`Unsupported share schema version: \${envelope.version}\` };
  if (!SHARE_KINDS.includes(envelope.kind)) return { valid: false, error: \`Unsupported share kind: \${envelope.kind}\` };
  return { valid: true, error: null };
}`,
`export function validateShareEnvelope(envelope) {
  try {
    if (!isPlainRecord(envelope) || envelope.schema !== "wwm-gvg-share") return { valid: false, error: "Not a WWM GvG share payload." };
    if (Number(envelope.version) !== SHARE_SCHEMA_VERSION) return { valid: false, error: \`Unsupported share schema version: \${envelope.version}\` };
    if (!SHARE_KINDS.includes(envelope.kind)) return { valid: false, error: \`Unsupported share kind: \${envelope.kind}\` };
    const encodedSize = JSON.stringify(envelope).length;
    if (encodedSize > 64 * 1024) return { valid: false, error: "Guild War share payload is too large." };
    inspectBoundedJson(envelope, { maxDepth: 10, maxArray: 200, maxKeys: 160, maxString: 2_000 });
    if (!isPlainRecord(envelope.payload)) return { valid: false, error: "Guild War share payload is missing." };
    const roster = Array.isArray(envelope.payload.roster) ? envelope.payload.roster : Array.isArray(envelope.payload?.workspace?.roster) ? envelope.payload.workspace.roster : null;
    if (roster && roster.length > 30) return { valid: false, error: "Guild War share roster exceeds 30 players." };
    if (roster) {
      const ids = new Set();
      for (const member of roster) {
        if (!isPlainRecord(member)) return { valid: false, error: "Guild War share contains an invalid roster member." };
        const id = String(member.id ?? "");
        if (!id || ids.has(id)) return { valid: false, error: "Guild War share contains missing or duplicate roster IDs." };
        ids.add(id);
      }
    }
    return { valid: true, error: null };
  } catch (error) {
    return { valid: false, error: error instanceof Error ? error.message : "Invalid Guild War share payload." };
  }
}`,
"GvG share validation");
  source = replaceOnce(source,
`export function migrateWorkspace(input) {
  if (!input || typeof input !== "object") return defaultWorkspace();
  if (input.schema === "wwm-gvg-workspace" && Number(input.version) === 1) {
    return { ...defaultWorkspace(), ...input, version: 1, scenario: "GUILD_WAR" };
  }
  // Deterministic v0 migration. Legacy PvE data is referenced, never mutated or reinterpreted as GvG values.
  if (Number(input.version ?? 0) === 0) {
    return { ...defaultWorkspace(), legacyReference: input.legacyReference ?? null };
  }
  return defaultWorkspace();
}`,
`const gvgText = (value, max = 160, fallback = "") => typeof value === "string" ? value.replace(/[<>]/g, "").slice(0, max) : fallback;
const gvgNumber = (value, min = 0, max = 1_000_000_000, fallback = null) => {
  if (value == null || value === "") return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? clamp(number, min, max) : fallback;
};
const gvgPoint = (value) => isPlainRecord(value) ? { x: gvgNumber(value.x, 0, 100, 50), y: gvgNumber(value.y, 0, 100, 50) } : { x: 50, y: 50 };

function uniqueBoundedId(value, prefix, index, seen) {
  const base = gvgText(value, 64, \`${prefix}-\${index + 1}\`) || \`${prefix}-\${index + 1}\`;
  let candidate = base;
  let suffix = 2;
  while (seen.has(candidate)) candidate = \`${base}-\${suffix++}\`;
  seen.add(candidate);
  return candidate;
}

function sanitizeGvgWorkspaceV1(input) {
  const base = defaultWorkspace();
  const rosterIds = new Set();
  const roster = (Array.isArray(input.roster) ? input.roster : []).slice(0, 30).filter(isPlainRecord).map((member, index) => {
    const id = uniqueBoundedId(member.id, "gvg-member", index, rosterIds);
    const roles = (Array.isArray(member.roles) ? member.roles : []).filter((role) => GVG_ROLES.includes(role)).slice(0, 2);
    return {
      id,
      name: gvgText(member.name, 80, \`Player \${String(index + 1).padStart(2, "0")}\`),
      path: gvgText(member.path, 80, "Bamboocut - Dust"),
      weapons: (Array.isArray(member.weapons) ? member.weapons : []).filter((item) => typeof item === "string").map((item) => gvgText(item, 80)).slice(0, 4),
      roles,
      team: gvgText(member.team, 80, "Main Ball"),
      buildReference: gvgText(member.buildReference, 120),
      exTechnique: gvgText(member.exTechnique, 120),
      exLevel: gvgNumber(member.exLevel, 1, 3, 1),
      normalProfile: gvgText(member.normalProfile, 80, "PvE / Normal"),
      arenaProfile: gvgText(member.arenaProfile, 80, "Arena"),
      gvgSelectedProfile: member.gvgSelectedProfile === "NORMAL" ? "NORMAL" : "ARENA",
      availability: member.availability !== false,
      notes: gvgText(member.notes, 1_000),
      antiHeal: Boolean(member.antiHeal),
      aoeCc: Boolean(member.aoeCc),
    };
  });

  const strategyInput = isPlainRecord(input.strategy) ? input.strategy : {};
  const positions = {};
  if (isPlainRecord(strategyInput.positions)) {
    for (const [id, point] of Object.entries(strategyInput.positions).slice(0, 30)) if (rosterIds.has(id)) positions[id] = gvgPoint(point);
  }
  const arrows = (Array.isArray(strategyInput.arrows) ? strategyInput.arrows : []).slice(0, 60).filter(isPlainRecord).map((arrow) => ({ from: gvgPoint(arrow.from), to: gvgPoint(arrow.to) }));
  const rallyPoints = (Array.isArray(strategyInput.rallyPoints) ? strategyInput.rallyPoints : []).slice(0, 30).filter(isPlainRecord).map((point, index) => ({ ...gvgPoint(point), label: gvgText(point.label, 40, \`R\${index + 1}\`) }));

  const timelineIds = new Set();
  const timeline = (Array.isArray(input.timeline) ? input.timeline : []).slice(0, 200).filter(isPlainRecord).map((event, index) => ({
    id: uniqueBoundedId(event.id, "event", index, timelineIds),
    label: gvgText(event.label, 160, "Plan event"),
    timeSeconds: gvgNumber(event.timeSeconds, 0, 86_400, 0),
    type: gvgText(event.type, 60, "PLAN"),
  })).sort((a, b) => a.timeSeconds - b.timeSeconds);

  const commanderInput = isPlainRecord(input.commander) ? input.commander : {};
  const coinIds = new Set();
  const commanderEvents = (Array.isArray(commanderInput.events) ? commanderInput.events : []).slice(0, 200).filter(isPlainRecord).map((event, index) => ({
    id: uniqueBoundedId(event.id, "coin", index, coinIds),
    timeSeconds: gvgNumber(event.timeSeconds, 0, 86_400, 0),
    amount: gvgNumber(event.amount, -1_000_000, 1_000_000, 0),
    label: gvgText(event.label, 160, "Commander event"),
    ...(event.cooldownSeconds == null || event.cooldownSeconds === "" ? {} : { cooldownSeconds: gvgNumber(event.cooldownSeconds, 0, 86_400, null) }),
  }));

  const objectiveInput = isPlainRecord(input.objectiveParams) ? input.objectiveParams : {};
  const halftimeInput = isPlainRecord(input.halftime) ? input.halftime : {};
  const duelistInput = isPlainRecord(input.duelist) ? input.duelist : {};
  const validRef = (value) => rosterIds.has(value) ? value : null;
  const healerInput = isPlainRecord(input.healerCalibration) ? input.healerCalibration : {};
  const healerKeys = ["hps", "burstHealing", "sustainedHealing", "reviveUtility", "enduranceSupport", "antiHealExposure", "survivability"];
  const healerCalibration = Object.fromEntries(healerKeys.map((key) => [key, gvgNumber(healerInput[key], 0, 1_000_000_000, null)]));
  const matchLogs = (Array.isArray(input.matchLogs) ? input.matchLogs : []).slice(-100).filter(isPlainRecord).map((log) => {
    try { return createMatchLog(cloneBoundedJson(log, { maxDepth: 6, maxArray: 80, maxKeys: 100, maxString: 2_000, maxChars: 96 * 1024 })); }
    catch { return null; }
  }).filter(Boolean);
  const attunementInput = isPlainRecord(input.attunementProfiles) ? input.attunementProfiles : {};
  const normalAttunement = isPlainRecord(attunementInput.normal) ? attunementInput.normal : {};
  const arenaAttunement = isPlainRecord(attunementInput.arena) ? attunementInput.arena : {};

  return {
    ...base,
    schema: "wwm-gvg-workspace",
    version: 1,
    scenario: "GUILD_WAR",
    doctrine: gvgText(input.doctrine, 80, "CUSTOM"),
    halftime: { timeSeconds: gvgNumber(halftimeInput.timeSeconds, 0, 86_400, null), reward: gvgText(halftimeInput.reward, 160), evidence: Object.values(EVIDENCE).includes(halftimeInput.evidence) ? halftimeInput.evidence : EVIDENCE.COMMUNITY_CONFLICTING },
    objectiveParams: {
      bulwarkDrPerStack: gvgNumber(objectiveInput.bulwarkDrPerStack, 0, 1, null),
      gooseDrPerStack: gvgNumber(objectiveInput.gooseDrPerStack, 0, 1, null),
      zhangBaoBaseSeconds: gvgNumber(objectiveInput.zhangBaoBaseSeconds, 0, 86_400, null),
      zhuxieGuleBaseSeconds: gvgNumber(objectiveInput.zhuxieGuleBaseSeconds, 0, 86_400, null),
    },
    roster,
    strategy: { positions, arrows, rallyPoints, notes: gvgText(strategyInput.notes, 2_000) },
    timeline,
    commander: { startingCoins: gvgNumber(commanderInput.startingCoins, -1_000_000, 1_000_000, 0), events: commanderEvents },
    duelist: { primary: validRef(duelistInput.primary), backup1: validRef(duelistInput.backup1), backup2: validRef(duelistInput.backup2) },
    healerCalibration,
    matchLogs,
    attunementProfiles: {
      normal: { name: gvgText(normalAttunement.name, 80, "PvE / Normal"), source: gvgText(normalAttunement.source, 80, "legacy-compatible") },
      arena: { name: gvgText(arenaAttunement.name, 80, "Arena"), source: gvgText(arenaAttunement.source, 80, "separate-profile") },
      gvgSelected: attunementInput.gvgSelected === "NORMAL" ? "NORMAL" : "ARENA",
    },
    ...(input.importedBuildReference && isPlainRecord(input.importedBuildReference) ? { importedBuildReference: cloneBoundedJson(input.importedBuildReference, { maxDepth: 6, maxArray: 80, maxKeys: 100, maxString: 2_000, maxChars: 64 * 1024 }) } : {}),
  };
}

export function migrateWorkspaceWithStatus(input) {
  if (!isPlainRecord(input)) return { workspace: defaultWorkspace(), recovered: true, migrated: false, message: "Some saved Guild War data could not be loaded.", reason: "Workspace must be an object." };
  const version = input.version == null ? 0 : Number(input.version);
  if (version === 0) {
    let legacyReference = null;
    try { legacyReference = input.legacyReference == null ? null : cloneBoundedJson(input.legacyReference, { maxDepth: 5, maxArray: 80, maxKeys: 80, maxString: 2_000, maxChars: 64 * 1024 }); } catch {}
    return { workspace: { ...defaultWorkspace(), legacyReference }, recovered: false, migrated: true, backup: true, message: "Saved Guild War data was migrated to schema v1." };
  }
  if (input.schema !== "wwm-gvg-workspace" || version !== 1) return { workspace: defaultWorkspace(), recovered: true, migrated: false, message: "Some saved Guild War data could not be loaded.", reason: \`Unsupported Guild War schema v\${String(input.version ?? "unknown")}\` };
  const workspace = sanitizeGvgWorkspaceV1(input);
  const normalized = JSON.stringify(workspace) !== JSON.stringify(input);
  return { workspace, recovered: normalized, migrated: false, backup: normalized, message: normalized ? "Some saved Guild War data was normalized to the supported V1 schema." : "", reason: normalized ? "Workspace contained unsupported or invalid fields." : "ok" };
}

export function migrateWorkspace(input) {
  return migrateWorkspaceWithStatus(input).workspace;
}`,
"GvG workspace migration");
  write(path, source);
}

function patchGuildWarWorkspace() {
  const path = "src/product/GuildWarWorkspace.tsx";
  let source = read(path);
  if (source.includes("V1_STORAGE_RECOVERY_GVG_UI")) return;
  source = replaceOnce(source,
`  migrateWorkspace,
  neutralBossWindow,`,
`  migrateWorkspace,
  migrateWorkspaceWithStatus,
  neutralBossWindow,`,
"GvG migration status import");
  source = replaceOnce(source,
`import "./guild-war.css";`,
`import { isPlainRecord, readJsonStorage } from "./storage-registry.js";
import "./guild-war.css";`,
"GvG storage registry import");
  source = replaceOnce(source,
`function parseStoredWorkspace() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultWorkspace();
    return migrateWorkspace(JSON.parse(raw));
  } catch {
    return defaultWorkspace();
  }
}`,
`function parseStoredWorkspace() {
  return readJsonStorage(STORAGE_KEY, {
    ownerLabel: "Guild War",
    recoveryMessage: "Some saved Guild War data could not be loaded.",
    fallback: defaultWorkspace,
    maxChars: 512 * 1024,
    bounds: { maxDepth: 10, maxArray: 500, maxKeys: 200, maxString: 64 * 1024 },
    validate: (value: any) => {
      if (!isPlainRecord(value)) return "Guild War workspace must be an object.";
      const version = value.version == null ? 0 : Number(value.version);
      if (!Number.isInteger(version) || version < 0) return "Invalid Guild War schema version.";
      if (version > 1) return \`Unsupported future Guild War schema v\${version}.\`;
      return "";
    },
    migrate: (value: any) => {
      const result = migrateWorkspaceWithStatus(value);
      return { value: result.workspace, recovered: result.recovered, migrated: result.migrated, backup: result.backup, message: result.message, reason: result.reason };
    },
  });
}`,
"GvG storage loader");
  source = replaceOnce(source,
`  const [tab, setTab] = useState<GvgTab>("lab");
  const [workspace, setWorkspace] = useState<any>(() => parseStoredWorkspace());`,
`  const [tab, setTab] = useState<GvgTab>("lab");
  const [initialStorage] = useState(() => parseStoredWorkspace()); // V1_STORAGE_RECOVERY_GVG_UI
  const [workspace, setWorkspace] = useState<any>(() => initialStorage.value);
  const [storageRecovery] = useState(() => initialStorage.recoveryMessage);
  const skipInitialRecoveredPersist = useRef(Boolean(initialStorage.recovered));`,
"GvG initial storage status");
  source = replaceOnce(source,
`  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
  }, [workspace]);`,
`  useEffect(() => {
    if (skipInitialRecoveredPersist.current) {
      skipInitialRecoveredPersist.current = false;
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
  }, [workspace]);`,
"GvG recovered persistence guard");
  source = replaceOnce(source,
`  const removeMember = (id: string) => {
    patchRoster(roster.filter((member) => member.id !== id));
    const positions = { ...(workspace.strategy?.positions ?? {}) };
    delete positions[id];
    patchStrategy({ ...workspace.strategy, positions }, false);
  };`,
`  const removeMember = (id: string) => {
    setSelectedStrategyMember((current) => current === id ? null : current);
    setWorkspace((current: any) => {
      const positions = { ...(current.strategy?.positions ?? {}) };
      delete positions[id];
      const clearRef = (value: string | null) => value === id ? null : value;
      return {
        ...current,
        roster: (current.roster ?? []).filter((member: RosterMember) => member.id !== id),
        strategy: { ...current.strategy, positions },
        duelist: { primary: clearRef(current.duelist?.primary ?? null), backup1: clearRef(current.duelist?.backup1 ?? null), backup2: clearRef(current.duelist?.backup2 ?? null) },
      };
    });
  };`,
"GvG deleted member references");
  source = replaceOnce(source,
`      if (envelope.kind === "FULL_GUILD_WAR_PLAN") setWorkspace(migrateWorkspace(envelope.payload));
      else if (envelope.kind === "ROSTER") patchWorkspace({ roster: envelope.payload.roster ?? [], doctrine: envelope.payload.doctrine ?? "CUSTOM" });
      else if (envelope.kind === "STRATEGY") patchWorkspace({ roster: envelope.payload.roster ?? roster, strategy: envelope.payload.strategy ?? workspace.strategy });
      else patchWorkspace({ importedBuildReference: envelope.payload });`,
`      if (envelope.kind === "FULL_GUILD_WAR_PLAN") setWorkspace(migrateWorkspace(envelope.payload));
      else if (envelope.kind === "ROSTER") {
        const imported = migrateWorkspace({ ...workspace, roster: envelope.payload.roster ?? [], doctrine: envelope.payload.doctrine ?? "CUSTOM" });
        patchWorkspace({ roster: imported.roster, doctrine: imported.doctrine });
      }
      else if (envelope.kind === "STRATEGY") {
        const imported = migrateWorkspace({ ...workspace, roster: envelope.payload.roster ?? roster, strategy: envelope.payload.strategy ?? workspace.strategy });
        patchWorkspace({ roster: imported.roster, strategy: imported.strategy });
      }
      else {
        const imported = migrateWorkspace({ ...workspace, importedBuildReference: envelope.payload });
        patchWorkspace({ importedBuildReference: imported.importedBuildReference });
      }`,
"GvG safe share clone");
  source = replaceOnce(source,
`      </header>

      <div className="gvg-official-strip">`,
`      </header>

      {storageRecovery && <div className="gvg-callout" role="status"><Shield size={18} /><div><strong>RECOVERED SAVED DATA</strong><p>{storageRecovery}</p></div></div>}

      <div className="gvg-official-strip">`,
"GvG recovery banner");
  write(path, source);
}

patchArenaCore();
patchArenaWorkspace();
patchGvgModel();
patchGuildWarWorkspace();
console.log("V1 release hardening applied deterministically.");
