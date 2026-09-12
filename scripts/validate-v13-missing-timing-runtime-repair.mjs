import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";

const tempDir = await mkdtemp(path.join(os.tmpdir(), "wwm-v13-runtime-timing-"));
const missing = { available: false, reason: "MISSING_LOAD_BEARING_TIMING", missingTiming: ["Unmapped custom skill"] };

try {
  await build({ entryPoints: { app: "src/App.tsx" }, bundle: true, format: "esm", platform: "node", outdir: tempDir, outExtension: { ".js": ".mjs" } });
  const { missingTimingUnavailableState } = await import(pathToFileURL(path.join(tempDir, "app.mjs")).href);
  assert.deepEqual(missingTimingUnavailableState(missing), missing, "App consumer preserves structured missing-timing state");
  assert.equal(missingTimingUnavailableState({ available: true }), null, "available results are not marked unavailable");
  assert.notEqual(missingTimingUnavailableState(missing)?.reason, "ZERO_DPS", "missing timing stays distinguishable from valid zero");
  console.log("[v13-missing-timing-runtime-repair] PASS — App consumer preserves fail-closed missing-timing state.");
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
