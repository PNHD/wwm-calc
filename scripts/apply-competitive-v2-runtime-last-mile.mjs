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

// Local #gvg/share intentionally stays on the hardened privacy review surface.
// It strips private metadata, bounds the payload/roster, defaults to player-name
// redaction and sends shared links through a read-only landing. Do not bypass it
// just to exercise the less-strict internal War Room Share component.
replaceContract(
  "scripts/runtime-gvg-acceptance.spec.mjs",
  "COMPETITIVE_V2_GVG_SHARE_PRIVACY_SURFACE",
  `  await page.goto(\`\${base}#gvg/share\`, { waitUntil: "networkidle" });\n  await expect(page.getByTestId("gvg-share")).toBeVisible();\n  await page.getByRole("button", { name: /Prepare JSON/i }).click();\n  await expect(page.getByRole("status")).toContainText(/redacted/i);`,
  `  await page.goto(\`\${base}#gvg/share\`, { waitUntil: "networkidle" });\n  const sharePrivacy = page.getByTestId("gvg-share-privacy" /* COMPETITIVE_V2_GVG_SHARE_PRIVACY_SURFACE */);\n  await expect(sharePrivacy).toBeVisible();\n  await expect(sharePrivacy.getByText("PUBLIC DATA INCLUDED", { exact: true })).toBeVisible();\n  await expect(sharePrivacy.getByLabel(/Redact player names/i)).toBeChecked();\n  await expect(sharePrivacy.getByRole("button", { name: /Generate share link/i })).toBeVisible();\n  await expect(sharePrivacy.getByRole("button", { name: /Copy versioned JSON/i })).toBeVisible();`,
  "Guild War hardened share/privacy surface",
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

// Secondary Guild War persistence (phase/assignments/manual overrides) is
// intentionally separate from the main workspace document. Surface bounded
// recovery from those helpers after the child/phase loaders have had a chance to
// report corruption; do not reuse the main-workspace replacement action.
{
  const path = "src/product/GuildWarWorkspace.tsx";
  const marker = "V1_GVG_SECONDARY_RECOVERY_UI";
  let source = read(path);
  if (!source.includes(marker)) {
    const holdAnchor = `const [holdPersistence,setHoldPersistence] = useState(Boolean(loaded.holdPersistence));`;
    if (!source.includes(holdAnchor)) throw new Error("Competitive V2 last-mile: Guild War hold-persistence anchor missing");
    source = source.replace(holdAnchor, `${holdAnchor} const [secondaryRecovery,setSecondaryRecovery] = useState(""); // ${marker}`);

    const shareEffectAnchor = `  useEffect(() => { const marker = "gvg-share=";`;
    if (!source.includes(shareEffectAnchor)) throw new Error("Competitive V2 last-mile: Guild War share-effect anchor missing");
    source = source.replace(shareEffectAnchor, `  useEffect(() => { const message = consumeGvgStorageRecovery(); if (message) setSecondaryRecovery(message); }, [view, phase]);\n${shareEffectAnchor}`);

    const navAnchor = `<nav className="gvg-tabs" aria-label="Guild War workspaces">`;
    if (!source.includes(navAnchor)) throw new Error("Competitive V2 last-mile: Guild War tab-nav anchor missing");
    const secondaryUi = `{secondaryRecovery && <div className="gvg-card" data-testid="gvg-secondary-recovery"><Unknown>{secondaryRecovery}</Unknown><p>Invalid secondary state is not trusted. A bounded backup is retained; editing the affected control replaces only that secondary key.</p><button className="gvg-button" type="button" aria-label="Acknowledge secondary recovery" onClick={() => setSecondaryRecovery("")}>Acknowledge</button></div>}`;
    source = source.replace(navAnchor, `${secondaryUi}${navAnchor}`);

    if (!source.includes(marker) || !source.includes("gvg-secondary-recovery") || !source.includes("consumeGvgStorageRecovery(); if (message) setSecondaryRecovery(message)")) throw new Error("Competitive V2 last-mile: Guild War secondary recovery UI contract incomplete");
    write(path, source);
  }
}

console.log("Competitive V2 last-mile runtime assertions applied deterministically.");
