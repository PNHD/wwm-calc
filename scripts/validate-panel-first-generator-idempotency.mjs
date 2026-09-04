import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const root = process.cwd();
const generatorPath = path.join(root, "scripts", "apply-panel-first-optimizer.mjs");
const fixtureFiles = [
  "src/App.tsx",
  "src/utils/globalT96Gear.ts",
  "src/product/workspaces/ArsenalWorkspace.tsx",
];

const createFixture = async () => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), "wwm-panel-first-generator-"));
  await mkdir(path.join(fixture, "scripts"), { recursive: true });
  await copyFile(generatorPath, path.join(fixture, "scripts", "apply-panel-first-optimizer.mjs"));
  await copyFile(path.join(root, "scripts", "source-invariant-ast.mjs"), path.join(fixture, "scripts", "source-invariant-ast.mjs"));
  for (const relativePath of fixtureFiles) {
    const target = path.join(fixture, relativePath);
    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(path.join(root, relativePath), target);
  }
  return fixture;
};

const runGenerator = (fixture) => spawnSync(
  process.execPath,
  [path.join(fixture, "scripts", "apply-panel-first-optimizer.mjs")],
  { cwd: fixture, encoding: "utf8", env: { ...process.env, WWM_SOURCE_INVARIANT_TYPESCRIPT_RESOLVER: path.join(root, "package.json") } },
);

const snapshot = async (fixture) => Object.fromEntries(await Promise.all(
  fixtureFiles.map(async (relativePath) => [relativePath, await readFile(path.join(fixture, relativePath))]),
));

const assertSnapshotEqual = (actual, expected, label) => {
  for (const relativePath of fixtureFiles) {
    assert.deepEqual(actual[relativePath], expected[relativePath], `${label}: ${relativePath} changed`);
  }
};

const fixtures = [];
try {
  const currentFixture = await createFixture();
  fixtures.push(currentFixture);
  const currentApp = await readFile(path.join(currentFixture, "src", "App.tsx"), "utf8");
  assert.match(currentApp, /getNumericalPathAvailability\(selectedBuild\)/, "fixture must exercise the Draught-aware App shape");
  assert.match(currentApp, /const compareRotationTime = modeledDurationOrZero\(selectedBuild\);/, "fixture must use the Draught-aware duration boundary");

  const before = await snapshot(currentFixture);
  const first = runGenerator(currentFixture);
  assert.equal(first.status, 0, `Draught-aware transformed source must be accepted:\n${first.stderr || first.stdout}`);
  const afterFirst = await snapshot(currentFixture);
  assertSnapshotEqual(afterFirst, before, "first idempotent run");

  const second = runGenerator(currentFixture);
  assert.equal(second.status, 0, `second generator run must succeed:\n${second.stderr || second.stdout}`);
  const afterSecond = await snapshot(currentFixture);
  assertSnapshotEqual(afterSecond, afterFirst, "second idempotent run");

  const corruptedFixture = await createFixture();
  fixtures.push(corruptedFixture);
  const corruptedAppPath = path.join(corruptedFixture, "src", "App.tsx");
  const intactApp = await readFile(corruptedAppPath, "utf8");
  const corruptedApp = intactApp.replace("const candidateCombo = [", "const corruptedCandidateCombo = [");
  assert.notEqual(corruptedApp, intactApp, "negative fixture must remove a required replacement-comparison invariant");
  await writeFile(corruptedAppPath, corruptedApp, "utf8");

  const rejected = runGenerator(corruptedFixture);
  assert.notEqual(rejected.status, 0, "generator must reject a transformed source missing a required panel-first invariant");
  assert.match(`${rejected.stderr}\n${rejected.stdout}`, /full replacement gear comparison/, "rejection must identify the unavailable required transform");

  const reviewerFixture = await createFixture();
  fixtures.push(reviewerFixture);
  const reviewerAppPath = path.join(reviewerFixture, "src", "App.tsx");
  const reviewerApp = (await readFile(reviewerAppPath, "utf8")).replace(
    "const candidateCombo = [",
    "const corruptedCandidateCombo = [ // const candidateCombo = [",
  );
  await writeFile(reviewerAppPath, reviewerApp, "utf8");
  assert.notEqual(runGenerator(reviewerFixture).status, 0, "comment-only candidateCombo text must not satisfy the executable replacement invariant");

  console.log("[panel-first-generator-regression] PASS — Draught-aware source is byte-idempotent; ordinary and reviewer comment-only candidateCombo corruptions fail closed.");
} finally {
  await Promise.all(fixtures.map((fixture) => rm(fixture, { recursive: true, force: true })));
}
