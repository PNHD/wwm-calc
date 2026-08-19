import fs from "node:fs";

const path = "src/product/ProductShell.tsx";
let source = fs.readFileSync(path, "utf8");
const marker = 'aria-label="Open Arena workspace"';
if (!source.includes(marker)) {
  const needle = `      <button type="button" className={workspace === "gvg" ? "is-active" : ""} aria-pressed={workspace === "gvg"} onClick={() => onChange("gvg")}>
        <Shield size={15} aria-hidden="true" /><span>Guild War</span>
      </button>`;
  if (!source.includes(needle)) throw new Error("Arena migration: WorkspaceSwitcher anchor not found");
  const arena = `      <button type="button" aria-label="Open Arena workspace" aria-pressed={false} onClick={() => { window.location.hash = "#arena/overview"; }}>
        <Target size={15} aria-hidden="true" /><span>Arena</span>
      </button>
${needle}`;
  source = source.replace(needle, arena);
  console.log("Arena workspace switcher applied");
} else {
  console.log("Arena workspace switcher already applied");
}

const oldOverview = `{workspace === "gvg" && gvgView === "overview" && <GvgOverview onNavigate={goGvg} onOpenLibrary={openLibrary} />}`;
const v2Overview = `{workspace === "gvg" && gvgView === "overview" && <div className="workspace-gvg-host is-overview"><GuildWarWorkspace onClose={() => goGvg("overview")} /></div>}`;
if (!source.includes(v2Overview)) {
  if (!source.includes(oldOverview)) throw new Error("Competitive V2 migration: Guild War overview anchor not found");
  source = source.replace(oldOverview, v2Overview);
  console.log("Guild War V2 overview applied");
} else {
  console.log("Guild War V2 overview already applied");
}
fs.writeFileSync(path, source, "utf8");

// V2 replaces the legacy Arena/Guild War React surfaces, but the V1 hardening
// migration still owns the core/schema sanitizers. Mark only the superseded UI
// patchers as satisfied and wire their recovery contract directly into V2.
const arenaV2Path = "src/arena/ArenaWorkspace.tsx";
let arenaV2 = fs.readFileSync(arenaV2Path, "utf8");
if (!arenaV2.includes("V1_STORAGE_RECOVERY_ARENA_UI")) {
  arenaV2 = `// V1_STORAGE_RECOVERY_ARENA_UI — Competitive V2 implements the recovery UI contract directly.\n${arenaV2}`;
  arenaV2 = arenaV2.replace(
    `  decodeArenaShare, encodeArenaShare, loadArenaHistory, loadArenaState, readPveInventorySnapshot,`,
    `  consumeArenaStorageRecovery, decodeArenaShare, encodeArenaShare, loadArenaHistory, loadArenaState, readPveInventorySnapshot,`,
  );
  arenaV2 = arenaV2.replace(
    `  const [route, setRoute] = useState<Route>(() => routeFromHash()); const [state, setStateRaw] = useState<ArenaState>(() => loadArenaState()); const profile = state.profiles.find((p: any) => p.id === state.activeProfileId) || state.profiles[0];`,
    `  const [route, setRoute] = useState<Route>(() => routeFromHash()); const [state, setStateRaw] = useState<ArenaState>(() => loadArenaState()); const [storageRecovery] = useState(() => consumeArenaStorageRecovery()); const profile = state.profiles.find((p: any) => p.id === state.activeProfileId) || state.profiles[0];`,
  );
  arenaV2 = arenaV2.replace(
    `<main className="arena-main"><div className="arena-card" style={{ marginBottom: 16 }}><ModePicker mode={mode} onChange={setMode}/></div>{content[route]}</main>`,
    `<main className="arena-main">{storageRecovery && <div className="arena-validation bad" role="status"><Info size={16}/><span>{storageRecovery}</span></div>}<div className="arena-card" style={{ marginBottom: 16 }}><ModePicker mode={mode} onChange={setMode}/></div>{content[route]}</main>`,
  );
  if (!arenaV2.includes("consumeArenaStorageRecovery")) throw new Error("Competitive V2 migration: Arena recovery contract could not be wired");
  fs.writeFileSync(arenaV2Path, arenaV2, "utf8");
  console.log("Arena V2 recovery UI contract applied");
} else {
  console.log("Arena V2 recovery UI contract already applied");
}

const gvgV2Path = "src/product/GuildWarWorkspace.tsx";
let gvgV2 = fs.readFileSync(gvgV2Path, "utf8");
if (!gvgV2.includes("V1_STORAGE_RECOVERY_GVG_UI")) {
  gvgV2 = `// V1_STORAGE_RECOVERY_GVG_UI — Competitive V2 implements the recovery UI contract directly.\n${gvgV2}`;
  gvgV2 = gvgV2.replace(
    `import { createShareEnvelope, defaultWorkspace, migrateWorkspace, validateRoster, validateShareEnvelope } from "../gvg/model.js";`,
    `import { createShareEnvelope, defaultWorkspace, migrateWorkspace, migrateWorkspaceWithStatus, validateRoster, validateShareEnvelope } from "../gvg/model.js";`,
  );
  const oldLoader = `function loadWorkspace() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { workspace: defaultWorkspace(), recovery: "" };
  try { return { workspace: migrateWorkspace(JSON.parse(raw)), recovery: "" }; }
  catch { if (!localStorage.getItem(BACKUP_KEY)) localStorage.setItem(BACKUP_KEY, raw.slice(0, 250000)); return { workspace: defaultWorkspace(), recovery: "Some saved Guild War data could not be loaded. The original payload is preserved in a bounded recovery backup until you explicitly recover or replace it." }; }
}`;
  const newLoader = `function loadWorkspace() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { workspace: defaultWorkspace(), recovery: "", holdPersistence: false };
  try {
    const parsed = JSON.parse(raw);
    const version = parsed && typeof parsed === "object" ? Number(parsed.version ?? 0) : -1;
    const futureOrUnsupported = version > 1 || (version === 1 && parsed.schema !== "wwm-gvg-workspace");
    const result = migrateWorkspaceWithStatus(parsed);
    if (result.backup || result.recovered || result.migrated || futureOrUnsupported) {
      if (!localStorage.getItem(BACKUP_KEY)) localStorage.setItem(BACKUP_KEY, raw.slice(0, 250000));
    }
    return {
      workspace: result.workspace,
      recovery: result.message || (futureOrUnsupported ? "Some saved Guild War data could not be loaded." : ""),
      holdPersistence: futureOrUnsupported,
    };
  } catch {
    if (!localStorage.getItem(BACKUP_KEY)) localStorage.setItem(BACKUP_KEY, raw.slice(0, 250000));
    return { workspace: defaultWorkspace(), recovery: "Some saved Guild War data could not be loaded. The original payload is preserved in a bounded recovery backup until you explicitly recover or replace it.", holdPersistence: true };
  }
}`;
  if (!gvgV2.includes(oldLoader)) throw new Error("Competitive V2 migration: Guild War loader anchor not found");
  gvgV2 = gvgV2.replace(oldLoader, newLoader);
  gvgV2 = gvgV2.replace(
    `  const loaded = useMemo(() => loadWorkspace(), []); const [workspace,setWorkspaceRaw] = useState<any>(loaded.workspace); const [recovery,setRecovery] = useState(loaded.recovery || consumeGvgStorageRecovery()); const [view,setView] = useState<View>(() => routeFromHash()); const [phase,setPhaseRaw] = useState(() => loadGvgPhaseV2());`,
    `  const loaded = useMemo(() => loadWorkspace(), []); const [workspace,setWorkspaceRaw] = useState<any>(loaded.workspace); const [recovery,setRecovery] = useState(loaded.recovery || consumeGvgStorageRecovery()); const [holdPersistence,setHoldPersistence] = useState(Boolean(loaded.holdPersistence)); const [view,setView] = useState<View>(() => routeFromHash()); const [phase,setPhaseRaw] = useState(() => loadGvgPhaseV2());`,
  );
  gvgV2 = gvgV2.replace(
    `  useEffect(() => { if (!recovery) localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace)); }, [workspace,recovery]);`,
    `  useEffect(() => { if (!holdPersistence) localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace)); }, [workspace,holdPersistence]);`,
  );
  gvgV2 = gvgV2.replace(
    `  const recover = () => { const next = defaultWorkspace(); setWorkspaceRaw(next); setRecovery(""); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); };`,
    `  const recover = () => { const next = { ...defaultWorkspace(), roster: seededRoster() }; setWorkspaceRaw(next); setRecovery(""); setHoldPersistence(false); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); };`,
  );
  gvgV2 = gvgV2.replace(
    `{sharedError && <div className="gvg-card"><Unknown>{sharedError}</Unknown></div>}`,
    `{sharedError && <div className="gvg-card" data-testid="gvg-shared-invalid"><Unknown>{sharedError}</Unknown></div>}`,
  );
  if (!gvgV2.includes("migrateWorkspaceWithStatus") || !gvgV2.includes("const [holdPersistence,setHoldPersistence]") || !gvgV2.includes("gvg-shared-invalid")) throw new Error("Competitive V2 migration: Guild War recovery/share contract incomplete");
  fs.writeFileSync(gvgV2Path, gvgV2, "utf8");
  console.log("Guild War V2 recovery/share contract applied");
} else {
  console.log("Guild War V2 recovery/share contract already applied");
}

// The legacy app has generic header/form rules. Scope Arena surfaces so the new
// workspace retains its dark design system at every responsive breakpoint.
const arenaCssPath = "src/arena/arena.css";
let arenaCss = fs.readFileSync(arenaCssPath, "utf8");
const arenaCssIsolation = [
  `.arena-root .arena-topbar{background:rgba(11,13,16,.98)!important;background-color:#0b0d10!important;box-shadow:none!important}`,
  `.arena-root input,.arena-root select,.arena-root textarea{background:#0d1115!important;background-color:#0d1115!important;color:#e9e6df!important;border-color:rgba(255,255,255,.09)!important;color-scheme:dark}`,
];
let cssChanged = false;
for (const rule of arenaCssIsolation) {
  if (!arenaCss.includes(rule)) {
    arenaCss = `${arenaCss.trimEnd()}\n${rule}\n`;
    cssChanged = true;
  }
}
if (cssChanged) {
  fs.writeFileSync(arenaCssPath, arenaCss, "utf8");
  console.log("Arena scoped CSS isolation applied");
} else {
  console.log("Arena scoped CSS isolation already applied");
}

// Arena adds three current Library references. Keep the existing browser acceptance
// contract aligned with the larger curated dataset instead of treating valid Arena
// content as a PvE/Guild War regression.
const libraryTestPath = "scripts/runtime-library-acceptance.spec.mjs";
let libraryTest = fs.readFileSync(libraryTestPath, "utf8");
const recentNeedle = `  await expect(page.locator(".library-card")).toHaveCount(5);`;
const recentReplacement = `  await expect(page.locator(".library-card")).toHaveCount(8);`;
if (!libraryTest.includes(recentReplacement)) {
  if (!libraryTest.includes(recentNeedle)) throw new Error("Arena migration: Library recent-count acceptance anchor not found");
  libraryTest = libraryTest.replace(recentNeedle, recentReplacement);
}
const weaponNeedle = `  await filters.getByLabel("Weapon").selectOption({ label: "Vernal Umbrella" });
  await expect(page.locator(".library-card")).toHaveCount(1);
  await expect(page.locator(".library-card").getByRole("heading", { name: "Silkbind-Jade", exact: true })).toBeVisible();`;
const weaponReplacement = `  await filters.getByLabel("Weapon").selectOption({ label: "Vernal Umbrella" });
  await expect(page.locator(".library-card")).toHaveCount(2);
  await expect(page.locator(".library-card").getByRole("heading", { name: "Silkbind-Jade", exact: true })).toBeVisible();
  await expect(page.locator(".library-card").getByRole("heading", { name: "Silkbind-Jade Arena", exact: true })).toBeVisible();`;
if (!libraryTest.includes(weaponReplacement)) {
  if (!libraryTest.includes(weaponNeedle)) throw new Error("Arena migration: Library weapon-filter acceptance anchor not found");
  libraryTest = libraryTest.replace(weaponNeedle, weaponReplacement);
}
fs.writeFileSync(libraryTestPath, libraryTest, "utf8");
console.log("Arena Library runtime acceptance contract applied");

// Competitive V2 validator is chained through the already-authoritative Arena model
// step so PR and push workflows cannot bypass evidence/applicability guards.
const validatorPath = "scripts/validate-arena-model.mjs";
let validator = fs.readFileSync(validatorPath, "utf8");
const validatorImport = `import "./validate-competitive-v2.mjs";`;
if (!validator.includes(validatorImport)) {
  validator = `${validatorImport}\n${validator}`;
  fs.writeFileSync(validatorPath, validator, "utf8");
  console.log("Competitive V2 validator chained");
} else {
  console.log("Competitive V2 validator already chained");
}

await import("./apply-competitive-v2-compat.mjs");
