import { ECHO_BEADS_PER_STONE, activeLockCount, beadsForStones, costForLocks, usdForBeads } from './common.js';

export const PACKAGE_REFERENCES = Object.freeze({
  Brazil: Object.freeze({ region: 'Brazil', echoBeads: 7200, price: 569.9, currency: 'BRL' }),
  Japan: Object.freeze({ region: 'Japan', echoBeads: 7200, price: 15000, currency: 'JPY' }),
  Malaysia: Object.freeze({ region: 'Malaysia', echoBeads: 7200, price: 434.9, currency: 'MYR' }),
  Mexico: Object.freeze({ region: 'Mexico', echoBeads: 7200, price: 2249, currency: 'MXN' }),
  Philippines: Object.freeze({ region: 'Philippines', echoBeads: 7200, price: 5750, currency: 'PHP' }),
  'South Korea': Object.freeze({ region: 'South Korea', echoBeads: 7200, price: 142000, currency: 'KRW' }),
  Thailand: Object.freeze({ region: 'Thailand', echoBeads: 7200, price: 3350, currency: 'THB' }),
  'United Kingdom': Object.freeze({ region: 'United Kingdom', echoBeads: 7200, price: 91.9, currency: 'GBP' }),
  'United States': Object.freeze({ region: 'United States', echoBeads: 7200, price: 99.99, currency: 'USD' })
});

export const PACKAGE_REFERENCE = Object.freeze({
  ...PACKAGE_REFERENCES['United States'],
  label: 'Reference only: 7,200 Echo Beads ≈ $99.99 USD'
});

export const REGIONS = Object.freeze([
  'Brazil', 'Japan', 'Malaysia', 'Mexico', 'Philippines', 'South Korea', 'Thailand',
  'United Kingdom', 'United States', 'Other / custom'
]);

export function packageReferenceFor(region) {
  return PACKAGE_REFERENCES[region] || null;
}

export function budgetSummary(state) {
  const budget = state.budget || {};
  const stonesUsed = Math.max(0, Number(state.totalStones) || 0);
  const spentBeads = beadsForStones(stonesUsed) + Math.max(0, Number(budget.baseWeaponBeads) || 0);
  const startingBeads = Math.max(0, Number(budget.startingBeads) || 0);
  const startingStones = Math.max(0, Number(budget.startingStones) || 0);
  const availableBeads = startingBeads + startingStones * ECHO_BEADS_PER_STONE;
  const nextStones = costForLocks(activeLockCount(state));
  const reference = packageReferenceFor(budget.region);
  return {
    stonesUsed,
    spentBeads,
    approximateUsd: usdForBeads(spentBeads),
    approximateRegional: reference ? spentBeads / reference.echoBeads * reference.price : null,
    referenceRegion: reference?.region || null,
    referencePrice: reference?.price ?? null,
    referenceCurrency: reference?.currency || null,
    remainingBeads: availableBeads - spentBeads,
    remainingStonesEquivalent: (availableBeads - spentBeads) / ECHO_BEADS_PER_STONE,
    nextStones,
    nextBeads: beadsForStones(nextStones)
  };
}