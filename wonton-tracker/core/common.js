import { appearancesFor } from '../data/weapons.v1.js';

export const SCHEMA_VERSION = 2;
export const HARD_PITY = 90;
export const UNLOCK_ATTEMPTS = 30;
export const LOCK_COSTS = Object.freeze([1, 2, 5, 10]);
export const ECHO_BEADS_PER_STONE = 200;
export const ECHO_BEADS_PER_100_USD = 7200;

export const clone = value => structuredClone(value);

export function clampInt(value, min, max) {
  const parsed = Number.isFinite(Number(value)) ? Math.floor(Number(value)) : min;
  return Math.min(max, Math.max(min, parsed));
}

export function clampNumber(value, min, max) {
  const parsed = Number.isFinite(Number(value)) ? Number(value) : min;
  return Math.min(max, Math.max(min, parsed));
}

export function costForLocks(count) {
  return LOCK_COSTS[clampInt(count, 0, 3)];
}

export const beadsForStones = stones => Math.max(0, Number(stones) || 0) * ECHO_BEADS_PER_STONE;
export const usdForBeads = beads => Math.max(0, Number(beads) || 0) / ECHO_BEADS_PER_100_USD * 100;

export function defaultSlot(id) {
  const active = id === 1;
  return {
    id,
    active,
    quality: id === 5 ? 'gold' : 'blue',
    attribute: id === 5 ? 'Sunlight' : 'Set 1',
    locked: false,
    pity: 0,
    progress: active ? 100 : 0,
    activationAttempts: 0
  };
}

export const createSlots = () => [1, 2, 3, 4, 5].map(defaultSlot);

export function normalizeSlots(input) {
  const source = Array.isArray(input) ? input : [];
  const slots = [1, 2, 3, 4, 5].map((id, index) => {
    const fallback = defaultSlot(id);
    const incoming = source[index] && typeof source[index] === 'object' ? source[index] : fallback;
    const quality = ['blue', 'purple', 'gold'].includes(incoming.quality) ? incoming.quality : fallback.quality;
    const allowed = appearancesFor(id, id === 5 ? 'gold' : quality);
    return {
      id,
      active: id === 1 || !!incoming.active,
      quality: id === 5 ? 'gold' : quality,
      attribute: id === 5 ? 'Sunlight' : (allowed.includes(incoming.attribute) ? incoming.attribute : allowed[0]),
      locked: id === 5 ? !!incoming.active : !!incoming.locked,
      pity: id === 5 ? 0 : clampInt(incoming.pity, 0, HARD_PITY),
      progress: id === 1 ? 100 : clampNumber(incoming.progress, 0, 100),
      activationAttempts: id === 1 ? 0 : clampInt(incoming.activationAttempts, 0, UNLOCK_ATTEMPTS)
    };
  });

  let inactiveSeen = false;
  for (let index = 1; index < slots.length; index += 1) {
    const slot = slots[index];
    if (inactiveSeen) Object.assign(slot, defaultSlot(slot.id));
    else if (!slot.active) {
      inactiveSeen = true;
      slot.locked = false;
      slot.pity = 0;
      slot.progress = Math.min(99.99, slot.progress);
      slot.activationAttempts = Math.min(UNLOCK_ATTEMPTS - 1, slot.activationAttempts);
    } else {
      slot.progress = 100;
    }
  }

  const locked = slots.slice(0, 4).filter(slot => slot.active && slot.locked);
  locked.slice(3).forEach(slot => { slot.locked = false; });
  return slots;
}

export const activeLockCount = state => state.slots.slice(0, 4).filter(slot => slot.active && slot.locked).length;
export const nextInactiveSlot = state => state.slots.find(slot => slot.id > 1 && !slot.active) || null;

export function activateSlot(slot) {
  slot.active = true;
  slot.progress = 100;
  slot.pity = 0;
  slot.locked = slot.id === 5;
  slot.quality = slot.id === 5 ? 'gold' : 'blue';
  slot.attribute = slot.id === 5 ? 'Sunlight' : 'Set 1';
  return slot;
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

export function safeText(value, fallback = '', maxLength = 120) {
  return typeof value === 'string' ? value.slice(0, maxLength) : fallback;
}
