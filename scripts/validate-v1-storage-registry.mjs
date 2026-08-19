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

const re = /(?:localStorage|sessionStorage)\.(?:getItem|setItem|removeItem)\(\s*["'`]([^"'`]+)["'`]/g;
const constCall = /(?:localStorage|sessionStorage)\.(?:getItem|setItem|removeItem)\(\s*([A-Z][A-Z0-9_]*)\b/g;
const constAssignment = /\b(?:const|let)\s+([A-Z][A-Z0-9_]*)\s*=\s*["'`]([^"'`]+)["'`]/g;
function discoverStorageKeys(text) {
  const found = new Set([...text.matchAll(re)].map((match) => match[1]));
  const constants = new Map([...text.matchAll(constAssignment)].map((match) => [match[1], match[2]]));
  for (const match of text.matchAll(constCall)) { const key = constants.get(match[1]); if (key) found.add(key); }
  return found;
}
function missingKeys(keys, registry, external = new Set()) {
  const recoveryKey = (key) => /__recovery_backup_v\d+$/.test(key) && registry.has(key.replace(/__recovery_backup_v\d+$/, ""));
  return [...keys].filter((key) => !registry.has(key) && !external.has(key) && !recoveryKey(key));
}
const regressionRegistry = new Set(["wwm_registered_literal_v1", "wwm_registered_const_v1"]);
const regressionExternal = new Set(["h72na_data_token"]);
assert.deepEqual(missingKeys(discoverStorageKeys(`localStorage.getItem("wwm_registered_literal_v1")`), regressionRegistry, regressionExternal), [], "registered literal passes");
assert.deepEqual(missingKeys(discoverStorageKeys(`localStorage.getItem("wwm_unregistered_literal_v1")`), regressionRegistry, regressionExternal), ["wwm_unregistered_literal_v1"], "unregistered literal is detected");
assert.deepEqual(missingKeys(discoverStorageKeys(`const STORAGE_KEY = "wwm_registered_const_v1"; localStorage.getItem(STORAGE_KEY)`), regressionRegistry, regressionExternal), [], "registered const passes");
assert.deepEqual(missingKeys(discoverStorageKeys(`const STORAGE_KEY = "wwm_unregistered_const_v1"; localStorage.getItem(STORAGE_KEY)`), regressionRegistry, regressionExternal), ["wwm_unregistered_const_v1"], "unregistered const is detected");
assert.deepEqual(missingKeys(new Set(["wwm_registered_const_v1__recovery_backup_v1"]), regressionRegistry, regressionExternal), [], "registered recovery backup passes");
assert.deepEqual(missingKeys(new Set(["h72na_data_token"]), regressionRegistry, regressionExternal), [], "external-origin exemption passes");
const discovered = new Map();
for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  for (const key of discoverStorageKeys(text)) {
    if (!discovered.has(key)) discovered.set(key, []);
    discovered.get(key).push(file.replaceAll("\\", "/"));
  }
}

// h72na_data_token is referenced only inside the generated WWM dashboard bookmarklet.
// It belongs to the external game dashboard origin, not WWM Calc storage.
const externalOriginKeys = new Set(["h72na_data_token"]);
const registryKeys = new Set(STORAGE_REGISTRY.map((item) => item.key));
const missing = missingKeys(discovered.keys(), registryKeys, externalOriginKeys);
assert.deepEqual(missing, [], `Unregistered storage keys: ${missing.map((key) => `${key} (${discovered.get(key).join(", ")})`).join("; ")}`);

for (const item of STORAGE_REGISTRY) {
  assert.ok(item.owner && item.schemaVersion != null && item.migration && item.fallback && item.size && item.corruption, `Incomplete registry metadata for ${item.key}`);
}

console.log(JSON.stringify({ success: true, registered: STORAGE_REGISTRY.length, discovered: [...discovered.keys()].sort(), externalOriginKeys: [...externalOriginKeys] }, null, 2));
