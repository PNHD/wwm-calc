import type { RotationItem } from "../types";

export interface RotationPreset {
  id: string;
  name: string;
  rotation: RotationItem[];
}

export function normalizePreset(value: unknown): RotationPreset | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<RotationPreset>;
  if (!Array.isArray(raw.rotation)) return null;
  const rotation = raw.rotation
    .filter((item): item is RotationItem => !!item && typeof item.name === "string" && Number.isFinite(Number(item.count)))
    .map((item) => ({ ...item, count: Math.max(0, Number(item.count)) }));
  const name = String(raw.name ?? "").trim();
  return name ? { id: String(raw.id ?? crypto.randomUUID()), name, rotation } : null;
}

export function duplicatePreset(preset: RotationPreset, name: string): RotationPreset {
  return { id: crypto.randomUUID(), name: name.trim() || `${preset.name} copy`, rotation: preset.rotation.map((item) => ({ ...item })) };
}
