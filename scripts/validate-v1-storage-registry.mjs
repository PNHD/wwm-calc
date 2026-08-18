import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import { STORAGE_REGISTRY } from "../src/product/storage-registry.js";

const root = "src";
const extensions = new Set([".js", ".mjs", ".ts", ".tsx"]);
const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (extensions.has(path.extname(entry.name))) files.push(full);
  }
}
walk(root);

const discovered = new Map();
const re = /(?:localStorage|sessionStorage)\.(?:getItem|setItem|removeItem)\(\s*["'`]([^"'`]+)["'`]/g;
for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  for (const match of text.matchAll(re)) {
    const key = match[1];
    if (!discovered.has(key)) discovered.set(key, []);
    discovered.get(key).push(file.replaceAll("\\", "/"));
  }
}

// h72na_data_token is referenced only inside the generated WWM dashboard bookmarklet.
// It belongs to the external game dashboard origin, not WWM Calc storage.
const externalOriginKeys = new Set(["h72na_data_token"]);
const registryKeys = new Set(STORAGE_REGISTRY.map((item) => item.key));
const missing = [...discovered.keys()].filter((key) => !registryKeys.has(key) && !externalOriginKeys.has(key));
assert.deepEqual(missing, [], `Unregistered storage keys: ${missing.map((key) => `${key} (${discovered.get(key).join(", ")})`).join("; ")}`);

for (const item of STORAGE_REGISTRY) {
  assert.ok(item.owner && item.schemaVersion != null && item.migration && item.fallback && item.size && item.corruption, `Incomplete registry metadata for ${item.key}`);
}

console.log(JSON.stringify({ success: true, registered: STORAGE_REGISTRY.length, discovered: [...discovered.keys()].sort(), externalOriginKeys: [...externalOriginKeys] }, null, 2));
