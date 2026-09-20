import { clone, safeText } from './common.js';

export const MAX_PLANS = 5;

export function normalizePlan(input, index = 0) {
  const source = input && typeof input === 'object' ? input : {};
  const slots = [1, 2, 3, 4, 5].map((id, slotIndex) => {
    const incoming = Array.isArray(source.slots) ? source.slots[slotIndex] || {} : {};
    return {
      id,
      active: id === 1 || !!incoming.active,
      quality: id === 5 ? 'gold' : (['blue', 'purple', 'gold'].includes(incoming.quality) ? incoming.quality : 'blue'),
      attribute: id === 5 ? 'Sunlight' : safeText(incoming.attribute, 'Set 1', 80)
    };
  });
  return {
    id: Number.isInteger(source.id) && source.id > 0 ? source.id : index + 1,
    name: safeText(source.name, `Plan ${index + 1}`, 80),
    savedAt: safeText(source.savedAt, '', 40),
    slots
  };
}

export function normalizePlans(input) {
  const plans = (Array.isArray(input) ? input : []).slice(0, MAX_PLANS).map(normalizePlan);
  const used = new Set();
  plans.forEach((plan, index) => {
    if (used.has(plan.id)) plan.id = Math.max(0, ...used) + 1;
    used.add(plan.id);
    if (!plan.name) plan.name = `Plan ${index + 1}`;
  });
  return plans;
}

export function savePlan(inputState, name = '') {
  const state = clone(inputState);
  state.plans = normalizePlans(state.plans);
  if (state.plans.length >= MAX_PLANS) return { state, saved: false, plan: null };
  const plan = normalizePlan({
    id: Math.max(0, ...state.plans.map(item => item.id)) + 1,
    name: safeText(name, `Plan ${state.plans.length + 1}`, 80) || `Plan ${state.plans.length + 1}`,
    savedAt: new Date().toISOString(),
    slots: state.slots
  }, state.plans.length);
  state.plans.push(plan);
  return { state, saved: true, plan };
}

export function renamePlan(inputState, planId, name) {
  const state = clone(inputState);
  const plan = state.plans.find(item => item.id === Number(planId));
  if (!plan) return { state, renamed: false };
  plan.name = safeText(name, plan.name, 80).trim() || plan.name;
  return { state, renamed: true, plan };
}

export function applyPlan(inputState, planId) {
  const state = clone(inputState);
  const plan = normalizePlans(state.plans).find(item => item.id === Number(planId));
  if (!plan) return { state, applied: false, plan: null };
  state.slots.forEach((slot, index) => {
    const saved = plan.slots[index];
    if (!slot.active || !saved?.active) return;
    slot.quality = slot.id === 5 ? 'gold' : saved.quality;
    slot.attribute = slot.id === 5 ? 'Sunlight' : saved.attribute;
  });
  return { state, applied: true, plan };
}

export function deletePlan(inputState, planId) {
  const state = clone(inputState);
  const before = state.plans.length;
  state.plans = state.plans.filter(item => item.id !== Number(planId));
  return { state, deleted: state.plans.length !== before };
}

export function targetMatch(slots, target = {}) {
  const requested = [target.color, target.part1, target.part2, target.part3]
    .map((value, index) => ({ value, index })).filter(item => item.value);
  if (!requested.length) return { matches: 0, total: 0, label: 'No appearance target' };
  const matches = requested.reduce((sum, item) => {
    const slot = slots[item.index];
    return sum + (slot?.active && slot.attribute === item.value ? 1 : 0);
  }, 0);
  return { matches, total: requested.length, label: `${matches}/${requested.length} target parts match` };
}
