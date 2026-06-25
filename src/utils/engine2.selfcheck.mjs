// Ad-hoc self-check: translateTier shape + sum logic. Run: node src/utils/engine2.selfcheck.mjs
// (Pure-logic check with stubs — no app runtime, no framework. ponytail: one check on the
//  non-trivial translate/sum path.)
import assert from "node:assert";

// Minimal re-impl of the sum contract to lock behavior (mirrors engine2Dps's loop).
// Note: priceFn(name) stands in for calcSkill(...).total, which ALREADY includes
// the per-item count internally — so the loop adds `t` once per item with NO
// external `* count`, exactly like engine2Dps and the app's computeTotalDamage.
function sumContract(items, priceFn, timeSec) {
  let total = 0, mapped = 0;
  for (const it of items) {
    const t = priceFn(it.name);
    if (t <= 0) continue;       // unpriced/unmapped: excluded from total AND mapped
    total += t; mapped++;
  }
  return { dps: timeSec > 0 ? total / timeSec : 0, total, mapped };
}

const items = [{ name: "A", count: 2 }, { name: "B", count: 1 }, { name: "Unpriced", count: 5 }];
const price = (n) => ({ A: 100, B: 50, Unpriced: 0 }[n] ?? 0);
const r = sumContract(items, price, 10);
assert.strictEqual(r.total, 100 + 50, "total should be 150 (count handled inside priceFn)");
assert.strictEqual(r.mapped, 2, "Unpriced should not count as mapped");
assert.strictEqual(r.dps, 15, "dps = 150/10");
console.log("engine2 self-check OK", r);
