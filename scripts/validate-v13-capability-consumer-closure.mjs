import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const app = readFileSync(new URL("../src/App.tsx", import.meta.url), "utf8");
const shell = readFileSync(new URL("../src/product/ProductShell.tsx", import.meta.url), "utf8");
const combat = readFileSync(new URL("../src/product/workspaces/CombatWorkspace.tsx", import.meta.url), "utf8");
const optimize = readFileSync(new URL("../src/product/workspaces/OptimizeWorkspace.tsx", import.meta.url), "utf8");

const block = (source, name) => source.match(new RegExp(`const ${name} = useMemo\\([\\s\\S]*?\\n  }, \\[`, "m"))?.[0] ?? "";

assert.match(shell, /const goPve = \(view: PveView\) => \{\s*if \(!isPveViewAvailable\(context\.pathKey, view\)\) return;/, "PvE navigation must reject disabled views before mutating view or route state");
assert.match(shell, /const resolvePveView = \(pathKey: string, requested: PveView\): PveView =>\s*isPveViewAvailable\(pathKey, requested\) \? requested : "overview";/, "PvE view reuse must resolve disabled views to the canonical safe view");
assert.match(shell, /const \[pveView, setPveView\] = useState<PveView>\(\(\) => \{[\s\S]*?return resolvePveView\(context\.pathKey, requested\);/, "Initial stored/hash PvE state must be normalized");
assert.match(shell, /if \(parsed\.workspace === "pve"\) \{[\s\S]*?const view = resolvePveView\(context\.pathKey, parsed\.pveView\);[\s\S]*?setPveView\(view\);[\s\S]*?if \(view !== parsed\.pveView\) updateRoute\("pve", view\);/, "Hash transitions must normalize unavailable PvE views before retaining or routing them");
assert.match(shell, /const resolved = resolvePveView\(context\.pathKey, pveView\);[\s\S]*?if \(resolved !== pveView\) \{[\s\S]*?setPveView\(resolved\);/, "Path changes must evict a stale unavailable PvE view");
assert.match(shell, /if \(next === "pve"\) \{\s*const view = resolvePveView\(context\.pathKey, pveView\);[\s\S]*?setPveView\(view\);[\s\S]*?#pve\/\$\{view\}[\s\S]*?TAB_FOR_PVE\[view\]/, "Workspace returns must route and navigate only the resolved PvE view");
assert.match(shell, /const compareAvailable = isPveViewAvailable\(context\.pathKey, "compare"\);/, "Overview Compare CTAs must share the canonical view-availability rule");
assert.match(shell, /compareAvailable\s*\?\s*<button[\s\S]*?Compare gear/, "Overview must not offer an actionable Compare CTA when gearCompare is disabled");

const legacyCapabilities = app.match(/const legacyAnalysisCapability:[\s\S]*?\n\};/)?.[0] ?? "";
for (const [tab, capability] of [["compare", "gearCompare"], ["priority", "statPriority"], ["best-build", "bestBuild"], ["bis", "bestBuild"], ["transmute", "statPriority"]]) {
  assert.match(legacyCapabilities, new RegExp(`(?:${tab}|"${tab}")\\s*:\\s*"${capability}"`), `Legacy ${tab} must declare ${capability}`);
}
assert.match(app, /const openLegacyAnalysis = \(tab: string\) => \{\s*const capability = legacyAnalysisCapability\[tab\];\s*if \(capability && !isProductCapabilityEnabled\(selectedBuild, capability\)\) return;/, "Legacy analysis entry points must reject disabled capabilities");

const priority = block(app, "statPriorityList");
assert.match(priority, /if \(!isProductCapabilityEnabled\(selectedBuild, "statPriority"\)\) return \{ base: null, gains: \[\], losses: \[\] \};/, "Stat Priority must fail closed before ranking an unauthorized modeled path");
assert.match(app, /priorities=\{isProductCapabilityEnabled\(selectedBuild, "statPriority"\) \? statPriorityList\.gains\.map/, "Combat must receive Stat Priority only for an authorized path");
assert.match(app, /selectedBuild === "silkbind-jade"[\s\S]*?priorities=\{statPriorityList\.gains\.map/, "Jade must continue to receive its authorized Stat Priority result");
assert.match(combat, /\{props\.priorities\.length > 0 && <article>[\s\S]*?<h2>Stat priority<\/h2>/, "Combat must suppress the Stat Priority article when no authorized result exists");
assert.doesNotMatch(combat, /drives Gear Compare, Stat Priority and Best Build/, "Combat copy must not promise disabled optimization tools");
assert.match(combat, /currently enabled optimization tools/, "Combat copy must describe only enabled optimization tools");

assert.match(optimize, /const optimizationUnavailable = props\.unavailableTools\.includes\("best-build"\) \|\| props\.unavailableTools\.includes\("compare"\);/, "Optimize overview must derive availability from its existing unavailable-tools contract");
assert.match(optimize, /Actionable optimization recommendations are unavailable pending stronger evidence\./, "Optimize overview must explain unavailable recommendations");
assert.match(optimize, /optimizationUnavailable \? "manual" : tool/, "Optimize overview must route unavailable recommendations to the permitted manual diagnostic");
assert.match(optimize, /optimizationUnavailable \? "Review build configuration" : "Open recommended tool"/, "Optimize CTA must not promise an unavailable optimization tool");

for (const name of ["gearContrib", "bowCompare", "armorSetCompare"]) {
  const consumer = block(app, name);
  assert.match(consumer, /if \(!isProductCapabilityEnabled\(selectedBuild, "gearCompare"\)\) return null;/, `${name} must not publish an actionable result when gearCompare is disabled`);
}

assert.match(block(app, "gearContrib"), /baseResult\.unavailable[\s\S]*?reduced\.unavailable/, "gearContrib must propagate unavailable combination results");
assert.match(block(app, "bowCompare"), /currentResult\.unavailable[\s\S]*?result\.unavailable/, "bowCompare must propagate unavailable combination results");

const armor = block(app, "armorSetCompare");
assert.match(armor, /if \(!result\.available\) return null;/, "armorSetCompare must distinguish unavailable calcSkill output from a valid zero");
assert.match(app, /gradModalActiveTab === "compare" && isProductCapabilityEnabled\(selectedBuild, "gearCompare"\)/, "Legacy Compare must not render after its capability becomes unavailable");
assert.match(app, /gradModalActiveTab === "transmute" && isProductCapabilityEnabled\(selectedBuild, "statPriority"\)/, "Legacy Transmute must not render after its capability becomes unavailable");
assert.match(app, /gradModalActiveTab === "bis" && isProductCapabilityEnabled\(selectedBuild, "bestBuild"\)/, "Legacy BiS must not render after its capability becomes unavailable");

console.log("[v13-capability-consumer-closure] PASS — actionable consumers obey capability and availability contracts.");
