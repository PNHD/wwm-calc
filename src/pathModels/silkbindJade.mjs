export const JADE_MODEL_VERSION = 2;
export const PROVENANCE = Object.freeze({ CONFIRMED_CLIENT:'CONFIRMED_CLIENT', CONFIRMED_OFFICIAL:'CONFIRMED_OFFICIAL', COMMUNITY_GUIDE:'COMMUNITY_GUIDE', COMMUNITY_MEASURED:'COMMUNITY_MEASURED', MODELED_ASSUMPTION:'MODELED_ASSUMPTION', UNRESOLVED:'UNRESOLVED' });
export const JADE_OBJECTIVES = Object.freeze({ EXPECTED_DPS:'expected-dps', SHORT_FIGHT_BURST:'short-fight-burst', SPEEDRUN_CEILING:'speedrun-ceiling', TEAM_DPS:'team-dps' });
export const JADE_OBJECTIVE_LABELS = Object.freeze({ 'expected-dps':'Expected DPS', 'short-fight-burst':'Short-fight Burst', 'speedrun-ceiling':'Speedrun Ceiling', 'team-dps':'Team DPS / Bitter Duty' });

export const JADE_ATTUNEMENT_FAMILIES = Object.freeze({
  'vernal-high-frequency-ballistic': { id:'vernal-high-frequency-ballistic', activeAtT96:true, provenance:PROVENANCE.CONFIRMED_OFFICIAL, displayAliases:['Vernal Umbrella Frequent Ballistic DMG Boost','Vernal Umbrella Frequent Projectile DMG Boost','Frequent Ballistic DMG Boost','Frequent Projectile DMG Boost'], legacyAliases:[], covers:['spring-away','unfading-flower'] },
  'vernal-special': { id:'vernal-special', activeAtT96:true, provenance:PROVENANCE.CONFIRMED_OFFICIAL, displayAliases:['Vernal Umbrella Special Skill DMG Boost','Special Skill Damage Boost'], legacyAliases:['Ninefold Spring: Special Skill DMG Bonus'], covers:['unfading-flower'] },
  'vernal-charged': { id:'vernal-charged', activeAtT96:true, provenance:PROVENANCE.CONFIRMED_OFFICIAL, displayAliases:['Vernal Umbrella Charged Skill DMG Boost','Charged Skill Damage Boost'], legacyAliases:[], covers:['spring-away'] },
  'vernal-light-heavy-derived': { id:'vernal-light-heavy-derived', activeAtT96:true, provenance:PROVENANCE.CONFIRMED_OFFICIAL, displayAliases:['Vernal Umbrella Light/Heavy Attack & Varied Combo DMG Boost','Vernal Umbrella Light/Heavy Follow-up DMG Boost','Light/Heavy Attack & Varied Combo DMG Boost'], legacyAliases:[], covers:['umbrella-light','umbrella-heavy-light'] },
});
const clamp=(n,lo,hi)=>Math.min(hi,Math.max(lo,Number.isFinite(Number(n))?Number(n):0));
const round=(n,p=4)=>Number(Number(n||0).toFixed(p));
const norm=(s='')=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
export function resolveJadeAttunementFamily(text=''){ const v=norm(text); if(!v)return null; for(const f of Object.values(JADE_ATTUNEMENT_FAMILIES)) if([...f.displayAliases,...f.legacyAliases].some(a=>v.includes(norm(a)))) return f; return null; }
export function jadeAttunementCovers(familyOrText,skillId){ const f=typeof familyOrText==='string'?(JADE_ATTUNEMENT_FAMILIES[familyOrText]||resolveJadeAttunementFamily(familyOrText)):familyOrText; return Boolean(f?.covers?.includes(skillId)); }

export function deriveJadeRates(panel,judgeRes=0.45,blossomDirectCritPct=0){
  const jr=1+Math.max(0,Number(judgeRes||0));
  const precision=clamp(65+Math.max(0,(panel.prec??0)-65)/jr,0,100);
  const yellowCrit=clamp((panel.crit??0)/jr,0,80), yellowAffinity=clamp((panel.aff??0)/jr,0,40);
  const directCrit=Math.max(0,panel.dcrit??0)+Math.max(0,blossomDirectCritPct||0), directAffinity=Math.max(0,panel.daff??0);
  return { precision:round(precision), yellowCrit:round(yellowCrit), yellowAffinity:round(yellowAffinity), directCrit:round(directCrit), directAffinity:round(directAffinity), heuristicBudget:round(yellowCrit+directCrit+yellowAffinity+directAffinity) };
}

export const DEFAULT_JADE_SCENARIO = Object.freeze({
  duration:60, strategy:'ground-jade', opening:'qhlq', fightType:'boss', judgeRes:0.45,
  firstQiBreakTime:24, qiBreakDuration:8, subsequentQiBreakInterval:35, bossTakesQiDamage:true, challengeMode:false,
  perfectDodge:false, jadeCount:1, lingerBridging:false, bitterSuppliedByTeammate:false, otherJadeDroneRefresh:false,
  breakingPoint:false, thunderousBloom:false, bitterSeasons:false, moraleChant:false, starReacher:false,
  starReacherBaseAttackPct:5, starReacherLowQiAttackPct:12.5, starReacherT6OwnMarkDmgPct:3, hpAbove75:true,
  bitterResistanceReduction:10, bitterPersonalRampSec:10, blossomBarrage:true,
  maintainCombo:true, maintainJadebreak:true, maintainLingeringBone:true, whiteBodyEnabled:true, pursuitPolicy:'leftover', redroneDelaySec:0,
  blossomDirectCritPct:0, blossomDirectCritProvenance:PROVENANCE.UNRESOLVED,
  comboProjectileBonusPct:20, comboProjectileBonusProvenance:PROVENANCE.COMMUNITY_GUIDE,
  jadebreakProjectileBonusPct:40, jadebreakProjectileBonusProvenance:PROVENANCE.COMMUNITY_GUIDE,
  blossomOwnComboBonusPct:5, blossomOwnComboExhaustedBonusPct:10, blossomOwnComboBonusProvenance:PROVENANCE.CONFIRMED_OFFICIAL,
  qPetalsNoCombo:1, qPetalsWithCombo:2.5, heavyLightPetals:2.4, petalGenerationProvenance:PROVENANCE.COMMUNITY_MEASURED,
  blossomsPerPetal:10, maxPetals:5, qCooldown:12, qCharges:3, qComboCooldownRefund:5,
  dronePetalCostShort:2.5, dronePetalCostLong:5, droneDurationPerPetal:2.4, droneTickInterval:0.6,
  droneRefundBlossoms:15, droneRefundCooldown:5, droneRefundProvenance:PROVENANCE.CONFIRMED_OFFICIAL,
  comboDuration:15, jadebreakDuration:15, lingeringBoneDuration:6, lingeringBoneDurationProvenance:PROVENANCE.MODELED_ASSUMPTION,
  shatteredSpringDuration:15, shatteredSpringMax:5, shatteredSpringPerStackPct:4,
  whiteBodyPetalRefillPerSecond:0.9, whiteBodyCadenceProvenance:PROVENANCE.MODELED_ASSUMPTION,
  vitalityMax:100, vitalityReserveForQiBreak:35, attunementBonuses:{}, fluteDistanceBonus:null,
});

export const JADE_SKILL_TEMPLATES = Object.freeze({
  'fan-wall': { name:'Fan Wall', duration:1.2, tags:['weapon','fan','martial','jadebreak-source'], appSkill:'扇Q(近距离命中)+阴阳鬼掣', priced:true },
  'umbrella-q': { name:'Spring Sorrow', duration:1.19, tags:['weapon','umbrella','martial','projectile','ballistic','combo-source','blossom-eligible'], appSkill:'伞Q(风墙无纵地)', priced:true },
  'umbrella-heavy-light': { name:'Umbrella Heavy → Light', duration:1.4, tags:['weapon','umbrella','heavy','derived','projectile'], appSkill:'伞重击派生(无纵地)', priced:true },
  'spring-away': { name:'Spring Away', duration:1.7, tags:['weapon','umbrella','charged','projectile','ballistic','blossom-eligible'], appSkill:'伞～(连中风墙无纵地)', priced:true },
  'unfading-flower': { name:'Unfading Flower', duration:0, tags:['weapon','umbrella','special','projectile','ballistic','drone','blossom-eligible'], appSkill:'丢伞(无纵地)', priced:true },
  'fan-special': { name:'Fan Special', duration:0.9, tags:['weapon','fan','special','lingering-bone-source'], appSkill:null, priced:false },
  'fan-pursuit': { name:'Fan Pursuit', duration:1.15, tags:['weapon','fan','pursuit'], appSkill:'扇普通重击派生(风墙阴阳低真气鬼掣)', priced:true },
  'flying-projectile': { name:'Flying Jade projectile', duration:1.7, tags:['weapon','umbrella','charged','projectile','ballistic'], appSkill:'伞～(连中风墙无纵地)', priced:true },
  'dragonhead': { name:'Dragonhead filler', duration:1.8, tags:['mystic','qi-break-filler'], appSkill:null, priced:false, provenance:PROVENANCE.UNRESOLVED },
});

export function isQiBrokenAt(t,s){
  if(!s.bossTakesQiDamage||s.firstQiBreakTime==null||s.qiBreakDuration<=0)return false;
  if(t>=s.firstQiBreakTime&&t<s.firstQiBreakTime+s.qiBreakDuration)return true;
  if(!(s.subsequentQiBreakInterval>0))return false;
  for(let x=s.firstQiBreakTime+s.subsequentQiBreakInterval;x<s.duration;x+=s.subsequentQiBreakInterval) if(t>=x&&t<x+s.qiBreakDuration)return true;
  return false;
}
function nextQiBreakStart(t,s){ if(!s.bossTakesQiDamage||s.firstQiBreakTime==null)return null; if(t<=s.firstQiBreakTime)return s.firstQiBreakTime; if(!(s.subsequentQiBreakInterval>0))return null; let x=s.firstQiBreakTime+s.subsequentQiBreakInterval; while(x<t)x+=s.subsequentQiBreakInterval; return x<s.duration?x:null; }
function refresh(state,s){ if(state.t>=state.comboUntil)state.combo=false; if(state.t>=state.jadebreakUntil)state.jadebreak=false; if(state.t>=state.lingeringBoneUntil)state.lingeringBone=false; if(state.t>=state.shatteredSpringUntil)state.shatteredSpring=0; if(state.droneActive&&state.t>=state.droneUntil){ state.droneActive=false; state.droneEnds++; state.lastDroneEndAt=state.droneUntil; if(state.droneUntil-state.lastDroneRefundAt>=s.droneRefundCooldown){ gainPetals(state,s.droneRefundBlossoms/s.blossomsPerPetal,s); state.lastDroneRefundAt=state.droneUntil; state.refundedBlossoms+=s.droneRefundBlossoms; } } }
function gainPetals(state,amount,s){ const before=state.petals; state.petals=Math.min(s.maxPetals,state.petals+amount); state.petalsWasted+=Math.max(0,before+amount-s.maxPetals); }
function rechargeQ(state,s){ state.qRecharge.sort((a,b)=>a-b); while(state.qRecharge.length&&state.qRecharge[0]<=state.t){ state.qRecharge.shift(); state.qCharges=Math.min(s.qCharges,state.qCharges+1); } }
function push(events,state,s,id,extra={}){
  const sk=JADE_SKILL_TEMPLATES[id], at=state.t;
  const e={ t:round(at,3), id, name:sk.name, tags:[...sk.tags], duration:sk.duration, combo:state.combo&&at<state.comboUntil, jadebreak:state.jadebreak&&at<state.jadebreakUntil, lingeringBone:state.lingeringBone&&at<state.lingeringBoneUntil, qiBroken:isQiBrokenAt(at,s), shatteredSpringBefore:state.shatteredSpring, thunderousBoost:false, breakingPoint:state.breakingPointUntil>at, starReacher:s.starReacher&&state.starReacherUntil>at, moraleStacks:s.moraleChant?Math.min(5,Math.floor(at/2)+1):0, bitterActive:Boolean(s.bitterSuppliedByTeammate||(s.bitterSeasons&&at>=s.bitterPersonalRampSec)), ...extra };
  if(s.thunderousBloom&&state.thunderCharges>0&&(sk.tags.includes('heavy')||sk.tags.includes('pursuit')||sk.tags.includes('ballistic'))){e.thunderousBoost=true;state.thunderCharges--;}
  events.push(e); state.t+=sk.duration; if(s.thunderousBloom&&sk.tags.includes('martial'))state.thunderCharges=Math.max(state.thunderCharges,3); return e;
}
function emitDrone(events,state,s,until){
  while(state.droneActive&&state.nextDroneTick<=until&&state.nextDroneTick<s.duration){
    const t=state.nextDroneTick, qi=isQiBrokenAt(t,s);
    if(qi&&s.whiteBodyEnabled){ const petals=s.whiteBodyPetalRefillPerSecond*s.droneTickInterval, ext=petals*s.droneDurationPerPetal; state.droneUntil+=ext; state.qiBreakDroneExtension+=ext; state.whiteBodyPetals+=petals; }
    events.push({ t:round(t,3), id:'unfading-flower', name:'Unfading Flower tick', tags:[...JADE_SKILL_TEMPLATES['unfading-flower'].tags], duration:0, droneTick:true, combo:state.combo&&t<state.comboUntil, jadebreak:state.jadebreak&&t<state.jadebreakUntil, lingeringBone:state.lingeringBone&&t<state.lingeringBoneUntil, qiBroken:qi, shatteredSpringBefore:state.shatteredSpring, thunderousBoost:false, breakingPoint:state.breakingPointUntil>t, starReacher:s.starReacher&&state.starReacherUntil>t, moraleStacks:s.moraleChant?Math.min(5,Math.floor(t/2)+1):0, bitterActive:Boolean(s.bitterSuppliedByTeammate||(s.bitterSeasons&&t>=s.bitterPersonalRampSec)) });
    if(state.lingeringBone&&t<state.lingeringBoneUntil)state.lingeringBoneUntil=Math.max(state.lingeringBoneUntil,t+s.lingeringBoneDuration); else if(s.jadeCount>1&&s.lingerBridging){state.lingeringBone=true;state.lingeringBoneUntil=t+s.lingeringBoneDuration;}
    state.nextDroneTick+=s.droneTickInterval;
  }
}
function chooseDrone(state,s){ const remaining=s.duration-state.t,nextQi=nextQiBreakStart(state.t,s); if(remaining<7||(nextQi!=null&&nextQi-state.t<=5))return 'short'; return state.petals>=s.dronePetalCostLong?'long':'short'; }
function startDrone(events,state,s){ const len=chooseDrone(state,s),cost=len==='long'?s.dronePetalCostLong:s.dronePetalCostShort; if(state.petals+1e-9<cost)return false; if(state.lastDroneEndAt!=null&&state.t<state.lastDroneEndAt+Math.max(0,s.redroneDelaySec))return false; if(state.lastDroneEndAt!=null)state.droneDowntime+=Math.max(0,state.t-state.lastDroneEndAt); state.petals-=cost; state.droneActive=true; state.droneStarts++; state.droneUntil=state.t+cost*s.droneDurationPerPetal; state.nextDroneTick=state.t+s.droneTickInterval; events.push({t:round(state.t,3),id:'drone-start',name:`Unfading Flower (${len})`,tags:['state','drone-start'],duration:0,petalsSpent:cost}); return true; }
function useQ(events,state,s,priority){ const hadCombo=state.combo&&state.t<state.comboUntil; const e=push(events,state,s,'umbrella-q',{priority}); gainPetals(state,hadCombo?s.qPetalsWithCombo:s.qPetalsNoCombo,s); state.combo=true; state.comboUntil=state.t+s.comboDuration; state.qCharges=Math.max(0,state.qCharges-1); state.qRecharge.push(state.t+Math.max(0,s.qCooldown-(hadCombo&&s.blossomBarrage?s.qComboCooldownRefund:0))); return e; }
function waitStep(events,state,s,sec=.2){ const until=Math.min(s.duration,state.t+sec); emitDrone(events,state,s,until); state.t=until; }

export function planSilkbindJadeRotation(inputScenario={}){
  const s={...DEFAULT_JADE_SCENARIO,...inputScenario},events=[];
  const state={ t:0,petals:0,petalsWasted:0,combo:false,comboUntil:0,jadebreak:false,jadebreakUntil:0,lingeringBone:false,lingeringBoneUntil:0,droneActive:false,droneUntil:0,nextDroneTick:Infinity,droneStarts:0,droneEnds:0,lastDroneEndAt:null,droneDowntime:0,lastDroneRefundAt:-Infinity,refundedBlossoms:0,whiteBodyPetals:0,qCharges:s.qCharges,qRecharge:[],shatteredSpring:0,shatteredSpringUntil:0,pursuitHits:0,qiBreakDroneExtension:0,thunderCharges:0,breakingPointUntil:0,starReacherUntil:0,vitality:s.vitalityMax,nextPerfectDodgeAt:0 };
  if(s.maintainJadebreak){push(events,state,s,'fan-wall',{priority:'maintain-jadebreak'});state.jadebreak=true;state.jadebreakUntil=state.t+s.jadebreakDuration;}
  if(s.maintainLingeringBone){push(events,state,s,'fan-special',{priority:'ensure-lingering-bone'});state.lingeringBone=true;state.lingeringBoneUntil=state.t+s.lingeringBoneDuration;if(s.starReacher)state.starReacherUntil=state.t+8;}
  const opening=s.opening==='qq'?['umbrella-q','umbrella-q']:s.opening==='qhl'?['umbrella-q','umbrella-heavy-light']:s.opening==='qqhl'?['umbrella-q','umbrella-q','umbrella-heavy-light']:['umbrella-q','umbrella-heavy-light','umbrella-q'];
  for(const id of opening){ if(state.t>=s.duration)break; if(id==='umbrella-q')useQ(events,state,s,'opening'); else{push(events,state,s,id,{priority:'opening'});gainPetals(state,s.heavyLightPetals,s);} }
  if(s.strategy==='ground-jade'&&state.petals>=s.dronePetalCostShort)startDrone(events,state,s);
  let guard=0;
  while(state.t<s.duration&&guard++<10000){
    rechargeQ(state,s);refresh(state,s);emitDrone(events,state,s,state.t);refresh(state,s);
    if(s.breakingPoint&&isQiBrokenAt(state.t,s))state.breakingPointUntil=Math.max(state.breakingPointUntil,state.t+5);
    if(s.breakingPoint&&s.perfectDodge&&!isQiBrokenAt(state.t,s)&&state.t>=state.nextPerfectDodgeAt){state.breakingPointUntil=state.t+5;state.nextPerfectDodgeAt=state.t+15;events.push({t:round(state.t,3),id:'perfect-dodge',name:'Perfect Dodge → Breaking Point',tags:['state'],duration:0});}
    if(s.starReacher&&state.lingeringBone&&state.t<state.lingeringBoneUntil)state.starReacherUntil=Math.max(state.starReacherUntil,state.t+8);
    if(s.strategy==='flying-jade'){const end=state.t+JADE_SKILL_TEMPLATES['flying-projectile'].duration;emitDrone(events,state,s,end);push(events,state,s,'flying-projectile',{priority:'flying-jade-filler'});continue;}
    if(s.maintainJadebreak&&(!state.jadebreak||state.jadebreakUntil-state.t<1.25)){const end=state.t+1.2;emitDrone(events,state,s,end);push(events,state,s,'fan-wall',{priority:'maintain-jadebreak'});state.jadebreak=true;state.jadebreakUntil=state.t+s.jadebreakDuration;continue;}
    if(s.maintainCombo&&(!state.combo||state.comboUntil-state.t<1.25)&&state.qCharges>0){const end=state.t+1.19;emitDrone(events,state,s,end);useQ(events,state,s,'maintain-combo');continue;}
    if(s.maintainLingeringBone&&(!state.lingeringBone||state.lingeringBoneUntil-state.t<1)&&(state.droneActive||state.petals>=s.dronePetalCostShort)){const end=state.t+.9;emitDrone(events,state,s,end);push(events,state,s,'fan-special',{priority:'ensure-lingering-bone'});state.lingeringBone=true;state.lingeringBoneUntil=state.t+s.lingeringBoneDuration;if(s.starReacher)state.starReacherUntil=Math.max(state.starReacherUntil,state.t+8);continue;}
    if(!state.droneActive&&state.petals>=s.dronePetalCostShort&&startDrone(events,state,s))continue;
    if((!state.droneActive||state.petals<s.dronePetalCostShort)&&state.qCharges>0){const end=state.t+1.19;emitDrone(events,state,s,end);useQ(events,state,s,'build-petals');continue;}
    if(!state.droneActive&&state.petals<s.dronePetalCostShort){const end=state.t+1.4;emitDrone(events,state,s,end);push(events,state,s,'umbrella-heavy-light',{priority:'build-petals'});gainPetals(state,s.heavyLightPetals,s);continue;}
    const remaining=state.droneUntil-state.t,nextQi=nextQiBreakStart(state.t,s),reserve=nextQi!=null&&nextQi-state.t<6;
    if(s.pursuitPolicy==='maintain-5'&&state.shatteredSpring<s.shatteredSpringMax){const end=state.t+1.15;emitDrone(events,state,s,end);push(events,state,s,'fan-pursuit',{priority:'maintain-shattered-spring'});state.shatteredSpring++;state.shatteredSpringUntil=state.t+s.shatteredSpringDuration;state.pursuitHits++;continue;}
    if(remaining>1.8&&(!reserve||state.vitality>s.vitalityReserveForQiBreak+10)){const end=state.t+1.7;emitDrone(events,state,s,end);push(events,state,s,'spring-away',{priority:'drone-filler'});state.vitality=Math.max(0,state.vitality-10);continue;}
    if(remaining>1.2&&s.pursuitPolicy==='leftover'&&state.shatteredSpring<s.shatteredSpringMax){const end=state.t+1.15;emitDrone(events,state,s,end);push(events,state,s,'fan-pursuit',{priority:'leftover-drone-window'});state.shatteredSpring++;state.shatteredSpringUntil=state.t+s.shatteredSpringDuration;state.pursuitHits++;continue;}
    waitStep(events,state,s,.2);
  }
  emitDrone(events,state,s,s.duration);state.t=s.duration;refresh(state,s);
  const ticks=events.filter(e=>e.droneTick),projectiles=events.filter(e=>e.tags?.includes('projectile'));
  let qiSecs=0;for(let t=0;t<s.duration;t+=.05)if(isQiBrokenAt(t,s))qiSecs+=.05;
  const uptime=Math.min(s.duration,ticks.length*s.droneTickInterval),qiTicks=ticks.filter(e=>e.qiBroken).length;
  return { path:'silkbind-jade',strategy:s.strategy,scenario:s,events,finalState:{...state,petals:round(state.petals),petalsWasted:round(state.petalsWasted)},diagnostics:{ duration:s.duration,droneUptimePct:round(uptime/s.duration*100,2),averageDroneDowntime:state.droneStarts>1?round(state.droneDowntime/(state.droneStarts-1),3):0,dronesPer60:round(state.droneStarts*60/s.duration,2),petalsWasted:round(state.petalsWasted,3),refundedBlossoms:state.refundedBlossoms,comboUptimePct:projectiles.length?round(projectiles.filter(e=>e.combo).length/projectiles.length*100,2):0,jadebreakUptimePct:projectiles.length?round(projectiles.filter(e=>e.jadebreak).length/projectiles.length*100,2):0,lingeringBoneCoveragePct:ticks.length?round(ticks.filter(e=>e.lingeringBone).length/ticks.length*100,2):0,qiBreakDroneUptimePct:qiSecs>0?round(Math.min(qiSecs,qiTicks*s.droneTickInterval)/qiSecs*100,2):0,qiBreakDroneExtensionSec:round(state.qiBreakDroneExtension,3),whiteBodyPetals:round(state.whiteBodyPetals,3),pursuitUses:state.pursuitHits,thunderousConsumptions:events.filter(e=>e.thunderousBoost).length,breakingPointEvents:events.filter(e=>e.breakingPoint).length } };
}

export function jadeEventMultiplier(event,input={}){
  const s={...DEFAULT_JADE_SCENARIO,...input};let m=1;const reasons=[];
  if(event.tags?.includes('projectile')){if(event.combo){m*=1+s.comboProjectileBonusPct/100;reasons.push('Combo projectile');}if(event.jadebreak){m*=1+s.jadebreakProjectileBonusPct/100;reasons.push('Jadebreak projectile');}}
  if(event.tags?.includes('blossom-eligible')&&event.combo&&s.blossomBarrage){const pct=event.qiBroken?s.blossomOwnComboExhaustedBonusPct:s.blossomOwnComboBonusPct;m*=1+pct/100;reasons.push(`Blossom Barrage own Combo +${pct}%`);}
  if(event.id==='unfading-flower'||event.id==='spring-away'){m*=1.15;reasons.push('Official 1.7 PvE +15%');}
  if(event.id==='spring-away'&&event.shatteredSpringBefore>0){m*=1+event.shatteredSpringBefore*s.shatteredSpringPerStackPct/100;reasons.push('Shattered Spring');}
  if(event.thunderousBoost){m*=1.15;reasons.push('Thunderous Bloom event charge');}
  if(event.breakingPoint){m*=1.10;reasons.push('Breaking Point window');}
  if(event.moraleStacks>0){m*=1+event.moraleStacks/100;reasons.push(`Morale Chant ${event.moraleStacks} stack`);}
  if(event.starReacher&&event.lingeringBone&&s.hpAbove75){m*=1+s.starReacherT6OwnMarkDmgPct/100;reasons.push('Star Reacher T6 own Lingering Bone');}
  for(const [id,pctRaw] of Object.entries(s.attunementBonuses||{})){const pct=Number(pctRaw||0);if(pct>0&&jadeAttunementCovers(id,event.id)){m*=1+pct/100;reasons.push(`${id} Attunement`);}}
  return {multiplier:m,reasons};
}
function fallbackPrice(event,panel,objective){if(!JADE_SKILL_TEMPLATES[event.id]?.priced)return 0;const min=Math.max(0,panel.minOuter||0),max=Math.max(min,panel.maxOuter||min),atk=objective===JADE_OBJECTIVES.SPEEDRUN_CEILING?max:(min+max)/2;return atk*.8+100;}
export function evaluateSilkbindJade(panel,inputScenario={},objective=JADE_OBJECTIVES.EXPECTED_DPS,priceSkill=null){
  const s={...DEFAULT_JADE_SCENARIO,...inputScenario},plan=planSilkbindJadeRotation(s),basePanel={...panel};
  if(s.blossomBarrage&&s.blossomDirectCritPct>0)basePanel.dcrit=(basePanel.dcrit||0)+s.blossomDirectCritPct;
  if(objective===JADE_OBJECTIVES.SPEEDRUN_CEILING)basePanel.minOuter=basePanel.maxOuter;
  let total=0;const perSkill=new Map();
  for(const event of plan.events){if(!JADE_SKILL_TEMPLATES[event.id]?.priced)continue;const p={...basePanel};if(event.moraleStacks>0)p.outerPen=(p.outerPen||0)+2*event.moraleStacks;if(event.bitterActive)p.outerPen=(p.outerPen||0)+s.bitterResistanceReduction;if(event.starReacher){const pct=event.qiBroken?s.starReacherLowQiAttackPct:s.starReacherBaseAttackPct;p.minOuter=(p.minOuter||0)*(1+pct/100);p.maxOuter=(p.maxOuter||0)*(1+pct/100);}const base=priceSkill?Number(priceSkill(event,p)||0):fallbackPrice(event,p,objective);const dmg=base*jadeEventMultiplier(event,s).multiplier;if(!(dmg>0))continue;total+=dmg;const row=perSkill.get(event.id)||{id:event.id,name:event.name,damage:0,events:0};row.damage+=dmg;row.events++;perSkill.set(event.id,row);}
  const rates=deriveJadeRates(basePanel,s.judgeRes,0),dps=total/Math.max(.001,s.duration),rows=[...perSkill.values()].map(x=>({...x,damage:round(x.damage,2),sharePct:total?round(x.damage/total*100,2):0})).sort((a,b)=>b.damage-a.damage);
  return {path:'silkbind-jade',objective,objectiveLabel:objective===JADE_OBJECTIVES.SPEEDRUN_CEILING?'COMMUNITY SPEEDRUN OBJECTIVE — Max-Physical endpoint; not statistical P95':JADE_OBJECTIVE_LABELS[objective]||objective,totalDamage:round(total,2),dps:round(dps,2),rates,diagnostics:{...plan.diagnostics,precision:rates.precision,precisionTarget:100,precisionGap:round(Math.max(0,100-rates.precision),2),effectiveCrit:rates.yellowCrit,critTarget:80,directCrit:rates.directCrit,affinity:rates.yellowAffinity,rateBudget:rates.heuristicBudget,rateBudgetStatus:rates.heuristicBudget>100.5?'overcap/waste':rates.heuristicBudget<99.5?'below-community-target':'target-range',maxPhysical:panel.maxOuter||0},perSkill:rows,timeline:plan.events,assumptions:[s.blossomDirectCritPct===0?'Blossom Barrage Direct Crit numeric value is unresolved and therefore not credited by default.':null,'Exact Global Min↔Max attack-roll distribution is unresolved; Speedrun Ceiling uses the Max endpoint and is not a statistical percentile.','White Body extension is generated by Qi-break refill events; its exact refill cadence remains a modeled assumption.','Flute distance exact value is unresolved and disabled.'].filter(Boolean)};
}
const CACHE=new Map();
export function getSilkbindJadeCacheKey(panel,scenario,objective){const keys=['minOuter','maxOuter','outerPen','minPz','maxPz','pzPen','pzDmg','prec','crit','aff','dcrit','daff','critDmg','affDmg','outerDmg','bossDmg','umbAll','umbMartial','umbSpecial','umbCharged','fanAll','fanMartial','fanSpecial','fanCharged','allArts','attunedBonus','power','agility','momentum','set'];const p=Object.fromEntries(keys.map(k=>[k,typeof panel?.[k]==='number'?round(panel[k],4):panel?.[k]]));return JSON.stringify({v:JADE_MODEL_VERSION,objective,panel:p,scenario:{...DEFAULT_JADE_SCENARIO,...scenario}});}
export function evaluateSilkbindJadeCached(panel,scenario={},objective=JADE_OBJECTIVES.EXPECTED_DPS,priceSkill=null){if(priceSkill&&!scenario.cacheSalt)return evaluateSilkbindJade(panel,scenario,objective,priceSkill);const key=getSilkbindJadeCacheKey(panel,scenario,objective)+(scenario.cacheSalt||'');if(CACHE.has(key))return CACHE.get(key);const v=evaluateSilkbindJade(panel,scenario,objective,priceSkill);CACHE.set(key,v);if(CACHE.size>4000)CACHE.delete(CACHE.keys().next().value);return v;}
export function clearSilkbindJadeCache(){CACHE.clear();}
export function jadeMarginalValue(panel,stat,delta,scenario={},objective=JADE_OBJECTIVES.EXPECTED_DPS,priceSkill=null){const a=evaluateSilkbindJade(panel,scenario,objective,priceSkill),b=evaluateSilkbindJade({...panel,[stat]:(panel[stat]||0)+delta},scenario,objective,priceSkill);return{stat,delta,gainDps:round(b.dps-a.dps,4),gainPct:a.dps?round((b.dps/a.dps-1)*100,4):0};}
export function jadeBuildAdvice(panel,scenario={},objective=JADE_OBJECTIVES.EXPECTED_DPS,priceSkill=null){const r=evaluateSilkbindJade(panel,scenario,objective,priceSkill),d=r.diagnostics,out=[];out.push(d.precision>=99.95?'Precision is already capped; more Precision has sharply reduced marginal value.':`Precision is ${d.precision.toFixed(1)}% effective — ${(100-d.precision).toFixed(1)}% below the Jade community target.`);if(d.effectiveCrit>=79.95)out.push('Yellow Critical is at the 80% cap; Direct Crit/Affinity and physical attack decide the remaining rate budget.');if(d.rateBudget>100.5)out.push('Rate budget is over 100%; Momentum/Affinity is not invalid, but its modeled marginal gain is likely squeezed by Direct Crit.');if(objective===JADE_OBJECTIVES.SPEEDRUN_CEILING)out.push('Max Physical receives extra value only for the community Speedrun Ceiling endpoint; Expected DPS remains separate.');if(d.droneUptimePct<60)out.push('Drone uptime is low; resource timing/redrone behavior can outweigh small static-stat gains.');return out;}
export const SILKBIND_JADE_PATH_MODEL=Object.freeze({id:'silkbind-jade',menuPanelRules:'shared-global-t96-panel',skillTags:JADE_SKILL_TEMPLATES,stateFactory:()=>({petals:0,combo:false,jadebreak:false,lingeringBone:false,droneActive:false,shatteredSpring:0,qi:'normal',vitality:100}),eventRules:['projectile-eligibility','combo','jadebreak','lingering-bone','drone','qi-break','thunderous-bloom','breaking-point','bitter-duty'],rotationPlanner:planSilkbindJadeRotation,objectives:Object.values(JADE_OBJECTIVES),scenarioDefaults:DEFAULT_JADE_SCENARIO,buildDiagnostics:(p,s,o)=>evaluateSilkbindJadeCached(p,s,o).diagnostics,gearAdvice:jadeBuildAdvice});