(function () {
  'use strict';

  const Sim = window.WontonSimulator;
  if (!Sim) throw new Error('WontonSimulator core failed to load');

  const BASELINE_KEY = 'wontonSimulatorBaseline.v2';
  const ECHO_BEADS_PER_STONE = 200;
  const ECHO_BEADS_PER_100_USD = 7200;
  const beadsForStones = stones => stones * ECHO_BEADS_PER_STONE;
  const usdForStones = stones => beadsForStones(stones) / ECHO_BEADS_PER_100_USD * 100;
  const undoStack = [];
  let state = loadState();
  let baselineSlots = loadBaselineSlots(state.slots);

  const els = {
    slots: document.querySelector('#slots'),
    mode: document.querySelector('#mode'),
    seed: document.querySelector('#seed'),
    modeNote: document.querySelector('#mode-note'),
    goal: document.querySelector('#goal'),
    goalStatus: document.querySelector('#goal-status'),
    totalStones: document.querySelector('#total-stones'),
    totalValue: document.querySelector('#total-value'),
    reforgeCount: document.querySelector('#reforge-count'),
    goldCount: document.querySelector('#gold-count'),
    nextCost: document.querySelector('#next-cost'),
    nextValue: document.querySelector('#next-value'),
    reforgeButton: document.querySelector('#reforge-btn'),
    undoButton: document.querySelector('#undo-btn'),
    resetButton: document.querySelector('#reset-btn'),
    newSeedButton: document.querySelector('#new-seed-btn'),
    setupButton: document.querySelector('#setup-btn'),
    setupDialog: document.querySelector('#setup-dialog'),
    setupForm: document.querySelector('#setup-form'),
    setupSlots: document.querySelector('#setup-slots'),
    setupCancel: document.querySelector('#setup-cancel'),
    history: document.querySelector('#history'),
    clearHistory: document.querySelector('#clear-history'),
    batchRuns: document.querySelector('#batch-runs'),
    batchGoal: document.querySelector('#batch-goal'),
    batchStrategy: document.querySelector('#batch-strategy'),
    batchMax: document.querySelector('#batch-max'),
    batchButton: document.querySelector('#batch-run-btn'),
    batchResult: document.querySelector('#batch-result'),
    planCount: document.querySelector('#plan-count'),
    savePlanButton: document.querySelector('#save-plan-btn'),
    plans: document.querySelector('#plans')
  };

  function loadState() {
    try {
      const raw = localStorage.getItem(Sim.STORAGE_KEY);
      if (raw) return Sim.normalizeState(JSON.parse(raw));
    } catch (error) {
      console.warn('Ignoring invalid simulator state', error);
    }
    return Sim.createInitialState({ mode: 'official', seed: 'practice-1' });
  }

  function persist() {
    localStorage.setItem(Sim.STORAGE_KEY, JSON.stringify(state));
  }

  function loadBaselineSlots(fallback) {
    try {
      const raw = localStorage.getItem(BASELINE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length === 5) return parsed;
      }
    } catch (error) {
      console.warn('Ignoring invalid simulator baseline', error);
    }
    return JSON.parse(JSON.stringify(fallback));
  }

  function persistBaseline() {
    localStorage.setItem(BASELINE_KEY, JSON.stringify(baselineSlots));
  }

  function snapshot() {
    undoStack.push(JSON.stringify(state));
    if (undoStack.length > 30) undoStack.shift();
  }

  function restoreLast() {
    const raw = undoStack.pop();
    if (!raw) return;
    state = Sim.normalizeState(JSON.parse(raw));
    persist();
    render();
  }

  function activeLockedCount() {
    return state.slots.slice(0, 4).filter(slot => slot.active && slot.locked).length;
  }

  function qualityLabel(quality) {
    return quality[0].toUpperCase() + quality.slice(1);
  }

  function allowedAttributes(slotId, quality) {
    if (slotId === 5) return ['Sunlight'];
    const source = slotId === 1 ? Sim.ATTRIBUTES[1] : Sim.ATTRIBUTES[234];
    return source[quality] || ['Set 1'];
  }

  function slotCard(slot) {
    const fixed = slot.id === 5;
    const nextUnlock = Sim.nextUnlockSlotId(state);
    const isNextUnlock = !slot.active && slot.id === nextUnlock;
    const barValue = slot.active
      ? (fixed ? 100 : Math.min(100, (slot.pity / Sim.HARD_PITY) * 100))
      : (isNextUnlock ? slot.progress : 0);
    const status = slot.active ? 'Active' : (isNextUnlock ? 'Unlocking' : 'Waiting');
    const mainLabel = slot.active
      ? qualityLabel(slot.quality)
      : (isNextUnlock ? `Unlocking ${Math.round(slot.progress)}%` : 'Locked');
    const detail = slot.active
      ? escapeHtml(slot.attribute)
      : (isNextUnlock
          ? `Attempt ${slot.activationAttempts}/30 · can unlock early`
          : `Unlock Slot ${slot.id - 1} first`);
    const meterLabel = slot.active
      ? (fixed ? 'Fixed Gold' : 'Gold pity')
      : (isNextUnlock ? 'Unlock progress' : 'Gold pity');
    const meterValue = slot.active
      ? (fixed ? '—' : `${slot.pity}/90`)
      : (isNextUnlock ? `${Math.round(slot.progress)}%` : 'Not started');

    return `
      <article class="slot-card ${slot.active ? slot.quality : 'inactive'}" data-slot="${slot.id}">
        <div class="slot-topline">
          <span class="slot-number">Slot ${slot.id}</span>
          <span class="status-pill">${status}</span>
        </div>
        <div class="quality">${mainLabel}</div>
        <div class="attribute">${detail}</div>
        <div class="pity-row">
          <span>${meterLabel}</span>
          <strong>${meterValue}</strong>
        </div>
        <div class="pity-bar" aria-hidden="true"><i style="width:${barValue}%"></i></div>
        ${fixed
          ? '<div class="lock-note">Slot 5 becomes fixed Gold · Sunlight when unlocked.</div>'
          : `
          <label class="lock-control">
            <input type="checkbox" data-lock="${slot.id}" ${slot.locked ? 'checked' : ''} ${!slot.active ? 'disabled' : ''} />
            <span>Lock this slot</span>
          </label>
        `}
      </article>`;
  }

  function renderSlots() {
    els.slots.innerHTML = state.slots.map(slotCard).join('');
    els.slots.querySelectorAll('[data-lock]').forEach(input => {
      input.addEventListener('change', event => {
        const id = Number(event.currentTarget.dataset.lock);
        const slot = state.slots[id - 1];
        if (!slot || !slot.active) return;
        const currentlyLocked = activeLockedCount();
        if (event.currentTarget.checked && !slot.locked && currentlyLocked >= 3) {
          event.currentTarget.checked = false;
          announce('You can lock at most 3 reforgeable slots.');
          return;
        }
        snapshot();
        slot.locked = event.currentTarget.checked;
        state = Sim.normalizeState(state);
        persist();
        render();
      });
    });
  }

  function renderHistory() {
    if (!state.history.length) {
      els.history.innerHTML = '<div class="empty-state">No practice rolls yet.</div>';
      return;
    }
    els.history.innerHTML = state.history.slice(0, 30).map(event => {
      const changes = event.changes.length
        ? event.changes.map(change => `S${change.slot} ${qualityLabel(change.quality)} · ${escapeHtml(change.attribute)} · pity ${change.pity}`).join('<br>')
        : 'No active unlocked slot changed.';
      let activationText = '';
      if (event.activation && event.activation.slot) {
        activationText = event.activation.activated
          ? `<br><strong>Unlocked Slot ${event.activation.slot}</strong>${event.activation.direct ? ' early' : ' at full meter'}${event.activation.quality ? ` · ${qualityLabel(event.activation.quality)} ${escapeHtml(event.activation.attribute)}` : ''}`
          : `<br>Slot ${event.activation.slot} unlock: ${Math.round(event.activation.progress)}% (${event.activation.attempts}/30)`;
      }
      return `
        <div class="history-item">
          <div class="history-head"><strong>Roll #${event.roll}</strong><span>${event.cost} stone${event.cost === 1 ? '' : 's'}</span></div>
          <div>${changes}${activationText}</div>
        </div>`;
    }).join('');
  }

  function formatSavedAt(value) {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
  }

  function renderPlans() {
    els.planCount.textContent = `${state.plans.length}/${Sim.MAX_PLANS}`;
    els.savePlanButton.disabled = state.plans.length >= Sim.MAX_PLANS;

    if (!state.plans.length) {
      els.plans.innerHTML = '<div class="empty-state">No saved plans yet.</div>';
      return;
    }

    els.plans.innerHTML = [...state.plans].reverse().map(plan => `
      <article class="plan-card">
        <div class="plan-head">
          <div>
            <strong>${escapeHtml(plan.name)}</strong>
            <div class="plan-time">${escapeHtml(formatSavedAt(plan.savedAt))}</div>
          </div>
        </div>
        <div class="plan-slots">
          ${plan.slots.map(slot => `
            <div class="mini-slot ${slot.active ? slot.quality : 'inactive'}">
              <strong>S${slot.id}</strong>
              <span>${slot.active ? qualityLabel(slot.quality) : 'Locked'}</span>
              <small>${slot.active ? escapeHtml(slot.attribute) : '—'}</small>
            </div>`).join('')}
        </div>
        <div class="plan-actions">
          <button class="btn ghost small" type="button" data-apply-plan="${plan.id}">Apply appearance</button>
          <button class="btn danger small" type="button" data-delete-plan="${plan.id}">Delete</button>
        </div>
      </article>
    `).join('');

    els.plans.querySelectorAll('[data-apply-plan]').forEach(button => {
      button.addEventListener('click', () => {
        const id = Number(button.dataset.applyPlan);
        if (!window.confirm('Apply this saved appearance? Current pity, unlock progress, locks, seed and stone spend will be preserved.')) return;
        snapshot();
        const result = Sim.applyPlan(state, id);
        state = result.state;
        persist();
        render();
        if (result.applied) announce(`Applied ${result.plan.name}. Progress and pity were preserved.`);
      });
    });

    els.plans.querySelectorAll('[data-delete-plan]').forEach(button => {
      button.addEventListener('click', () => {
        const id = Number(button.dataset.deletePlan);
        if (!window.confirm('Delete this saved plan?')) return;
        const result = Sim.deletePlan(state, id);
        state = result.state;
        persist();
        render();
        if (result.deleted) announce('Saved plan deleted.');
      });
    });
  }

  function renderModeNote() {
    const unlock = '<br><strong>Unlock flow:</strong> only Slot 1 starts active. Slots 2 → 3 → 4 → 5 unlock sequentially, up to 30 reforges each. Early-unlock chance uses the community WWMReforge v1.3 model (2% / 3.5% / 5%), because official sources do not publish those crit rates.';
    if (state.mode === 'official') {
      els.modeNote.innerHTML = '<strong>Official-rate mode:</strong> 82% Blue / 15% Purple / 3% Gold with Gold guaranteed by 90 on each active rerolled slot.' + unlock;
    } else {
      els.modeNote.innerHTML = '<strong>Community quality model:</strong> uses the WWMReforge-style 3% → 4% → 5% Gold tiers after 30/60 pity. These soft-rate tiers are unofficial.' + unlock;
    }
  }

  function renderMetrics() {
    const locks = activeLockedCount();
    const goal = els.goal.value;
    const reached = Sim.goalReached(state, goal);
    const nextStones = Sim.costForLocks(locks);
    els.totalStones.textContent = state.totalStones.toLocaleString();
    els.totalValue.textContent = `${beadsForStones(state.totalStones).toLocaleString()} Echo Beads · ≈ $` + usdForStones(state.totalStones).toFixed(2);
    els.reforgeCount.textContent = state.reforgeCount.toLocaleString();
    els.goldCount.textContent = `${Sim.countGold(state)} / 4`;
    els.nextCost.textContent = `${nextStones} stone${nextStones === 1 ? '' : 's'}`;
    els.nextValue.textContent = `${beadsForStones(nextStones).toLocaleString()} Echo Beads · ≈ $` + usdForStones(nextStones).toFixed(2);
    els.goalStatus.textContent = reached ? 'Goal reached' : 'Keep practicing';
    els.goalStatus.className = `goal-status ${reached ? 'reached' : ''}`;
    els.reforgeButton.querySelector('strong').textContent = `${nextStones} stone${nextStones === 1 ? '' : 's'} · ${beadsForStones(nextStones).toLocaleString()} beads`;
    els.undoButton.disabled = undoStack.length === 0;
  }

  function render() {
    state = Sim.normalizeState(state);
    els.mode.value = state.mode;
    els.seed.value = state.seed;
    renderModeNote();
    renderSlots();
    renderMetrics();
    renderPlans();
    renderHistory();
  }

  function announce(message) {
    const toast = document.querySelector('#toast');
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(announce.timer);
    announce.timer = setTimeout(() => { toast.hidden = true; }, 2400);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function resetRun(seed) {
    snapshot();
    const fresh = Sim.createInitialState({ mode: state.mode, seed: seed || state.seed });
    fresh.slots = JSON.parse(JSON.stringify(baselineSlots));
    fresh.plans = JSON.parse(JSON.stringify(state.plans));
    state = Sim.normalizeState(fresh);
    persist();
    els.batchResult.innerHTML = '<div class="empty-state">Run a batch to see practice statistics.</div>';
    render();
  }

  function createFreshSeed() {
    if (window.crypto && window.crypto.getRandomValues) {
      const values = new Uint32Array(2);
      window.crypto.getRandomValues(values);
      return `practice-${values[0].toString(36)}-${values[1].toString(36)}`;
    }
    return `practice-${Date.now().toString(36)}`;
  }

  function setupCard(slot) {
    const fixed = slot.id === 5;
    const attrs = allowedAttributes(slot.id, slot.quality);
    const attribute = attrs.includes(slot.attribute) ? slot.attribute : attrs[0];
    return `
      <fieldset class="setup-card" data-setup-slot="${slot.id}">
        <legend>Slot ${slot.id}${fixed ? ' · Fixed Gold' : ''}</legend>
        <label class="switch-row">
          <input type="checkbox" name="active-${slot.id}" ${slot.active ? 'checked' : ''} />
          <span>Active</span>
        </label>
        ${fixed ? '<p class="help">When active, Slot 5 remains Gold · Sunlight and is not rerolled.</p>' : `
          <div class="field-grid">
            <label>Quality
              <select name="quality-${slot.id}">
                ${['blue', 'purple', 'gold'].map(q => `<option value="${q}" ${slot.quality === q ? 'selected' : ''}>${qualityLabel(q)}</option>`).join('')}
              </select>
            </label>
            <label>Pity
              <input name="pity-${slot.id}" type="number" min="0" max="90" step="1" value="${slot.pity}" />
            </label>
          </div>
          <label>Attribute
            <select name="attribute-${slot.id}">
              ${attrs.map(item => `<option value="${escapeHtml(item)}" ${attribute === item ? 'selected' : ''}>${escapeHtml(item)}</option>`).join('')}
            </select>
          </label>
          <label class="switch-row"><input type="checkbox" name="locked-${slot.id}" ${slot.locked ? 'checked' : ''} /><span>Locked</span></label>
        `}
      </fieldset>`;
  }

  function openSetup() {
    els.setupSlots.innerHTML = state.slots.map(setupCard).join('');
    els.setupSlots.querySelectorAll('select[name^="quality-"]').forEach(select => {
      select.addEventListener('change', event => {
        const id = Number(event.currentTarget.name.split('-')[1]);
        const card = els.setupSlots.querySelector(`[data-setup-slot="${id}"]`);
        const attributeSelect = card.querySelector(`[name="attribute-${id}"]`);
        const options = allowedAttributes(id, event.currentTarget.value);
        attributeSelect.innerHTML = options.map(item => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join('');
      });
    });
    els.setupDialog.showModal();
  }

  function applySetup(event) {
    event.preventDefault();
    const data = new FormData(els.setupForm);
    const next = Sim.normalizeState(state);
    let lockCount = 0;
    next.slots.forEach(slot => {
      const active = data.has(`active-${slot.id}`);
      slot.active = active;
      if (slot.id === 5) {
        slot.quality = 'gold';
        slot.attribute = 'Sunlight';
        slot.locked = true;
        slot.pity = 0;
        return;
      }
      slot.quality = data.get(`quality-${slot.id}`) || 'blue';
      slot.pity = Sim.clampPity(data.get(`pity-${slot.id}`));
      const allowed = allowedAttributes(slot.id, slot.quality);
      const desired = data.get(`attribute-${slot.id}`);
      slot.attribute = allowed.includes(desired) ? desired : allowed[0];
      slot.locked = active && data.has(`locked-${slot.id}`) && lockCount < 3;
      if (slot.locked) lockCount += 1;
    });
    snapshot();
    next.totalStones = 0;
    next.reforgeCount = 0;
    next.history = [];
    next.lastRoll = null;
    state = Sim.normalizeState(next);
    baselineSlots = JSON.parse(JSON.stringify(state.slots));
    persistBaseline();
    persist();
    els.setupDialog.close();
    render();
  }

  function runBatch() {
    const runs = Number(els.batchRuns.value);
    const goal = els.batchGoal.value;
    const strategy = els.batchStrategy.value;
    const maxReforges = Number(els.batchMax.value);
    const result = Sim.runBatch(state, { runs, goal, strategy, maxReforges });
    els.batchResult.innerHTML = `
      <div class="batch-grid">
        <div><span>Success rate</span><strong>${(result.successRate * 100).toFixed(1)}%</strong></div>
        <div><span>Successful runs</span><strong>${result.successes}/${result.runs}</strong></div>
        <div><span>Avg. reforges</span><strong>${result.averageReforges}</strong></div>
        <div><span>Avg. cost</span><strong>${result.averageStones} stones</strong><small>${Math.round(beadsForStones(result.averageStones)).toLocaleString()} beads · ≈ &#36;${usdForStones(result.averageStones).toFixed(2)}</small></div>
        <div><span>Median cost</span><strong>${result.medianStones} stones</strong><small>${beadsForStones(result.medianStones).toLocaleString()} beads · ≈ &#36;${usdForStones(result.medianStones).toFixed(2)}</small></div>
        <div><span>P90 cost</span><strong>${result.p90Stones} stones</strong><small>${beadsForStones(result.p90Stones).toLocaleString()} beads · ≈ &#36;${usdForStones(result.p90Stones).toFixed(2)}</small></div>
      </div>
      <p class="batch-note">Each run starts from the current slot setup and pity values. Results are seeded simulation statistics, not server RNG predictions.</p>`;
  }

  els.savePlanButton.addEventListener('click', () => {
    const result = Sim.savePlan(state);
    state = result.state;
    persist();
    render();
    if (result.saved) announce(`Saved ${result.plan.name}.`);
    else announce(`You can save up to ${Sim.MAX_PLANS} plans.`);
  });

  els.reforgeButton.addEventListener('click', () => {
    snapshot();
    state = Sim.reforge(state).state;
    persist();
    render();
  });

  els.undoButton.addEventListener('click', restoreLast);
  els.resetButton.addEventListener('click', () => resetRun(state.seed));
  els.newSeedButton.addEventListener('click', () => resetRun(createFreshSeed()));
  els.setupButton.addEventListener('click', openSetup);
  els.setupCancel.addEventListener('click', () => els.setupDialog.close());
  els.setupForm.addEventListener('submit', applySetup);
  els.clearHistory.addEventListener('click', () => {
    snapshot();
    state.history = [];
    persist();
    render();
  });
  els.batchButton.addEventListener('click', runBatch);
  els.goal.addEventListener('change', renderMetrics);

  els.mode.addEventListener('change', event => {
    snapshot();
    state.mode = event.currentTarget.value === 'community' ? 'community' : 'official';
    persist();
    render();
  });

  els.seed.addEventListener('change', event => {
    const nextSeed = event.currentTarget.value.trim() || 'practice-1';
    resetRun(nextSeed);
  });

  render();
})();
