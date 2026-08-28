import assert from "node:assert/strict";
import {
  applyGearRowSemantics,
  getWeaponAttunementById,
  matchWeaponAttunementText,
} from "../src/data/gearAttunement.ts";
import {
  jadeAttunementCovers,
  resolveJadeAttunementFamily,
} from "../src/pathModels/silkbindJade.mjs";

const canonicalType = "Vernal Frequent Projectile DMG Boost";
const migrate = (row) => applyGearRowSemantics([row]);

for (const [attunementId, type] of [
  ["vernal-special", "Vernal Special Skill DMG Boost"],
  ["vernal-charged", "Vernal Charged Skill DMG Boost"],
  ["vernal-special-t96", "Vernal Umbrella Special Skill DMG Boost"],
  ["vernal-charged-t96", "Vernal Umbrella Charged Skill DMG Boost"],
  ["vernal-high-frequency-ballistic", "Vernal Frequent Ballistic DMG Boost"],
  [undefined, "Ninefold Spring: Special Skill DMG Bonus"],
]) {
  const input = { type, val: "5.8", attunementId };
  const once = migrate(input);
  assert.equal(once.length, 1, "one saved row must remain one row");
  assert.equal(once[0].type, canonicalType);
  assert.equal(once[0].attunementId, "vernal-frequent-projectile");
  assert.equal(once[0].val, "5.8", "migration preserves the original numeric value");
  assert.deepEqual(migrate(once[0]), once, "migration is idempotent");
  assert.equal(once.filter((row) => row.type === canonicalType).length, 1, "a saved row cannot produce a legacy plus canonical multiplier");
}

assert.equal(getWeaponAttunementById("vernal-special-t96")?.id, "vernal-frequent-projectile");
assert.equal(getWeaponAttunementById("vernal-charged-t96")?.id, "vernal-frequent-projectile");
assert.equal(matchWeaponAttunementText("Vernal Umbrella Frequent Projectile DMG Boost")?.id, "vernal-frequent-projectile");
assert.equal(matchWeaponAttunementText("Vernal Umbrella Light/Heavy Attack & Varied Combo DMG Boost")?.id, "vernal-light-heavy-derived");
assert.equal(matchWeaponAttunementText("Vernal Umbrella Martial Art Skill DMG Boost")?.id, "vernal-umbrella");

assert.equal(resolveJadeAttunementFamily("vernal-special-t96")?.id, "vernal-frequent-projectile");
assert.equal(resolveJadeAttunementFamily("vernal-charged-t96")?.id, "vernal-frequent-projectile");
assert.equal(jadeAttunementCovers("vernal-frequent-projectile", "spring-away"), true);
assert.equal(jadeAttunementCovers("vernal-frequent-projectile", "unfading-flower"), true);
assert.equal(jadeAttunementCovers("vernal-frequent-projectile", "fan-pursuit"), false);
assert.equal(jadeAttunementCovers("vernal-light-heavy-derived", "umbrella-heavy-light"), true);
assert.equal(jadeAttunementCovers("vernal-light-heavy-derived", "spring-away"), false);

console.log("[v11-silkbind-jade-migration] PASS — canonical migration, matcher precedence, aliases, and eligibility are deterministic.");
