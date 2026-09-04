import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const root = process.cwd();
const generatorName = "apply-bamboocut-trust.mjs";
const generatorPath = path.join(root, "scripts", generatorName);
const appPath = path.join(root, "src", "App.tsx");
const filteredBuffs = "      const buffs = buildTimelineBuffs(selectedInnerWays, innerWayTiers).filter((buff) => !diagnostics?.excludedBuffIds?.includes(buff.id));";
const unfilteredBuffs = "      const buffs = buildTimelineBuffs(selectedInnerWays, innerWayTiers);";
const draughtDuration = "      const window = modeledDurationOrZero(selectedBuild);";
const normalizeEol = (value) => value.replace(/\r\n/g, "\n");

const createFixture = async (generatorText, appText) => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), "wwm-bamboocut-trust-generator-"));
  await mkdir(path.join(fixture, "scripts"), { recursive: true });
  await mkdir(path.join(fixture, "src"), { recursive: true });
  await writeFile(path.join(fixture, "scripts", generatorName), generatorText, "utf8");
  await copyFile(path.join(root, "scripts", "source-invariant-ast.mjs"), path.join(fixture, "scripts", "source-invariant-ast.mjs"));
  await writeFile(path.join(fixture, "src", "App.tsx"), appText, "utf8");
  return fixture;
};

const runGenerator = (fixture) => spawnSync(
  process.execPath,
  [path.join(fixture, "scripts", generatorName)],
  { cwd: fixture, encoding: "utf8", env: { ...process.env, WWM_SOURCE_INVARIANT_TYPESCRIPT_RESOLVER: path.join(root, "package.json") } },
);

const outputOf = (result) => `${result.stderr || ""}\n${result.stdout || ""}`;
const fixtures = [];

try {
  const generatorText = normalizeEol(await readFile(generatorPath, "utf8"));
  const currentApp = normalizeEol(await readFile(appPath, "utf8"));
  assert.ok(currentApp.includes(filteredBuffs), "fixture must contain the real comboInCombat exclusion filter");
  assert.ok(currentApp.includes(`${filteredBuffs}\n${draughtDuration}`), "fixture must contain the Draught-safe duration boundary next to the filter");

  const scopedTransform = `requiredWithinComboInCombat(
  "${unfilteredBuffs}",
  "${filteredBuffs}",
  "conditional mechanic exclusion",
);`;
  const legacyTransform = `required(
  '${unfilteredBuffs}\\n      const window = getRotationTimeForBuild(selectedBuild);',
  '${filteredBuffs}\\n      const window = getRotationTimeForBuild(selectedBuild);',
  "conditional mechanic exclusion",
);`;
  const legacyGenerator = generatorText.replace(scopedTransform, legacyTransform);
  assert.notEqual(legacyGenerator, generatorText, "RED fixture must reconstruct the pre-fix adjacent-anchor transform");

  const redFixture = await createFixture(legacyGenerator, currentApp);
  fixtures.push(redFixture);
  const red = runGenerator(redFixture);
  assert.notEqual(red.status, 0, "pre-fix generator must fail against the Draught-aware duration boundary");
  assert.match(outputOf(red), /Missing patch anchor: conditional mechanic exclusion/, "RED failure must identify the reported anchor");

  const currentFixture = await createFixture(generatorText, currentApp);
  fixtures.push(currentFixture);
  const currentFixtureApp = path.join(currentFixture, "src", "App.tsx");
  const before = await readFile(currentFixtureApp);
  const first = runGenerator(currentFixture);
  assert.equal(first.status, 0, `current Draught-aware source must pass:\n${outputOf(first)}`);
  const afterFirst = await readFile(currentFixtureApp);
  assert.deepEqual(afterFirst, before, "run 1 must leave the already-transformed source byte-stable");
  const second = runGenerator(currentFixture);
  assert.equal(second.status, 0, `second generator run must pass:\n${outputOf(second)}`);
  const afterSecond = await readFile(currentFixtureApp);
  assert.deepEqual(afterSecond, afterFirst, "run 2 must be byte-identical to run 1");
  assert.ok(afterSecond.toString("utf8").includes(`${filteredBuffs}\n${draughtDuration}`), "the transformed filter plus Draught duration boundary must remain intact");
  assert.ok(!afterSecond.toString("utf8").includes(`${filteredBuffs}\n      const window = getRotationTimeForBuild(selectedBuild);`), "generator must not restore the obsolete duration lookup");

  const repairFixture = await createFixture(generatorText, currentApp.replace(filteredBuffs, unfilteredBuffs));
  fixtures.push(repairFixture);
  const repaired = runGenerator(repairFixture);
  assert.equal(repaired.status, 0, `valid pre-transform filter shape must be repaired:\n${outputOf(repaired)}`);
  const repairedApp = await readFile(path.join(repairFixture, "src", "App.tsx"), "utf8");
  assert.ok(repairedApp.includes(`${filteredBuffs}\n${draughtDuration}`), "repair must restore the real filter without changing the Draught duration boundary");

  const misleadingApp = currentApp
    .replace(filteredBuffs, "      const buffs = buildTimelineBuffs(selectedInnerWays, innerWayTiers).map((buff) => buff);")
    .replace("import ", "// unrelated diagnostics?.excludedBuffIds token must not satisfy comboInCombat\nimport ");
  const misleadingFixture = await createFixture(generatorText, misleadingApp);
  fixtures.push(misleadingFixture);
  const misleading = runGenerator(misleadingFixture);
  assert.notEqual(misleading.status, 0, "unrelated excludedBuffIds text must not hide a corrupted real filter");
  assert.match(outputOf(misleading), /Missing patch anchor: conditional mechanic exclusion/, "misleading-token corruption must fail at the scoped invariant");

  const reviewerApp = currentApp.replace(
    filteredBuffs,
    "      const buffs = buildTimelineBuffs(selectedInnerWays, innerWayTiers).map((buff) => buff);\n      /*\n      const buffs = buildTimelineBuffs(selectedInnerWays, innerWayTiers).filter((buff) => !diagnostics?.excludedBuffIds?.includes(buff.id));\n      */",
  );
  const reviewerFixture = await createFixture(generatorText, reviewerApp);
  fixtures.push(reviewerFixture);
  assert.notEqual(runGenerator(reviewerFixture).status, 0, "an in-block comment must not satisfy the comboInCombat exclusion filter");

  console.log("[bamboocut-trust-generator] PASS — current source is two-run byte-idempotent; valid pre-transform filtering is repaired; misleading-token and reviewer in-block-comment corruptions fail closed; modeledDurationOrZero is preserved.");
} finally {
  await Promise.all(fixtures.map((fixture) => rm(fixture, { recursive: true, force: true })));
}
