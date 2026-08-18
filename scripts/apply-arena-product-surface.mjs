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
