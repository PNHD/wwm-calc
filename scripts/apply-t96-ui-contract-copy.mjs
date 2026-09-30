import fs from "node:fs";

const path = "src/App.tsx";
let source = fs.readFileSync(path, "utf8");

source = source.replace(
  'title="Max value applied as in-combat buff"',
  'title="Always-on Attribute Buff at the selected tier; conditional effects use the combat timeline"',
);
source = source.replace(
  'ⓘ Inner Ways are <b>in-combat buffs</b> — they do NOT appear in your character-menu panel. The calculator adds each selected stat at its <b>max value</b> (full stacks / condition met) on top of your base panel. "Conditional" ones require a specific state (enemy exhausted, &gt;50% HP, random proc…), so real uptime may be lower.',
  'ⓘ For Bamboocut-Dust, always-on <b>Attribute Buff</b> rows from selected Inner Ways are included in the <b>MENU PANEL</b>, matching the game. Ramping/conditional effects are modeled separately on the combat timeline and are <b>not</b> permanently applied at max stacks.',
);

if (source.includes('Inner Ways are <b>in-combat buffs</b> — they do NOT appear in your character-menu panel')) {
  throw new Error("[t96-ui-contract] stale Inner Way panel copy remains");
}
if (!source.includes("Ramping/conditional effects are modeled separately on the combat timeline")) {
  throw new Error("[t96-ui-contract] corrected Inner Way contract copy was not generated");
}


source = source.replace('the app subtracts your gear sub-stats <i>and</i> inner-way stats to learn this character\'s true base, so the in-combat panel matches the game exactly (no double-counting). Re-calibrate if you change gear or inner ways.',
  'the app subtracts the equipped gear and selected static Attribute Buffs to learn the residual base. Conditional effects stay on the combat timeline. Gear and Inner Way changes recompute automatically; recalibrate when unmodeled character progression changes the base or the calculated menu panel no longer matches the game.');
source = source.replace('Calibration sticks to your character, not to one gear set.', 'Calibration is saved for this scheme and is independent of its equipped gear set.');
source = source.replace('No need to re-calibrate.', 'Recalibrate after unmodeled progression or a menu-panel mismatch.');
source = source.replace('tip: "Which stats to add or drop to graduate fastest — shows the DPS gained per stat point."', 'tip: "Simulate displayed increments and compare modeled DPS plus historical graduation percentage-point changes."');


// Graduation counts are historical 95下 units, even when the active model is T96.
const countsStart = source.indexOf('                const COUNT_CATS:');
const countsEnd = source.indexOf('                const tiles = COUNT_CATS', countsStart);
let counts = source.slice(countsStart, countsEnd);
const historicalCaps = { maxOuter: 'subMaxOuter', minOuter: 'subMinOuter', strength: 'jin', agility: 'min', power: 'shi', crit: 'subCrit', prec: 'subPrec', aff: 'subAff', ownWeapon: 'subOwnWeapon', allWeapon: 'subAllWeapon' };
counts = counts.replace(/(key: "(\w+)",[^\n]+?roll: )[^,]+/g, (row, prefix, key) => {
  const cap = historicalCaps[key];
  if (!cap) return row;
  const percent = ['crit', 'prec', 'aff', 'ownWeapon', 'allWeapon'].includes(key);
  return prefix + 'WWM_DATA.tiers["95下"].subCaps.' + cap + (percent ? ' * 100' : '');
});
source = source.slice(0, countsStart) + counts + source.slice(countsEnd);
source = source.replace('Compare your current in-combat panel against the fully-graduated target panel.',
  'Historical T91 reference: compare equipped substat counts using 95下 max-roll units. This is not a calibrated T96 graduation target.');

source = source.replace('                const activeGear = getActiveGear();',
  '                const cultivateInventory = getActiveGear();\n                const activeGear = cultivateInventory.filter((item) => isItemEquipped(item, cultivateInventory));');

fs.writeFileSync(path, source, "utf8");
console.log("[t96-ui-contract] PASS — Inner Way UI distinguishes static menu-panel rows from conditional combat timeline effects.");
