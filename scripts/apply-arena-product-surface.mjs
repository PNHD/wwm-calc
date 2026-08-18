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
  fs.writeFileSync(path, source, "utf8");
  console.log("Arena workspace switcher applied");
} else {
  console.log("Arena workspace switcher already applied");
}

// The legacy app has a generic `header { ... }` rule. Scope the Arena topbar so the
// new workspace keeps its dark design surface at every responsive breakpoint.
const arenaCssPath = "src/arena/arena.css";
let arenaCss = fs.readFileSync(arenaCssPath, "utf8");
const topbarIsolation = `.arena-root .arena-topbar{background:rgba(11,13,16,.98)!important;background-color:#0b0d10!important;box-shadow:none!important}`;
if (!arenaCss.includes(topbarIsolation)) {
  arenaCss = `${arenaCss.trimEnd()}\n${topbarIsolation}\n`;
  fs.writeFileSync(arenaCssPath, arenaCss, "utf8");
  console.log("Arena topbar CSS isolation applied");
} else {
  console.log("Arena topbar CSS isolation already applied");
}

// Arena adds three current Library references. Keep the existing browser acceptance
// contract aligned with the larger curated dataset instead of treating valid Arena
// content as a PvE/GvG regression.
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
