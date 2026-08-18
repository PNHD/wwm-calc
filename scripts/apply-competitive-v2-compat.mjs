import fs from "node:fs";

await import("./apply-competitive-v2-evidence-fixes.mjs");

function patch(path, marker, transform) {
  let source = fs.readFileSync(path, "utf8");
  if (source.includes(marker)) return;
  source = transform(source);
  if (!source.includes(marker)) throw new Error(`Competitive V2 compatibility marker missing after patch: ${marker}`);
  fs.writeFileSync(path, source, "utf8");
}

patch("src/arena/ArenaWorkspace.tsx", "V1_MODEL_ABOUT_ARENA", (source) => {
  if (!source.includes("Competitive Modes V2")) throw new Error("Competitive V2 Arena source marker missing");
  const importAnchor = `import "./arena.css";`;
  if (!source.includes(importAnchor)) throw new Error("Competitive V2 ModelAbout import anchor missing");
  source = source.replace(importAnchor, `${importAnchor}\nimport ModelAbout from "../product/ModelAbout"; // V1_MODEL_ABOUT_ARENA`);
  const headerAnchor = `<div className="arena-patch"><span>GLOBAL</span><strong>2.0 V2</strong></div></header>`;
  if (!source.includes(headerAnchor)) throw new Error("Competitive V2 ModelAbout header anchor missing");
  return source.replace(headerAnchor, `<div className="arena-patch"><span>GLOBAL</span><strong>2.0 V2</strong></div><ModelAbout workspace="ARENA" page={route} path={profile.path} /></header>`);
});

patch("src/arena/ArenaWorkspace.tsx", "V1_ARENA_LIBRARY_COMPARE_CONSUMER", (source) => {
  if (!source.includes("Competitive Modes V2")) throw new Error("Competitive V2 Arena compare source marker missing");
  const oldCompare = `function Compare({ mode }: { mode: ArenaModeV2 }) { const guard = canOptimizeNumericStats(mode); return <div data-testid="arena-compare"><SectionHeader eyebrow="Arena V2 / Compare" title="Tradeoff compare" copy="Compare mechanic envelopes; do not import 1106/1129 PvE DPS ordering as Arena truth."/><article className="arena-card"><h3>Build A vs Build B</h3><div className="arena-two-col"><div><strong>A</strong><p>Burst / conversion / pressure focus.</p></div><div><strong>B</strong><p>Survival / Qi economy / peel focus.</p></div></div><p><strong>NO UNIVERSAL WINNER.</strong> Select the mode and matchup objective before deciding.</p>{!guard.allowed && <Unknown>Numeric stat delta comparison is disabled because selected-mode stat applicability is unresolved.</Unknown>}</article></div>; }`;
  if (!source.includes(oldCompare)) throw new Error("Competitive V2 Arena compare anchor missing");
  const nextCompare = `type ArenaLibraryCompareDescriptor = { entryId: string; path: string; mode: string; role: string; source: string };\n\nfunction readArenaLibraryCompareDescriptorV2(): ArenaLibraryCompareDescriptor | null {\n  const key = "wwm_arena_library_compare_v1";\n  const decode = (raw: string | null): ArenaLibraryCompareDescriptor | null => {\n    if (!raw || raw.length > 4096) return null;\n    try {\n      const value = JSON.parse(raw);\n      if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) return null;\n      if (["__proto__", "prototype", "constructor"].some((name) => Object.prototype.hasOwnProperty.call(value, name))) return null;\n      const path = typeof value.path === "string" && PATH_COMPETITIVE_PROFILES[value.path] ? value.path : "";\n      const mode = typeof value.mode === "string" && ["1v1", "3v3", "5v5"].includes(value.mode) ? value.mode : "";\n      if (!path || !mode) return null;\n      return { entryId: String(value.entryId || "library-reference").slice(0, 120), path, mode, role: String(value.role || "Community Reference").replace(/[<>]/g, "").slice(0, 120), source: String(value.source || "Community Library").replace(/[<>]/g, "").slice(0, 160) };\n    } catch { return null; }\n  };\n  try { const session = decode(sessionStorage.getItem(key)); if (session) return session; } catch {}\n  try {\n    const descriptor = decode(localStorage.getItem(key));\n    localStorage.removeItem(key);\n    if (descriptor) { sessionStorage.setItem(key, JSON.stringify(descriptor)); return descriptor; }\n  } catch {}\n  return null;\n}\n\nfunction Compare({ mode }: { mode: ArenaModeV2 }) {\n  const guard = canOptimizeNumericStats(mode);\n  const libraryReference = useMemo(() => readArenaLibraryCompareDescriptorV2(), []); // V1_ARENA_LIBRARY_COMPARE_CONSUMER\n  const buildB = libraryReference ? (libraryReference.role || "Community Reference") + " · Community Reference" : "Build B · Local tradeoff candidate";\n  return <div data-testid="arena-compare"><SectionHeader eyebrow="Arena V2 / Compare" title="Tradeoff compare" copy="Compare mechanic envelopes; do not import 1106/1129 PvE DPS ordering as Arena truth."/><article className="arena-card"><div className="arena-compare-pickers"><label>BUILD A<select aria-label="BUILD A" value="active" aria-readonly="true"><option value="active">Active Arena Build</option></select></label><ArrowLeftRight size={22}/><label>BUILD B<select aria-label="BUILD B" value={libraryReference ? "library" : "candidate"} aria-readonly="true"><option value={libraryReference ? "library" : "candidate"}>{buildB}</option></select></label></div>{libraryReference && <div className="arena-validation" data-testid="arena-library-reference"><Info size={16}/> Community Library reference loaded for comparison only: <strong>{libraryReference.path}</strong> · {libraryReference.role} · {libraryReference.source}. It was not cloned or made active.</div>}<h3>Build A vs Build B</h3><div className="arena-two-col"><div><strong>A</strong><p>Burst / conversion / pressure focus.</p></div><div><strong>B</strong><p>{libraryReference ? libraryReference.path + " reference mechanics for " + libraryReference.mode + "." : "Survival / Qi economy / peel focus."}</p></div></div><p><strong>NO UNIVERSAL WINNER.</strong> Select the mode and matchup objective before deciding.</p><p className="arena-muted">PvE modeled DPS is intentionally excluded from Arena comparison.</p>{!guard.allowed && <Unknown>Numeric stat delta comparison is disabled because selected-mode stat applicability is unresolved.</Unknown>}</article></div>;\n}`;
  return source.replace(oldCompare, nextCompare);
});

patch("src/product/GuildWarWorkspace.tsx", "V1_GVG_IMPORT_TYPE_CONTRACT", (source) => {
  if (!source.includes("GLOBAL GUILD WAR V2")) throw new Error("Competitive V2 Guild War source marker missing");
  return `// V1_GVG_IMPORT_TYPE_CONTRACT — V2 import validation is handled by validateShareEnvelope/migrateWorkspace.\n${source}`;
});

await import("./apply-competitive-v2-runtime-fixes.mjs");
await import("./apply-competitive-v2-runtime-final.mjs");

console.log("Competitive V2 compatibility contracts applied deterministically.");
