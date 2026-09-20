import { ECHO_BEADS_PER_STONE, activeLockCount, beadsForStones, costForLocks, usdForBeads } from './common.js';

export const PACKAGE_REFERENCE = Object.freeze({
  region: 'United States',
  echoBeads: 7200,
  price: 99.99,
  currency: 'USD',
  label: 'Reference only: 7,200 Echo Beads ≈ $99.99 USD'
});

export const REGIONS = Object.freeze([
  'Brazil', 'Japan', 'Malaysia', 'Mexico', 'Philippines', 'South Korea', 'Thailand',
  'United Kingdom', 'United States', 'Other / custom'
]);

export function budgetSummary(state) {
  const budget = state.budget || {};
  const stonesUsed = Math.max(0, Number(state.totalStones) || 0);
  const spentBeads = beadsForStones(stonesUsed) + Math.max(0, Number(budget.baseWeaponBeads) || 0);
  const startingBeads = Math.max(0, Number(budget.startingBeads) || 0);
  const startingStones = Math.max(0, Number(budget.startingStones) || 0);
  const availableBeads = startingBeads + startingStones * ECHO_BEADS_PER_STONE;
  const nextStones = costForLocks(activeLockCount(state));
  return {
    stonesUsed,
    spentBeads,
    approximateUsd: usdForBeads(spentBeads),
    remainingBeads: availableBeads - spentBeads,
    remainingStonesEquivalent: (availableBeads - spentBeads) / ECHO_BEADS_PER_STONE,
    nextStones,
    nextBeads: beadsForStones(nextStones)
  };
}

