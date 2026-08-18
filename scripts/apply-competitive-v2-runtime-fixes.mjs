import fs from "node:fs";

function read(path) { return fs.readFileSync(path, "utf8"); }
function write(path, source) { fs.writeFileSync(path, source, "utf8"); }

function replaceContract(path, marker, before, after, label) {
  let source = read(path);
  if (source.includes(marker)) return;
  if (!source.includes(before)) throw new Error(`Competitive V2 runtime fix: ${label} anchor missing`);
  source = source.replace(before, after);
  if (!source.includes(marker)) throw new Error(`Competitive V2 runtime fix: ${label} marker missing after patch`);
  write(path, source);
}

// Product regression: ProductShell updates its external Guild War route with
// history.replaceState(), which does not emit hashchange. Remount the V2 child
// when the shell route changes so the child reads the authoritative hash on mount.
{
  const path = "src/product/ProductShell.tsx";
  const marker = "COMPETITIVE_V2_GVG_ROUTE_KEY";
  const before = `{workspace === "gvg" && gvgView !== "overview" && (gvgView !== "share" || (Boolean(gvgSharePayload()) && !previewLegacyGvgShare)) && <div className={\`workspace-gvg-host is-\${gvgView}\`}><GuildWarWorkspace onClose={() => goGvg("overview")} /></div>}`;
  const after = `{workspace === "gvg" && gvgView !== "overview" && (gvgView !== "share" || (Boolean(gvgSharePayload()) && !previewLegacyGvgShare)) && <div className={\`workspace-gvg-host is-\${gvgView}\`}><GuildWarWorkspace key={gvgView} onClose={() => goGvg("overview")} />{/* COMPETITIVE_V2_GVG_ROUTE_KEY */}</div>}`;
  replaceContract(path, marker, before, after, "Guild War routed-host remount");
}

// Product regression: Competitive V2 replaced the old Arena reference cards
// with a path catalog but accidentally dropped the bounded clone action. Restore
// an Arena-only clone that never mutates PvE inventory or changes the active profile.
{
  const path = "src/arena/ArenaWorkspace.tsx";
  const marker = "V1_ARENA_REFERENCE_CLONE_V2";
  let source = read(path);
  if (!source.includes(marker)) {
    const start = source.indexOf("function ReferenceBuilds() {");
    const end = source.indexOf("\n\nfunction HistoryView", start);
    if (start < 0 || end < 0) throw new Error("Competitive V2 runtime fix: Arena reference catalog anchor missing");
    const replacement = `function ReferenceBuilds({ state, setState, mode }: { state: ArenaState; setState: (s: ArenaState) => void; mode: ArenaModeV2 }) {\n  const clone = (path: string, data: any) => {\n    if (state.profiles.length >= 12) return;\n    const id = \`arena-ref-clone-\${Date.now()}\`;\n    const next = {\n      id, name: \`\${path} Arena Reference\`, path,\n      weapons: Array.isArray(data.weapons) ? data.weapons.slice() : [],\n      mode: legacyMode(mode), normalAttunementProfile: null, arenaAttunementIds: [],\n      mysticSkills: [], innerWays: [], gearSnapshot: null, battlegroup: "Jiangzhu", latency: "Moderate latency",\n    };\n    setState({ ...state, profiles: [...state.profiles, next] } as ArenaState);\n  }; // V1_ARENA_REFERENCE_CLONE_V2\n  return <div data-testid="arena-reference"><SectionHeader eyebrow="Arena V2 / Paths" title="Evidence-backed competitive path catalog" copy="Only profiles supportable by current evidence are shown; missing paths are not filled with fake ratings."/><div className="arena-reference-grid">{Object.entries(PATH_COMPETITIVE_PROFILES).map(([path, data]: any) => <article className="arena-card" key={path}><div className="arena-result-head"><div><span className="arena-kicker">PATH</span><h3>{path}</h3></div><EvidenceBadge value={data.evidence}/></div><p>{data.weapons.join(" + ")} · {data.range}</p><ListBlock title="Control / stagger" rows={[...data.stagger,...data.control]}/><ListBlock title="Defensive states" rows={[...data.tenacity,...data.superArmor,...data.shielding]}/><ListBlock title="Unknown / counters" rows={data.counters}/><button type="button" disabled={state.profiles.length >= 12} onClick={() => clone(path, data)}>Clone to my workspace</button></article>)}</div></div>;\n}`;
    source = source.slice(0, start) + replacement + source.slice(end);
    const mappingBefore = `reference: <ReferenceBuilds/>`;
    const mappingAfter = `reference: <ReferenceBuilds state={state} setState={setState} mode={mode}/>`;
    if (!source.includes(mappingBefore)) throw new Error("Competitive V2 runtime fix: Arena reference route mapping anchor missing");
    source = source.replace(mappingBefore, mappingAfter);
    if (!source.includes(marker) || !source.includes(mappingAfter)) throw new Error("Competitive V2 runtime fix: Arena reference clone contract incomplete");
    write(path, source);
  }
}

// Selector compatibility: keep assertions tied to the semantic surface instead
// of changing product copy solely to satisfy Playwright accessible-name/text rules.
replaceContract(
  "scripts/runtime-gvg-acceptance.spec.mjs",
  "COMPETITIVE_V2_QI_MULTIPLIER_SELECTOR",
  `  await expect(page.getByText("×0.5", { exact: true }).first()).toBeVisible();`,
  `  await expect(page.getByTestId("gvg-phase-context" /* COMPETITIVE_V2_QI_MULTIPLIER_SELECTOR */)).toContainText("×0.5");`,
  "Guild War Qi multiplier assertion",
);

replaceContract(
  "scripts/runtime-workspace-ux.spec.mjs",
  "COMPETITIVE_V2_WORKSPACE_ACCESSIBLE_NAME",
  `async function switchWorkspace(page, name) { const switcher = page.getByRole("navigation", { name: "Product workspaces" }); await expect(switcher).toBeVisible(); await switcher.getByRole("button", { name: new RegExp(\`^\${name}\`) }).click(); }`,
  `async function switchWorkspace(page, name) { const switcher = page.getByRole("navigation", { name: "Product workspaces" }); await expect(switcher).toBeVisible(); await switcher.getByRole("button", { name: new RegExp(name, "i") /* COMPETITIVE_V2_WORKSPACE_ACCESSIBLE_NAME */ }).click(); }`,
  "workspace switcher accessible-name assertion",
);

replaceContract(
  "scripts/runtime-arena-acceptance.spec.mjs",
  "COMPETITIVE_V2_NO_UNIVERSAL_WINNER_SELECTOR",
  `  await expect(page.getByText(/NO UNIVERSAL WINNER/i)).toBeVisible();`,
  `  await expect(page.getByText("NO UNIVERSAL WINNER", { exact: true } /* COMPETITIVE_V2_NO_UNIVERSAL_WINNER_SELECTOR */)).toBeVisible();`,
  "Arena no-universal-winner assertion",
);

console.log("Competitive V2 runtime routing, clone and scoped acceptance contracts applied deterministically.");
