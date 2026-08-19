import fs from "node:fs";

function update(path, marker, transform) {
  let source = fs.readFileSync(path, "utf8");
  if (source.includes(marker)) return;
  source = transform(source);
  if (!source.includes(marker)) throw new Error(`Competitive V2 storage guard marker missing: ${marker}`);
  fs.writeFileSync(path, source, "utf8");
}

update("src/arena/ArenaWorkspace.tsx", "COMPETITIVE_V2_ARENA_STORAGE_GUARDS", (source) => {
  const importAnchor = `} from "../competitive/competitive-v2.mjs";`;
  if (!source.includes(importAnchor)) throw new Error("Arena V2 storage guard import anchor missing");
  if (source.includes("ARENA_CANONICAL_V2_MODE")) {
    const verifiedCanonicalState = source.includes("activeModeV2: next")
      && source.includes("opponentPath: next")
      && source.includes("setOpponentRaw");
    if (!verifiedCanonicalState) throw new Error("Arena canonical mode marker lacks verified canonical persistence postconditions");
    return source.replace(importAnchor, `${importAnchor}\n// COMPETITIVE_V2_ARENA_STORAGE_GUARDS`);
  }
  source = source.replace(importAnchor, `${importAnchor}\nimport { loadArenaModeV2, saveArenaModeV2 } from "../competitive/storage-v2.mjs"; // COMPETITIVE_V2_ARENA_STORAGE_GUARDS`);
  source = source.replace(`const MODE_KEY = "wwm_arena_mode_v2";\n`, "");
  const initialOld = `function initialMode(profile: any): ArenaModeV2 {\n  const stored = localStorage.getItem(MODE_KEY);\n  if (ARENA_MODE_IDS.includes(stored as any)) return stored as ArenaModeV2;\n  if (profile?.mode === "3v3") return "3V3_ARENA";\n  if (profile?.mode === "5v5") return "GROUP_STRATEGY";\n  return "1V1_ARENA";\n}`;
  const initialNew = `function initialMode(profile: any): ArenaModeV2 {\n  const fallback = profile?.mode === "3v3" ? "3V3_ARENA" : profile?.mode === "5v5" ? "GROUP_STRATEGY" : "1V1_ARENA";\n  return loadArenaModeV2(fallback) as ArenaModeV2;\n}`;
  if (!source.includes(initialOld)) throw new Error("Arena V2 initial mode storage anchor missing");
  source = source.replace(initialOld, initialNew);
  const writeOld = `localStorage.setItem(MODE_KEY, next); setModeRaw(next);`;
  if (!source.includes(writeOld)) throw new Error("Arena V2 mode write anchor missing");
  return source.replace(writeOld, `saveArenaModeV2(next); setModeRaw(next);`);
});

update("src/product/GuildWarWorkspace.tsx", "COMPETITIVE_V2_GVG_STORAGE_GUARDS", (source) => {
  if (source.includes("COMPETITIVE_V2_GVG_STORAGE_GUARDS")) {
    const verified = source.includes("consumeGvgStorageRecovery") && source.includes("loadGvgAssignmentsV2") && source.includes("saveGvgAssignmentsV2") && source.includes("loadGvgManualV2") && source.includes("saveGvgManualV2") && source.includes("loadGvgPhaseV2") && source.includes("saveGvgPhaseV2");
    if (!verified) throw new Error("Guild War storage guard marker lacks verified bounded persistence postconditions");
    return source;
  }
  const importAnchor = `} from "../competitive/competitive-v2.mjs";`;
  if (!source.includes(importAnchor)) throw new Error("Guild War V2 storage guard import anchor missing");
  source = source.replace(importAnchor, `${importAnchor}\nimport { loadGvgAssignmentsV2, loadGvgManualV2, loadGvgPhaseV2, saveGvgAssignmentsV2, saveGvgManualV2, saveGvgPhaseV2 } from "../competitive/storage-v2.mjs"; // COMPETITIVE_V2_GVG_STORAGE_GUARDS`);
  source = source.replace(`const PHASE_KEY = "wwm_gvg_phase_v2";\nconst MANUAL_KEY = "wwm_gvg_v2_manual";\n`, "");

  const strategyOld = `useState<Record<string,string>>(() => safeJson(localStorage.getItem("wwm_gvg_v2_assignments"), {}))`;
  if (!source.includes(strategyOld)) throw new Error("Guild War V2 assignments read anchor missing");
  source = source.replace(strategyOld, `useState<Record<string,string>>(() => loadGvgAssignmentsV2())`);
  const assignmentWriteOld = `localStorage.setItem("wwm_gvg_v2_assignments", JSON.stringify(next));`;
  if (!source.includes(assignmentWriteOld)) throw new Error("Guild War V2 assignments write anchor missing");
  source = source.replace(assignmentWriteOld, `saveGvgAssignmentsV2(next);`);

  const manualReadOld = `safeJson(localStorage.getItem(MANUAL_KEY), {}).halftimeTrigger ?? ""`;
  if (!source.includes(manualReadOld)) throw new Error("Guild War V2 manual read anchor missing");
  source = source.replace(manualReadOld, `loadGvgManualV2().halftimeTrigger ?? ""`);
  const manualSaveOld = `const row = safeJson(localStorage.getItem(MANUAL_KEY), {}); localStorage.setItem(MANUAL_KEY, JSON.stringify({ ...row, halftimeTrigger: value }));`;
  if (!source.includes(manualSaveOld)) throw new Error("Guild War V2 manual write anchor missing");
  source = source.replace(manualSaveOld, `const row = loadGvgManualV2(); saveGvgManualV2({ ...row, halftimeTrigger: value });`);

  const phaseReadOld = `useState(() => localStorage.getItem(PHASE_KEY) || "PREPARATION")`;
  if (!source.includes(phaseReadOld)) throw new Error("Guild War V2 phase read anchor missing");
  source = source.replace(phaseReadOld, `useState(() => loadGvgPhaseV2())`);
  const phaseWriteOld = `const setPhase = (value: string) => { setPhaseRaw(value); localStorage.setItem(PHASE_KEY,value); };`;
  if (!source.includes(phaseWriteOld)) throw new Error("Guild War V2 phase write anchor missing");
  return source.replace(phaseWriteOld, `const setPhase = (value: string) => { const safe = saveGvgPhaseV2(value); setPhaseRaw(safe); };`);
});

console.log("Competitive V2 local-state storage guards applied deterministically.");
