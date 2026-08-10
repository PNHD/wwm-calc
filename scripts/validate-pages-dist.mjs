import fs from "node:fs";
import path from "node:path";

const rootConfigPath = "wrangler.jsonc";
const distDir = "dist";
const requiredFiles = [
  path.join(distDir, "index.html"),
  path.join(distDir, "build-info.json"),
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) {
    throw new Error(`[pages-dist] Missing required static Pages output: ${file}`);
  }
}

if (!fs.existsSync(rootConfigPath)) {
  throw new Error(`[pages-dist] Missing authoritative Pages config: ${rootConfigPath}`);
}

const rootConfig = JSON.parse(fs.readFileSync(rootConfigPath, "utf8"));
if (rootConfig.pages_build_output_dir !== "./dist" && rootConfig.pages_build_output_dir !== "dist") {
  throw new Error("[pages-dist] Root wrangler.jsonc must set pages_build_output_dir to ./dist");
}

const forbiddenRootKeys = ["assets", "main", "workers_dev"];
for (const key of forbiddenRootKeys) {
  if (Object.prototype.hasOwnProperty.call(rootConfig, key)) {
    throw new Error(`[pages-dist] Root Pages config contains Worker-only field: ${key}`);
  }
}

const generatedWrangler = path.join(distDir, "wrangler.json");
if (fs.existsSync(generatedWrangler)) {
  const generated = fs.readFileSync(generatedWrangler, "utf8");
  let parsed;
  try {
    parsed = JSON.parse(generated);
  } catch {
    throw new Error("[pages-dist] dist/wrangler.json exists and is not valid JSON");
  }
  const workerOnlyKeys = [
    "assets",
    "main",
    "workers_dev",
    "bindings",
    "durable_objects",
    "queues",
    "services",
    "vpc_services",
    "vpc_networks",
    "worker_loaders",
  ];
  const present = workerOnlyKeys.filter((key) => Object.prototype.hasOwnProperty.call(parsed, key));
  throw new Error(
    `[pages-dist] Unexpected generated dist/wrangler.json would override the root Pages config${present.length ? `; Worker fields: ${present.join(", ")}` : ""}`,
  );
}

console.log("[pages-dist-audit] PASS — static dist is deployable by Pages and no generated Worker Wrangler manifest can override the root config.");
