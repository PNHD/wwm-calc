import fs from "node:fs";

const path = "src/App.tsx";
let source = fs.readFileSync(path, "utf8").replace(/\r\n/g, "\n");

const normalizeEol = (value) => value.replace(/\r\n/g, "\n");
const hasNormalized = (value, expected) => normalizeEol(value).includes(expected);
const replaceNormalized = (value, from, to, label) => {
  if (!hasNormalized(value, from)) throw new Error(`[t96-stat-priority] ${label} not found`);
  const eol = value.includes("\r\n") ? "\r\n" : "\n";
  return value.replace(from.replaceAll("\n", eol), to.replaceAll("\n", eol));
};

const oldBlock = `    const totalFor = (p: PanelStats) => {
      let total = 0;
      getRotationForBuild(selectedBuild).forEach((item) => {
        const { total: dmg } = calcSkill(item, p, activeTier, {
          set: p.set || adjustedPanel.set,
          datang,
          yishui,
          buildKey: selectedBuild,
          weaponStars: (adjustedPanel as any).weaponStars,
          armorSet: (p as any).armorSet ?? (adjustedPanel as any).armorSet,
        } as any);
        total += dmg;
      });
      return total;
    };`;

const newBlock = `    const totalFor = (p: PanelStats) => {
      if (selectedBuild === "bamboocut-dust") {
        // adjustedPanel already contains static Inner Way Attribute Buffs. Feed
        // only conditional effects into the event timeline so one-roll marginal
        // DPS uses the same Morale/Tang/Phantom/Starweave model as Compare and
        // Best Build without double-counting deterministic menu-panel stats.
        const conditionalBuffs = buildTimelineBuffs(selectedInnerWays, innerWayTiers)
          .filter((buff) => !buff.id.endsWith(":static"));
        return simulateTimeline(
          getScenarioRotationForBuild(selectedBuild),
          p,
          conditionalBuffs,
          activeTier,
          {
            set: p.set || adjustedPanel.set,
            datang: false,
            yishui: false,
            buildKey: selectedBuild,
            weaponStars: (p as any).weaponStars ?? (adjustedPanel as any).weaponStars,
            armorSet: (p as any).armorSet ?? (adjustedPanel as any).armorSet,
            starweaveDistanceBonusPct,
          } as any,
          getRotationTimeForBuild(selectedBuild),
        ).total;
      }

      let total = 0;
      getScenarioRotationForBuild(selectedBuild).forEach((item) => {
        const { total: dmg } = calcSkill(item, p, activeTier, {
          set: p.set || adjustedPanel.set,
          datang,
          yishui,
          buildKey: selectedBuild,
          weaponStars: (adjustedPanel as any).weaponStars,
          armorSet: (p as any).armorSet ?? (adjustedPanel as any).armorSet,
        } as any);
        total += dmg;
      });
      return total;
    };`;

const hasBamboocutTimeline = hasNormalized(source, 'if (selectedBuild === "bamboocut-dust")')
  && hasNormalized(source, 'conditionalBuffs = buildTimelineBuffs(selectedInnerWays, innerWayTiers)');
if (!hasNormalized(source, newBlock) && !hasBamboocutTimeline) {
  source = replaceNormalized(source, oldBlock, newBlock, "totalFor anchor");
}

const oldDeps = `  }, [adjustedPanel, activeTier, datang, yishui, selectedBuild, baselineScore, rotationStats.gradRate, rotationStats.totalDmg]);`;
const newDeps = `  }, [adjustedPanel, activeTier, datang, yishui, selectedBuild, baselineScore, rotationStats.gradRate, rotationStats.totalDmg, selectedInnerWays, innerWayTiers, cinderAsh, starweaveDistanceBonusPct]);`;
const hasExtendedCurrentDeps = hasNormalized(source, 'starweaveDistanceBonusPct, jadeObjective, jadeScenario]);');
if (!hasNormalized(source, newDeps) && !hasExtendedCurrentDeps) {
  source = replaceNormalized(source, oldDeps, newDeps, "dependency anchor");
}

if (!hasNormalized(source, "conditionalBuffs = buildTimelineBuffs")) throw new Error("[t96-stat-priority] timeline evaluator not generated");
if (!hasNormalized(source, "starweaveDistanceBonusPct")) throw new Error("[t96-stat-priority] distance scenario did not reach stat priority");

// Keep simulated increments tied to the same verified native T96 table as Gear.
if (!source.includes('import { GLOBAL_T96_ROLL_CAPS }')) {
  source = 'import { GLOBAL_T96_ROLL_CAPS } from "./data/globalT96Rules";\n' + source;
}
const priorityStart = source.indexOf('    const ALL_STAT_ROLLS:');
const priorityEnd = source.indexOf('    // Only show weapon-specific', priorityStart);
let rolls = source.slice(priorityStart, priorityEnd);
const caps = { maxOuter: "maxOuter", minOuter: "minOuter", outerPen: "physicalPen", crit: "crit", aff: "affinity", prec: "precision", maxPz: "maxElement", pzPen: "elementPen", allArts: "allArts", bossDmg: "bossDmg" };
rolls = rolls.replace(/(key: "(\w+)", label: [^\n]+?roll: )[^,]+/g, (row, prefix, key) => caps[key] ? prefix + 'GLOBAL_T96_ROLL_CAPS.' + caps[key] : /Martial$/.test(key) ? prefix + 'GLOBAL_T96_ROLL_CAPS.weaponMartial' : row);
rolls = rolls.replace('label: "Max Bamboocut ATK"', 'label: `Max ${innerAttrName(selectedBuild)} ATK`');
rolls = rolls.replace(/(key: "(?:outerPen|pzPen)"[^\n]+unit: )"%"/g, '$1""');
source = source.slice(0, priorityStart) + rolls + source.slice(priorityEnd);
source = source.replace('    const baseGrad = rotationStats.gradRate;\n    const baseTotal = rotationStats.totalDmg;',
  '    const baseTotal = totalFor(adjustedPanel);\n    const baseGrad = baselineScore > 0 ? baseTotal / baselineScore * 100 : 0;');
source = source.replace('    const rotTime = getRotationTimeForBuild(selectedBuild);\n\n    const rows = STAT_ROLLS',
  '    const rotTime = selectedBuild === "silkbind-jade" ? Number(jadeScenarioForCombo(getActiveGear()).duration || 60) : getRotationTimeForBuild(selectedBuild);\n\n    const rows = STAT_ROLLS');
source = source.replace('starweaveDistanceBonusPct, jadeObjective, jadeScenario]);\n\n  // Helper to dynamically',
  'starweaveDistanceBonusPct, jadeObjective, jadeScenario, activeScheme?.gear, skillOverrides]);\n\n  // Helper to dynamically');
source = source.replace('Stat Priority — Graduation Impact', 'Stat Priority — Modeled Impact');
source = source.replace('Each row simulates adding/removing <strong>one typical substat roll</strong> on a single sub-stat and shows the resulting change in graduation %.',
  'Each row simulates the displayed stat increment. Native T96 stats use verified max rolls; other rows are hypothetical increments, not verified roll caps. Graduation changes are percentage points against a historical T91 baseline, not current T96 completion.');
source = source.replace('Adding +1 substat roll', 'Adding the displayed increment');
source = source.replace('Removing 1 substat roll', 'Removing up to the displayed increment');
source = source.replace('>% gain</span>', '>Grad. pp</span>');
source = source.replace('+{g.gain.toFixed(3)}%', '+{g.gain.toFixed(3)} pp');
source = source.replace('{g.loss.toFixed(3)}%', '{g.loss.toFixed(3)} pp');
source = source.replace('title="DPS added by one more max roll of this stat"', 'title="Modeled DPS added by the displayed increment"');
// Replace the obsolete universal ranking/threshold claims with the live-model contract.
const guideStart = source.indexOf('            {/* General T91 Priority Rules Guide */}');
const guideEnd = source.indexOf('          </div>\n        )}', guideStart);
if (guideStart >= 0 && guideEnd > guideStart) {
  source = source.slice(0, guideStart) + `            <p className="text-sm text-slate-400">Rankings depend on the selected Path, target, rotation and combat conditions. Check actual replacements in Gear Compare; this table does not prove that a stat can be rolled on a particular slot or Relaid item.</p>\n` + source.slice(guideEnd);
}


const statStart = source.indexOf('  const statPriorityList = useMemo(');
const statEnd = source.indexOf('  // Helper to dynamically', statStart);
let statBlock = source.slice(statStart, statEnd);
statBlock = statBlock.replace('          armorSet: (p as any).armorSet ?? (adjustedPanel as any).armorSet,\n        } as any);',
  '          armorSet: (p as any).armorSet ?? (adjustedPanel as any).armorSet,\n          skillOverride: skillOverrides[item.name],\n        } as any);');
source = source.slice(0, statStart) + statBlock + source.slice(statEnd);

fs.writeFileSync(path, source, "utf8");
console.log("[t96-stat-priority] PASS — marginal stat value uses the same Bamboocut scenario timeline as optimizer ranking.");
