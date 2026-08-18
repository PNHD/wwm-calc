import fs from "node:fs";

function replaceOnce(source, needle, replacement, label) {
  if (source.includes(replacement)) return source;
  if (!source.includes(needle)) throw new Error(`Arena Library migration anchor missing: ${label}`);
  return source.replace(needle, replacement);
}

// Extend the shared Library model without weakening existing validation.
{
  const path = "src/library/model.ts";
  let source = fs.readFileSync(path, "utf8");
  source = replaceOnce(source,
`  "PVE_BUILD",
  "GVG_BUILD",`,
`  "PVE_BUILD",
  "ARENA_BUILD",
  "GVG_BUILD",`, "library type");
  source = replaceOnce(source,
`export type LibraryWorkspaceKind = "PVE" | "GVG";`,
`export type LibraryWorkspaceKind = "PVE" | "ARENA" | "GVG";`, "workspace type");
  source = replaceOnce(source,
`  role?: string;
  objective?: string;`,
`  role?: string;
  arenaMode?: "1v1" | "3v3" | "5v5";
  objective?: string;`, "Arena mode field");
  source = replaceOnce(source,
`  kind: "PVE_BUILD" | "GVG_PLAN";`,
`  kind: "PVE_BUILD" | "ARENA_BUILD" | "GVG_PLAN";`, "share kind");
  source = replaceOnce(source,
`  if (value.workspace !== "PVE" && value.workspace !== "GVG") errors.push("invalid workspace");`,
`  if (value.workspace !== "PVE" && value.workspace !== "ARENA" && value.workspace !== "GVG") errors.push("invalid workspace");`, "workspace validation");
  source = replaceOnce(source,
`  if (value.weapons !== undefined && !stringArray(value.weapons, 4, 80)) errors.push("invalid entry weapons");`,
`  if (value.weapons !== undefined && !stringArray(value.weapons, 4, 80)) errors.push("invalid entry weapons");
  if (value.arenaMode !== undefined && value.arenaMode !== "1v1" && value.arenaMode !== "3v3" && value.arenaMode !== "5v5") errors.push("invalid Arena mode");`, "Arena mode validation");
  source = replaceOnce(source,
`    role: entry.role,
    objective: entry.objective,`,
`    role: entry.role,
    arenaMode: entry.arenaMode,
    objective: entry.objective,`, "whitelist Arena mode");
  source = replaceOnce(source,
`    kind: entry.workspace === "PVE" ? "PVE_BUILD" : "GVG_PLAN",`,
`    kind: entry.workspace === "PVE" ? "PVE_BUILD" : entry.workspace === "ARENA" ? "ARENA_BUILD" : "GVG_PLAN",`, "share Arena kind");
  source = replaceOnce(source,
`    kind: candidate.workspace === "PVE" ? "PVE_BUILD" : "GVG_PLAN",`,
`    kind: candidate.workspace === "PVE" ? "PVE_BUILD" : candidate.workspace === "ARENA" ? "ARENA_BUILD" : "GVG_PLAN",`, "legacy Arena kind");
  source = replaceOnce(source,
`    if (parsed.kind !== "PVE_BUILD" && parsed.kind !== "GVG_PLAN") throw new Error("Invalid shared build type.");`,
`    if (parsed.kind !== "PVE_BUILD" && parsed.kind !== "ARENA_BUILD" && parsed.kind !== "GVG_PLAN") throw new Error("Invalid shared build type.");`, "decode Arena kind");
  fs.writeFileSync(path, source, "utf8");
}

// Extend Community Library discovery, read-only sharing and isolated Arena cloning.
{
  const path = "src/product/LibraryWorkspace.tsx";
  let source = fs.readFileSync(path, "utf8");
  source = replaceOnce(source,
`type LibrarySection = "featured" | "pve" | "gvg-builds" | "gvg-plans" | "recent" | "saved";`,
`type LibrarySection = "featured" | "pve" | "arena" | "gvg-builds" | "gvg-plans" | "recent" | "saved";`, "Arena section type");
  source = replaceOnce(source,
`  if (hash === "#library/pve") return { kind: "landing", section: "pve" };
  if (hash === "#library/gvg-builds")`,
`  if (hash === "#library/pve") return { kind: "landing", section: "pve" };
  if (hash === "#library/arena") return { kind: "landing", section: "arena" };
  if (hash === "#library/gvg-builds")`, "Arena route");
  source = replaceOnce(source,
`function cloneGvgEntry(entry: LibraryEntry): { ok: boolean; name?: string; message: string } {`,
`function cloneArenaEntry(entry: LibraryEntry): { ok: boolean; name?: string; message: string } {
  try {
    const key = "wwm_arena_state_v1";
    const raw = JSON.parse(localStorage.getItem(key) || "null") || { schemaVersion: 1, patch: "2.0 / 2026-08-07", activeProfileId: "arena-main", profiles: [] };
    const profiles = Array.isArray(raw.profiles) ? raw.profiles.slice(0, 11) : [];
    const names = profiles.map((item: any) => String(item?.name || ""));
    const name = uniqueName(entry.title, names);
    const id = `arena-lib-${entry.id}-${Date.now()}`.slice(0, 120);
    const profile = {
      id, name,
      path: entry.path || entry.build.path || "Bamboocut-Dust",
      weapons: (entry.weapons || entry.build.weapons || []).slice(0, 2),
      mode: entry.arenaMode || "1v1",
      normalAttunementProfile: null,
      arenaAttunementIds: Array.isArray((entry.build as any).arenaAttunementIds) ? (entry.build as any).arenaAttunementIds.slice(0, 8) : [],
      mysticSkills: [], innerWays: [], gearSnapshot: null,
      battlegroup: "Jiangzhu", latency: "Moderate latency",
      libraryReference: { id: entry.id, source: entry.source.label, maturity: entry.maturity, clonedAt: new Date().toISOString() },
    };
    raw.profiles = [...profiles, profile];
    // Intentionally preserve activeProfileId: cloning a Library reference must never overwrite the active Arena build.
    localStorage.setItem(key, JSON.stringify(raw));
    return { ok: true, name, message: `${name} was cloned as a separate Arena profile. Your active Arena build was preserved.` };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Arena clone failed." };
  }
}

function cloneGvgEntry(entry: LibraryEntry): { ok: boolean; name?: string; message: string } {`, "Arena clone helper");
  source = replaceOnce(source,
`  const [roleFilter, setRoleFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");`,
`  const [roleFilter, setRoleFilter] = useState("");
  const [arenaModeFilter, setArenaModeFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");`, "Arena mode filter state");
  source = replaceOnce(source,
`    const result = entry.workspace === "PVE" ? clonePveEntry(entry) : cloneGvgEntry(entry);`,
`    const result = entry.workspace === "PVE" ? clonePveEntry(entry) : entry.workspace === "ARENA" ? cloneArenaEntry(entry) : cloneGvgEntry(entry);`, "Arena clone dispatch");
  source = replaceOnce(source,
`      if (entry.workspace === "PVE") {
        window.setTimeout(() => { onOpenPve("build"); window.location.reload(); }, 250);
      }`,
`      if (entry.workspace === "PVE") {
        window.setTimeout(() => { onOpenPve("build"); window.location.reload(); }, 250);
      }
      if (entry.workspace === "ARENA") setStatus(`${result.message} Open Arena when you want to inspect or activate it.`);`, "Arena clone navigation safety");
  source = replaceOnce(source,
`  const compareWithMyBuild = (entry: LibraryEntry) => {
    trackLibraryEvent("reference_compared", { itemId: entry.id, workspace: entry.workspace });
    navigate({ kind: "compare", a: entry.id, b: "my" }, `#library/compare/${encodeURIComponent(entry.id)}/my`);
  };`,
`  const compareWithMyBuild = (entry: LibraryEntry) => {
    trackLibraryEvent("reference_compared", { itemId: entry.id, workspace: entry.workspace });
    if (entry.workspace === "ARENA") {
      localStorage.setItem("wwm_arena_library_compare_v1", JSON.stringify({ entryId: entry.id, path: entry.path, mode: entry.arenaMode || "1v1", role: entry.role, source: entry.source.label }));
      window.location.hash = "#arena/compare";
      return;
    }
    navigate({ kind: "compare", a: entry.id, b: "my" }, `#library/compare/${encodeURIComponent(entry.id)}/my`);
  };`, "Arena compare dispatch");
  source = replaceOnce(source,
`    if (section === "pve") return entry.workspace === "PVE";
    if (section === "gvg-builds")`,
`    if (section === "pve") return entry.workspace === "PVE";
    if (section === "arena") return entry.workspace === "ARENA";
    if (section === "gvg-builds")`, "Arena section filtering");
  source = replaceOnce(source,
`      if (roleFilter && entry.role !== roleFilter) return false;
      if (sourceFilter === "community")`,
`      if (roleFilter && entry.role !== roleFilter) return false;
      if (arenaModeFilter && entry.arenaMode !== arenaModeFilter) return false;
      if (sourceFilter === "community")`, "Arena mode filtering");
  source = replaceOnce(source,
`  }, [items, route, search, pathFilter, weaponFilter, tierFilter, maturityFilter, patchFilter, objectiveFilter, roleFilter, sourceFilter, recent, favorites]);`,
`  }, [items, route, search, pathFilter, weaponFilter, tierFilter, maturityFilter, patchFilter, objectiveFilter, roleFilter, arenaModeFilter, sourceFilter, recent, favorites]);`, "Arena filter dependency");
  source = replaceOnce(source,
`  const clearFilters = () => { setSearch(""); setPathFilter(""); setWeaponFilter(""); setTierFilter(""); setMaturityFilter(""); setPatchFilter(""); setObjectiveFilter(""); setRoleFilter(""); setSourceFilter(""); };`,
`  const clearFilters = () => { setSearch(""); setPathFilter(""); setWeaponFilter(""); setTierFilter(""); setMaturityFilter(""); setPatchFilter(""); setObjectiveFilter(""); setRoleFilter(""); setArenaModeFilter(""); setSourceFilter(""); };`, "clear Arena filter");
  source = replaceOnce(source,
`      <span>{entry.workspace === "PVE" ? "PvE" : "Guild War"} · {entry.type.replaceAll("_", " ")}</span>`,
`      <span>{entry.workspace === "PVE" ? "PvE" : entry.workspace === "ARENA" ? "Arena" : "Guild War"} · {entry.type.replaceAll("_", " ")}</span>`, "Arena card label");
  source = replaceOnce(source,
`      <section className="library-shared-hero"><span className="library-eyebrow">{entry.workspace === "PVE" ? "SHARED PVE BUILD" : "SHARED GUILD WAR PLAN"}</span>`,
`      <section className="library-shared-hero"><span className="library-eyebrow">{entry.workspace === "PVE" ? "SHARED PVE BUILD" : entry.workspace === "ARENA" ? "SHARED ARENA BUILD" : "SHARED GUILD WAR PLAN"}</span>`, "Arena shared label");
  source = replaceOnce(source,
`      <button type="button" className="library-back" onClick={() => navigate({ kind: "landing", section: entry.workspace === "PVE" ? "pve" : entry.type === "GUILD_WAR_ROSTER" || entry.type === "GUILD_WAR_STRATEGY" ? "gvg-plans" : "gvg-builds" }, entry.workspace === "PVE" ? "#library/pve" : entry.type === "GUILD_WAR_ROSTER" || entry.type === "GUILD_WAR_STRATEGY" ? "#library/gvg-plans" : "#library/gvg-builds")}><ArrowLeft size={16} /> Library</button>`,
`      <button type="button" className="library-back" onClick={() => navigate({ kind: "landing", section: entry.workspace === "PVE" ? "pve" : entry.workspace === "ARENA" ? "arena" : entry.type === "GUILD_WAR_ROSTER" || entry.type === "GUILD_WAR_STRATEGY" ? "gvg-plans" : "gvg-builds" }, entry.workspace === "PVE" ? "#library/pve" : entry.workspace === "ARENA" ? "#library/arena" : entry.type === "GUILD_WAR_ROSTER" || entry.type === "GUILD_WAR_STRATEGY" ? "#library/gvg-plans" : "#library/gvg-builds")}><ArrowLeft size={16} /> Library</button>`, "Arena detail back route");
  source = replaceOnce(source,
`      {entry.workspace === "GVG" && <section className="library-run-next">`,
`      {entry.workspace === "ARENA" && <section className="library-run-next"><ShieldCheck size={22} /><div><strong>Keep the active Arena build independent</strong><p>Clone creates a separate Arena profile. The current PvE, Arena and Guild War configurations are not overwritten.</p></div><button type="button" onClick={() => { window.location.hash = "#arena/build"; }}>Open Arena</button></section>}
      {entry.workspace === "GVG" && <section className="library-run-next">`, "Arena detail CTA");
  source = replaceOnce(source,
`    { id: "pve", label: "PvE Builds", hash: "#library/pve" },
    { id: "gvg-builds",`,
`    { id: "pve", label: "PvE Builds", hash: "#library/pve" },
    { id: "arena", label: "Arena Builds", hash: "#library/arena" },
    { id: "gvg-builds",`, "Arena nav");
  source = replaceOnce(source,
`  const hasFilters = Boolean(search || pathFilter || weaponFilter || tierFilter || patchFilter || maturityFilter || objectiveFilter || roleFilter || sourceFilter);`,
`  const hasFilters = Boolean(search || pathFilter || weaponFilter || tierFilter || patchFilter || maturityFilter || objectiveFilter || roleFilter || arenaModeFilter || sourceFilter);`, "Arena filter active state");
  source = replaceOnce(source,
`<label>Role<select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}><option value="">All roles</option>{roles.map((value) => <option key={value}>{value}</option>)}</select></label><label>Source>`,
`<label>Role<select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}><option value="">All roles</option>{roles.map((value) => <option key={value}>{value}</option>)}</select></label><label>Arena mode<select value={arenaModeFilter} onChange={(event) => setArenaModeFilter(event.target.value)}><option value="">All Arena modes</option><option value="1v1">1v1</option><option value="3v3">3v3</option><option value="5v5">5v5 / Group Strategy</option></select></label><label>Source>`, "Arena mode UI filter");
  // The previous anchor includes JSX text immediately after Source. Replace robustly if the compact form differs.
  if (!source.includes("All Arena modes")) {
    source = replaceOnce(source,
`<label>Role<select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}><option value="">All roles</option>{roles.map((value) => <option key={value}>{value}</option>)}</select></label><label>Source<select`,
`<label>Role<select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}><option value="">All roles</option>{roles.map((value) => <option key={value}>{value}</option>)}</select></label><label>Arena mode<select value={arenaModeFilter} onChange={(event) => setArenaModeFilter(event.target.value)}><option value="">All Arena modes</option><option value="1v1">1v1</option><option value="3v3">3v3</option><option value="5v5">5v5 / Group Strategy</option></select></label><label>Source<select`, "Arena mode UI filter fallback");
  }
  source = source.replace("Discover reference builds and Guild War templates, understand their provenance, compare them with your build, then clone a safe local copy.", "Discover PvE, Arena and Guild War references, understand their provenance, compare them in the correct workspace, then clone a safe local copy.");
  fs.writeFileSync(path, source, "utf8");
}

// Seed a deliberately small Arena set. Exact equipment is omitted when not independently sourced.
{
  const path = "public/data/library-v1.json";
  const library = JSON.parse(fs.readFileSync(path, "utf8"));
  const existing = new Set((library.items || []).map((item) => item.id));
  const base = {
    workspace: "ARENA", type: "ARENA_BUILD", region: "Global", patch: "2.0", tier: "Arena Reference",
    createdDate: "2026-08-18", lastReviewedDate: "2026-08-18", librarySchemaVersion: 1, buildSchemaVersion: 1,
    maturity: ["OFFICIAL_REFERENCE", "MODELED"], featured: false,
    source: { label: "WWM Calc Global Arena evidence model", kind: "WWM_CALC", note: "Mechanic/reference profile only. No rank, win-rate or fabricated gear claim." },
  };
  const entries = [
    { ...base, id: "bamboocut-dust-arena-control-pressure", title: "Bamboocut-Dust Arena", subtitle: "Control / Pressure mechanic reference", path: "Bamboocut-Dust", weapons: ["Everspring Umbrella", "Unfettered Rope Dart"], arenaMode: "1v1", role: "Control / Pressure", objective: "1v1 matchup planning", tags: ["arena","1v1","control","pressure","bamboocut"], build: { path: "Bamboocut-Dust", weapons: ["Everspring Umbrella", "Unfettered Rope Dart"], arenaMode: "1v1", confidence: "OFFICIAL MECHANICS + MODELED PROFILE", scenario: "Global Version 2.0 Arena", gear: [], attunements: ["Scarlet Spin Arena Attunement trigger: successful Hit Stagger / Control"], why: ["Burn and Bury is currently unblockable but telegraphed by the golden flash.", "Piercing Dart Tenacity begins after 0.5s of Charging Stance.", "Scarlet Spin stagger/Attunement behavior uses the current Version 2.0 revision."], assumptions: ["No PvE DPS ranking is imported into Arena.", "Exact player reaction and matchup win probability remain unknown."], evidence: ["Official Version 2.0 rolling patch notes through August 7, 2026.", "Official Version 1.7 Path Balance / Arena rework."] } },
    { ...base, id: "stonesplit-might-arena-frontline", title: "Stonesplit-Might Arena", subtitle: "Frontline / Control mechanic reference", path: "Stonesplit-Might", weapons: ["Thundercry Blade", "Stormbreaker Spear"], arenaMode: "3v3", role: "Tank / Control", objective: "3v3 peel and frontline", tags: ["arena","3v3","tank","control","peel"], build: { path: "Stonesplit-Might", weapons: ["Thundercry Blade", "Stormbreaker Spear"], arenaMode: "3v3", confidence: "OFFICIAL MECHANICS + MODELED ROLE", scenario: "Global Version 2.0 3v3", gear: [], attunements: ["Predator's Shield Arena Attunement follows the current Version 2.0 chaining behavior."], why: ["Reference emphasizes survival, peel and control coverage rather than PvE DPS."], assumptions: ["Team value is modeled with event/state abstraction, not six-player frame simulation."], evidence: ["Official Version 2.0 Arena Attunement update.", "Official May 27/28 3v3 revive/composition rules."] } },
    { ...base, id: "silkbind-jade-arena-ranged-control", title: "Silkbind-Jade Arena", subtitle: "Ranged / Control mechanic reference", path: "Silkbind-Jade", weapons: ["Vernal Umbrella", "Inkwell Fan"], arenaMode: "1v1", role: "Ranged Control", objective: "1v1 ranged matchup planning", tags: ["arena","1v1","ranged","control","mobility"], maturity: ["MODELED"], build: { path: "Silkbind-Jade", weapons: ["Vernal Umbrella", "Inkwell Fan"], arenaMode: "1v1", confidence: "MODELED REFERENCE", scenario: "Global Version 2.0 Arena", gear: [], attunements: [], why: ["Mechanic-only profile for range, control and mobility comparisons."], assumptions: ["No exact item-level gear or community tier position is asserted."], evidence: ["Current Global Arena system rules; Path role remains modeled pending stronger client calibration."] } },
  ];
  for (const entry of entries) if (!existing.has(entry.id)) library.items.push(entry);
  fs.writeFileSync(path, `${JSON.stringify(library, null, 2)}\n`, "utf8");
}

console.log("Arena Community Library integration applied");
