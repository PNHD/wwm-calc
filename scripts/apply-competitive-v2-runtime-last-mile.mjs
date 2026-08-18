import fs from "node:fs";

function read(path) { return fs.readFileSync(path, "utf8"); }
function write(path, source) { fs.writeFileSync(path, source, "utf8"); }
function replaceContract(path, marker, before, after, label) {
  let source = read(path);
  if (source.includes(marker)) return;
  if (!source.includes(before)) throw new Error(`Competitive V2 last-mile: ${label} anchor missing`);
  source = source.replace(before, after);
  if (!source.includes(marker)) throw new Error(`Competitive V2 last-mile: ${label} marker missing after patch`);
  write(path, source);
}

// The War Room intentionally exposes 3:00 in both the phase schedule and the
// two objective rows. Assert the two official outpost rows explicitly instead
// of requiring a globally unique text node.
replaceContract(
  "scripts/runtime-gvg-acceptance.spec.mjs",
  "COMPETITIVE_V2_GVG_OUTPOST_3M_SCOPE",
  `  const timelineSurface = page.getByTestId("gvg-timeline" /* COMPETITIVE_V2_GVG_TIMELINE_SCOPE */);\n  await expect(timelineSurface).toBeVisible();\n  await expect(timelineSurface.getByText("OUTPOST PHASE", { exact: true })).toBeVisible();\n  await expect(timelineSurface.getByText("3:00", { exact: true })).toBeVisible();`,
  `  const timelineSurface = page.getByTestId("gvg-timeline" /* COMPETITIVE_V2_GVG_TIMELINE_SCOPE */);\n  await expect(timelineSurface).toBeVisible();\n  await expect(timelineSurface.getByText("OUTPOST PHASE", { exact: true })).toBeVisible();\n  const objectiveTimeline = page.getByTestId("gvg-objective-timeline" /* COMPETITIVE_V2_GVG_OUTPOST_3M_SCOPE */);\n  await expect(objectiveTimeline.getByText("TOP OUTPOST", { exact: true })).toBeVisible();\n  await expect(objectiveTimeline.getByText("BOTTOM OUTPOST", { exact: true })).toBeVisible();\n  await expect(objectiveTimeline.getByText("3:00", { exact: true })).toHaveCount(2);`,
  "Guild War outpost 3:00 scope",
);

// The representative-scale suite must time the actual Competitive V2 Strategy
// surface. The legacy strategy-board test id was deliberately superseded.
replaceContract(
  "scripts/runtime-v1-release-acceptance.spec.mjs",
  "COMPETITIVE_V2_V1_SCALE_GVG_STRATEGY",
  `  await page.goto(\`\${BASE}#gvg/strategy\`, { waitUntil: "networkidle" });\n  await expect(page.getByTestId("gvg-strategy-board")).toBeVisible();\n  timings.gvgStrategyMs = Date.now() - start;`,
  `  await page.goto(\`\${BASE}#gvg/strategy\`, { waitUntil: "networkidle" });\n  await expect(page.getByTestId("gvg-strategy" /* COMPETITIVE_V2_V1_SCALE_GVG_STRATEGY */)).toBeVisible();\n  await expect(page.getByTestId("gvg-objective-map")).toBeVisible();\n  timings.gvgStrategyMs = Date.now() - start;`,
  "V1 scale Guild War Strategy surface",
);

console.log("Competitive V2 last-mile runtime assertions applied deterministically.");
