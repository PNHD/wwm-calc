import { SILKBIND_JADE_PATH_MODEL } from './silkbindJade.mjs';

// Contract shared by path-owned combat models. Bamboocut-Dust keeps its existing
// rotationTimeline implementation; this registry only makes ownership explicit so
// future paths do not grow conditional logic across generic calculator files.
export const BAMBOOCUT_DUST_PATH_MODEL = Object.freeze({
  id: 'bamboocut-dust',
  menuPanelRules: 'shared-global-t96-panel',
  skillTags: 'src/utils/rotationTimeline.ts',
  stateFactory: 'buildTimelineBuffs',
  eventRules: 'simulateTimeline',
  rotationPlanner: 'existing-deterministic-t96-timeline',
  objectives: ['expected-dps'],
  scenarioDefaults: 'DEFAULT_T96_SCENARIO',
  buildDiagnostics: 'simulateTimeline diagnostics',
  gearAdvice: 'existing dynamic stat priority',
});

export const PATH_MODELS = Object.freeze({
  [BAMBOOCUT_DUST_PATH_MODEL.id]: BAMBOOCUT_DUST_PATH_MODEL,
  [SILKBIND_JADE_PATH_MODEL.id]: SILKBIND_JADE_PATH_MODEL,
});

export function getPathModel(pathId) {
  return PATH_MODELS[pathId] || null;
}
