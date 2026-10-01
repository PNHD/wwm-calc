// Explicit authoring contract. Coefficients, timings and effect reach require
// separate evidence; this engine never guesses them from aggregate frequencies.
export interface QiWindow { startSec: number; durationSec: number; lowQiLeadSec: number }
export interface OrderedAction {
  skillId: string;
  at: number;
  castTime: number;
  cancelAt?: number;
  prePull?: boolean;
  hitOffsets: number[];
  dot?: { applyOffset: number; firstOffset: number; interval: number; ticks: number };
  grants?: { id: string; stacks: number; maxStacks: number; duration: number }[];
  resourceDelta?: Record<string, number>;
}
export interface OrderedRotation {
  schemaVersion: 1;
  mode: "ordered";
  buildKey: string;
  fixedWindowSec: 30 | 60;
  openingResources: Record<string, number>;
  qiWindows: QiWindow[];
  actions: OrderedAction[];
}
export interface OrderedEvent {
  skillId: string;
  at: number;
  kind: "hit" | "dot";
  actionIndex: number;
}
export interface EventState {
  buffs: Record<string, number>;
  resources: Record<string, number>;
  qiPhase: "normal" | "low" | "broken";
}

export function simulateOrdered(rotation: OrderedRotation, supportedIds: ReadonlySet<string>, price: (event: OrderedEvent, state: EventState) => number) {
  const finite = (value: number) => Number.isFinite(value) && Math.abs(value) <= 10000;
  if (rotation.schemaVersion !== 1 || rotation.mode !== "ordered" || ![30, 60].includes(rotation.fixedWindowSec) || !Array.isArray(rotation.actions) || rotation.actions.length > 1000 || !Array.isArray(rotation.qiWindows) || rotation.qiWindows.length > 100 || Object.values(rotation.openingResources).some(v => !finite(v))) throw new Error("Invalid ordered rotation");
  const unsupported = [...new Set(rotation.actions.map(a => a.skillId).filter(id => !supportedIds.has(id)))];
  if (unsupported.length) throw new Error(`Unsupported skill IDs: ${unsupported.join(", ")}`);
  for (const q of rotation.qiWindows) if (![q.startSec, q.durationSec, q.lowQiLeadSec].every(v => finite(v) && v >= 0)) throw new Error("Invalid Qi window");
  const queue: { at: number; actionIndex: number; order: number; event?: OrderedEvent }[] = [];
  let order = 0;
  rotation.actions.forEach((a, actionIndex) => {
    if (!finite(a.at) || !finite(a.castTime) || a.castTime < 0 || !Array.isArray(a.hitOffsets) || a.hitOffsets.length > 1000 || a.hitOffsets.some(v => !finite(v) || v < 0) || (a.cancelAt !== undefined && (!finite(a.cancelAt) || a.cancelAt < 0 || a.cancelAt > a.castTime)) || Object.values(a.resourceDelta ?? {}).some(v => !finite(v))) throw new Error("Invalid action timing/resources");
    for (const b of a.grants ?? []) if (!b.id || ![b.stacks, b.maxStacks, b.duration].every(v => finite(v) && v >= 0) || b.maxStacks < 1) throw new Error("Invalid buff grant");
    queue.push({ at: a.at, actionIndex, order: order++ });
    const emit = (offset: number, kind: "hit" | "dot") => queue.push({ at: a.at + offset, actionIndex, order: order++, event: { skillId: a.skillId, at: a.at + offset, kind, actionIndex } });
    a.hitOffsets.filter(offset => offset <= (a.cancelAt ?? a.castTime)).forEach(offset => emit(offset, "hit"));
    if (a.dot) {
      const d = a.dot;
      if (!finite(d.applyOffset) || d.applyOffset < 0 || !finite(d.firstOffset) || d.firstOffset < d.applyOffset || !finite(d.interval) || d.interval <= 0 || !Number.isInteger(d.ticks) || d.ticks < 0 || d.ticks > 1000) throw new Error("Invalid DoT cadence");
      // A cancelled application cannot spawn ticks. Established DoTs keep their
      // authored tail after the action list ends, until the encounter boundary.
      if (d.applyOffset <= (a.cancelAt ?? a.castTime)) for (let i = 0; i < d.ticks; i++) emit(d.firstOffset + d.interval * i, "dot");
    }
  });
  queue.sort((a, b) => a.at - b.at || a.order - b.order);
  const resources = { ...rotation.openingResources };
  const buffs = new Map<string, { stacks: number; expires: number }>();
  const events: (OrderedEvent & { damage: number; state: EventState })[] = [];
  for (const item of queue) {
    if (item.at >= rotation.fixedWindowSec) break;
    const action = rotation.actions[item.actionIndex];
    for (const [id, buff] of buffs) if (buff.expires <= item.at) buffs.delete(id);
    if (!item.event) {
      for (const [id, value] of Object.entries(action.resourceDelta ?? {})) resources[id] = (resources[id] ?? 0) + value;
      for (const b of action.grants ?? []) buffs.set(b.id, { stacks: Math.min(b.maxStacks, (buffs.get(b.id)?.stacks ?? 0) + b.stacks), expires: item.at + b.duration });
      continue;
    }
    if (item.at < 0 || action.prePull) continue;
    const broken = rotation.qiWindows.some(q => item.at >= q.startSec && item.at < q.startSec + q.durationSec);
    const low = rotation.qiWindows.some(q => item.at >= q.startSec - q.lowQiLeadSec && item.at < q.startSec);
    const state: EventState = { buffs: Object.fromEntries([...buffs].map(([id, b]) => [id, b.stacks])), resources: { ...resources }, qiPhase: broken ? "broken" : low ? "low" : "normal" };
    const damage = price(item.event, state);
    if (!Number.isFinite(damage) || damage < 0) throw new Error("Invalid priced event");
    events.push({ ...item.event, damage, state });
  }
  const total = events.reduce((sum, e) => sum + e.damage, 0);
  return { total, dps: total / rotation.fixedWindowSec, duration: rotation.fixedWindowSec, events, finalResources: resources };
}
