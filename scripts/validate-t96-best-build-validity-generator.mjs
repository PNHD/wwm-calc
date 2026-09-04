import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { copyFile, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const root = process.cwd();
const generatorName = "apply-t96-best-build-validity.mjs";
const generatorPath = path.join(root, "scripts", generatorName);

const createFixture = async () => {
  const fixture = await mkdtemp(path.join(os.tmpdir(), "wwm-t96-best-build-validity-"));
  await mkdir(path.join(fixture, "scripts"), { recursive: true });
  await mkdir(path.join(fixture, "src"), { recursive: true });
  await copyFile(generatorPath, path.join(fixture, "scripts", generatorName));
  await copyFile(path.join(root, "scripts", "source-invariant-ast.mjs"), path.join(fixture, "scripts", "source-invariant-ast.mjs"));
  await copyFile(path.join(root, "src", "App.tsx"), path.join(fixture, "src", "App.tsx"));
  return fixture;
};

const runGenerator = (fixture) => spawnSync(
  process.execPath,
  [path.join(fixture, "scripts", generatorName)],
  { cwd: fixture, encoding: "utf8", env: { ...process.env, WWM_SOURCE_INVARIANT_TYPESCRIPT_RESOLVER: path.join(root, "package.json") } },
);

const corruptions = [
  {
    label: "valid-gear filter",
    from: "validateGlobalT96GearLines(item.slot, item.subs).errors.length === 0",
    to: "true /* corrupted valid-gear filter */",
  },
  {
    label: "reviewer comment-only valid-gear filter",
    from: "validateGlobalT96GearLines(item.slot, item.subs).errors.length === 0",
    to: "true /* validateGlobalT96GearLines(item.slot, item.subs).errors.length === 0 */",
  },
  {
    label: "complete-slot handling",
    from: "const missingSlots = SLOT_ORDER.filter((slot) => bySlot[slot].length === 0);",
    to: "const missingSlots = []; // corrupted complete-slot handling",
  },
  {
    label: "exact-search empty-slot invariant",
    from: "if (opts.length === 0) throw new Error(`Best Build invariant: missing required slot ${SLOT_ORDER[idx]}`);",
    to: "if (opts.length === 0) return; // corrupted exact-search invariant",
  },
  {
    label: "beam-search empty-slot invariant",
    from: "if (!options.length) throw new Error(`Best Build invariant: missing required slot ${SLOT_ORDER[slotIndex]}`);",
    to: "if (!options.length) continue; // corrupted beam-search invariant",
  },
];

const fixtures = [];
try {
  const currentFixture = await createFixture();
  fixtures.push(currentFixture);
  const currentAppPath = path.join(currentFixture, "src", "App.tsx");
  const before = await readFile(currentAppPath);
  const beforeText = before.toString("utf8");
  assert.match(beforeText, /setBestBuildResult\(\{ pathKey: requestPathKey, entries: \[\] \}\);/, "fixture must use path-keyed empty-result ownership");
  assert.match(beforeText, /bestBuildRequestId\.current === requestId && selectedBuild === requestPathKey/, "fixture must retain request/path stale-result guards");
  assert.doesNotMatch(beforeText, /setBestBuildResult\(\[\]\);/, "fixture must not depend on the obsolete result-state API");

  const first = runGenerator(currentFixture);
  assert.equal(first.status, 0, `current Draught-aware Best Build source must be accepted:\n${first.stderr || first.stdout}`);
  const afterFirst = await readFile(currentAppPath);
  assert.deepEqual(afterFirst, before, "first generator run must be byte-idempotent");

  const second = runGenerator(currentFixture);
  assert.equal(second.status, 0, `second generator run must succeed:\n${second.stderr || second.stdout}`);
  const afterSecond = await readFile(currentAppPath);
  assert.deepEqual(afterSecond, afterFirst, "second generator run must be byte-idempotent");

  const rejected = [];
  for (const corruption of corruptions) {
    const fixture = await createFixture();
    fixtures.push(fixture);
    const appPath = path.join(fixture, "src", "App.tsx");
    const intact = await readFile(appPath, "utf8");
    const corrupted = intact.replace(corruption.from, corruption.to);
    assert.notEqual(corrupted, intact, `${corruption.label} fixture must remove its required invariant`);
    await writeFile(appPath, corrupted, "utf8");

    const result = runGenerator(fixture);
    assert.notEqual(result.status, 0, `${corruption.label} corruption must fail closed`);
    assert.match(`${result.stderr}\n${result.stdout}`, /\[t96-best-build-validity\]/, `${corruption.label} rejection must come from the generator`);
    rejected.push(corruption.label);
  }

  console.log(`[t96-best-build-validity-generator] PASS — current path-keyed source is byte-idempotent across two runs; rejected corruptions: ${rejected.join(", ")}.`);
} finally {
  await Promise.all(fixtures.map((fixture) => rm(fixture, { recursive: true, force: true })));
}
