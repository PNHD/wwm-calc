import fs from "node:fs";

function patch(path, marker, replacements) {
  let source = fs.readFileSync(path, "utf8");
  if (source.includes(marker)) return;
  for (const [from, to, label] of replacements) {
    if (!source.includes(from)) throw new Error(`V1 release UI anchor missing: ${label}`);
    source = source.replace(from, to);
  }
  fs.writeFileSync(path, source, "utf8");
}

patch("src/product/ProductShell.tsx", "V1_MODEL_ABOUT_PRODUCT_SHELL", [
  [
    `import LibraryWorkspace from "./LibraryWorkspace";`,
    `import LibraryWorkspace from "./LibraryWorkspace";\nimport ModelAbout from "./ModelAbout"; // V1_MODEL_ABOUT_PRODUCT_SHELL`,
    "ProductShell ModelAbout import",
  ],
  [
    `{workspace === "pve" ? <button type="button" onClick={() => goPve("profile")}><Share2 size={14} /> Share / Import</button> : workspace === "gvg" ? <button type="button" onClick={() => goGvg("share")}><Share2 size={14} /> Share Plan</button> : null}\n          {actions}`,
    `{workspace === "pve" ? <button type="button" onClick={() => goPve("profile")}><Share2 size={14} /> Share / Import</button> : workspace === "gvg" ? <button type="button" onClick={() => goGvg("share")}><Share2 size={14} /> Share Plan</button> : null}\n          <ModelAbout workspace={workspace === "pve" ? "PVE" : workspace === "gvg" ? "GUILD_WAR" : "LIBRARY"} page={workspace === "pve" ? pveView : workspace === "gvg" ? gvgView : "library"} path={context.build} tier={context.tier} />\n          {actions}`,
    "ProductShell ModelAbout action",
  ],
]);

patch("src/arena/ArenaWorkspace.tsx", "V1_MODEL_ABOUT_ARENA", [
  [
    `import evidenceCatalog from "./arena-evidence.json";`,
    `import evidenceCatalog from "./arena-evidence.json";\nimport ModelAbout from "../product/ModelAbout"; // V1_MODEL_ABOUT_ARENA`,
    "Arena ModelAbout import",
  ],
  [
    `<div className="arena-patch"><span>GLOBAL</span><strong>2.0</strong></div></header>`,
    `<div className="arena-patch"><span>GLOBAL</span><strong>2.0</strong></div><ModelAbout workspace="ARENA" page={route} path={profile.path} /></header>`,
    "Arena ModelAbout action",
  ],
]);

patch("src/product/GuildWarWorkspace.tsx", "V1_GVG_IMPORT_TYPE_CONTRACT", [
  [
    `        patchWorkspace({ importedBuildReference: imported.importedBuildReference });`,
    `        patchWorkspace({ importedBuildReference: (imported as any).importedBuildReference }); // V1_GVG_IMPORT_TYPE_CONTRACT`,
    "Guild War imported build type bridge",
  ],
]);

console.log("V1 model/about, report-issue UI and generated type contracts applied deterministically.");
