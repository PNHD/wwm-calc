import assert from "node:assert/strict";
import { build } from "esbuild";

const out = "node_modules/.cache/attunement-effects.mjs";
await build({
  stdin: { contents: 'export * from "./src/utils/calc.ts"; export * from "./src/data/globalT96Preset.ts"; export * from "./src/data/gearAttunement.ts";', resolveDir: process.cwd() },
  bundle: true, platform: "node", format: "esm", outfile: out,
});
const { calcSkill, getRotationForBuild, TIERS, GLOBAL_T96_OBSERVED_PANEL, getAttunementContribution } = await import(`../${out}`);
const panel = { ...GLOBAL_T96_OBSERVED_PANEL, attunedBonus: 0 };
const bonus = getAttunementContribution({ type: "Strategic Sword Bleed DMG Boost", val: "5.2", attunementId: "strategic-sword-bleed" }, "bellstrike-umbra");
const rotation = getRotationForBuild("bellstrike-umbra");
let increased = 0, unchanged = 0;
for (const event of rotation) {
  // Existing reference masks cover Bleeding ticks and Bloodburst only.
  assert.equal(Boolean(event.isDingyin), /\u6d41\u8840|\u8840\u7206/.test(event.name));
  const opts = { set: "", datang: false, yishui: false, buildKey: "bellstrike-umbra" };
  const before = calcSkill(event, panel, TIERS["350|0.45-t96"], opts).total;
  const after = calcSkill(event, { ...panel, attunedBonus: bonus.value }, TIERS["350|0.45-t96"], opts).total;
  if (event.isDingyin && before > 0) { assert(after > before); increased++; }
  else { assert.equal(after, before); unchanged++; }
}
assert(increased > 0 && unchanged > 0);
assert.equal(getAttunementContribution({ type: "Panacea Fan Martial Art Skill Healing Boost", val: "99", attunementId: "panacea-fan-healing" }, "bamboocut-dust"), null);
console.log(`PASS: Bleed affects ${increased} reference events; ${unchanged} other events unchanged; Healing cannot inflate DPS.`);
