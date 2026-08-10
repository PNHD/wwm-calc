import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  JADE_ATTUNEMENT_FAMILIES,
  JADE_SKILL_TEMPLATES,
  jadeEventMultiplier,
} from '../src/pathModels/silkbindJade.mjs';

assert.equal(JADE_ATTUNEMENT_FAMILIES['vernal-high-frequency-ballistic'].activeAtT96, false);
assert.equal(JADE_ATTUNEMENT_FAMILIES['vernal-high-frequency-ballistic'].availability, 'OFFICIAL_POOL_FIX_PENDING');
assert.equal(JADE_ATTUNEMENT_FAMILIES['vernal-light-heavy-derived'].activeAtT96, false);
assert.equal(JADE_ATTUNEMENT_FAMILIES['vernal-light-heavy-derived'].availability, 'OFFICIAL_POOL_FIX_PENDING');
assert.equal(JADE_ATTUNEMENT_FAMILIES['vernal-special'].activeAtT96, true);
assert.equal(JADE_ATTUNEMENT_FAMILIES['vernal-charged'].activeAtT96, true);

const forsaken = JADE_SKILL_TEMPLATES['forsaken-fame'];
assert.equal(forsaken.pveDamageBonusPct, 45);
assert.equal(forsaken.enduranceRecovery, true);
assert.equal(forsaken.priced, false, 'Do not fabricate Forsaken Fame base coefficient.');
assert.equal(jadeEventMultiplier({ id:'forsaken-fame', tags:['weapon','fan','charged','pve'] }, {}).multiplier, 1.45);

const att = fs.readFileSync('src/data/gearAttunement.ts', 'utf8');
assert.ok(!att.includes('id: "vernal-high-frequency-ballistic"'));
assert.ok(!att.includes('id: "vernal-light-heavy-derived"'));
assert.ok(att.includes('id: "vernal-special-t96"'));
assert.ok(att.includes('id: "vernal-charged-t96"'));

console.log(JSON.stringify({
  ok: true,
  currentT96Obtainable: ['vernal-special', 'vernal-charged'],
  semanticButNotCurrentPool: ['vernal-high-frequency-ballistic', 'vernal-light-heavy-derived'],
  forsakenFame: { pveDamageBonusPct: 45, enduranceRecovery: true, baseCoefficient: 'UNRESOLVED' },
}, null, 2));
