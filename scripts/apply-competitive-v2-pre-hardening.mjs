import fs from "node:fs";

function read(path) { return fs.readFileSync(path, "utf8"); }
function write(path, source) { fs.writeFileSync(path, source, "utf8"); }

// The V1 hardening script generates sanitizeGvgWorkspaceV1 later in the workflow.
// Patch the generator contract before it runs so UNKNOWN can never be coerced to
// Arena. This is the source-of-truth fix; the validator below proves the generated result.
{
  const path = "scripts/apply-v1-release-hardening.mjs";
  const marker = "COMPETITIVE_V2_GVG_ATTUNEMENT_GENERATOR_UNKNOWN";
  let source = read(path);
  if (!source.includes(marker)) {
    const before = `      gvgSelectedProfile: member.gvgSelectedProfile === "NORMAL" ? "NORMAL" : "ARENA",`;
    const after = `      gvgSelectedProfile: member.gvgSelectedProfile === "NORMAL" || member.gvgSelectedProfile === "ARENA" ? member.gvgSelectedProfile : "UNKNOWN", // ${marker}`;
    if (!source.includes(before)) throw new Error("Competitive V2 pre-hardening: Guild War sanitizer generator anchor missing");
    source = source.replace(before, after);
    if (!source.includes(marker)) throw new Error("Competitive V2 pre-hardening: generator marker missing after patch");
    write(path, source);
  }
}

// final2 runs before the V1 hardening generator has materialized the sanitizer in
// src/gvg/model.js. Mark that this contract is intentionally generator-owned; the
// post-generation validator below is the enforcement point.
{
  const path = "src/gvg/model.js";
  const marker = "COMPETITIVE_V2_GVG_ATTUNEMENT_SANITIZER_UNKNOWN";
  let source = read(path);
  if (!source.includes(marker)) {
    source = `// ${marker} — generated sanitizeGvgWorkspaceV1 is patched by apply-competitive-v2-pre-hardening.mjs and verified by validate-gvg-model.mjs.\n${source}`;
    write(path, source);
  }
}

{
  const path = "scripts/validate-gvg-model.mjs";
  const marker = "COMPETITIVE_V2_GVG_ATTUNEMENT_SANITIZER_TEST";
  let source = read(path);
  if (!source.includes(marker)) {
    const before = `assert.equal(defaultWorkspace().scenario, "GUILD_WAR");`;
    const after = `assert.equal(defaultWorkspace().scenario, "GUILD_WAR");\nconst unknownAttunementWorkspace = migrateWorkspace({ ...defaultWorkspace(), roster: [{ id: "attune-unknown", name: "Unknown profile", roles: [], weapons: [], gvgSelectedProfile: "UNKNOWN" }] });\nassert.equal(unknownAttunementWorkspace.roster[0].gvgSelectedProfile, "UNKNOWN"); // ${marker}`;
    if (!source.includes(before)) throw new Error("Competitive V2 pre-hardening: Guild War validator migration anchor missing");
    source = source.replace(before, after);
    write(path, source);
  }
}

console.log("Competitive V2 pre-hardening Guild War Attunement UNKNOWN generator contract applied deterministically.");
