import fs from "node:fs";

const path = "src/App.tsx";
let source = fs.readFileSync(path, "utf8");

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

if (!source.includes(newBlock)) {
  if (!source.includes(oldBlock)) throw new Error("[t96-stat-priority] totalFor anchor not found");
  source = source.replace(oldBlock, newBlock);
}

const oldDeps = `  }, [adjustedPanel, activeTier, datang, yishui, selectedBuild, baselineScore, rotationStats.gradRate, rotationStats.totalDmg]);`;
const newDeps = `  }, [adjustedPanel, activeTier, datang, yishui, selectedBuild, baselineScore, rotationStats.gradRate, rotationStats.totalDmg, selectedInnerWays, innerWayTiers, cinderAsh, starweaveDistanceBonusPct]);`;
if (!source.includes(newDeps)) {
  if (!source.includes(oldDeps)) throw new Error("[t96-stat-priority] dependency anchor not found");
  source = source.replace(oldDeps, newDeps);
}

if (!source.includes("conditionalBuffs = buildTimelineBuffs")) throw new Error("[t96-stat-priority] timeline evaluator not generated");
if (!source.includes("starweaveDistanceBonusPct")) throw new Error("[t96-stat-priority] distance scenario did not reach stat priority");
fs.writeFileSync(path, source, "utf8");
console.log("[t96-stat-priority] PASS — marginal stat value uses the same Bamboocut scenario timeline as optimizer ranking.");
