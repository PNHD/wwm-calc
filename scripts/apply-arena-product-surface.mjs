import fs from "node:fs";

const path = "src/product/ProductShell.tsx";
let source = fs.readFileSync(path, "utf8");
const marker = 'aria-label="Open Arena workspace"';
if (!source.includes(marker)) {
  const needle = `      <button type="button" className={workspace === "gvg" ? "is-active" : ""} aria-pressed={workspace === "gvg"} onClick={() => onChange("gvg")}>
        <Shield size={15} aria-hidden="true" /><span>Guild War</span>
      </button>`;
  if (!source.includes(needle)) throw new Error("Arena migration: WorkspaceSwitcher anchor not found");
  const arena = `      <button type="button" aria-label="Open Arena workspace" aria-pressed={false} onClick={() => { window.location.hash = "#arena/overview"; }}>
        <Target size={15} aria-hidden="true" /><span>Arena</span>
      </button>
${needle}`;
  source = source.replace(needle, arena);
  console.log("Arena workspace switcher applied");
} else {
  console.log("Arena workspace switcher already applied");
}

const oldOverview = `{workspace === "gvg" && gvgView === "overview" && <GvgOverview onNavigate={goGvg} onOpenLibrary={openLibrary} />}`;
const v2Overview = `{workspace === "gvg" && gvgView === "overview" && <div className="workspace-gvg-host is-overview"><GuildWarWorkspace onClose={() => goGvg("overview")} /></div>}`;
if (!source.includes(v2Overview)) {
  if (!source.includes(oldOverview)) throw new Error("Competitive V2 migration: Guild War overview anchor not found");
  source = source.replace(oldOverview, v2Overview);
  console.log("Guild War V2 overview applied");
} else {
  console.log("Guild War V2 overview already applied");
}
fs.writeFileSync(path, source, "utf8");

// The legacy app has generic header/form rules. Scope Arena surfaces so the new
// workspace retains its dark design system at every responsive breakpoint.
const arenaCssPath = "src/arena/arena.css";
let arenaCss = fs.readFileSync(arenaCssPath, "utf8");
const arenaCssIsolation = [
  `.arena-root .arena-topbar{background:rgba(11,13,16,.98)!important;background-color:#0b0d10!important;box-shadow:none!important}`,
  `.arena-root input,.arena-root select,.arena-root textarea{background:#0d1115!important;background-color:#0d1115!important;color:#e9e6df!important;border-color:rgba(255,255,255,.09)!important;color-scheme:dark}`,
];
let cssChanged = false;
for (const rule of arenaCssIsolation) {
  if (!arenaCss.includes(rule)) {
    arenaCss = `${arenaCss.trimEnd()}\n${rule}\n`;
    cssChanged = true;
  }
}
if (cssChanged) {
  fs.writeFileSync(arenaCssPath, arenaCss, "utf8");
  console.log("Arena scoped CSS isolation applied");
} else {
  console.log("Arena scoped CSS isolation already applied");
}

// Arena adds three current Library references. Keep the existing browser acceptance
// contract aligned with the larger curated dataset instead of treating valid Arena
// content as a PvE/Guild War regression.
const libraryTestPath = "scripts/runtime-library-acceptance.spec.mjs";
let libraryTest = fs.readFileSync(libraryTestPath, "utf8");
const recentNeedle = `  await expect(page.locator(".library-card")).toHaveCount(5);`;
const recentReplacement = `  await expect(page.locator(".library-card")).toHaveCount(8);`;
if (!libraryTest.includes(recentReplacement)) {
  if (!libraryTest.includes(recentNeedle)) throw new Error("Arena migration: Library recent-count acceptance anchor not found");
  libraryTest = libraryTest.replace(recentNeedle, recentReplacement);
}
const weaponNeedle = `  await filters.getByLabel("Weapon").selectOption({ label: "Vernal Umbrella" });
  await expect(page.locator(".library-card")).toHaveCount(1);
  await expect(page.locator(".library-card").getByRole("heading", { name: "Silkbind-Jade", exact: true })).toBeVisible();`;
const weaponReplacement = `  await filters.getByLabel("Weapon").selectOption({ label: "Vernal Umbrella" });
  await expect(page.locator(".library-card")).toHaveCount(2);
  await expect(page.locator(".library-card").getByRole("heading", { name: "Silkbind-Jade", exact: true })).toBeVisible();
  await expect(page.locator(".library-card").getByRole("heading", { name: "Silkbind-Jade Arena", exact: true })).toBeVisible();`;
if (!libraryTest.includes(weaponReplacement)) {
  if (!libraryTest.includes(weaponNeedle)) throw new Error("Arena migration: Library weapon-filter acceptance anchor not found");
  libraryTest = libraryTest.replace(weaponNeedle, weaponReplacement);
}
fs.writeFileSync(libraryTestPath, libraryTest, "utf8");
console.log("Arena Library runtime acceptance contract applied");

// Competitive V2 validator is chained through the already-authoritative Arena model
// step so PR and push workflows cannot bypass evidence/applicability guards.
const validatorPath = "scripts/validate-arena-model.mjs";
let validator = fs.readFileSync(validatorPath, "utf8");
const validatorImport = `import "./validate-competitive-v2.mjs";`;
if (!validator.includes(validatorImport)) {
  validator = `${validatorImport}\n${validator}`;
  fs.writeFileSync(validatorPath, validator, "utf8");
  console.log("Competitive V2 validator chained");
} else {
  console.log("Competitive V2 validator already chained");
}
