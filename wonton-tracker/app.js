import {
  HARD_PITY, activeLockCount, beadsForStones, clone, costForLocks, escapeHtml,
  nextInactiveSlot, normalizeSlots
} from './core/common.js';
import {
  createLiveState, normalizeLiveState, observedStats, recordActualReforge,
  recordActualResult, undoLive
} from './core/live.js';
import {
  createPracticeState, normalizePracticeState, reforge, restartPractice, runBatch,
  undoPractice
} from './core/practice.js';
import { applyPlan, deletePlan, renamePlan, savePlan, targetMatch } from './core/plans.js';
import { budgetSummary, PACKAGE_REFERENCE, REGIONS } from './core/pricing.js';
import { exportBackup, exportText, importBackup, migrateStorage, persistState } from './core/storage.js';
import { APPEARANCES, WEAPONS, WEAPON_DATA_VERSION, WEAPON_PROFILES, appearancesFor, setsForWeapon } from './data/weapons.v1.js';

const $ = selector => document.querySelector(selector);
const migration = migrateStorage(localStorage);
let liveState = migration.live;
let practiceState = migration.practice;
let mode = new URLSearchParams(location.search).get('mode') === 'practice' ? 'practice' : 'live';
let lastBatch = null;

const current = () => mode === 'practice' ? practiceState : liveState;
function setCurrent(state) {
  if (mode === 'practice') practiceState = persistState(localStorage, mode, state);
  else liveState = persistState(localStorage, mode, state);
}

function announce(message) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(announce.timer);
  announce.timer = setTimeout(() => { toast.hidden = true; }, 2400);
}

function option(value, label, selected) {
  return `<option value="${escapeHtml(value)}"${value === selected ? ' selected' : ''}>${escapeHtml(label)}</option>`;
}

function appearanceOptions(slotId, selected, weapon = '') {
  const values = [...new Set(['blue', 'purple', 'gold'].flatMap(quality => appearancesFor(slotId, quality, weapon)))];
  if (selected && !values.includes(selected)) values.push(selected);
  return values.map(value => option(value, value, value === selected ? selected : '')).join('');
}

function qualityLabel(value) { return value ? value[0].toUpperCase() + value.slice(1) : ''; }

function slotCard(slot) {
  const next = nextInactiveSlot(current());
  const unlocking = !slot.active && next?.id === slot.id;
  const fixed = slot.id === 5;
  const percent = slot.active ? (fixed ? 100 : slot.pity / HARD_PITY * 100) : (unlocking ? slot.progress : 0);
  const status = slot.active ? 'Active' : unlocking ? 'Unlocking' : 'Waiting';
  const quality = slot.active ? qualityLabel(slot.quality) : unlocking ? `${Math.round(slot.progress)}% progress` : 'Inactive';
  const attribute = slot.active ? escapeHtml(slot.attribute) : unlocking ? `Attempt ${slot.activationAttempts}/30` : `Unlock Slot ${slot.id - 1} first`;
  const meterLabel = slot.active ? (fixed ? 'Fixed Gold' : 'Visible pity') : 'Unlock progress';
  const meterValue = slot.active ? (fixed ? '—' : `${slot.pity}/90`) : (unlocking ? `${Math.round(slot.progress)}%` : 'Not started');
  return `<article class="slot ${slot.active ? slot.quality : 'inactive'}" data-slot="${slot.id}">
    <div class="slot-top"><span class="slot-number">Slot ${slot.id}</span><span class="status-pill">${status}</span></div>
    <div class="quality">${quality}</div><div class="attribute">${attribute}</div>
    <div class="pity-head"><span>${meterLabel}</span><strong>${meterValue}</strong></div><div class="meter"><i style="width:${percent}%"></i></div>
    <div class="slot-meta">${fixed ? `Gold · ${escapeHtml(slot.attribute)} when active` : slot.active ? `${Math.round(slot.pity / HARD_PITY * 100)}% to hard pity` : 'No pity while inactive'}</div>
    ${fixed ? '' : `<label class="checkline"><input type="checkbox" name="lock-${slot.id}" data-lock="${slot.id}" ${slot.locked ? 'checked' : ''} ${slot.active ? '' : 'disabled'}><span>Lock slot</span></label>`}
  </article>`;
}

function renderSlots() {
  $('#slots').innerHTML = current().slots.map(slotCard).join('');
  document.querySelectorAll('[data-lock]').forEach(input => input.addEventListener('change', () => {
    const state = clone(current());
    const slot = state.slots[Number(input.dataset.lock) - 1];
    if (!slot?.active) return;
    if (input.checked && !slot.locked && activeLockCount(state) >= 3) {
      input.checked = false;
      announce('At most three active slots can be locked.');
      return;
    }
    slot.locked = input.checked;
    setCurrent(mode === 'practice' ? normalizePracticeState(state) : normalizeLiveState(state));
    render();
  }));
}

function renderAction() {
  const state = current();
  const locks = activeLockCount(state);
  const cost = costForLocks(locks);
  const next = nextInactiveSlot(state);
  $('#action-eyebrow').textContent = mode === 'live' ? 'REAL SESSION LEDGER' : 'RNG SIMULATOR';
  $('#action-title').textContent = mode === 'live' ? 'Record actual reforge' : 'Simulate reforge';
  $('#action-note').textContent = mode === 'live'
    ? (state.pendingResult ? 'Finish recording the last observed result before adding another reforge.' : `Counters only; appearance never changes unless you record it. ${next ? `Slot ${next.id} progress advances.` : 'All slots active.'}`)
    : `${state.mode === 'official' ? 'Official 82% / 15% / 3%' : 'Community 3% / 4% / 5% Gold tiers'} · seed ${state.seed}`;
  $('#primary-btn').textContent = mode === 'live'
    ? (state.pendingResult ? 'Record pending result' : `Record · ${cost} Stone${cost === 1 ? '' : 's'}`)
    : `Reforge · ${cost} Stone${cost === 1 ? '' : 's'}`;
  $('#undo-btn').disabled = !state.undoStack.length;
  $('#mode-subtitle').textContent = mode === 'live'
    ? 'A deterministic ledger for real, user-observed in-game events. No outcome RNG.'
    : 'Generates seeded practice outcomes and batch estimates. It never changes Real Tracker data.';
}

function renderMetrics() {
  const state = current();
  const budget = budgetSummary(state);
  $('#metrics').innerHTML = `
    <article class="metric"><span>Taiyi Stones used</span><strong>${state.totalStones.toLocaleString()}</strong><small>authoritative resource count</small></article>
    <article class="metric"><span>Echo Beads equivalent</span><strong>${beadsForStones(state.totalStones).toLocaleString()}</strong><small>200 beads per Stone</small></article>
    <article class="metric"><span>${mode === 'live' ? 'Actual reforges' : 'Practice reforges'}</span><strong>${state.reforgeCount.toLocaleString()}</strong><small>${mode === 'live' ? 'user recorded' : 'seeded simulation'}</small></article>
    <article class="metric"><span>Current roll cost</span><strong>${budget.nextStones} Stone${budget.nextStones === 1 ? '' : 's'}</strong><small>${budget.nextBeads.toLocaleString()} Echo Beads</small></article>`;
}

function renderTargets() {
  const state = current();
  const target = state.target;
  const weapon = target.weapon || '';
  const colorValues = weapon
    ? [...new Set(['blue', 'purple', 'gold'].flatMap(quality => appearancesFor(1, quality, weapon)))]
    : [...new Set(Object.values(APPEARANCES[1]).flat())];
  const partValues = weapon
    ? [...new Set(['blue', 'purple', 'gold'].flatMap(quality => setsForWeapon(weapon, quality)))]
    : ['Set 1', 'Set 2'];
  const fields = [
    ['weapon', 'Weapon', WEAPONS],
    ['color', 'Color target', colorValues],
    ['part1', 'Part 1 target', partValues],
    ['part2', 'Part 2 target', partValues],
    ['part3', 'Part 3 target', partValues]
  ];
  $('#target-fields').innerHTML = fields.map(([key, label, values]) => `<label class="field"><span>${label}</span><select name="target-${key}" data-target="${key}">${option('', 'Any / not set', target[key])}${values.map(value => option(value, value, target[key])).join('')}</select></label>`).join('');
  $('#target-summary').textContent = targetMatch(state.slots, target).label;
  document.querySelectorAll('[data-target]').forEach(select => select.addEventListener('change', () => {
    const next = clone(current());
    if (select.dataset.target === 'weapon' && next.target.weapon !== select.value) {
      next.target = { weapon: select.value, color: '', part1: '', part2: '', part3: '' };
    } else {
      next.target[select.dataset.target] = select.value;
    }
    setCurrent(next); render();
  }));
}
function renderPlans() {
  const state = current();
  $('#plan-count').textContent = `${state.plans.length}/5`;
  $('#save-plan-btn').disabled = state.plans.length >= 5;
  if (!state.plans.length) { $('#plans').innerHTML = '<div class="empty">No saved plans in this mode.</div>'; return; }
  $('#plans').innerHTML = state.plans.map(plan => {
    const match = targetMatch(plan.slots, state.target);
    return `<article class="plan"><div class="plan-head"><div><strong>${escapeHtml(plan.name)}</strong><div class="help">${escapeHtml(match.label)}</div></div></div>
      <div class="plan-slots">${plan.slots.map(slot => `<div class="mini-slot ${slot.active ? slot.quality : 'inactive'}"><strong>S${slot.id} · ${slot.active ? qualityLabel(slot.quality) : 'Inactive'}</strong><span>${slot.active ? escapeHtml(slot.attribute) : '—'}</span></div>`).join('')}</div>
      <div class="plan-actions"><button class="btn ghost small" data-plan-action="rename" data-plan="${plan.id}">Rename</button><button class="btn ghost small" data-plan-action="restore" data-plan="${plan.id}">Restore Snapshot</button><button class="btn danger small" data-plan-action="delete" data-plan="${plan.id}">Delete</button></div></article>`;
  }).join('');
  document.querySelectorAll('[data-plan-action]').forEach(button => button.addEventListener('click', () => handlePlanAction(button.dataset.planAction, Number(button.dataset.plan))));
}

function handlePlanAction(action, id) {
  let result;
  if (action === 'rename') {
    const plan = current().plans.find(item => item.id === id);
    const name = prompt('Plan name', plan?.name || '');
    if (name === null) return;
    result = renamePlan(current(), id, name);
  } else if (action === 'restore') {
    const plan = current().plans.find(item => item.id === id);
    const ok = confirm(
      `Restore "${plan?.name || 'this snapshot'}"?\n\n` +
      'This is a checkpoint restore, not a merge. Saved active slots replace the current appearance in those slots, even if a slot is locked. ' +
      'The lock itself, visible pity, unlock progress and spend stay unchanged. Saved inactive slots leave the current slot untouched.'
    );
    if (!ok) return;
    result = applyPlan(current(), id);
    if (result.applied) announce('Snapshot restored. Appearance changed; locks, pity, progress and spend were preserved.');
  } else {
    if (!confirm('Delete this saved plan?')) return;
    result = deletePlan(current(), id);
  }
  setCurrent(result.state); render();
}

function renderLiveTools() {
  const state = liveState;
  const cost = costForLocks(activeLockCount(state));
  $('#mode-tools').innerHTML = `<div class="section-head"><div><p class="eyebrow observed">USER-OBSERVED · LIVE ONLY</p><h2>Observed pity analytics</h2></div><span class="status-pill">Official hard pity: 90</span></div>
    <div class="analytics-grid">${state.slots.slice(0, 4).map(slot => {
      const stats = observedStats(state.observedGoldIntervals[slot.id]);
      const remaining = 90 - slot.pity;
      const worstCaseStones = remaining * cost;
      return `<article class="analytics-card"><span>Slot ${slot.id}</span><strong>${slot.pity}/90 · ${Math.round(slot.pity / 90 * 100)}%</strong><small>${stats.count ? `Avg ${stats.average} · Median ${stats.median} · n=${stats.count}` : 'No observed Gold samples'}</small><p class="help">${remaining} visible pity to next hard pity · ${cost} Stone${cost === 1 ? '' : 's'} per future roll · worst-case at current locks: ${worstCaseStones} Stones / ${beadsForStones(worstCaseStones).toLocaleString()} beads</p></article>`;
    }).join('')}</div><p class="help">Intervals are USER-OBSERVED, not official soft pity. Worst-case values assume the current lock count stays unchanged and only bound the next hard-pity trigger; they do not guarantee a desired appearance or set.</p>`;
}

function renderPracticeTools() {
  const state = practiceState;
  $('#mode-tools').innerHTML = `<div class="section-head"><div><p class="eyebrow">PRACTICE CONTROLS</p><h2>Seed, model, goals &amp; batch</h2></div><span class="status-pill ${state.mode === 'official' ? 'official' : 'community'}">${state.mode === 'official' ? 'Official quality model' : 'Community / Unofficial model'}</span></div>
    <div class="form-grid five">
      <label class="field"><span>Seed</span><input id="practice-seed" name="practice-seed" value="${escapeHtml(state.seed)}"></label>
      <label class="field"><span>Quality model</span><select id="practice-model" name="practice-model">${option('official', 'Official 82 / 15 / 3', state.mode)}${option('community', 'Community 3 / 4 / 5 Gold', state.mode)}</select></label>
      <label class="field"><span>Goal</span><select id="batch-goal" name="batch-goal">${[['gold-2','2 Gold'],['gold-3','3 Gold'],['gold-4','4 Gold'],['set-2','2 matching Gold sets'],['set-3','3 matching Gold sets']].map(([v,l]) => option(v,l,state.goals.goal)).join('')}</select></label>
      <label class="field"><span>Batch runs</span><select id="batch-runs" name="batch-runs">${[100,1000,10000].map(value => option(String(value), value.toLocaleString(), String(value) === String(state.goals.runs || 100) ? String(value) : '')).join('')}</select></label>
      <label class="field"><span>Batch strategy</span><select id="batch-strategy" name="batch-strategy">${option('lock-gold', 'Unlock all, then auto-lock useful Gold', state.goals.strategy)}${option('no-lock', 'Never auto-lock', state.goals.strategy)}</select></label>
      <label class="field"><span>Max reforges/run</span><input id="batch-max" name="batch-max" type="number" min="1" max="5000" value="${state.goals.maxReforges}"></label>
    </div><div class="button-row"><button class="btn secondary" id="apply-seed-btn">Apply seed &amp; restart</button><button class="btn primary" id="batch-btn">Run deterministic batch</button></div>
    <p class="help"><span class="official">Official:</span> Blue 82%, Purple 15%, Gold 3%, hard pity 90. <span class="community">Community/Unofficial:</span> Gold soft tiers and 2% / 3.5% / 5% early unlock. Practice only.</p><div id="batch-result"></div>`;
  if (lastBatch) $('#batch-result').innerHTML = `<div class="batch-grid"><div><span>Success</span><strong>${lastBatch.successes}/${lastBatch.runs}</strong></div><div><span>Rate</span><strong>${(lastBatch.successRate * 100).toFixed(1)}%</strong></div><div><span>Average cost</span><strong>${lastBatch.averageStones} Stones</strong></div><div><span>P90 cost</span><strong>${lastBatch.p90Stones} Stones</strong></div></div>`;
  $('#apply-seed-btn').addEventListener('click', () => {
    const next = createPracticeState({ seed: $('#practice-seed').value.trim() || 'practice-1', mode: $('#practice-model').value });
    next.plans = clone(state.plans); next.target = clone(state.target); next.budget = clone(state.budget);
    setCurrent(next); lastBatch = null; render(); announce('Seed applied; Practice restarted.');
  });
  $('#batch-btn').addEventListener('click', () => {
    const next = clone(practiceState);
    next.goals.goal = $('#batch-goal').value; next.goals.runs = Number($('#batch-runs').value); next.goals.strategy = $('#batch-strategy').value; next.goals.maxReforges = Number($('#batch-max').value);
    setCurrent(next);
    lastBatch = runBatch(practiceState, { runs: next.goals.runs, goal: next.goals.goal, strategy: next.goals.strategy, maxReforges: next.goals.maxReforges });
    render();
  });
}

function renderHistory() {
  const state = current();
  if (!state.history.length) { $('#history').innerHTML = '<div class="empty">No activity yet.</div>'; return; }
  $('#history').innerHTML = state.history.slice(0, 80).map(event => {
    const text = mode === 'live' ? event.text : `Roll #${event.roll}: ${event.changes?.length || 0} slot${event.changes?.length === 1 ? '' : 's'} changed${event.activation?.activated ? `; Slot ${event.activation.slot} unlocked` : ''}`;
    const gold = mode === 'live' ? event.type === 'gold' : event.hasGold;
    return `<div class="history-item ${gold ? 'gold' : ''}"><div class="history-head"><strong>${escapeHtml(text)}</strong><span>${event.cost || 0} Stone${event.cost === 1 ? '' : 's'}</span></div><div class="help">${escapeHtml(event.at || '')}</div></div>`;
  }).join('');
}

function renderBudget() {
  const state = current();
  const summary = budgetSummary(state);
  const regionalValue = summary.approximateRegional === null
    ? '≈ ' + String.fromCharCode(36) + summary.approximateUsd.toFixed(2) + ' USD'
    : '≈ ' + summary.referenceCurrency + ' ' + summary.approximateRegional.toLocaleString(undefined, { maximumFractionDigits: 2 });
  const packageNote = summary.referenceRegion
    ? `7,200 Echo Beads = ${summary.referenceCurrency} ${summary.referencePrice.toLocaleString()} (${summary.referenceRegion})`
    : `${PACKAGE_REFERENCE.label}; no regional package reference is stored for Other / custom`;
  $('#budget-content').innerHTML = `<div class="form-grid"><label class="field"><span>Region</span><select name="budget-region" data-budget="region">${REGIONS.map(value => option(value, value, state.budget.region)).join('')}</select></label><label class="field"><span>Starting Echo Beads</span><input name="budget-starting-beads" data-budget="startingBeads" type="number" min="0" value="${state.budget.startingBeads}"></label><label class="field"><span>Starting Taiyi Stones</span><input name="budget-starting-stones" data-budget="startingStones" type="number" min="0" value="${state.budget.startingStones}"></label><label class="field"><span>Base weapon / pull spend (beads)</span><input name="budget-base-weapon" data-budget="baseWeaponBeads" type="number" min="0" value="${state.budget.baseWeaponBeads}"></label></div>
    <div class="budget-grid"><div><span>Stones used</span><strong>${summary.stonesUsed.toLocaleString()}</strong></div><div><span>Echo Beads spent</span><strong>${summary.spentBeads.toLocaleString()}</strong></div><div><span>Approx. regional reference</span><strong>${regionalValue}</strong></div><div><span>Remaining balance</span><strong>${summary.remainingBeads.toLocaleString()} beads</strong></div></div>
    <p class="help">${packageNote}. Currency is an estimate only; resource arithmetic is authoritative. Current roll: ${summary.nextStones} Stone${summary.nextStones === 1 ? '' : 's'} = ${summary.nextBeads} beads.</p>`;
  document.querySelectorAll('[data-budget]').forEach(input => input.addEventListener('change', () => {
    const next = clone(current());
    next.budget[input.dataset.budget] = input.dataset.budget === 'region' ? input.value : Math.max(0, Number(input.value) || 0);
    setCurrent(next); render();
  }));
}

function renderReferences() {
  $('#attribute-guide').innerHTML = `<p class="help">Dataset ${WEAPON_DATA_VERSION}. Names come from accepted project data; missing weapon-specific mappings are not invented.</p><div class="attribute-columns">${['blue','purple','gold'].map(quality => `<div><strong>${qualityLabel(quality)}</strong><p>${APPEARANCES[1][quality].map(escapeHtml).join(' · ')}</p></div>`).join('')}</div>`;
  $('#assumptions').innerHTML = `<ul class="rules"><li><span class="official">Official:</span> 5 nodes; Blue 82%, Purple 15%, Gold 3%; Gold hard pity 90.</li><li><span class="community">Community/Unofficial:</span> 3% / 4% / 5% soft-rate tiers and 2% / 3.5% / 5% early unlock probabilities. Used only in Practice.</li><li><span class="observed">USER-OBSERVED:</span> Live Gold intervals, averages, and medians.</li><li>Live mode never infers server pity or generates outcomes.</li></ul>`;
}

function render() {
  document.querySelectorAll('[data-mode]').forEach(button => button.classList.toggle('active', button.dataset.mode === mode));
  renderSlots(); renderAction(); renderMetrics(); renderTargets(); renderPlans();
  mode === 'live' ? renderLiveTools() : renderPracticeTools();
  renderHistory(); renderBudget(); renderReferences();
}

function showLiveResult() {
  const state = liveState;
  $('#result-fields').innerHTML = state.slots.filter(slot => slot.active && slot.id < 5).map(slot => `<fieldset class="edit-card" data-result-slot="${slot.id}"><legend>Slot ${slot.id}</legend><label class="checkline"><input type="checkbox" name="result-gold-${slot.id}" data-gold="${slot.id}"> Gold observed</label><div class="form-grid"><label class="field"><span>Actual quality</span><select name="result-quality-${slot.id}" data-result-quality="${slot.id}">${['blue','purple','gold'].map(value => option(value, qualityLabel(value), slot.quality)).join('')}</select></label><label class="field"><span>Actual appearance</span><select name="result-attribute-${slot.id}" data-result-attribute="${slot.id}">${appearancesFor(slot.id, slot.quality).map(value => option(value, value, slot.attribute)).join('')}</select></label></div></fieldset>`).join('');
  $('#early-unlock-row').hidden = !nextInactiveSlot(state) || !!state.pendingResult?.activatedSlot;
  $('#early-unlock').checked = false;
  document.querySelectorAll('[data-result-quality]').forEach(select => select.addEventListener('change', () => {
    const attr = document.querySelector(`[data-result-attribute="${select.dataset.resultQuality}"]`);
    attr.innerHTML = appearancesFor(Number(select.dataset.resultQuality), select.value).map(value => option(value, value, '')).join('');
  }));
  document.querySelectorAll('[data-gold]').forEach(input => input.addEventListener('change', () => {
    if (!input.checked) return;
    const quality = document.querySelector(`[data-result-quality="${input.dataset.gold}"]`);
    quality.value = 'gold'; quality.dispatchEvent(new Event('change'));
  }));
  $('#result-dialog').showModal();
}

function showEdit() {
  const state = current();
  $('#edit-fields').innerHTML = state.slots.map(slot => `<fieldset class="edit-card" data-edit-slot="${slot.id}"><legend>Slot ${slot.id}</legend><label class="checkline"><input type="checkbox" name="edit-active-${slot.id}" data-edit="active" ${slot.active ? 'checked' : ''} ${slot.id === 1 ? 'disabled' : ''}> Active</label>${slot.id === 5 ? '<p class="help">Fixed Gold · Sunlight when active.</p>' : `<div class="form-grid"><label class="field"><span>Quality</span><select name="edit-quality-${slot.id}" data-edit="quality">${['blue','purple','gold'].map(value => option(value,qualityLabel(value),slot.quality)).join('')}</select></label><label class="field"><span>Appearance</span><select name="edit-attribute-${slot.id}" data-edit="attribute">${appearanceOptions(slot.id,slot.attribute)}</select></label><label class="field"><span>Pity</span><input name="edit-pity-${slot.id}" data-edit="pity" type="number" min="0" max="90" value="${slot.pity}"></label><label class="field"><span>Unlock progress %</span><input name="edit-progress-${slot.id}" data-edit="progress" type="number" min="0" max="100" step="0.01" value="${slot.progress}"></label></div><label class="checkline"><input name="edit-locked-${slot.id}" data-edit="locked" type="checkbox" ${slot.locked ? 'checked' : ''}> Locked</label>`}</fieldset>`).join('');
  $('#edit-dialog').showModal();
}

function saveEdit() {
  const next = clone(current());
  document.querySelectorAll('[data-edit-slot]').forEach(card => {
    const id = Number(card.dataset.editSlot); const slot = next.slots[id - 1];
    slot.active = id === 1 || card.querySelector('[data-edit="active"]').checked;
    if (id < 5) {
      slot.quality = card.querySelector('[data-edit="quality"]').value;
      slot.attribute = card.querySelector('[data-edit="attribute"]').value;
      slot.pity = Number(card.querySelector('[data-edit="pity"]').value);
      slot.progress = Number(card.querySelector('[data-edit="progress"]').value);
      slot.locked = card.querySelector('[data-edit="locked"]').checked;
    }
  });
  next.slots = normalizeSlots(next.slots);
  if (mode === 'practice') next.baselineSlots = clone(next.slots);
  setCurrent(mode === 'practice' ? normalizePracticeState(next) : normalizeLiveState(next));
  $('#edit-dialog').close();
  render(); announce('State correction saved.');
}

function download(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
  mode = button.dataset.mode; history.replaceState(null, '', mode === 'practice' ? '?mode=practice' : './'); render();
}));

$('#primary-btn').addEventListener('click', () => {
  if (mode === 'live') {
    if (liveState.pendingResult) return showLiveResult();
    const result = recordActualReforge(liveState); setCurrent(result.state); render(); showLiveResult();
  } else {
    const result = reforge(practiceState); setCurrent(result.state); render();
    if (result.event.hasGold) { $('#gold-message').textContent = `Gold on Slot${result.event.goldSlots.length > 1 ? 's' : ''} ${result.event.goldSlots.join(', ')}.`; $('#gold-dialog').showModal(); }
  }
});

$('#undo-btn').addEventListener('click', () => { const result = mode === 'live' ? undoLive(liveState) : undoPractice(practiceState); setCurrent(result.state); render(); if (result.undone) announce('Last reforge undone.'); });
$('#edit-btn').addEventListener('click', showEdit);
$('#edit-form').addEventListener('submit', event => { event.preventDefault(); saveEdit(); });
document.querySelectorAll('[data-close-edit]').forEach(button => button.addEventListener('click', () => $('#edit-dialog').close()));
$('#save-result-btn').addEventListener('click', () => {
  const goldSlots = [...document.querySelectorAll('[data-gold]:checked')].map(input => Number(input.dataset.gold));
  const changes = [...document.querySelectorAll('[data-result-slot]')].map(card => ({ slotId: Number(card.dataset.resultSlot), quality: card.querySelector('[data-result-quality]').value, attribute: card.querySelector('[data-result-attribute]').value }));
  const result = recordActualResult(liveState, { goldSlots, changes, unlockEarly: $('#early-unlock').checked });
  setCurrent(result.state); render(); announce('Actual result recorded.');
});

$('#save-plan-btn').addEventListener('click', () => { const name = prompt('Plan name', `Plan ${current().plans.length + 1}`); if (name === null) return; const result = savePlan(current(), name); setCurrent(result.state); render(); announce(result.saved ? 'Plan saved.' : 'Plan limit is five.'); });
$('#gold-save-btn').addEventListener('click', () => { const result = savePlan(practiceState); setCurrent(result.state); render(); announce(result.saved ? 'Practice plan saved.' : 'Plan limit is five.'); });
$('#gold-dialog').addEventListener('close', () => { if (practiceState.pendingGold) { const next = clone(practiceState); next.pendingGold = null; setCurrent(next); } });

$('#reset-btn').addEventListener('click', () => {
  if (!confirm(mode === 'live' ? 'Reset the Live session? Saved plans, target, and budget settings will remain.' : 'Restart Practice from its baseline and seed?')) return;
  if (mode === 'live') { const next = createLiveState(); next.plans = clone(liveState.plans); next.target = clone(liveState.target); next.budget = clone(liveState.budget); setCurrent(next); }
  else setCurrent(restartPractice(practiceState).state);
  lastBatch = null; render();
});

$('#clear-history-btn').addEventListener('click', () => { const next = clone(current()); next.history = []; setCurrent(next); render(); });
$('#export-json-btn').addEventListener('click', () => download(`wonton-reforge-lab-${mode}.json`, exportBackup(mode, current()), 'application/json'));
$('#export-txt-btn').addEventListener('click', () => download(`wonton-reforge-lab-${mode}.txt`, exportText(mode, current()), 'text/plain'));
$('#import-json-btn').addEventListener('click', async () => {
  const file = $('#import-file').files[0];
  if (!file) { $('#import-status').textContent = 'Choose a JSON backup first.'; return; }
  try { setCurrent(importBackup(await file.text(), mode)); $('#import-status').textContent = 'Backup imported safely.'; render(); }
  catch (error) { $('#import-status').textContent = error.message; }
});

if (migration.report.live === 'migrated' || ['migrated', 'repaired'].includes(migration.report.practice)) {
  $('#migration-note').hidden = false;
  $('#migration-note').textContent = migration.report.practice === 'repaired'
    ? 'Simulator state was reset to the corrected sequential Slot 1 start. Saved plans, targets, budget, seed and batch preferences were preserved.'
    : `Existing data migrated: Live ${migration.report.live}; Simulator ${migration.report.practice}. Legacy keys were retained.`;
}
if (migration.report.errors.length) {
  $('#migration-note').hidden = false;
  $('#migration-note').textContent = `Legacy data was left untouched because it could not be migrated safely: ${migration.report.errors.join(' ')}`;
}

render();
