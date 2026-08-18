import fs from "node:fs";

const path = "src/product/storage-registry.js";
let source = fs.readFileSync(path, "utf8");
const marker = `key: "wwm_arena_mode_v2"`;
if (!source.includes(marker)) {
  const arenaAnchor = `  { key: "wwm_arena_library_compare_v1", owner: "ARENA", schemaVersion: 1, migration: "legacy local descriptor → session-scoped comparison descriptor", fallback: "no Library reference selected for Arena compare", size: "tiny", corruption: "drop comparison descriptor only" },`;
  if (!source.includes(arenaAnchor)) throw new Error("Competitive V2 storage registry: Arena anchor missing");
  source = source.replace(arenaAnchor, `${arenaAnchor}
  { key: "wwm_arena_mode_v2", owner: "ARENA", schemaVersion: 2, migration: "allowlisted competitive mode enum", fallback: "1V1_ARENA", size: "tiny", corruption: "reset mode selector only" },`);

  const gvgAnchor = `  { key: "wwm_gvg_workspace_v1", owner: "GUILD_WAR", schemaVersion: 1, migration: "v0 → v1 bounded sanitize", fallback: "empty Guild War plan", size: "large", corruption: "backup + Guild-War-only recovery" },`;
  if (!source.includes(gvgAnchor)) throw new Error("Competitive V2 storage registry: Guild War anchor missing");
  source = source.replace(gvgAnchor, `${gvgAnchor}
  { key: "wwm_gvg_phase_v2", owner: "GUILD_WAR", schemaVersion: 2, migration: "allowlisted Guild War phase enum", fallback: "PREPARATION", size: "tiny", corruption: "reset current phase only" },
  { key: "wwm_gvg_v2_assignments", owner: "GUILD_WAR", schemaVersion: 2, migration: "seven-objective allowlist + bounded squad labels", fallback: "empty phase assignments", size: "small", corruption: "drop objective assignments only" },
  { key: "wwm_gvg_v2_manual", owner: "GUILD_WAR", schemaVersion: 2, migration: "bounded Advanced overrides; current Halftime trigger 0..3600s", fallback: "empty manual overrides / UNKNOWN", size: "tiny", corruption: "drop manual override only" },`);
  fs.writeFileSync(path, source, "utf8");
}

const validatorPath = "scripts/validate-arena-model.mjs";
let validator = fs.readFileSync(validatorPath, "utf8");
const storageImport = `import "./validate-competitive-storage-v2.mjs";`;
if (!validator.includes(storageImport)) {
  validator = `${storageImport}\n${validator}`;
  fs.writeFileSync(validatorPath, validator, "utf8");
}

console.log("Competitive V2 storage registry and sanitizer regression applied deterministically.");
