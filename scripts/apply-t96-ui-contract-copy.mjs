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

fs.writeFileSync(path, source, "utf8");
console.log("[t96-ui-contract] PASS — Inner Way UI distinguishes static menu-panel rows from conditional combat timeline effects.");
