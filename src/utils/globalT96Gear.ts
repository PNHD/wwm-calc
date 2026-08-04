import { GLOBAL_T96_ROLL_CAPS } from "../data/globalT96Rules";

export interface GlobalT96GearLine {
  type: string;
  val: string;
  isTuned?: boolean;
}

export interface GlobalT96LineScore {
  type: string;
  value: number;
  cap: number | null;
  rollPct: number | null;
  fitWeight: number;
  useful: boolean;
  reason: string;
}

export interface GlobalT96GearScore {
  overall: number;
  rollQuality: number;
  buildFit: number;
  modeledContribution: number;
  recognizedLines: number;
  usefulLines: number;
  unknownLines: number;
  sourceLabel: string;
  lines: GlobalT96LineScore[];
  warnings: string[];
}

const parseNumber = (value: string): number => {
  const match = value.match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
};

const normalize = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]/g, "");

const ELEMENT_NAMES = ["bamboocut", "silkbind", "bellstrike", "stonesplit"];

const canonicalStat = (type: string): string | null => {
  const key = normalize(type);
  if (key.includes("maxphysatk") || key.includes("maxouteratk")) return "maxOuter";
  if (key.includes("minphysatk") || key.includes("minouteratk")) return "minOuter";
  if (key.includes("physpen") || key.includes("outerpen")) return "outerPen";
  if (key.includes("formlesspen") || key.includes("attrpen") || key.includes("elementpen")) return "elementPen";
  if (key.includes("critrate") || key === "crit") return "crit";
  if (key.includes("affinityrate") || key === "affinity") return "affinity";
  if (key.includes("precision")) return "precision";
  if (key === "power") return "power";
  if (key === "strength") return "strength";
  if (key === "agility") return "agility";
  if (key.includes("allmartialarts")) return "allArts";
  if (key.includes("bossdmg")) return "bossDmg";
  if (key.includes("mystic") || key.includes("anomalydmg")) return "mysticDmg";
  if (key.includes("attunedbonus") || key.includes("specifiedskill")) return "specifiedSkill";
  if (key.includes("bonus") || key.includes("martialartskilldmgboost") || key.includes("artof")) return "weaponMartial";
  if (ELEMENT_NAMES.some((name) => key.includes(`max${name}atk`))) return "maxElement";
  if (ELEMENT_NAMES.some((name) => key.includes(`min${name}atk`))) return "minElement";
  return null;
};

const CAP_BY_STAT: Record<string, number> = {
  strength: GLOBAL_T96_ROLL_CAPS.strength,
  agility: GLOBAL_T96_ROLL_CAPS.agility,
  power: GLOBAL_T96_ROLL_CAPS.power,
  minOuter: GLOBAL_T96_ROLL_CAPS.minOuter,
  maxOuter: GLOBAL_T96_ROLL_CAPS.maxOuter,
  precision: GLOBAL_T96_ROLL_CAPS.precision,
  crit: GLOBAL_T96_ROLL_CAPS.crit,
  affinity: GLOBAL_T96_ROLL_CAPS.affinity,
  minElement: GLOBAL_T96_ROLL_CAPS.minElement,
  maxElement: GLOBAL_T96_ROLL_CAPS.maxElement,
  allArts: GLOBAL_T96_ROLL_CAPS.allArts,
  weaponMartial: GLOBAL_T96_ROLL_CAPS.weaponMartial,
  outerPen: GLOBAL_T96_ROLL_CAPS.physicalPen,
  elementPen: GLOBAL_T96_ROLL_CAPS.elementPen,
  specifiedSkill: GLOBAL_T96_ROLL_CAPS.specifiedSkill,
  bossDmg: GLOBAL_T96_ROLL_CAPS.bossDmg,
  mysticDmg: GLOBAL_T96_ROLL_CAPS.mysticDmg,
};

const DEFAULT_WEIGHTS: Record<string, number> = {
  maxOuter: 0.9,
  minOuter: 0.55,
  outerPen: 0.9,
  elementPen: 0.55,
  crit: 0.85,
  affinity: 0.55,
  precision: 0.65,
  power: 0.45,
  strength: 0.45,
  agility: 0.45,
  maxElement: 0.65,
  minElement: 0.35,
  allArts: 0.85,
  weaponMartial: 0.85,
  specifiedSkill: 1,
  bossDmg: 0.9,
  mysticDmg: 0.4,
};

const BUILD_WEIGHTS: Record<string, Partial<Record<string, number>>> = {
  "bamboocut-dust": {
    maxOuter: 1,
    outerPen: 1,
    crit: 1,
    maxElement: 0.9,
    allArts: 0.95,
    weaponMartial: 1,
    specifiedSkill: 1,
    bossDmg: 0.95,
    precision: 0.75,
    minOuter: 0.55,
    power: 0.55,
    strength: 0.5,
    agility: 0.35,
    affinity: 0.15,
  },
  "bamboocut-wind": { maxElement: 1, elementPen: 0.95, outerPen: 0.9, crit: 0.9, weaponMartial: 1, bossDmg: 0.9 },
  "bellstrike-umbra": { affinity: 1, maxOuter: 0.95, outerPen: 0.9, weaponMartial: 1, bossDmg: 0.9, crit: 0.55 },
  "bellstrike-splendor": { maxOuter: 1, crit: 0.9, affinity: 0.75, outerPen: 0.85, weaponMartial: 1 },
  "silkbind-jade": { maxOuter: 0.95, crit: 0.9, affinity: 0.8, maxElement: 0.9, weaponMartial: 1, allArts: 0.95 },
  "silkbind-deluge": { maxOuter: 0.75, minOuter: 0.7, crit: 0.7, allArts: 0.85, bossDmg: 0.25 },
  "stonesplit-might": { maxOuter: 1, minOuter: 0.75, crit: 0.9, outerPen: 0.9, allArts: 0.9, maxElement: 0.05, minElement: 0.05 },
  "stonesplit-awe": { maxOuter: 1, crit: 0.9, outerPen: 0.9, allArts: 0.9 },
  "stonesplit-pure-datang": { maxOuter: 1, crit: 0.9, outerPen: 0.95, allArts: 0.95, weaponMartial: 1 },
  "bamboocut-kite": { maxOuter: 0.95, maxElement: 1, outerPen: 0.9, crit: 0.9, weaponMartial: 1 },
};

const fitWeight = (buildKey: string, stat: string): number => {
  const build = BUILD_WEIGHTS[buildKey];
  return build?.[stat] ?? DEFAULT_WEIGHTS[stat] ?? 0;
};

const isWrongElement = (type: string, buildKey: string): boolean => {
  const key = normalize(type);
  const ownElement = buildKey.startsWith("bamboocut") ? "bamboocut"
    : buildKey.startsWith("silkbind") ? "silkbind"
      : buildKey.startsWith("bellstrike") ? "bellstrike"
        : buildKey.startsWith("stonesplit") ? "stonesplit"
          : "";
  if (!ownElement) return false;
  const found = ELEMENT_NAMES.find((name) => key.includes(name));
  return Boolean(found && found !== ownElement);
};

export function scoreGlobalT96Gear(
  lines: GlobalT96GearLine[],
  buildKey: string,
  modeledContributionPct = 0,
): GlobalT96GearScore {
  const scored = lines.map<GlobalT96LineScore>((line) => {
    const stat = canonicalStat(line.type);
    const value = parseNumber(line.val);
    const cap = stat ? CAP_BY_STAT[stat] ?? null : null;
    const wrongElement = isWrongElement(line.type, buildKey);
    const weight = stat ? (wrongElement ? 0.05 : fitWeight(buildKey, stat)) : 0;
    const rollPct = cap && cap > 0 ? Math.max(0, Math.min(125, value / cap * 100)) : null;
    const useful = weight >= 0.55;
    const reason = !stat
      ? "No verified T96 cap for this line"
      : wrongElement
        ? "Off-element line for the selected path"
        : useful
          ? "Matches the selected build priority"
          : "Recognized T96 line with low build value";
    return { type: line.type, value, cap, rollPct, fitWeight: weight, useful, reason };
  });

  const recognized = scored.filter((line) => line.cap !== null);
  const rollQuality = recognized.length
    ? recognized.reduce((sum, line) => sum + Math.min(100, line.rollPct ?? 0), 0) / recognized.length
    : 0;
  const buildFit = scored.length
    ? scored.reduce((sum, line) => sum + line.fitWeight * 100, 0) / scored.length
    : 0;
  const modeledContribution = Math.max(0, Math.min(100, modeledContributionPct / 7 * 100));
  const overall = rollQuality * 0.5 + buildFit * 0.35 + modeledContribution * 0.15;
  const unknownLines = scored.filter((line) => line.cap === null).length;
  const warnings: string[] = [];
  if (unknownLines) warnings.push(`${unknownLines} line(s) are excluded because no verified Global T96 cap is available.`);
  if (scored.some((line) => line.reason.startsWith("Off-element"))) warnings.push("Off-element attribute attack is heavily discounted for this path.");
  if (!recognized.length) warnings.push("This item cannot be roll-scored from the verified 100上 table yet.");

  return {
    overall,
    rollQuality,
    buildFit,
    modeledContribution,
    recognizedLines: recognized.length,
    usefulLines: scored.filter((line) => line.useful).length,
    unknownLines,
    sourceLabel: "Global T96 verified · 100上",
    lines: scored,
    warnings,
  };
}
