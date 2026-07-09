import assert from "node:assert";

function outcome({ precision, crit, affinity }) {
  const pPrec = precision;
  const pAff = affinity;
  const pCrit = (crit + pAff > 1 ? Math.max(0, 1 - pAff) : crit) * pPrec;
  const pGraze = Math.max(0, (1 - pPrec) * (1 - pAff));
  const pWhite = Math.max(0, 1 - pCrit - pAff - pGraze);
  return { pCrit, pAff, pWhite, pGraze };
}

const capped = outcome({ precision: 0.8, crit: 0.8, affinity: 0.4 });
assert.equal(capped.pCrit, 0.48);
assert.equal(capped.pAff, 0.4);
assert.equal(Number(capped.pGraze.toFixed(12)), 0.12);
assert.equal(Number(capped.pWhite.toFixed(12)), 0);

const normal = outcome({ precision: 0.9, crit: 0.5, affinity: 0.2 });
assert.equal(normal.pCrit, 0.45);
assert.equal(normal.pAff, 0.2);
assert.equal(Number(normal.pGraze.toFixed(12)), 0.08);
assert.equal(Number(normal.pWhite.toFixed(12)), 0.27);

console.log("probability self-check OK");
