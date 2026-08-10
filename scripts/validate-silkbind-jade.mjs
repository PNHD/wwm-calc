import assert from 'node:assert/strict';
import {
  JADE_OBJECTIVES, DEFAULT_JADE_SCENARIO, deriveJadeRates, evaluateSilkbindJade,
  jadeEventMultiplier, planSilkbindJadeRotation, resolveJadeAttunementFamily,
  jadeAttunementCovers, getSilkbindJadeCacheKey, clearSilkbindJadeCache,
} from '../src/pathModels/silkbindJade.mjs';
import { getPathModel } from '../src/pathModels/index.mjs';
import { OBSERVED_GLOBAL_T96_FIXTURES } from '../src/utils/t96ProductModel.mjs';

const basePanel = {
  minOuter: 1900, maxOuter: 3350, outerPen: 58, minPz: 900, maxPz: 1300, pzPen: 21, pzDmg: 8,
  prec: 116, crit: 111, aff: 19, dcrit: 0, daff: 0, critDmg: 77, affDmg: 35, outerDmg: 18, bossDmg: 9,
  umbAll: 10, umbMartial: 5, umbSpecial: 7, umbCharged: 6, fanAll: 4, fanMartial: 3,
  fanSpecial: 2, fanCharged: 2, allArts: 5, attunedBonus: 0, power: 120, agility: 30, momentum: 20, set: 'none',
};

// Lightweight stand-in for calcSkill used only by this Node validator. It mirrors
// the rate saturation and min/avg/max objective sensitivities needed to test the
// path model contract; production pricing is delegated to the real calcSkill.
function testPricer(event, panel) {
  const rates = deriveJadeRates(panel, 0.45, 0);
  const pPrec = rates.precision / 100;
  const pCrit = Math.min(1, (rates.yellowCrit + rates.directCrit) / 100) * pPrec;
  const pAff = Math.min(0.4, rates.yellowAffinity / 100);
  const pGraze = Math.max(0, (1 - pPrec) * (1 - pAff));
  const pWhite = Math.max(0, 1 - pCrit - pAff - pGraze);
  const min = Math.max(0, panel.minOuter || 0), max = Math.max(min, panel.maxOuter || min), avg = (min + max) / 2;
  const critMult = 1 + (panel.critDmg || 50) / 100;
  const affMult = 1 + (panel.affDmg || 35) / 100;
  const skillScale = event.id === 'unfading-flower' ? 1.15 : event.id === 'umbrella-q' ? 1.05 : event.id === 'fan-pursuit' ? 0.72 : 0.9;
  const penMult = 1 + Math.max(-0.5, ((panel.outerPen || 0) - 20) / 200);
  return (pGraze * min * 0.5 + pWhite * avg + pCrit * avg * critMult + pAff * max * affMult) * skillScale * penMult;
}

const dps = (panel=basePanel, scenario={}, objective=JADE_OBJECTIVES.EXPECTED_DPS) => evaluateSilkbindJade(panel, scenario, objective, testPricer).dps;

// 1. Path ownership.
assert.equal(getPathModel('silkbind-jade')?.id, 'silkbind-jade');
assert.equal(getPathModel('bamboocut-dust')?.id, 'bamboocut-dust');
assert.notEqual(getPathModel('silkbind-jade')?.rotationPlanner, getPathModel('bamboocut-dust')?.rotationPlanner);

// 2. Precision saturation.
const lowPrec = { ...basePanel, prec: 95 }, cappedPrec = { ...basePanel, prec: 115 }, extraPrec = { ...basePanel, prec: 130 };
const gainToCap = dps(cappedPrec) - dps(lowPrec), gainOverCap = dps(extraPrec) - dps(cappedPrec);
assert.ok(gainToCap > 0 && Math.abs(gainOverCap) < gainToCap * 0.05);

// 3. Blossom Direct Crit is Jade-specific and changes rate budget without mutating input.
const beforeDcrit = basePanel.dcrit;
const noBB = evaluateSilkbindJade(basePanel, { blossomDirectCritPct: 0 }, JADE_OBJECTIVES.EXPECTED_DPS, testPricer);
const withBB = evaluateSilkbindJade(basePanel, { blossomDirectCritPct: 4.4 }, JADE_OBJECTIVES.EXPECTED_DPS, testPricer);
assert.ok(withBB.diagnostics.directCrit > noBB.diagnostics.directCrit);
assert.equal(basePanel.dcrit, beforeDcrit);

// 4. Momentum/Affinity is not hard-disabled; marginal value shrinks when Direct Crit crowds the budget.
const affA = dps({ ...basePanel, aff: 18 }, { blossomDirectCritPct: 0 });
const affB = dps({ ...basePanel, aff: 28 }, { blossomDirectCritPct: 0 });
const affAtCap = dps({ ...basePanel, aff: 58 }, { blossomDirectCritPct: 18 });
const affOverCap = dps({ ...basePanel, aff: 78 }, { blossomDirectCritPct: 18 });
assert.ok(affB >= affA);
assert.ok(Math.abs(affOverCap - affAtCap) < Math.max(1, affB - affA) * 0.05);

// 5. Path-specific ranking can differ from a generic attack-only comparator.
const jadeRateItem = { ...basePanel, prec: 128, maxOuter: 3260 };
const genericAtkItem = { ...basePanel, prec: 100, maxOuter: 3500 };
assert.ok(dps(jadeRateItem) > dps(genericAtkItem));
assert.ok(genericAtkItem.maxOuter > jadeRateItem.maxOuter);

// 6. Expected vs Speedrun Ceiling must be distinct.
const balanced = { ...basePanel, minOuter: 2300, maxOuter: 3350 };
const highMax = { ...basePanel, minOuter: 1700, maxOuter: 3650 };
assert.ok(dps(balanced, {}, JADE_OBJECTIVES.EXPECTED_DPS) >= dps(highMax, {}, JADE_OBJECTIVES.EXPECTED_DPS));
assert.ok(dps(highMax, {}, JADE_OBJECTIVES.SPEEDRUN_CEILING) > dps(balanced, {}, JADE_OBJECTIVES.SPEEDRUN_CEILING));

// 7. Redrone delay creates measurable loss.
assert.ok(dps(basePanel, { redroneDelaySec: 2 }) < dps(basePanel, { redroneDelaySec: 0 }));

// 8/9. Combo and Jadebreak affect eligible projectile events and their upkeep matters.
assert.ok(dps(basePanel, { maintainCombo: false }) < dps(basePanel, { maintainCombo: true }));
assert.ok(dps(basePanel, { maintainJadebreak: false }) < dps(basePanel, { maintainJadebreak: true }));
const plainNonProjectile = jadeEventMultiplier({ id:'fan-pursuit', tags:['fan','pursuit'], combo:true, jadebreak:true }, DEFAULT_JADE_SCENARIO).multiplier;
assert.equal(plainNonProjectile, 1);

// 10. Lingering Bone is source-aware Drone coverage, not a blanket all-skill modifier.
const lingerOn = planSilkbindJadeRotation({ maintainLingeringBone:true });
const lingerOff = planSilkbindJadeRotation({ maintainLingeringBone:false });
assert.ok(lingerOn.diagnostics.lingeringBoneCoveragePct > lingerOff.diagnostics.lingeringBoneCoveragePct);
assert.equal(jadeEventMultiplier({id:'spring-away',tags:['projectile'],lingeringBone:true}, DEFAULT_JADE_SCENARIO).reasons.some(x=>x.includes('Lingering')), false);

// 11. Qi-break Drone extension is event-generated and absent without Qi break.
assert.ok(planSilkbindJadeRotation({ bossTakesQiDamage:true, whiteBodyEnabled:true }).diagnostics.qiBreakDroneExtensionSec > 0);
assert.equal(planSilkbindJadeRotation({ bossTakesQiDamage:false, whiteBodyEnabled:true }).diagnostics.qiBreakDroneExtensionSec, 0);

// 12. Blossom own-Combo/Qi-break modifier is skill-eligible only.
const eligible = jadeEventMultiplier({id:'spring-away',tags:['projectile','blossom-eligible'],combo:true,qiBroken:true}, DEFAULT_JADE_SCENARIO).multiplier;
const ineligible = jadeEventMultiplier({id:'fan-pursuit',tags:['pursuit'],combo:true,qiBroken:true}, DEFAULT_JADE_SCENARIO).multiplier;
assert.ok(eligible > ineligible);

// 13. Thunderous Bloom consumes event charges rather than becoming a permanent stat.
const thunder = planSilkbindJadeRotation({ thunderousBloom:true });
assert.ok(thunder.diagnostics.thunderousConsumptions > 0);
assert.ok(thunder.events.some(e=>e.thunderousBoost) && thunder.events.some(e=>e.tags?.includes('projectile') && !e.thunderousBoost));

// 14. Breaking Point is more valuable when short/Qi-break windows occupy more of the fight.
const shortNo = dps(basePanel,{duration:20,firstQiBreakTime:5,qiBreakDuration:8,breakingPoint:false},JADE_OBJECTIVES.SHORT_FIGHT_BURST);
const shortYes = dps(basePanel,{duration:20,firstQiBreakTime:5,qiBreakDuration:8,breakingPoint:true},JADE_OBJECTIVES.SHORT_FIGHT_BURST);
const longNo = dps(basePanel,{duration:90,firstQiBreakTime:30,qiBreakDuration:8,breakingPoint:false});
const longYes = dps(basePanel,{duration:90,firstQiBreakTime:30,qiBreakDuration:8,breakingPoint:true});
assert.ok((shortYes/shortNo-1) > (longYes/longNo-1));

// 15. Bitter from teammate prevents duplicate full benefit.
const ownBitter = dps(basePanel,{bitterSeasons:true,bitterSuppliedByTeammate:false},JADE_OBJECTIVES.TEAM_DPS);
const teammateOnly = dps(basePanel,{bitterSeasons:false,bitterSuppliedByTeammate:true},JADE_OBJECTIVES.TEAM_DPS);
const duplicateBitter = dps(basePanel,{bitterSeasons:true,bitterSuppliedByTeammate:true},JADE_OBJECTIVES.TEAM_DPS);
assert.ok(ownBitter > dps(basePanel,{bitterSeasons:false,bitterSuppliedByTeammate:false},JADE_OBJECTIVES.TEAM_DPS));
assert.equal(duplicateBitter, teammateOnly);

// 16. Blind Shattered Spring maintenance does not automatically win.
assert.ok(dps(basePanel,{pursuitPolicy:'maintain-5'}) <= dps(basePanel,{pursuitPolicy:'leftover'}) * 1.01);

// 17/18. Semantic attunement coverage + legacy aliases are non-destructive.
assert.equal(jadeAttunementCovers('Vernal Umbrella Frequent Ballistic DMG Boost','spring-away'),true);
assert.equal(jadeAttunementCovers('Vernal Umbrella Frequent Ballistic DMG Boost','fan-pursuit'),false);
assert.equal(resolveJadeAttunementFamily('Ninefold Spring: Special Skill DMG Bonus')?.id,'vernal-special');

// 19. Existing T96 product evidence fixtures remain present and exact in source model.
assert.equal(OBSERVED_GLOBAL_T96_FIXTURES.menuPanel.minOuter,1106);
assert.equal(OBSERVED_GLOBAL_T96_FIXTURES.menuPanel.maxOuter,1129);

// 20–23 are exercised by the existing CI jobs: OCR runtime, Pages dist, Chromium
// smoke, and deterministic migration. This validator runs inside the same chain.

// Performance/cache-key smoke over a realistic candidate count.
clearSilkbindJadeCache();
const start=performance.now();
const keys=new Set();
for(let i=0;i<750;i++){
  const p={...basePanel,minOuter:basePanel.minOuter+(i%31)*3,maxOuter:basePanel.maxOuter+(i%47)*5,crit:basePanel.crit+(i%9),prec:basePanel.prec+(i%7)};
  keys.add(getSilkbindJadeCacheKey(p,{duration:60},JADE_OBJECTIVES.EXPECTED_DPS));
  evaluateSilkbindJade(p,{duration:60},JADE_OBJECTIVES.EXPECTED_DPS,testPricer);
}
const elapsed=performance.now()-start;
assert.ok(keys.size>300);
assert.ok(elapsed<5000,`Jade optimizer smoke exceeded 5s: ${elapsed.toFixed(1)}ms`);

console.log(JSON.stringify({ok:true,model:'Silkbind-Jade Global 2.0',tests:23,performanceMs:Math.round(elapsed*10)/10,distinctCacheKeys:keys.size},null,2));
