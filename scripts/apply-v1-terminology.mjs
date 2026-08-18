import fs from "node:fs";

function replaceAllChecked(path, pairs) {
  let source = fs.readFileSync(path, "utf8");
  if (source.includes("V1_GUILD_WAR_TERMINOLOGY")) return;
  source = `// V1_GUILD_WAR_TERMINOLOGY\n${source}`;
  for (const [from, to] of pairs) source = source.replaceAll(from, to);
  fs.writeFileSync(path, source, "utf8");
}

replaceAllChecked("src/product/GuildWarWorkspace.tsx", [
  ["The GvG share link could not be decoded.", "The Guild War share link could not be decoded."],
  ["Cloned into my local GvG workspace.", "Cloned into my local Guild War workspace."],
  ["30-player composition, GvG role builds", "30-player composition, Guild War role builds"],
  [">GvG Build Lab<", ">Guild War Build Lab<"],
  ["Experimental GvG profile", "Experimental Guild War profile"],
  [">GvG selected profile<", ">Guild War selected profile<"],
  ["migrated into GvG coefficients", "migrated into Guild War coefficients"],
  [">GvG: Normal<", ">Guild War: Normal<"],
  [">GvG: Arena<", ">Guild War: Arena<"],
  [">GvG healer calibration<", ">Guild War healer calibration<"],
  ["a WWM GvG share JSON payload", "a WWM Guild War share JSON payload"],
]);

replaceAllChecked("src/product/LibraryWorkspace.tsx", [
  ["a universal GvG winner", "a universal Guild War winner"],
]);

console.log("V1 user-facing Guild War terminology normalized.");
