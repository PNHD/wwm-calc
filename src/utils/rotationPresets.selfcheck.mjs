import assert from "node:assert";
const normalizePreset = (value) => {
  if (!value || typeof value !== "object" || !Array.isArray(value.rotation)) return null;
  const rotation = value.rotation.filter((item) => item && typeof item.name === "string" && Number.isFinite(Number(item.count))).map((item) => ({ ...item, count: Math.max(0, Number(item.count)) }));
  const name = String(value.name ?? "").trim();
  return name ? { id: String(value.id ?? "generated"), name, rotation } : null;
};
const duplicatePreset = (preset, name) => ({ id: "copy", name: name.trim() || `${preset.name} copy`, rotation: preset.rotation.map((item) => ({ ...item })) });

const base = { id: "base", name: "Reference", rotation: [{ name: "Q", count: 1 }] };
const copy = duplicatePreset(base, "Copy");
assert.notStrictEqual(copy.id, base.id, "duplicate must receive a new id");
assert.equal(copy.name, "Copy");
assert.deepEqual(copy.rotation, base.rotation);
assert.notStrictEqual(copy.rotation, base.rotation, "duplicate must not share the rotation array");

const clean = normalizePreset({ id: 1, name: "  Custom  ", rotation: [{ name: "Q", count: -3 }, { name: 2, count: 1 }] });
assert.deepEqual(clean, { id: "1", name: "Custom", rotation: [{ name: "Q", count: 0 }] });
console.log("rotation preset self-check OK");
