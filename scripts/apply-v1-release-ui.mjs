import fs from "node:fs";

function patch(path, marker, replacements) {
  let source = fs.readFileSync(path, "utf8");
  if (source.includes(marker)) return;
  for (const [from, to, label] of replacements) {
    if (!source.includes(from)) throw new Error(`V1 release UI anchor missing: ${label}`);
    source = source.replace(from, to);
  }
  fs.writeFileSync(path, source, "utf8");
}

patch("src/product/ProductShell.tsx", "V1_MODEL_ABOUT_PRODUCT_SHELL", [
  [
    `import LibraryWorkspace from "./LibraryWorkspace";`,
    `import LibraryWorkspace from "./LibraryWorkspace";\nimport ModelAbout from "./ModelAbout"; // V1_MODEL_ABOUT_PRODUCT_SHELL`,
    "ProductShell ModelAbout import",
  ],
  [
    `{workspace === "pve" ? <button type="button" onClick={() => goPve("profile")}><Share2 size={14} /> Share / Import</button> : workspace === "gvg" ? <button type="button" onClick={() => goGvg("share")}><Share2 size={14} /> Share Plan</button> : null}\n          {actions}`,
    `{workspace === "pve" ? <button type="button" onClick={() => goPve("profile")}><Share2 size={14} /> Share / Import</button> : workspace === "gvg" ? <button type="button" onClick={() => goGvg("share")}><Share2 size={14} /> Share Plan</button> : null}\n          <ModelAbout workspace={workspace === "pve" ? "PVE" : workspace === "gvg" ? "GUILD_WAR" : "LIBRARY"} page={workspace === "pve" ? pveView : workspace === "gvg" ? gvgView : "library"} path={context.build} tier={context.tier} />\n          {actions}`,
    "ProductShell ModelAbout action",
  ],
]);

patch("src/arena/ArenaWorkspace.tsx", "V1_MODEL_ABOUT_ARENA", [
  [
    `import evidenceCatalog from "./arena-evidence.json";`,
    `import evidenceCatalog from "./arena-evidence.json";\nimport ModelAbout from "../product/ModelAbout"; // V1_MODEL_ABOUT_ARENA`,
    "Arena ModelAbout import",
  ],
  [
    `<div className="arena-patch"><span>GLOBAL</span><strong>2.0</strong></div></header>`,
    `<div className="arena-patch"><span>GLOBAL</span><strong>2.0</strong></div><ModelAbout workspace="ARENA" page={route} path={profile.path} /></header>`,
    "Arena ModelAbout action",
  ],
]);

patch("src/arena/ArenaWorkspace.tsx", "V1_ARENA_LIBRARY_COMPARE_CONSUMER", [
  [
    `function Compare({ state, profile }: { state: ArenaState; profile: any }) {\n  const [aId, setA] = useState(profile.id);\n  const [bId, setB] = useState(state.profiles[1]?.id || profile.id);\n  const [objective, setObjective] = useState("1V1_GENERAL");\n  const a = state.profiles.find((p: any) => p.id === aId) || profile;\n  const bBase = state.profiles.find((p: any) => p.id === bId) || profile;`,
    `type ArenaLibraryCompareDescriptor = { entryId: string; path: string; mode: string; role: string; source: string };\n\nfunction readArenaLibraryCompareDescriptor(): ArenaLibraryCompareDescriptor | null {\n  const key = "wwm_arena_library_compare_v1";\n  const decode = (raw: string | null): ArenaLibraryCompareDescriptor | null => {\n    if (!raw || raw.length > 4096) return null;\n    try {\n      const value = JSON.parse(raw);\n      if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) return null;\n      if (["__proto__", "prototype", "constructor"].some((name) => Object.prototype.hasOwnProperty.call(value, name))) return null;\n      const path = typeof value.path === "string" && PATH_PROFILES[value.path] ? value.path : "";\n      const mode = typeof value.mode === "string" && ARENA_MODES.includes(value.mode) ? value.mode : "";\n      if (!path || !mode) return null;\n      return {\n        entryId: String(value.entryId || "library-reference").slice(0, 120),\n        path, mode,\n        role: String(value.role || "Community Reference").replace(/[<>]/g, "").slice(0, 120),\n        source: String(value.source || "Community Library").replace(/[<>]/g, "").slice(0, 160),\n      };\n    } catch { return null; }\n  };\n  try {\n    const session = decode(sessionStorage.getItem(key));\n    if (session) return session;\n  } catch {}\n  try {\n    const legacyRaw = localStorage.getItem(key);\n    const legacy = decode(legacyRaw);\n    localStorage.removeItem(key);\n    if (legacy) { sessionStorage.setItem(key, JSON.stringify(legacy)); return legacy; }\n  } catch {}\n  return null;\n}\n\nfunction Compare({ state, profile }: { state: ArenaState; profile: any }) {\n  const libraryReference = useMemo(() => readArenaLibraryCompareDescriptor(), []); // V1_ARENA_LIBRARY_COMPARE_CONSUMER\n  const referenceProfile = libraryReference ? {\n    id: "arena-library-reference",\n    name: libraryReference.role + " · Community Reference",\n    path: libraryReference.path,\n    mode: libraryReference.mode,\n    weapons: PATH_PROFILES[libraryReference.path]?.weapons || [],\n    arenaDimensions: {},\n    arenaAttunementIds: [],\n    libraryReference,\n  } : null;\n  const comparisonProfiles = referenceProfile ? [...state.profiles, referenceProfile] : state.profiles;\n  const [aId, setA] = useState(profile.id);\n  const [bId, setB] = useState(referenceProfile?.id || state.profiles[1]?.id || profile.id);\n  const [objective, setObjective] = useState("1V1_GENERAL");\n  const a = comparisonProfiles.find((p: any) => p.id === aId) || profile;\n  const bBase = comparisonProfiles.find((p: any) => p.id === bId) || profile;`,
    "Arena Library comparison consumer",
  ],
  [
    `<div className="arena-compare-pickers"><label>BUILD A<select value={aId} onChange={(e) => setA(e.target.value)}>{state.profiles.map((p: any) => <option value={p.id} key={p.id}>{p.name}</option>)}</select></label><ArrowLeftRight size={22} /><label>BUILD B<select value={bId} onChange={(e) => setB(e.target.value)}>{state.profiles.map((p: any) => <option value={p.id} key={p.id}>{p.name}</option>)}</select></label><label>OBJECTIVE<select value={objective} onChange={(e) => setObjective(e.target.value)}><option>1V1_GENERAL</option><option>VS_BURST</option><option>VS_RANGED</option><option>VS_TANK</option><option>3V3_BURST</option><option>3V3_SUPPORT</option></select></label></div>`,
    `<div className="arena-compare-pickers"><label>BUILD A<select value={aId} onChange={(e) => setA(e.target.value)}>{comparisonProfiles.map((p: any) => <option value={p.id} key={p.id}>{p.name}</option>)}</select></label><ArrowLeftRight size={22} /><label>BUILD B<select value={bId} onChange={(e) => setB(e.target.value)}>{comparisonProfiles.map((p: any) => <option value={p.id} key={p.id}>{p.name}</option>)}</select></label><label>OBJECTIVE<select value={objective} onChange={(e) => setObjective(e.target.value)}><option>1V1_GENERAL</option><option>VS_BURST</option><option>VS_RANGED</option><option>VS_TANK</option><option>3V3_BURST</option><option>3V3_SUPPORT</option></select></label></div>{referenceProfile && <div className="arena-validation"><Info size={16} /> Community Library reference loaded for comparison only; it was not cloned or made active.</div>}`,
    "Arena compare reference options",
  ],
]);

patch("src/product/LibraryWorkspace.tsx", "V1_ARENA_LIBRARY_COMPARE_SESSION", [
  [
    `localStorage.setItem("wwm_arena_library_compare_v1", JSON.stringify({ entryId: entry.id, path: entry.path, mode: entry.arenaMode || "1v1", role: entry.role, source: entry.source.label }));`,
    `sessionStorage.setItem("wwm_arena_library_compare_v1", JSON.stringify({ entryId: entry.id, path: entry.path, mode: entry.arenaMode || "1v1", role: entry.role, source: entry.source.label })); // V1_ARENA_LIBRARY_COMPARE_SESSION`,
    "Arena Library compare descriptor lifetime",
  ],
]);

patch("src/product/GuildWarWorkspace.tsx", "V1_GVG_IMPORT_TYPE_CONTRACT", [
  [
    `        patchWorkspace({ importedBuildReference: imported.importedBuildReference });`,
    `        patchWorkspace({ importedBuildReference: (imported as any).importedBuildReference }); // V1_GVG_IMPORT_TYPE_CONTRACT`,
    "Guild War imported build type bridge",
  ],
]);

console.log("V1 model/about, Library Arena compare wiring, report-issue UI and generated type contracts applied deterministically.");
