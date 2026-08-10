import fs from "node:fs";

const appPath = "src/App.tsx";
const timelinePath = "src/utils/rotationTimeline.ts";
let app = fs.readFileSync(appPath, "utf8");
let timeline = fs.readFileSync(timelinePath, "utf8");

function replaceRequired(source, from, to, label) {
  if (source.includes(to)) return source;
  if (!source.includes(from)) throw new Error(`[t96-scenario] Missing patch anchor: ${label}`);
  return source.replace(from, to);
}

// Session scenario state. Food already exists and is persisted by the legacy
// config path; Cinder / distance are explicit product assumptions and default to
// the supplied 60s boss fixture.
app = replaceRequired(
  app,
  `  const [food, setFood] = useState<boolean>(() => {
    const config = getCustomConfig();
    return config?.food ?? true;
  });
  const [yishuiPen, setYishuiPen] = useState<boolean>(() => {`,
  `  const [food, setFood] = useState<boolean>(() => {
    const config = getCustomConfig();
    return config?.food ?? true;
  });
  const [cinderAsh, setCinderAsh] = useState(true);
  const [starweaveDistance, setStarweaveDistance] = useState<"near" | "far">("near");
  // Current committed Global tooltip: distance component begins above 4m and
  // reaches its explicit +1% maximum at 8m. Do not invent interpolation.
  const starweaveDistanceBonusPct = starweaveDistance === "far" ? 1 : 0;
  const getScenarioRotationForBuild = (buildKey: typeof selectedBuild) =>
    getRotationForBuild(buildKey).filter((item) => cinderAsh || !["Divinecraft - Fire", "Fire - Solid Foundation"].includes(item.name));
  const [yishuiPen, setYishuiPen] = useState<boolean>(() => {`,
  "scenario state",
);

// Make Cinder affect the same rotation source list used by displayed DPS and the
// complete-build evaluator. Other call sites remain unchanged unless they are the
// active product rotation path.
app = app.replaceAll("const rotation = getRotationForBuild(selectedBuild);", "const rotation = getScenarioRotationForBuild(selectedBuild);");
app = app.replaceAll(
  `        getRotationForBuild(selectedBuild),
        p,
        buffs,`,
  `        getScenarioRotationForBuild(selectedBuild),
        p,
        buffs,`,
);

// Pass the explicit distance mode into both current-build and candidate timeline
// calls. The timeline only consumes the verified discrete 0% / +1% endpoints.
app = app.replaceAll(
  `buildKey: selectedBuild, weaponStars: (p as any).weaponStars, armorSet: (p as any).armorSet } as any,`,
  `buildKey: selectedBuild, weaponStars: (p as any).weaponStars, armorSet: (p as any).armorSet, starweaveDistanceBonusPct } as any,`,
);
app = app.replaceAll(
  `buildKey: selectedBuild, weaponStars: (adjustedPanel as any).weaponStars, armorSet: (adjustedPanel as any).armorSet } as any,`,
  `buildKey: selectedBuild, weaponStars: (adjustedPanel as any).weaponStars, armorSet: (adjustedPanel as any).armorSet, starweaveDistanceBonusPct } as any,`,
);

// Current-build timeline memo must react to scenario changes.
app = app.replace(
  `  }, [adjustedPanel, activeTier, datang, yishui, selectedBuild, baselineScore, skillOverrides, selectedInnerWays, innerWayTiers, iwStats]);`,
  `  }, [adjustedPanel, activeTier, datang, yishui, selectedBuild, baselineScore, skillOverrides, selectedInnerWays, innerWayTiers, iwStats, cinderAsh, starweaveDistanceBonusPct]);`,
);

// Surface editable assumptions in the Combat workspace.
app = replaceRequired(
  app,
  `          onFoodChange={setFood}
          onConfigure={() => openProductTab("settings")}`,
  `          onFoodChange={setFood}
          cinderAsh={cinderAsh}
          onCinderAshChange={setCinderAsh}
          starweaveDistance={starweaveDistance}
          onStarweaveDistanceChange={setStarweaveDistance}
          onConfigure={() => openProductTab("settings")}`,
  "Combat workspace scenario props",
);

// Starweave's separate distance component is martial-skill scoped just like the
// stack component. Only exact tooltip endpoints are accepted; no 4–8m curve.
timeline = replaceRequired(
  timeline,
  `function starweaveBuff(color: string): TimelineBuff {
  return {`,
  `function starweaveBuff(color: string, distanceBonusPct = 0): TimelineBuff {
  return {`,
  "Starweave distance parameter",
);
timeline = replaceRequired(
  timeline,
  `    maxDelta: { generalDmg: 15 },
    maxStacks: 5,`,
  `    maxDelta: { generalDmg: 15 + Math.max(0, Math.min(1, distanceBonusPct)) },
    maxStacks: 5,`,
  "Starweave distance max component",
);
timeline = replaceRequired(
  timeline,
  `    allBuffs.push(starweaveBuff(BUFF_PALETTE[allBuffs.length % BUFF_PALETTE.length]));`,
  `    allBuffs.push(starweaveBuff(
      BUFF_PALETTE[allBuffs.length % BUFF_PALETTE.length],
      Number((opts as any).starweaveDistanceBonusPct || 0),
    ));`,
  "Starweave distance timeline injection",
);

if (!app.includes("getScenarioRotationForBuild")) throw new Error("[t96-scenario] scenario rotation helper missing");
if (!app.includes("onCinderAshChange={setCinderAsh}")) throw new Error("[t96-scenario] Cinder UI wiring missing");
if (!app.includes("onStarweaveDistanceChange={setStarweaveDistance}")) throw new Error("[t96-scenario] distance UI wiring missing");
if (!timeline.includes("distanceBonusPct")) throw new Error("[t96-scenario] distance timeline support missing");

fs.writeFileSync(appPath, app, "utf8");
fs.writeFileSync(timelinePath, timeline, "utf8");
console.log("[t96-scenario] PASS — Food/Cinder/distance assumptions are visible and share the optimizer timeline.");
