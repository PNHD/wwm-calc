import type { RotationItem } from "../types";
import { isPlainRecord } from "../product/storage-registry.js";

export interface RotationPreset {
  id: string;
  name: string;
  rotation: RotationItem[];
  schemaVersion?: 2;
  buildKey?: string;
  reference?: RotationReference;
}

export interface RotationReference {
  id: string; name: string; classId: string; buildKey: string;
  maturity: string; steps: { skillId: string }[]; permanentBuffIds: string[];
  openingStacks: Record<string, number>; fixedWindowSec: number;
  qiBreak: { startSec: number; durationSec: number; lowQiLeadSec: number };
  createdAt: string; updatedAt: string; description?: string;
  source: { repository: string; sha: string; path: string; license: string; anchor: string };
}

export function normalizeReference(value: unknown): RotationReference | null {
  const r = value as RotationReference;
  if (["__proto__", "prototype", "constructor"].includes(r?.buildKey)) return null;
  if (!isPlainRecord(r) || !isPlainRecord(r.openingStacks) || !isPlainRecord(r.qiBreak) || !isPlainRecord(r.source)) return null;
  if (!r || typeof r !== "object" || ![r.id, r.name, r.classId, r.buildKey, r.createdAt, r.updatedAt].every(v => typeof v === "string" && v.length > 0 && v.length < 300) || ![30, 60].includes(r.fixedWindowSec) || !Array.isArray(r.steps) || !r.steps.length || r.steps.length > 1000 || r.steps.some(s => !s || typeof s.skillId !== "string" || !s.skillId || s.skillId.length > 200) || !Array.isArray(r.permanentBuffIds) || r.permanentBuffIds.some(v => typeof v !== "string" || v.length > 200) || !r.openingStacks || Object.entries(r.openingStacks).some(([id, v]) => ["__proto__", "constructor", "prototype"].includes(id) || !Number.isFinite(v) || v < 0 || v > 1000) || !r.qiBreak || ![r.qiBreak.startSec, r.qiBreak.durationSec, r.qiBreak.lowQiLeadSec].every(v => Number.isFinite(v) && v >= 0 && v <= 120) || !r.source || ![r.source.repository, r.source.sha, r.source.path, r.source.license, r.source.anchor].every(v => typeof v === "string" && v.length > 0 && v.length < 1000)) return null;
  return { ...r, maturity: "REFERENCE_ONLY", steps: r.steps.map(s => ({ skillId: s.skillId })) };
}

export function normalizePreset(value: unknown): RotationPreset | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<RotationPreset>;
  if (["__proto__", "prototype", "constructor"].includes(raw.buildKey)) return null;
  if ((raw.schemaVersion !== undefined && raw.schemaVersion !== 2) || (raw.buildKey !== undefined && (typeof raw.buildKey !== "string" || raw.buildKey.length > 100)) || (raw.id !== undefined && (typeof raw.id !== "string" || raw.id.length > 200))) return null;
  if (!Array.isArray(raw.rotation)) return null;
  if (raw.rotation.length > 200 || raw.rotation.some(item => !item || typeof item.name !== "string" || !item.name.trim() || item.name.length > 200 || !Number.isFinite(item.count) || item.count < 0 || item.count > 5000 || [item.generalBonus ?? 0, item.yishui ?? 0, item.tiaozhan ?? 1].some(v => !Number.isFinite(v) || v < 0 || v > 100))) return null;
  const rotation = raw.rotation.map(item => ({ ...item, name: item.name, count: item.count, isDingyin: item.isDingyin === true, generalBonus: item.generalBonus ?? 0, yishui: item.yishui ?? 0, tiaozhan: item.tiaozhan ?? 1 }));
  const name = String(raw.name ?? "").trim();
  const reference = raw.reference && normalizeReference(raw.reference);
  if (raw.reference && !reference) return null;
  return name && name.length <= 200 ? { id: String(raw.id ?? crypto.randomUUID()), name, rotation, schemaVersion: 2, buildKey: raw.buildKey, ...(reference ? { reference } : {}) } : null;
}

export function duplicatePreset(preset: RotationPreset, name: string): RotationPreset {
  return { ...structuredClone(preset), id: crypto.randomUUID(), name: name.trim() || `${preset.name} copy` };
}
