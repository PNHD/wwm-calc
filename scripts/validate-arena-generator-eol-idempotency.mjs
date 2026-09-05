import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const libraryTarget = "public/data/library-v1.json";
const productTarget = "scripts/runtime-library-acceptance.spec.mjs";
const libraryGenerator = path.join(root, "scripts/apply-arena-library.mjs");
const productGenerator = path.join(root, "scripts/apply-arena-product-surface.mjs");

function normalized(text) {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function withEol(text, eol) {
  const value = normalized(text);
  const hasFinalNewline = value.endsWith("\n");
  const body = hasFinalNewline ? value.slice(0, -1) : value;
  return `${body.replaceAll("\n", eol)}${hasFinalNewline ? eol : ""}`;
}

function createFixture() {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "wwm-arena-eol-"));
  fs.cpSync(root, fixture, {
    recursive: true,
    filter: (source) => !source.includes(`${path.sep}.git${path.sep}`) && !source.includes(`${path.sep}node_modules${path.sep}`) && !source.includes(`${path.sep}dist${path.sep}`),
  });
  return fixture;
}

function writeTarget(fixture, target, text, eol) {
  const targetPath = path.join(fixture, target);
  fs.writeFileSync(targetPath, withEol(text, eol), "utf8");
  return fs.readFileSync(targetPath);
}

function run(fixture, generator) {
  const result = spawnSync(process.execPath, [generator], { cwd: fixture, encoding: "utf8" });
  assert.equal(result.status, 0, `${path.basename(generator)} failed:\n${result.stdout}\n${result.stderr}`);
}

function runCurrentCase(name, target, generator, eol) {
  const fixture = createFixture();
  try {
    const source = fs.readFileSync(path.join(root, target), "utf8");
    const before = writeTarget(fixture, target, source, eol);
    run(fixture, generator);
    const run1 = fs.readFileSync(path.join(fixture, target));
    run(fixture, generator);
    const run2 = fs.readFileSync(path.join(fixture, target));
    assert.deepEqual(run1, before, `${name}: already-current target changed on run 1`);
    assert.deepEqual(run2, run1, `${name}: run 2 changed target bytes`);
    console.log(`PASS ${name}`);
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
}

function libraryLegacySource() {
  const library = JSON.parse(fs.readFileSync(path.join(root, libraryTarget), "utf8"));
  const arenaIds = new Set([
    "bamboocut-dust-arena-control-pressure",
    "stonesplit-might-arena-frontline",
    "silkbind-jade-arena-ranged-control",
  ]);
  library.items = library.items.filter((item) => !arenaIds.has(item.id));
  return `${JSON.stringify(library, null, 2)}\n`;
}

function productLegacySource() {
  const source = normalized(fs.readFileSync(path.join(root, productTarget), "utf8"));
  const current = `  await expect(page.locator(".library-card")).toHaveCount(8);`;
  const legacy = `  await expect(page.locator(".library-card")).toHaveCount(5);`;
  assert.ok(source.includes(current), "product legacy fixture anchor is missing");
  return source.replace(current, legacy);
}

function runLegacyCase(name, target, generator, legacySource, expectedText, eol) {
  const fixture = createFixture();
  try {
    const before = writeTarget(fixture, target, legacySource(), eol);
    run(fixture, generator);
    const run1 = fs.readFileSync(path.join(fixture, target));
    assert.notDeepEqual(run1, before, `${name}: recognized legacy fixture did not transform`);
    const output = run1.toString("utf8");
    assert.ok(normalized(output).includes(expectedText), `${name}: intended semantic change is missing`);
    assert.ok(eol === "\r\n" ? !/(^|[^\r])\n/.test(output) : !output.includes("\r\n"), `${name}: original EOL convention changed`);
    run(fixture, generator);
    const run2 = fs.readFileSync(path.join(fixture, target));
    assert.deepEqual(run2, run1, `${name}: second run changed target bytes`);
    console.log(`PASS ${name}`);
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
}

runCurrentCase("library CRLF already-current", libraryTarget, libraryGenerator, "\r\n");
runCurrentCase("library LF already-current", libraryTarget, libraryGenerator, "\n");
runCurrentCase("product-surface CRLF already-current", productTarget, productGenerator, "\r\n");
runCurrentCase("product-surface LF already-current", productTarget, productGenerator, "\n");
runLegacyCase("library legacy CRLF transform", libraryTarget, libraryGenerator, libraryLegacySource, '"workspace": "ARENA"', "\r\n");
runLegacyCase("library legacy LF transform", libraryTarget, libraryGenerator, libraryLegacySource, '"workspace": "ARENA"', "\n");
runLegacyCase("product-surface legacy CRLF transform", productTarget, productGenerator, productLegacySource, "toHaveCount(8)", "\r\n");
runLegacyCase("product-surface legacy LF transform", productTarget, productGenerator, productLegacySource, "toHaveCount(8)", "\n");

console.log("Arena generator EOL idempotency validation passed");
