import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const root = process.cwd(), name = "apply-bamboocut-best-build-trust.mjs", fixtures = [];
const norm = (s) => s.replace(/\r\n/g, "\n");
const fixture = async (generator, app) => { const dir = await mkdtemp(path.join(os.tmpdir(), "wwm-best-trust-")); fixtures.push(dir); await mkdir(path.join(dir, "scripts"), { recursive: true }); await mkdir(path.join(dir, "src"), { recursive: true }); await writeFile(path.join(dir, "scripts", name), generator); await writeFile(path.join(dir, "src", "App.tsx"), app); return dir; };
const run = (dir) => spawnSync(process.execPath, [path.join(dir, "scripts", name)], { cwd: dir, encoding: "utf8" });
const fail = async (generator, app, label) => assert.notEqual(run(await fixture(generator, app)).status, 0, `${label} must fail closed`);

try {
  const generator = norm(await readFile(path.join(root, "scripts", name), "utf8"));
  const current = norm(await readFile(path.join(root, "src", "App.tsx"), "utf8"));
  const stale = generator.replace("modeledDurationOrZero(selectedBuild);\n                            const deltaPct", "getRotationTimeForBuild(selectedBuild);\n                            const deltaPct");
  const red = run(await fixture(stale, current));
  assert.notEqual(red.status, 0, "stale generator must fail on Draught-aware source");
  assert.match(`${red.stderr}\n${red.stdout}`, /Missing or ambiguous anchor: Top 3 trust helper/);
  const currentFixture = await fixture(generator, current);
  assert.equal(run(currentFixture).status, 0, "current source must pass");
  const first = await readFile(path.join(currentFixture, "src", "App.tsx"));
  assert.equal(run(currentFixture).status, 0, "second current run must pass");
  assert.deepEqual(await readFile(path.join(currentFixture, "src", "App.tsx")), first, "current source must be byte-idempotent");
  const legacy = current.replace(/                          const bestBuildTrustSummary[\s\S]*?                          \/\/ Best Build recommendation confidence/, "                          // Best Build recommendation confidence").replace(/<div className="text-\[11px\] text-slate-500 mt-1">Delta vs current:[\s\S]*?Key tradeoffs: \{bestTrust\.tradeoffs\}<\/div>/, `<div className="text-[11px] text-slate-500 mt-1">Delta vs current: {bestDeltaPct >= 0 ? "+" : ""}{bestDeltaPct.toFixed(2)}% · Confidence: <strong>{bestConfidence.label}</strong>{pathMaturity ? <> · {pathMaturity.ownership} · {pathMaturity.maturity}</> : null}</div>`).replace("bestBuildEntries.slice(1, 3).map((r, idx) => (", "bestBuildResult.slice(1, 6).map((r, idx) => (").replace(/<span className="text-slate-300 truncate flex-1 px-2" title=\{r\.gear\.map\(g => g\.name\)\.join\(", "\)\}>[\s\S]*?<\/span>/, `<span className="text-slate-300 truncate flex-1 px-2" title={r.gear.map(g => g.name).join(", ")}>{r.gear.map(g => g.name).join(" · ")}</span>`).replace(/<span className="font-mono font-bold text-\[#f0b400\] mr-2">[\s\S]*?<\/span>/, `<span className="font-mono font-bold text-[#f0b400] mr-2">{Math.round(r.rate / 100 * baselineScore / getRotationTimeForBuild(selectedBuild)).toLocaleString()} DPS</span>`);
  const legacyFixture = await fixture(generator, legacy); assert.equal(run(legacyFixture).status, 0, "legacy must migrate"); const migrated = await readFile(path.join(legacyFixture, "src", "App.tsx")); assert.equal(run(legacyFixture).status, 0); assert.deepEqual(await readFile(path.join(legacyFixture, "src", "App.tsx")), migrated, "legacy migration must be idempotent");
  await fail(generator, current.replace(/const bestBuildTrustSummary[\s\S]*?const bestTrust = bestBuildTrustSummary\(best\);/, ""), "missing helper");
  await fail(generator, current.replace("const bestTrust = bestBuildTrustSummary(best);", "const bestBuildTrustSummary = () => null;\n                          const bestTrust = bestBuildTrustSummary(best);"), "duplicate helper");
  await fail(generator, current.replace("const dps = entry.rate / 100 * baselineScore / modeledDurationOrZero(selectedBuild);", "const dps = entry.rate / 100 * baselineScore / getRotationTimeForBuild(selectedBuild);"), "wrong duration");
  await fail(generator, current.replace("bestBuildEntries.slice(1, 3)", "bestBuildEntries.slice(1, 6)"), "wrong Top-3 bound");
  await fail(generator, current.replace("bestTrust.tradeoffs", "bestTrust.missingTradeoffs"), "missing winner metadata");
  await fail(generator, current.replace("meta.tradeoffs", "meta.missingTradeoffs"), "missing alternative metadata");
  await fail(generator, current.replace("bestTrust.tradeoffs", "bestTrust.missingTradeoffs // bestTrust.tradeoffs\n                          const misleading = 'bestBuildTrustSummary bestBuildEntries.slice(1, 3) meta.tradeoffs';"), "misleading tokens");
  console.log("[bamboocut-best-build-trust-generator] PASS — RED, current/idempotency, legacy migration, ownership, and all fail-closed corruptions passed.");
} finally { await Promise.all(fixtures.map((dir) => rm(dir, { recursive: true, force: true }))); }
