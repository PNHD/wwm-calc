import fs from "node:fs";

const files = {
  innerWays: "src/data/innerways.ts",
  calc: "src/utils/calc.ts",
};

function read(path) {
  return fs.readFileSync(path, "utf8");
}

function write(path, content) {
  fs.writeFileSync(path, content, "utf8");
}

function replaceRequired(source, from, to, label) {
  if (source.includes(to)) return source;
  if (!source.includes(from)) throw new Error(`[global-v2-innerways] Missing patch anchor: ${label}`);
  return source.replace(from, to);
}

let innerWays = read(files.innerWays);
innerWays = replaceRequired(
  innerWays,
  'import { InnerWayTier, InnerWay, InnerWayTrigger } from "../types";',
  'import { InnerWayTier, InnerWay, InnerWayTrigger } from "../types";\nimport { GLOBAL_V2_INNER_WAY_OVERRIDES } from "./globalV2CombatEvidence";',
  "inner way override import",
);
innerWays = replaceRequired(
  innerWays,
  "export const INNER_WAYS: InnerWay[] = [",
  "const BASE_INNER_WAYS: InnerWay[] = [",
  "base inner way table",
);
innerWays = replaceRequired(
  innerWays,
  "];\n\n// Trigger classification for each inner way.",
  `];

// Overlay only the records verified against the current English Global client.
// Keeping the historical table below the overlay preserves all other paths while
// preventing stale CN/early-Global values from leaking into the active T96 build.
export const INNER_WAYS: InnerWay[] = BASE_INNER_WAYS.map((innerWay) => {
  const override = GLOBAL_V2_INNER_WAY_OVERRIDES[innerWay.id];
  return override ? { ...innerWay, ...override, id: innerWay.id, tiers: override.tiers } : innerWay;
});

// Trigger classification for each inner way.`,
  "Global 2.0 inner way overlay",
);
write(files.innerWays, innerWays);

let calc = read(files.calc);
calc = replaceRequired(
  calc,
  'import { ClassConfig, SkillData } from "../data/referenceData";',
  'import { ClassConfig, SkillData } from "../data/referenceData";\nimport { GLOBAL_V2_SKILL_OUTCOME_RULES } from "../data/globalV2CombatEvidence";',
  "skill outcome import",
);
calc = replaceRequired(
  calc,
  "  if (opts.skillOverride) sk = { ...sk, ...opts.skillOverride };\n\n  const set = opts.set;",
  `  if (opts.skillOverride) sk = { ...sk, ...opts.skillOverride };

  // The base Effective Critical Rate remains capped before Direct Critical is
  // added. Only explicit current-Global skill exceptions are applied here; all
  // unverified DoT/summon/settlement sources keep the normal formula rather than
  // being guessed into forced Crit/Affinity behavior.
  const outcomeRule = GLOBAL_V2_SKILL_OUTCOME_RULES[rot.name]?.rule;
  if (outcomeRule === "guaranteed-critical" && sk.force !== "crit") {
    sk = { ...sk, force: "crit" };
  }

  const set = opts.set;`,
  "current Global outcome rules",
);
write(files.calc, calc);

console.log("[global-v2-innerways] Current Global Inner Ways and explicit outcome rules applied.");
