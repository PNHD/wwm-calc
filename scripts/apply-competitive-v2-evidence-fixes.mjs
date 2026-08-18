import fs from "node:fs";

await import("./apply-competitive-v2-storage.mjs");
await import("./apply-competitive-v2-storage-guards.mjs");
await import("./apply-competitive-v2-war-room.mjs");

const modelPath = "src/competitive/competitive-v2.mjs";
let model = fs.readFileSync(modelPath, "utf8");
const oldRow = `{ id: "arena-battlegroups", mode: "ARENA", patch: "2026-04-30+", source: "Official PVP427", sourceDate: "2026-04-30", claim: "Five current battlegroups and server mapping", scope: "Global Arena/Guild War", numeric: null, evidence: OFFICIAL, implementation: IMPLEMENTATION_STATE.ENCODED }`;
const newRow = `{ id: "arena-battlegroups", mode: "ARENA", patch: "2026-05-08+", source: "Official publisher Steam — May 8 Optimizations & Fixes", sourceDate: "2026-05-08", claim: "Linhe was added for US West, leaving five current battlegroups and the current server mapping", scope: "Global Arena/Guild War", numeric: null, evidence: OFFICIAL, implementation: IMPLEMENTATION_STATE.ENCODED }`;
if (!model.includes(newRow)) {
  if (!model.includes(oldRow)) throw new Error("Competitive V2 evidence fix: battlegroup row anchor missing");
  model = model.replace(oldRow, newRow);
  fs.writeFileSync(modelPath, model, "utf8");
}

const arenaDocPath = "docs/GLOBAL_ARENA_MODEL_V2.md";
let arenaDoc = fs.readFileSync(arenaDocPath, "utf8");
const apr30 = `- Apr 30 Arena/Guild War Optimization — https://www.wherewindsmeetgame.com/m/news/official/PVP427.html`;
const may8 = `- May 8 publisher Optimizations & Fixes — Steam publisher feed; Linhe split US West from the original Yougu grouping`;
if (!arenaDoc.includes(may8)) {
  if (!arenaDoc.includes(apr30)) throw new Error("Competitive V2 evidence fix: Arena source-list anchor missing");
  arenaDoc = arenaDoc.replace(apr30, `${apr30}\n${may8}`);
  arenaDoc = arenaDoc.replace(`Current official battlegroups encoded as data:`, `Current battlegroups are encoded as data. Apr 30 initially published four groups; the May 8 publisher update added Linhe for US West, producing the five-group mapping used below:`);
  fs.writeFileSync(arenaDocPath, arenaDoc, "utf8");
}

const matrixPath = "docs/COMPETITIVE_MODE_EVIDENCE_MATRIX.md";
let matrix = fs.readFileSync(matrixPath, "utf8");
const matrixOld = `| arena-battlegroups | Arena/GW | Yougu/Yunya/Canglang/Linhe/Jiangzhu mapping | CONFIRMED_OFFICIAL | encoded metadata |`;
const matrixNew = `| arena-battlegroups | Arena/GW | May 8 publisher update added Linhe (US West), yielding Yougu/Yunya/Canglang/Linhe/Jiangzhu mapping | CONFIRMED_OFFICIAL | encoded metadata |`;
if (!matrix.includes(matrixNew)) {
  if (!matrix.includes(matrixOld)) throw new Error("Competitive V2 evidence fix: matrix battlegroup anchor missing");
  matrix = matrix.replace(matrixOld, matrixNew);
  fs.writeFileSync(matrixPath, matrix, "utf8");
}

console.log("Competitive V2 evidence provenance corrections applied.");
