import { EVIDENCE } from './evidence-v2.mjs';

export const ARENA_MODE = Object.freeze({
  ONE_V_ONE: '1V1_ARENA',
  THREE_V_THREE: '3V3_ARENA',
  GROUP_STRATEGY: 'GROUP_STRATEGY',
  FIVE_V_FIVE: '5V5_ARENA',
  PERCEPTION_FOREST: 'PERCEPTION_FOREST',
  TRAINING_TERRACE: 'TRAINING_TERRACE',
  TWO_V_TWO_DUMMY_REFERENCE: '2V2_DUMMY_REFERENCE',
});

const unknownApplicability = () => ({ value: null, evidence: EVIDENCE.UNKNOWN, source: 'CLIENT_NEEDED' });
const officialYes = (source = 'MAY27') => ({ value: true, evidence: EVIDENCE.CONFIRMED_OFFICIAL, source });

export const BATTLEGROUPS = Object.freeze({
  YOUGU: { servers: ['US East'], timezone: 'UTC-4', gvg: 'Sat & Sun 20:30', source: 'APR30' },
  LINHE: { servers: ['US West'], timezone: 'UTC-7', gvg: 'Sat & Sun 20:30', source: 'APR30' },
  YUNYA: { servers: ['Europe'], timezone: 'UTC+2', gvg: 'Sat & Sun 20:30', source: 'APR30' },
  CANGLANG: { servers: ['Asia', 'HK/MO/TW'], timezone: 'UTC+8', gvg: 'Sat & Sun 20:30', source: 'APR30' },
  JIANGZHU: { servers: ['Southeast Asia'], timezone: 'UTC+8', gvg: 'Sat & Sun 20:30', source: 'APR30' },
});

export const ARENA_MODE_TAXONOMY = Object.freeze({
  [ARENA_MODE.ONE_V_ONE]: { id: ARENA_MODE.ONE_V_ONE, ranked: true, teamSize: 1, solo: true, schedule: '24/7', scheduleEvidence: EVIDENCE.CONFIRMED_OFFICIAL, levelAdjustment: unknownApplicability(), normalAttunement: unknownApplicability(), arenaAttunement: { value: true, evidence: EVIDENCE.OFFICIAL_BUT_SCOPE_UNRESOLVED, source: 'MAY27' }, revive: { value: false, evidence: EVIDENCE.CONFIRMED_OFFICIAL, source: 'APR30' }, environment: 'standard-duel', source: 'APR30' },
  [ARENA_MODE.THREE_V_THREE]: { id: ARENA_MODE.THREE_V_THREE, ranked: true, teamSize: 3, solo: false, schedule: 'Mon/Wed/Fri/Sun 15:00–02:00 battlegroup local time', scheduleEvidence: EVIDENCE.CONFIRMED_OFFICIAL, levelAdjustment: officialYes('MAY27'), normalAttunement: unknownApplicability(), arenaAttunement: { value: true, evidence: EVIDENCE.OFFICIAL_BUT_SCOPE_UNRESOLVED, source: 'MAY27' }, revive: { value: 'BRANCHED_BY_HEALER', evidence: EVIDENCE.CONFIRMED_OFFICIAL, source: 'MAY27' }, environment: 'team-arena', source: 'MAY27' },
  [ARENA_MODE.GROUP_STRATEGY]: { id: ARENA_MODE.GROUP_STRATEGY, ranked: true, teamSize: null, solo: false, schedule: 'Daily 12:00–02:00 battlegroup local time', scheduleEvidence: EVIDENCE.CONFIRMED_OFFICIAL, levelAdjustment: officialYes('MAY27'), normalAttunement: unknownApplicability(), arenaAttunement: { value: true, evidence: EVIDENCE.OFFICIAL_BUT_SCOPE_UNRESOLVED, source: 'MAY27' }, revive: unknownApplicability(), environment: 'group-strategy', source: 'APR30' },
  [ARENA_MODE.FIVE_V_FIVE]: { id: ARENA_MODE.FIVE_V_FIVE, ranked: null, teamSize: 5, solo: false, schedule: null, scheduleEvidence: EVIDENCE.UNKNOWN, levelAdjustment: unknownApplicability(), normalAttunement: unknownApplicability(), arenaAttunement: unknownApplicability(), revive: unknownApplicability(), environment: 'five-v-five', source: 'MAY27' },
  [ARENA_MODE.PERCEPTION_FOREST]: { id: ARENA_MODE.PERCEPTION_FOREST, ranked: true, teamSize: null, solo: false, schedule: null, scheduleEvidence: EVIDENCE.UNKNOWN, levelAdjustment: unknownApplicability(), normalAttunement: unknownApplicability(), arenaAttunement: unknownApplicability(), revive: { value: 'MODE_SPECIFIC_RETURN', evidence: EVIDENCE.CONFIRMED_OFFICIAL, source: 'MAY27' }, environment: 'perception-forest', source: 'MAY27' },
  [ARENA_MODE.TRAINING_TERRACE]: { id: ARENA_MODE.TRAINING_TERRACE, ranked: false, teamSize: null, solo: false, schedule: 'custom rooms', scheduleEvidence: EVIDENCE.CONFIRMED_OFFICIAL, levelAdjustment: unknownApplicability(), normalAttunement: unknownApplicability(), arenaAttunement: unknownApplicability(), revive: unknownApplicability(), environment: 'calibration-only', source: 'APR30' },
  [ARENA_MODE.TWO_V_TWO_DUMMY_REFERENCE]: { id: ARENA_MODE.TWO_V_TWO_DUMMY_REFERENCE, ranked: null, teamSize: 2, solo: false, schedule: null, scheduleEvidence: EVIDENCE.UNKNOWN, levelAdjustment: unknownApplicability(), normalAttunement: unknownApplicability(), arenaAttunement: unknownApplicability(), revive: unknownApplicability(), environment: 'dummy-calibration-reference-not-live-mode-proof', source: 'MAY28' },
});

export const LEVEL_ADJUSTMENT_COMPONENTS = Object.freeze(['characterLevel','martialArtBreakthrough','gearTier','gearBaseAttributes','gearAdditionalAttributes','retunedAttributes','sets','normalAttunement','arenaAttunement','innerWays','innerWayTiers','mysticSkills','mysticBranches','food','buffScripts','hp','physicalAttack','precision','crit','affinity','penetration','playerTargetBoost']);
export const LEVEL_ADJUSTMENT = Object.freeze({
  [ARENA_MODE.THREE_V_THREE]: Object.fromEntries(LEVEL_ADJUSTMENT_COMPONENTS.map((key) => [key, { value: null, evidence: EVIDENCE.UNKNOWN, source: 'CLIENT_NEEDED' }])),
  [ARENA_MODE.GROUP_STRATEGY]: Object.fromEntries(LEVEL_ADJUSTMENT_COMPONENTS.map((key) => [key, { value: null, evidence: EVIDENCE.UNKNOWN, source: 'CLIENT_NEEDED' }])),
});

export const ATTUNEMENT_APPLICABILITY = Object.freeze({
  PVE: { normal: unknownApplicability(), arena: { value: false, evidence: EVIDENCE.REJECTED_FOR_CURRENT_GLOBAL, source: 'MAY27' }, stack: false },
  [ARENA_MODE.ONE_V_ONE]: { normal: unknownApplicability(), arena: { value: true, evidence: EVIDENCE.OFFICIAL_BUT_SCOPE_UNRESOLVED, source: 'MAY27' }, stack: null },
  [ARENA_MODE.THREE_V_THREE]: { normal: unknownApplicability(), arena: { value: true, evidence: EVIDENCE.OFFICIAL_BUT_SCOPE_UNRESOLVED, source: 'MAY27' }, stack: null },
  [ARENA_MODE.GROUP_STRATEGY]: { normal: unknownApplicability(), arena: { value: true, evidence: EVIDENCE.OFFICIAL_BUT_SCOPE_UNRESOLVED, source: 'MAY27' }, stack: null },
  [ARENA_MODE.FIVE_V_FIVE]: { normal: unknownApplicability(), arena: unknownApplicability(), stack: null },
  [ARENA_MODE.PERCEPTION_FOREST]: { normal: unknownApplicability(), arena: unknownApplicability(), stack: null },
  GUILD_WAR: { normal: unknownApplicability(), arena: unknownApplicability(), stack: null },
});
