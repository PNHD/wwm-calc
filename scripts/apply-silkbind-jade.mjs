import fs from 'node:fs';

const appPath='src/App.tsx';
const innerPath='src/data/innerways.ts';
const attPath='src/data/gearAttunement.ts';
let app=fs.readFileSync(appPath,'utf8');
let inner=fs.readFileSync(innerPath,'utf8');
let att=fs.readFileSync(attPath,'utf8');

function replaceRequired(source,from,to,label){
  if(source.includes(to)) return source;
  if(!source.includes(from)) throw new Error(`[jade-2.0] Missing patch anchor: ${label}`);
  return source.replace(from,to);
}
function replaceRegexRequired(source,re,to,label){
  if(typeof to==='string' && source.includes(to)) return source;
  if(!re.test(source)) throw new Error(`[jade-2.0] Missing regex anchor: ${label}`);
  return source.replace(re,to);
}

// ---- Imports / path-owned UI ------------------------------------------------
app=replaceRequired(app,
  'import { SPEEDRUN_BOSSES, SPEEDRUN_PLAYBOOK } from "./data/speedrunGuide";',
  `import { SPEEDRUN_BOSSES, SPEEDRUN_PLAYBOOK } from "./data/speedrunGuide";
import JadeHealthPanel from "./product/workspaces/JadeHealthPanel";
import {
  JADE_OBJECTIVES,
  JADE_SKILL_TEMPLATES,
  evaluateSilkbindJadeCached,
  jadeBuildAdvice,
  resolveJadeAttunementFamily,
} from "./pathModels/silkbindJade.mjs";`,
  'Jade path-model imports');

// Remove stale Jade static-priority copy. Best Build/stat priority are now modeled.
app=replaceRequired(app,
  `  "silkbind-jade": {
    label: "Silkbind-Jade", weapons: "Vernal Umbrella + Inkwell Fan",
    tier: "T1 Ranged", color: "text-teal-400",
    gradTargets: { maxOuter: 2990, minOuter: 1345, outerPen: 35.5, crit: 107.6, aff: 43.5, critDmg: 50 },
    notes: "Priority: Max Phys ATK → Bamboocut ATK → Crit Rate → Affinity Rate.",
    priorityStats: ["maxOuter","crit","aff","affDmg","outerPen","umbMartial"],
  },`,
  `  "silkbind-jade": {
    label: "Silkbind-Jade", weapons: "Vernal Umbrella + Inkwell Fan",
    tier: "T96 Global 2.0", color: "text-teal-400",
    gradTargets: { maxOuter: 2990, minOuter: 1345, outerPen: 35.5, crit: 107.6, aff: 43.5, critDmg: 50 },
    notes: "Global 2.0: dynamic priority model. Reach effective Precision/Crit needs, then let modeled Jade DPS decide rates vs Physical Attack; no static stat weights.",
    priorityStats: [],
  },`,
  'Jade profile copy');
app=app.replaceAll('Ninefold Spring: Special Skill DMG Bonus (Attuned Weapon Bonus)','Vernal Umbrella: T96 semantic Attunement (family-aware)');

// ---- Scenario state ---------------------------------------------------------
const scenarioAnchor='  const starweaveDistanceBonusPct = starweaveDistance === "far" ? 1 : 0;';
const scenarioState=`  const starweaveDistanceBonusPct = starweaveDistance === "far" ? 1 : 0;
  const [jadeObjective, setJadeObjective] = useState<string>(JADE_OBJECTIVES.EXPECTED_DPS);
  const [jadeScenarioOverrides, setJadeScenarioOverrides] = useState<Record<string, any>>({
    duration: 60, strategy: "ground-jade", opening: "qhlq", firstQiBreakTime: 24,
    qiBreakDuration: 8, subsequentQiBreakInterval: 35, bossTakesQiDamage: true,
    perfectDodge: false, jadeCount: 1, lingerBridging: false, bitterSuppliedByTeammate: false,
    blossomDirectCritPct: 0,
  });
  const updateJadeScenario = (patch: Record<string, unknown>) => setJadeScenarioOverrides((prev) => ({ ...prev, ...patch }));
  const jadeScenario = useMemo(() => ({
    ...jadeScenarioOverrides,
    blossomBarrage: selectedInnerWays.includes("blossom_barrage"),
    starReacher: selectedInnerWays.includes("star_reacher"),
    thunderousBloom: selectedInnerWays.includes("thunderous_bloom"),
    moraleChant: selectedInnerWays.includes("morale_chant"),
    breakingPoint: selectedInnerWays.includes("breaking_point"),
    bitterSeasons: selectedInnerWays.includes("bitter_seasons"),
  }), [jadeScenarioOverrides, selectedInnerWays]);`;
app=replaceRequired(app,scenarioAnchor,scenarioState,'Jade scenario state');

// Helpers intentionally inspect raw Attunement rows so current T96 semantic
// families can coexist with old profiles whose family-level keys are preserved.
const helperAnchor='  // ponytail: single source for "gear combo → in-combat panel → rotation total".';
const helperBlock=`  const jadeAttunementsForCombo = (combo: GearItem[]) => {
    const bonuses: Record<string, number> = {};
    combo.forEach((gear) => gear.subs.forEach((sub) => {
      const family = resolveJadeAttunementFamily((sub as any).displayName || sub.type);
      if (!family) return;
      const value = parseSubValue(sub.val);
      if (Number.isFinite(value) && value > 0) bonuses[family.id] = (bonuses[family.id] || 0) + value;
    }));
    return bonuses;
  };
  const jadeScenarioForCombo = (combo: GearItem[]) => ({
    ...jadeScenario,
    attunementBonuses: jadeAttunementsForCombo(combo),
    cacheSalt: \`\${activeTier.name}|\${food ? 1 : 0}|\${bowSelect}|\${selectedInnerWays.join(",")}\`,
  });
  const priceJadeEvent = (event: any, eventPanel: PanelStats) => {
    const appSkill = JADE_SKILL_TEMPLATES[event.id]?.appSkill;
    if (!appSkill) return 0;
    return calcSkill(
      { name: appSkill, count: 1, isDingyin: false, generalBonus: 0, yishui: 0, tiaozhan: 1 },
      eventPanel,
      activeTier,
      {
        set: eventPanel.set || adjustedPanel.set,
        datang: false,
        yishui: false,
        buildKey: "silkbind-jade",
        weaponStars: (eventPanel as any).weaponStars ?? (adjustedPanel as any).weaponStars,
        armorSet: (eventPanel as any).armorSet ?? (adjustedPanel as any).armorSet,
      } as any,
    ).total;
  };

  // ponytail: single source for "gear combo → in-combat panel → rotation total".`;
app=replaceRequired(app,helperAnchor,helperBlock,'Jade complete-build helpers');

// Jade branch inside the complete-build evaluator. This automatically routes
// Gear Compare, contribution analysis and Best Build through the same planner.
if(!app.includes('const jadeResult = evaluateSilkbindJadeCached(')){
  app=replaceRegexRequired(app,
    /(  const comboInCombat = \(combo: GearItem\[\], bowOverride\?: string\): \{ total: number; crit: number \} => \{[\s\S]*?return \{ total: timelineResult\.total, crit: p\.crit \+ iwStats\.crit \};\n    \}\n\n)(    p\.outerPen \+= iwStats\.outerPen;)/,
    `$1    if (selectedBuild === "silkbind-jade") {
      p.outerPen += iwStats.outerPen; p.pzPen += iwStats.pzPen; p.crit += iwStats.crit; p.aff += iwStats.aff;
      p.dcrit += iwStats.dcrit; p.daff += iwStats.daff; p.critDmg += iwStats.critDmg; p.affDmg += iwStats.affDmg;
      p.outerDmg += iwStats.outerDmg; p.pzDmg += iwStats.pzDmg; p.prec += iwStats.prec;
      p.minOuter += iwStats.minOuter; p.maxOuter += iwStats.maxOuter; p.iwGeneralDmg = 0;
      const jadeResult = evaluateSilkbindJadeCached(p, jadeScenarioForCombo(combo), jadeObjective, priceJadeEvent);
      return { total: jadeResult.totalDamage, crit: p.crit };
    }

$2`,
    'Jade combo evaluator branch');
}

// Current-build DPS/skill table uses the exact same Jade evaluation.
if(!app.includes('const jadeCurrent = evaluateSilkbindJadeCached(')){
  const marker='    let totalDmg = 0;\n    const items = rotation.map((item) => {';
  const jadeCurrent=`    if (selectedBuild === "silkbind-jade") {
      const jadeCurrent = evaluateSilkbindJadeCached(adjustedPanel, jadeScenarioForCombo(equippedGear), jadeObjective, priceJadeEvent);
      const items = jadeCurrent.perSkill.map((row: any) => ({
        name: row.name, count: row.events, isDingyin: false, generalBonus: 0, yishui: 0, tiaozhan: 1,
        perHit: row.events ? row.damage / row.events : 0, total: row.damage,
        breakdown: { crit: 0, aff: 0, normal: 0, abrasion: 0 },
      }));
      return {
        items, totalDmg: jadeCurrent.totalDamage, dps: jadeCurrent.dps,
        gradRate: baselineScore > 0 ? jadeCurrent.totalDamage / baselineScore * 100 : 0,
        composition: comp, compositionPct: { crit: 0, aff: 0, normal: 100, abrasion: 0 },
      };
    }

    let totalDmg = 0;
    const items = rotation.map((item) => {`;
  app=replaceRequired(app,marker,jadeCurrent,'Jade current-build DPS branch');
}

// Dynamic Stat Priority must perturb the panel and rerun Jade, not the legacy fixed rotation.
if(!app.includes('if (selectedBuild === "silkbind-jade") {\n        return evaluateSilkbindJadeCached')){
  const marker=`      let total = 0;
      getScenarioRotationForBuild(selectedBuild).forEach((item) => {`;
  const branch=`      if (selectedBuild === "silkbind-jade") {
        return evaluateSilkbindJadeCached(
          p,
          { ...jadeScenario, cacheSalt: \`stat|\${activeTier.name}|\${jadeObjective}\` },
          jadeObjective,
          priceJadeEvent,
        ).totalDamage;
      }

      let total = 0;
      getScenarioRotationForBuild(selectedBuild).forEach((item) => {`;
  app=replaceRequired(app,marker,branch,'Jade stat-priority evaluator');
}

// Ensure memos react to Jade objective/scenario changes.
app=app.replace(
  'iwStats, cinderAsh, starweaveDistanceBonusPct]);',
  'iwStats, cinderAsh, starweaveDistanceBonusPct, jadeObjective, jadeScenario]);',
);
app=app.replace(
  'selectedInnerWays, innerWayTiers, cinderAsh, starweaveDistanceBonusPct]);',
  'selectedInnerWays, innerWayTiers, cinderAsh, starweaveDistanceBonusPct, jadeObjective, jadeScenario]);',
);

// Current diagnostics/advice live immediately before the Analysis workspace so the
// default screen remains compact and advanced scenario controls stay collapsed.
if(!app.includes('onObjectiveChange={setJadeObjective}')){
  const uiAnchor='      {workspace === "analysis" && (';
  const ui=`      {selectedBuild === "silkbind-jade" && (() => {
        const result = evaluateSilkbindJadeCached(adjustedPanel, jadeScenarioForCombo(equippedGear), jadeObjective, priceJadeEvent);
        return <JadeHealthPanel
          result={result}
          objective={jadeObjective}
          onObjectiveChange={setJadeObjective}
          scenario={jadeScenario}
          onScenarioChange={updateJadeScenario}
          advice={jadeBuildAdvice(adjustedPanel, jadeScenarioForCombo(equippedGear), jadeObjective, priceJadeEvent)}
          priorities={statPriorityList.gains.map((item) => ({ name: item.label, dps: item.gainDps }))}
        />;
      })()}

      {workspace === "analysis" && (`;
  app=replaceRequired(app,uiAnchor,ui,'Jade health UI');
}

// Jade compare reasoning: keep the existing full-build panel/set/attunement WHY,
// and add rate-saturation/objective context instead of a generic gear score.
if(!app.includes('const jadeReason = selectedBuild === "silkbind-jade"')){
  app=replace(
    'const reason = item.id === current?.id\n      ? "Current complete-build baseline."',
    'const jadeReason = selectedBuild === "silkbind-jade"\n      ? (candidateMenu.prec >= 115 ? " Precision remains near/at effective cap; excess Precision has low marginal value." : " Precision is still below the Jade target and remains valuable.")\n        + (jadeObjective === JADE_OBJECTIVES.SPEEDRUN_CEILING && candidateMenu.maxOuter > currentMenuPanel.maxOuter ? " +Max Physical is favored by the community Speedrun Ceiling endpoint." : "")\n      : "";\n    const reason = item.id === current?.id\n      ? "Current complete-build baseline."',
  );
  app=app.replace(
    ': `\${deltaDps >= 0 ? "Rotation gain" : "Rotation loss"} after the same 60s combat timeline\${reasonStats ? `; largest menu-panel changes: \${reasonStats}` : ""}.`;',
    ': `\${deltaDps >= 0 ? "Modeled gain" : "Modeled loss"} after the same path/scenario objective\${reasonStats ? `; largest menu-panel changes: \${reasonStats}` : ""}.\${jadeReason}`;',
  );
}

// ---- Inner Way corrections -------------------------------------------------
inner=replaceRequired(inner,
  'desc:"Vernal Umbrella\'s Spring Sorrow Martial Art Skill can hold up to 2 stacks. Hitting a target applies Combo effect: target takes +10% damage from your Ballistic Skills for 10s. Affected Skills: Let Spring Go, Everbloom, Umbrella Light Attack, Spring Away.",',
  'desc:"Global 2.0: Blossom Barrage is projectile-focused. Tier 5 changes the former Critical DMG breakthrough to Direct Critical Rate. Spring Away / Unfading Flower gain an own-Combo damage bonus, increased while the target is Exhausted. Exact current Direct Crit numeric value is intentionally not fabricated.",',
  'Blossom Barrage description');
inner=replaceRequired(inner,
  '{tier:5,effect:"Combo: Ballistic Skills +10% DMG for 10s (conditional, not summed)",stat:{}},\n      {tier:6,effect:"Basic Buff (conditional, NOT summed): combo +10% DMG for 10s. Attr Buff: Crit DMG +4.4%, Crit Rate +8.2%",stat:{critDmg:4.4,crit:8.2}},',
  '{tier:5,effect:"Global 2.0: Critical DMG breakthrough changed to Direct Critical Rate. Numeric current-client value unresolved; not added as a flat stat here.",stat:{}},\n      {tier:6,effect:"Ground Jade enabler (community/current behavior): Q on own Combo can gain ~2.5 Petals and refund 5s Q cooldown; Direct Crit numeric remains user/client supplied until verified.",stat:{}},',
  'Blossom Barrage T5/T6');
inner=replaceRequired(inner,
  'desc:"Moving >15m in 3s grants 3 stacks of Spring Thunder (12s): each Heavy Attack, Aerial Heavy, Light, or Light Charged Skill hit consumes 1 stack for +15% HP damage (next 1s of that skill type). Cannot stack. Once per 15s.",\n    recommended:false, note:"Mobility-triggered buff. Less consistent on stationary boss fights.",',
  'desc:"Official 1.7: completing Martial Art Skills activates Spring Thunder. Eligible attack/ballistic events consume charges for the temporary damage effect; low-Qi/Qi-break rules are modeled as event state rather than a permanent average.",\n    recommended:false, note:"Global 1.7+ event-driven trigger. Legacy movement-distance behavior is not used by the Jade optimizer.",',
  'Thunderous Bloom current description');

// ---- T96 semantic Attunement families -------------------------------------
const attInsert=`  { id: "vernal-high-frequency-ballistic", family: "umbrella", statKey: "Vernal Frequent Ballistic DMG Boost", weaponName: "Vernal Umbrella", aliases: ["vernal umbrella frequent ballistic dmg boost", "vernal umbrella frequent projectile dmg boost", "frequent ballistic dmg boost", "frequent projectile dmg boost"], displayName: "Vernal Umbrella — Frequent Ballistic DMG Boost" },
  { id: "vernal-special-t96", family: "umbrella", statKey: "Vernal Special Skill DMG Boost", weaponName: "Vernal Umbrella", aliases: ["vernal umbrella special skill dmg boost", "ninefold spring special skill dmg bonus"], displayName: "Vernal Umbrella — Special Skill DMG Boost" },
  { id: "vernal-charged-t96", family: "umbrella", statKey: "Vernal Charged Skill DMG Boost", weaponName: "Vernal Umbrella", aliases: ["vernal umbrella charged skill dmg boost"], displayName: "Vernal Umbrella — Charged Skill DMG Boost" },
  { id: "vernal-light-heavy-derived", family: "umbrella", statKey: "Vernal Light Heavy Derived DMG Boost", weaponName: "Vernal Umbrella", aliases: ["vernal umbrella light heavy attack varied combo dmg boost", "vernal umbrella light heavy follow up dmg boost", "light heavy attack varied combo dmg boost"], displayName: "Vernal Umbrella — Light/Heavy + Derived DMG Boost" },
`;
if(!att.includes('id: "vernal-high-frequency-ballistic"')){
  att=replaceRequired(att,
    '  { id: "vernal-umbrella", family: "umbrella", statKey: "Umb Martial Art Skill DMG Boost", weaponName: "Vernal Umbrella", aliases: ["vernal umbrella"], displayName: "Vernal Umbrella — Martial Art Skill DMG Boost" },\n',
    '  { id: "vernal-umbrella", family: "umbrella", statKey: "Umb Martial Art Skill DMG Boost", weaponName: "Vernal Umbrella", aliases: ["vernal umbrella"], displayName: "Vernal Umbrella — Martial Art Skill DMG Boost" },\n'+attInsert,
    'Vernal T96 Attunement definitions');
}
att=replaceRequired(att,
  '  const value = normalize(text);\n  if (!value.includes("martial art skill dmg")) return null;\n  for (const entry of WEAPON_ATTUNEMENTS) {',
  '  const value = normalize(text);\n  for (const entry of WEAPON_ATTUNEMENTS) {',
  'Attunement matcher supports semantic aliases');

if(!app.includes('evaluateSilkbindJadeCached')) throw new Error('[jade-2.0] App integration missing');
if(!app.includes('jadeObjective')) throw new Error('[jade-2.0] objective UI missing');
if(!inner.includes('Exact current Direct Crit numeric value is intentionally not fabricated')) throw new Error('[jade-2.0] Blossom evidence correction missing');
if(!att.includes('vernal-high-frequency-ballistic')) throw new Error('[jade-2.0] semantic Attunement family missing');

fs.writeFileSync(appPath,app,'utf8');
fs.writeFileSync(innerPath,inner,'utf8');
fs.writeFileSync(attPath,att,'utf8');
console.log('[jade-2.0] PASS — Silkbind-Jade path model, optimizer, diagnostics and semantic Attunements integrated.');
