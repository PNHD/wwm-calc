export const COMPETITIVE_PATCH = 'Global 2.0 / verified through 2026-08-18';

export const EVIDENCE = Object.freeze({
  CONFIRMED_CLIENT: 'CONFIRMED_CLIENT',
  CONFIRMED_OFFICIAL: 'CONFIRMED_OFFICIAL',
  OFFICIAL_BUT_SCOPE_UNRESOLVED: 'OFFICIAL_BUT_SCOPE_UNRESOLVED',
  COMMUNITY_CORROBORATED: 'COMMUNITY_CORROBORATED',
  COMMUNITY_CONFLICTING: 'COMMUNITY_CONFLICTING',
  MODELED: 'MODELED',
  UNKNOWN: 'UNKNOWN',
  OUTDATED: 'OUTDATED',
  REJECTED_FOR_CURRENT_GLOBAL: 'REJECTED_FOR_CURRENT_GLOBAL',
});

export const EFFECT_SCOPE = Object.freeze({
  PVE_ONLY: 'PVE_ONLY',
  NON_PLAYER_ONLY: 'NON_PLAYER_ONLY',
  ARENA_ONLY: 'ARENA_ONLY',
  PERCEPTION_FOREST_ONLY: 'PERCEPTION_FOREST_ONLY',
  GVG_ONLY: 'GVG_ONLY',
  PLAYER_TARGET: 'PLAYER_TARGET',
  ALL_MODES: 'ALL_MODES',
});

export const SOURCES = Object.freeze({
  APR30: { id: 'APR30', kind: 'OFFICIAL', date: '2026-04-27', url: 'https://www.wherewindsmeetgame.com/m/news/official/PVP427.html', title: 'April 30 Arena & Guild War Optimization' },
  MAY22: { id: 'MAY22', kind: 'OFFICIAL', date: '2026-05-22', url: 'https://www.wherewindsmeetgame.com/news/official/522update.html', title: 'May 22 Cross-Server Matchmaking' },
  MAY27: { id: 'MAY27', kind: 'OFFICIAL', date: '2026-05-27', url: 'https://www.wherewindsmeetgame.com/news/official/527update.html', title: 'May 27 Patch Notes' },
  MAY28: { id: 'MAY28', kind: 'OFFICIAL', date: '2026-05-28', url: 'https://www.wherewindsmeetgame.com/news/official/Adjustment528.html', title: 'Version 1.7 Path / Arena Balance' },
  V20: { id: 'V20', kind: 'OFFICIAL', date: '2026-07-23', url: 'https://www.wherewindsmeetgame.com/news/official/723update.html', title: 'Version 2.0 rolling patch notes' },
  STEAM_V20: { id: 'STEAM_V20', kind: 'OFFICIAL_STEAM', date: '2026-08-07', url: 'https://store.steampowered.com/news/app/3564740', title: 'Publisher Steam rolling Version 2.0 feed' },
  CLIENT_NEEDED: { id: 'CLIENT_NEEDED', kind: 'CLIENT_CAPTURE_REQUIRED', date: '2026-08-18', url: null, title: 'Current Global client evidence required' },
  METAFORGE: { id: 'METAFORGE', kind: 'COMMUNITY', date: '2026-01-26', url: 'https://metaforge.app/where-winds-meet/guides', title: 'MetaForge GvG Top-100 reference' },
  VCROSS: { id: 'VCROSS', kind: 'COMMUNITY', date: '2026-08-18', url: 'https://vcross.gg/where-winds-meet', title: 'VCross GvG strategy tooling' },
});

export const EFFECTS = Object.freeze([
  { id: 'DREAMWROUGHT_NON_PLAYER_20', scope: EFFECT_SCOPE.NON_PLAYER_ONLY, modes: ['PVE'], playerTargetAllowed: false, source: 'V20', evidence: EVIDENCE.CONFIRMED_OFFICIAL },
  { id: 'RETURNING_UMBRELLA_NON_PLAYER_20', scope: EFFECT_SCOPE.NON_PLAYER_ONLY, modes: ['PVE'], playerTargetAllowed: false, source: 'MAY28', evidence: EVIDENCE.CONFIRMED_OFFICIAL },
  { id: 'GUILD_WAR_EVERSPRING_EX', scope: EFFECT_SCOPE.GVG_ONLY, modes: ['GUILD_WAR'], playerTargetAllowed: true, source: 'MAY27', evidence: EVIDENCE.CONFIRMED_OFFICIAL },
  { id: 'PERCEPTION_RODENT_HUNT', scope: EFFECT_SCOPE.PERCEPTION_FOREST_ONLY, modes: ['PERCEPTION_FOREST'], playerTargetAllowed: true, source: 'MAY28', evidence: EVIDENCE.CONFIRMED_OFFICIAL },
  { id: 'ARENA_CHEST_ATTUNEMENT', scope: EFFECT_SCOPE.ARENA_ONLY, modes: ['1V1_ARENA', '3V3_ARENA', 'GROUP_STRATEGY'], playerTargetAllowed: true, source: 'V20', evidence: EVIDENCE.OFFICIAL_BUT_SCOPE_UNRESOLVED },
]);

export function effectApplies(effect, mode, { playerTarget = true } = {}) {
  if (!effect) return false;
  if (playerTarget && effect.playerTargetAllowed === false) return false;
  return effect.modes.includes(mode);
}

export const EVIDENCE_MATRIX = Object.freeze([
  { id: 'arena-battlegroups', mode: 'ARENA', patch: '2026-04-30+', source: 'APR30', sourceDate: SOURCES.APR30.date, claim: 'Current battlegroups include Yougu, Yunya, Canglang, Linhe, Jiangzhu with region/timezone mapping.', value: ['YOUGU', 'LINHE', 'YUNYA', 'CANGLANG', 'JIANGZHU'], evidence: EVIDENCE.CONFIRMED_OFFICIAL, implementation: 'DATA' },
  { id: 'arena-level-adjustment-3v3', mode: '3V3_ARENA', patch: '2026-05-27+', source: 'MAY27', sourceDate: SOURCES.MAY27.date, claim: '3v3 is explicitly named as a Level Adjustment mode.', value: true, evidence: EVIDENCE.CONFIRMED_OFFICIAL, implementation: 'GUARD_UNKNOWN_COMPONENTS' },
  { id: 'arena-level-adjustment-components', mode: '3V3_ARENA', patch: 'current', source: 'CLIENT_NEEDED', sourceDate: '2026-08-18', claim: 'Exact normalized stats/components are not established by current official text.', value: null, evidence: EVIDENCE.UNKNOWN, implementation: 'BLOCK_STAT_OPTIMIZER' },
  { id: 'arena-cross-server', mode: 'ARENA', patch: '2026-05-22+', source: 'MAY22', sourceDate: SOURCES.MAY22.date, claim: 'Cross-server toggle can expand matchmaking to same battlegroup after timeout; host is player with cross-server disabled.', value: { toggle: true, timeoutSeconds: null }, evidence: EVIDENCE.CONFIRMED_OFFICIAL, implementation: 'METADATA_ONLY' },
  { id: 'gvg-attunement-applicability', mode: 'GUILD_WAR', patch: 'current', source: 'CLIENT_NEEDED', sourceDate: '2026-08-18', claim: 'Normal vs Arena Attunement applicability in Guild War remains unresolved.', value: null, evidence: EVIDENCE.UNKNOWN, implementation: 'BLOCK_ATTUNEMENT_RANKING' },
  { id: 'gvg-halftime-trigger', mode: 'GUILD_WAR', patch: 'current', source: 'CLIENT_NEEDED', sourceDate: '2026-08-18', claim: 'Current Global Halftime trigger timestamp remains unresolved.', value: null, evidence: EVIDENCE.UNKNOWN, implementation: 'MANUAL_ADVANCED' },
  { id: 'gvg-halftime-ramp', mode: 'GUILD_WAR', patch: '2026-05-27+', source: 'MAY27', sourceDate: SOURCES.MAY27.date, claim: 'Upon entering Halftime initial DMG Bonus is 0%; additional +30% every 30 seconds.', value: { initialPct: 0, stepPct: 30, intervalSeconds: 30 }, evidence: EVIDENCE.CONFIRMED_OFFICIAL, implementation: 'STATE_ENGINE' },
  { id: 'gvg-old-green-points', mode: 'GUILD_WAR', patch: 'current', source: 'METAFORGE', sourceDate: SOURCES.METAFORGE.date, claim: 'Green Points terminology is superseded by current official Fun Coins.', value: null, evidence: EVIDENCE.REJECTED_FOR_CURRENT_GLOBAL, implementation: 'TERMINOLOGY_REJECT' },
  { id: 'gvg-old-ten-minute-halftime', mode: 'GUILD_WAR', patch: 'current', source: 'METAFORGE', sourceDate: SOURCES.METAFORGE.date, claim: 'Older community 10-minute Halftime claim is not current-official truth.', value: null, evidence: EVIDENCE.OUTDATED, implementation: 'DO_NOT_HARDCODE' },
]);

export const CLIENT_CAPTURE_CHECKLIST = Object.freeze([
  { id: 'ARENA_LEVEL_ADJUSTMENT_STATS', priority: 'P0', capture: '3v3 and Group Strategy detailed stat panel before/after entering Level Adjustment.', closes: ['gear/stat optimizer guard'] },
  { id: 'GVG_ATTUNEMENT', priority: 'P0', capture: 'Guild War gear detail + active Attunement profile/effect indicator.', closes: ['Guild War Attunement applicability'] },
  { id: 'GVG_COMMAND_TOOLTIP', priority: 'P0', capture: 'Commander Command Skill tooltip(s) showing current Fun Coin cost, cooldown, target and duration.', closes: ['Command exact costs/CD'] },
  { id: 'GVG_HALFTIME_TIMER', priority: 'P0', capture: 'Continuous video/timer covering entry into Halftime and buff changes.', closes: ['Halftime trigger/structure'] },
  { id: 'GVG_OBJECTIVE_TOOLTIP', priority: 'P0', capture: 'Bulwark and Goose status tooltip at multiple nearby-player counts.', closes: ['DR per stack'] },
  { id: 'GVG_SETTLEMENT', priority: 'P0', capture: 'Current Guild War settlement/victory screen with objective states.', closes: ['victory ordering'] },
  { id: 'TRAINING_TERRACE_RULES', priority: 'P1', capture: 'Training Terrace Preliminary/current stat + Attunement + custom Mystic branch screens.', closes: ['calibration environment applicability'] },
]);

export function validateEvidenceMatrix() {
  const errors = [];
  const states = new Set(Object.values(EVIDENCE));
  for (const row of EVIDENCE_MATRIX) {
    if (!row.id || !row.mode || !row.patch || !row.source || !row.sourceDate || !row.claim || !row.implementation) errors.push(`evidence row missing provenance fields: ${row.id || '<unknown>'}`);
    if (!states.has(row.evidence)) errors.push(`invalid evidence state: ${row.id}`);
    const source = SOURCES[row.source];
    if (!source) errors.push(`unknown source: ${row.id}:${row.source}`);
    if (row.evidence === EVIDENCE.UNKNOWN && row.value != null) errors.push(`UNKNOWN row hard-codes a value: ${row.id}`);
    if (row.evidence === EVIDENCE.CONFIRMED_OFFICIAL && source && !['OFFICIAL', 'OFFICIAL_STEAM'].includes(source.kind)) errors.push(`community/non-official source labeled official: ${row.id}`);
    if (row.evidence === EVIDENCE.OUTDATED && row.implementation === 'CURRENT_RULE') errors.push(`outdated patch marked current: ${row.id}`);
  }
  for (const effect of EFFECTS) {
    if (!effect.source || !SOURCES[effect.source]) errors.push(`effect lacks provenance: ${effect.id}`);
    if (effect.scope === EFFECT_SCOPE.GVG_ONLY && effect.modes.some((m) => String(m).includes('ARENA'))) errors.push(`GvG-only effect leaked into Arena: ${effect.id}`);
    if (effect.scope === EFFECT_SCOPE.PERCEPTION_FOREST_ONLY && effect.modes.some((m) => m !== 'PERCEPTION_FOREST')) errors.push(`Perception Forest effect leaked: ${effect.id}`);
    if (effect.scope === EFFECT_SCOPE.NON_PLAYER_ONLY && effect.playerTargetAllowed) errors.push(`non-player effect marked player-applicable: ${effect.id}`);
  }
  return { valid: errors.length === 0, errors };
}
