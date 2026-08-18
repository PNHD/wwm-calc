import { EVIDENCE } from './evidence-v2.mjs';

export const COMBAT_STATES = Object.freeze(['NEUTRAL','HIT_STAGGER','CONTROLLED','IMMOBILIZED','AIRBORNE','KNOCKBACK','KNOCKDOWN','TENACITY','SUPER_ARMOR','CONTROL_IMMUNITY','INVINCIBILITY','DEFENSE','DEFLECT','CONTINUOUS_DEFLECT','PERFECT_DODGE','DODGE_IFRAME','SPRINT','DASH','BREAK_DEFENSE','EXECUTION','EXECUTED_KNOCKDOWN','GET_UP_PROTECTION','PASSIVE_BREAK_CONTROL','GUARDING_QI_CORE']);

export function createArenaCombatState(overrides = {}) {
  return { t:0,state:'NEUTRAL',hp:100,qi:100,endurance:100,vitality:100,pathResource:null,mysticCooldowns:{},breakControlProgress:0,breakControlFrozenUntil:0,tenacity:false,superArmor:false,controlImmunity:false,invincibleUntil:0,qiDamageImmune:false,inescapableHitStagger:false,log:[],...overrides };
}
const logState=(s,event,note)=>({...s,log:[...s.log,{t:s.t,event,note}]});
export function applyArenaStateEvent(input,event){
  let s={...input,mysticCooldowns:{...(input.mysticCooldowns||{})},log:[...(input.log||[])]};
  if(Number.isFinite(event.t)) s.t=Math.max(s.t,event.t);
  switch(event.type){
    case 'HIT_STAGGER': s.state='HIT_STAGGER'; s.inescapableHitStagger=Boolean(event.inescapable); return logState(s,event.type,'Hit Stagger is distinct from Control.');
    case 'CONTROL': s.state=event.kind==='IMMOBILIZED'?'IMMOBILIZED':event.kind==='AIRBORNE'?'AIRBORNE':event.kind==='KNOCKBACK'?'KNOCKBACK':event.kind==='KNOCKDOWN'?'KNOCKDOWN':'CONTROLLED'; return logState(s,event.type,'Control subtype preserved.');
    case 'EXECUTE_KNOCKDOWN': s.state='EXECUTED_KNOCKDOWN'; s.qiDamageImmune=true; s.breakControlFrozenUntil=Math.max(s.breakControlFrozenUntil,s.t+Math.max(0,event.freezeSeconds??0)); return logState(s,event.type,'Execute knockdown grants applicable Qi Damage immunity; no unpublished duration is inferred.');
    case 'GET_UP': s.state='GET_UP_PROTECTION'; s.qiDamageImmune=false; s.tenacity=true; s.controlImmunity=true; s.superArmor=true; return logState(s,event.type,'Get-up Tenacity, Control Immunity and Super Armor remain separate protections.');
    case 'GUARDING_QI_CORE': { const started=s.state==='HIT_STAGGER'; s.hp=Math.min(100,s.hp+Math.max(0,event.hpRestore??0)); s.qi=Math.min(100,s.qi+Math.max(0,event.qiRestore??0)); if(started)s.state='GUARDING_QI_CORE'; const baseEnd=s.t+0.5; s.invincibleUntil=s.inescapableHitStagger&&event.hitStaggerEndsAt!=null?Math.max(baseEnd,Number(event.hitStaggerEndsAt)):baseEnd; return logState(s,event.type,started?'Restore HP/Qi, qualifying control clear, 0.5s Invincibility; inescapable Hit Stagger may extend Invincibility to stagger end.':'Restore HP/Qi and 0.5s Invincibility; inherent control-clear does not trigger outside Hit Stagger.'); }
    case 'BREAK_CONTROL_PROGRESS': if(s.t<s.breakControlFrozenUntil)return logState(s,event.type,'Passive Break Control progress is temporarily frozen.'); s.breakControlProgress=Math.min(100,s.breakControlProgress+Math.max(0,event.delta??0)); return logState(s,event.type,'Progress is event/client input; no fabricated fill duration.');
    case 'EXIT_HIT_STAGGER': s.state='NEUTRAL'; s.inescapableHitStagger=false; s.breakControlFrozenUntil=Math.max(s.breakControlFrozenUntil,s.t+Math.max(0,event.freezeSeconds??0)); return logState(s,event.type,'Break-control progress freezes briefly; exact duration remains client input.');
    case 'QI_DAMAGE': if(!s.qiDamageImmune)s.qi=Math.max(0,s.qi-Math.max(0,event.amount??0)); return logState(s,event.type,s.qiDamageImmune?'Qi Damage ignored during applicable Execute knockdown.':'Qi Damage applied.');
    case 'HP_DAMAGE': if(s.t>=s.invincibleUntil)s.hp=Math.max(0,s.hp-Math.max(0,event.amount??0)); return logState(s,event.type,s.t<s.invincibleUntil?'HP Damage negated by Invincibility.':'HP Damage applied.');
    default:return logState(s,event.type||'UNKNOWN_EVENT','No unpublished coefficient inferred.');
  }
}

export const ENDURANCE_RULES=Object.freeze({reductionCapPct:40,continuousSprintThresholdSeconds:1,bowChargeConsumptionThresholdSeconds:1.2,defenseRecoveryCoefficient:null,evidence:EVIDENCE.CONFIRMED_OFFICIAL,source:'MAY28'});
export const NETWORK_HIT_VALIDATION=Object.freeze({rule:'REVERSE_HIT_VALIDATION',meaning:'Resolve a hit against defender dodge-invulnerability state on the server; latency is reliability metadata, not a DPS coefficient.',attackerLatencyMs:null,defenderLatencyMs:null,hostServer:null,evidence:EVIDENCE.CONFIRMED_OFFICIAL,source:'V20'});

export function validateThreeVThreeTeam(players=[],{healerPresent=false,royalRemedyT6=false}={}){
  const team=players.slice(0,3); const arts=new Map();
  for(const p of team) for(const art of (p.martialArts||[]).slice(0,2)) arts.set(art,(arts.get(art)||0)+1);
  const violations=[...arts].filter(([,count])=>count>2).map(([art])=>`${art} exceeds the same-Martial-Art max of 2.`);
  return {valid:team.length===3&&violations.length===0,violations,reviveBranch:healerPresent?{type:'HEALER',panaceaSameTargetRestriction:true,royalRemedyT6Exception:Boolean(royalRemedyT6),evidence:EVIDENCE.CONFIRMED_OFFICIAL}:{type:'NO_HEALER',opportunities:1,rangeMeters:10,windowSeconds:15,successfulReviveTemporaryPhysicalAttackBuff:true,buffMagnitude:null,evidence:EVIDENCE.CONFIRMED_OFFICIAL}};
}
