import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const base = "http://127.0.0.1:4173/";
const port = 9322;
const chrome = path.join(process.env.ProgramFiles || "C:\\Program Files", "Google", "Chrome", "Application", "chrome.exe");
const profile = await mkdtemp(path.join(os.tmpdir(), "wwm-v13-nav-browser-"));
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const json = (url) => new Promise((resolve, reject) => http.get(url, (response) => {
  let body = ""; response.setEncoding("utf8"); response.on("data", (chunk) => { body += chunk; }); response.on("end", () => {
    try { resolve(JSON.parse(body)); } catch (error) { reject(error); }
  });
}).on("error", reject));

async function waitForTarget() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const targets = await json(`http://127.0.0.1:${port}/json`);
      const page = targets.find((target) => target.type === "page");
      if (page) return page;
    } catch {}
    await pause(100);
  }
  throw new Error("Chrome DevTools target did not become available");
}

function connect(url) {
  const socket = new WebSocket(url);
  let nextId = 0;
  const pending = new Map();
  const events = [];
  socket.addEventListener("message", ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const request = pending.get(message.id); pending.delete(message.id);
      if (message.error) request.reject(new Error(message.error.message)); else request.resolve(message.result);
    } else if (message.method === "Runtime.exceptionThrown" || message.method === "Log.entryAdded" || message.method === "Network.loadingFailed" || (message.method === "Runtime.consoleAPICalled" && ["error", "warning", "assert"].includes(message.params.type))) events.push(message);
  });
  const ready = new Promise((resolve, reject) => { socket.addEventListener("open", resolve, { once: true }); socket.addEventListener("error", reject, { once: true }); });
  const send = async (method, params = {}) => {
    await ready;
    const id = ++nextId;
    const response = new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
    socket.send(JSON.stringify({ id, method, params }));
    return response;
  };
  return { socket, send, events };
}

async function main() {
  const browser = spawn(chrome, [`--headless=new`, `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check", "about:blank"], { stdio: "ignore", windowsHide: true });
  try {
    const target = await waitForTarget();
    const cdp = connect(target.webSocketDebuggerUrl);
    await cdp.send("Page.enable"); await cdp.send("Runtime.enable"); await cdp.send("Log.enable"); await cdp.send("Network.enable");
    const evaluate = async (expression) => {
      const result = await cdp.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
      return result.result.value;
    };
    const navigate = async (hash) => {
      await cdp.send("Page.navigate", { url: `${base}${hash}` });
      for (let attempt = 0; attempt < 100; attempt += 1) {
        if (await evaluate(`document.readyState === "complete" && location.hash === ${JSON.stringify(hash)}`)) break;
        await pause(50);
      }
      await pause(150);
    };
    const clickPath = async (label) => {
      const openedBuild = await evaluate(`(() => { const nav = document.querySelector('[aria-label="PvE navigation"]'); const button = [...(nav?.querySelectorAll('button') || [])].find((candidate) => /^Build/.test(candidate.textContent || '')); if (!button) return false; button.click(); return true; })()`);
      if (!openedBuild) await navigate("#pve/build");
      for (let attempt = 0; attempt < 100; attempt += 1) {
        if (await evaluate("Boolean(document.querySelector('.build-path-list button'))")) break;
        await pause(50);
      }
      const clicked = await evaluate(`(() => {
        const normalize = (value) => value.toLowerCase().replace(/[^a-z0-9]/g, '');
        const wanted = normalize(${JSON.stringify(label)});
        const button = [...document.querySelectorAll('.build-path-list button')].find((candidate) => normalize(candidate.textContent || '').startsWith(wanted));
        if (button) { button.click(); return true; }
        const select = document.querySelector('select[aria-label="Selected path"]');
        const option = select && [...select.options].find((candidate) => normalize(candidate.textContent || '') === wanted);
        if (!option) return false;
        select.value = option.value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      })()`);
      assert.equal(clicked, true, `${label} path selector must be present`);
      await pause(500);
    };
    const navState = async (navigationLabel) => evaluate(`(() => { const nav = document.querySelector(${JSON.stringify(`[aria-label="${navigationLabel}"]`)}); const button = [...(nav?.querySelectorAll('button') || [])].find((candidate) => candidate.getAttribute('aria-label') === 'Best Build unavailable: numerical model unavailable'); if (!button) return null; const before = document.activeElement; button.focus(); const focused = document.activeElement === button; button.click(); const style = getComputedStyle(button); return { disabled: button.disabled, ariaDisabled: button.getAttribute('aria-disabled'), ariaLabel: button.getAttribute('aria-label'), focused, hash: location.hash, cursor: style.cursor, opacity: style.opacity, text: button.textContent.trim() }; })()`);

    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 960, deviceScaleFactor: 1, mobile: false });
    await navigate("");
    const cleanRoot = await evaluate(`(() => ({
      path: localStorage.getItem("wwm_selected_build"),
      shell: Boolean(document.querySelector('[aria-label="PvE navigation"]')),
      status: document.querySelector('[data-testid="missing-timing-unavailable"]')?.innerText || "",
      selector: Boolean(document.querySelector('.build-path-list button')),
      compareDisabled: [...document.querySelectorAll('[aria-label="PvE navigation"] button')].find((button) => /^Compare unavailable/.test(button.textContent || ''))?.disabled,
      bestBuildDisabled: [...document.querySelectorAll('[aria-label="PvE navigation"] button')].find((button) => /^Best Build unavailable/.test(button.textContent || ''))?.disabled,
    }))()`);
    assert.deepEqual({ path: cleanRoot.path, shell: cleanRoot.shell, selector: cleanRoot.selector, compareDisabled: cleanRoot.compareDisabled, bestBuildDisabled: cleanRoot.bestBuildDisabled }, { path: "bamboocut-dust", shell: true, selector: true, compareDisabled: true, bestBuildDisabled: true }, "fresh root must retain the normal shell, path selector, and fail-closed Compare/Best Build controls");
    assert.match(cleanRoot.status, /Explicit timing is required[\s\S]*Provisional model/i, "fresh Dust root must retain timing reason and provenance");
    const gearOpened = await evaluate(`(() => { const nav = document.querySelector('[aria-label="PvE navigation"]'); const button = [...(nav?.querySelectorAll('button') || [])].find((candidate) => /^Gear/.test(candidate.textContent || '')); if (!button) return false; button.click(); return true; })()`);
    assert.equal(gearOpened, true, "Gear navigation must remain reachable from clean Dust");
    await pause(200);
    const cleanGear = await evaluate(`(() => ({ workspace: Boolean(document.querySelector('.arsenal-workspace')), edit: Boolean(document.querySelector('[aria-label^="Edit "]')), compareDisabled: [...document.querySelectorAll('.gear-inspector-actions button')].find((button) => /^Compare unavailable/.test(button.textContent || ''))?.disabled, unavailable: document.querySelector('[data-testid="gear-analysis-unavailable"]')?.innerText || "" }))()`);
    assert.deepEqual({ workspace: cleanGear.workspace, edit: cleanGear.edit, compareDisabled: cleanGear.compareDisabled }, { workspace: true, edit: true, compareDisabled: true }, "Gear Editor must remain reachable while numerical recommendation controls stay fail-closed");
    assert.match(cleanGear.unavailable, /Explicit timing is required/i, "Gear analysis must remain fail-closed");
    await evaluate(`document.querySelector('[aria-label^="Edit "]')?.click()`); await pause(100);
    const editorRows = await evaluate(`(() => ({ normal: document.querySelectorAll('.product-gear-modal [placeholder="Search stat..."]').length, attunement: document.querySelectorAll('.product-gear-modal [placeholder*="Attunement"]').length }))()`);
    assert.deepEqual(editorRows, { normal: 6, attunement: 1 }, "Gear Editor must preserve six normal rows plus a distinct Attunement row");
    await evaluate(`document.querySelector('.product-gear-modal .cancel-btn')?.click()`);
    await clickPath("Bamboocut-Dust");
    const setOptions = await evaluate(`(() => [...document.querySelectorAll('select option')].map((option) => option.textContent).filter((text) => /Hawkwing|Eaglerise/.test(text || '')))()`);
    assert.ok(setOptions.some((option) => /Hawkwing/.test(option || '')) && setOptions.some((option) => /Eaglerise/.test(option || '')), "Build controls must expose Hawkwing and Eaglerise sets");
    await clickPath("Bamboocut - Draught");
    const draughtDesktop = await navState("PvE navigation");
    assert.deepEqual({ disabled: draughtDesktop.disabled, ariaDisabled: draughtDesktop.ariaDisabled, ariaLabel: draughtDesktop.ariaLabel, focused: draughtDesktop.focused, hash: draughtDesktop.hash }, { disabled: true, ariaDisabled: "true", ariaLabel: "Best Build unavailable: numerical model unavailable", focused: false, hash: "#pve/build" });
    assert.notEqual(draughtDesktop.cursor, "pointer"); assert.ok(Number(draughtDesktop.opacity) < 1);
    const draughtDesktopText = await evaluate("document.body.innerText");
    assert.match(draughtDesktopText, /Bamboocut - Draught[\s\S]*Skystrike Gauntlets \+ Riven Twinblades/i, "Draught must retain its path-specific recognition status");
    const draughtStatus = await evaluate("document.querySelector('.build-config-section[role=\\\"status\\\"]')?.innerText || ''");
    assert.match(draughtStatus, /Known recognition metadata: Skystrike Gauntlets \+ Riven Twinblades/i);

    await clickPath("Bamboocut - Kite");
    const kiteDesktop = await navState("PvE navigation");
    assert.deepEqual({ disabled: kiteDesktop.disabled, ariaDisabled: kiteDesktop.ariaDisabled, ariaLabel: kiteDesktop.ariaLabel, focused: kiteDesktop.focused, hash: kiteDesktop.hash }, { disabled: true, ariaDisabled: "true", ariaLabel: "Best Build unavailable: numerical model unavailable", focused: false, hash: "#pve/build" });
    assert.notEqual(kiteDesktop.cursor, "pointer"); assert.ok(Number(kiteDesktop.opacity) < 1);
    const kiteDesktopText = await evaluate("document.body.innerText");
    assert.match(kiteDesktopText, /Bamboocut - Kite[\s\S]*Heavenwill Gauntlets \+ Skygrasp Rope Dart/i, "Kite must display its current Global martial-art names");
    const kiteStatus = await evaluate("document.querySelector('.build-config-section[role=\\\"status\\\"]')?.innerText || ''");
    assert.match(kiteStatus, /Known recognition metadata: Heavenwill Gauntlets \+ Skygrasp Rope Dart/i, "Kite unmodeled status must use Kite recognition metadata");
    assert.doesNotMatch(kiteStatus, /Bamboocut - Draught is current Global content, but its numerical model is UNKNOWN\./);

    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true }); await pause(100);
    const kiteMobile = await navState("PvE mobile navigation");
    assert.deepEqual({ disabled: kiteMobile.disabled, ariaDisabled: kiteMobile.ariaDisabled, ariaLabel: kiteMobile.ariaLabel, focused: kiteMobile.focused, hash: kiteMobile.hash }, { disabled: true, ariaDisabled: "true", ariaLabel: "Best Build unavailable: numerical model unavailable", focused: false, hash: "#pve/build" });
    assert.notEqual(kiteMobile.cursor, "pointer"); assert.ok(Number(kiteMobile.opacity) < 1);
    const kiteMobileText = await evaluate("document.body.innerText");
    assert.match(kiteMobileText, /Heavenwill Gauntlets \+ Skygrasp Rope Dart/);
    assert.match(kiteMobileText, /Numerical model unavailable/);
    await navigate("#pve/best-build");
    const kiteDirectRoute = await evaluate("({ path: localStorage.getItem('wwm_selected_build'), hash: location.hash, text: document.body.innerText, compareDisabled: document.querySelector('[aria-label=\"Compare unavailable: numerical model unavailable\"]')?.disabled, bestBuildDisabled: document.querySelector('[aria-label=\"Best Build unavailable: numerical model unavailable\"]')?.disabled })");
    assert.equal(kiteDirectRoute.path, "bamboocut-kite");
    assert.equal(kiteDirectRoute.hash, "#pve/overview", "an unavailable direct Best Build route must normalize to the safe overview");
    assert.match(kiteDirectRoute.text, /PVE \/ OVERVIEW[\s\S]*Bamboocut - Kite/i);
    assert.deepEqual({ compareDisabled: kiteDirectRoute.compareDisabled, bestBuildDisabled: kiteDirectRoute.bestBuildDisabled }, { compareDisabled: true, bestBuildDisabled: true }, "safe overview must retain unavailable Compare and Best Build controls");
    assert.doesNotMatch(kiteDirectRoute.text, /Best Build is unavailable: Bamboocut - Draught has no numerical model/i);
    assert.doesNotMatch(kiteDirectRoute.text, /Equip this build/i);

    await clickPath("Bamboocut - Draught");
    const draughtMobile = await navState("PvE mobile navigation");
    assert.deepEqual({ disabled: draughtMobile.disabled, ariaDisabled: draughtMobile.ariaDisabled, ariaLabel: draughtMobile.ariaLabel, focused: draughtMobile.focused, hash: draughtMobile.hash }, { disabled: true, ariaDisabled: "true", ariaLabel: "Best Build unavailable: numerical model unavailable", focused: false, hash: "#pve/build" });
    assert.notEqual(draughtMobile.cursor, "pointer"); assert.ok(Number(draughtMobile.opacity) < 1);

    await navigate("#pve/best-build");
    const directRoute = await evaluate("({ path: localStorage.getItem('wwm_selected_build'), hash: location.hash, text: document.body.innerText, compareDisabled: document.querySelector('[aria-label=\"Compare unavailable: numerical model unavailable\"]')?.disabled, bestBuildDisabled: document.querySelector('[aria-label=\"Best Build unavailable: numerical model unavailable\"]')?.disabled })");
    assert.equal(directRoute.path, "bamboocut-draught", "direct route must retain the selected Draught path");
    assert.equal(directRoute.hash, "#pve/overview", "an unavailable direct Draught Best Build route must normalize to the safe overview");
    assert.match(directRoute.text, /PVE \/ OVERVIEW[\s\S]*Bamboocut - Draught/i);
    assert.deepEqual({ compareDisabled: directRoute.compareDisabled, bestBuildDisabled: directRoute.bestBuildDisabled }, { compareDisabled: true, bestBuildDisabled: true }, "safe overview must retain unavailable Compare and Best Build controls for a direct Draught route");

    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 960, deviceScaleFactor: 1, mobile: false });
    await clickPath("Bamboocut-Dust");
    const dustDesktopText = await evaluate("document.body.innerText");
    assert.match(dustDesktopText, /Numerical (result|model) unavailable/i, "Dust must retain structured numerical unavailability when an active skill lacks explicit timing");
    assert.match(dustDesktopText, /Explicit timing is required/i, "Dust must name the missing timing boundary");
    assert.match(dustDesktopText, /Provisional model/i, "Dust unavailable state must retain provenance");
    assert.doesNotMatch(dustDesktopText, /Equip this build/i, "an unavailable Dust calculation must not expose an actionable result");

    await clickPath("Silkbind - Jade");
    await pause(250);
    const jadeDesktop = await evaluate("({ path: localStorage.getItem('wwm_selected_build'), text: document.body.innerText })");
    assert.equal(jadeDesktop.path, "silkbind-jade", "Dust -> Jade must retain the selected Path without a TDZ crash");
    assert.match(jadeDesktop.text, /Silkbind - Jade/i);
    await clickPath("Bamboocut - Draught");
    await navigate("#pve/best-build");
    const draughtAfterResult = await evaluate("({ hash: location.hash, text: document.body.innerText, compareDisabled: document.querySelector('[aria-label=\"Compare unavailable: numerical model unavailable\"]')?.disabled, bestBuildDisabled: document.querySelector('[aria-label=\"Best Build unavailable: numerical model unavailable\"]')?.disabled })");
    assert.equal(draughtAfterResult.hash, "#pve/overview", "an unavailable Draught Best Build route must normalize to the safe overview");
    assert.match(draughtAfterResult.text, /PVE \/ OVERVIEW[\s\S]*Bamboocut - Draught/i);
    assert.doesNotMatch(draughtAfterResult.text, /Equip this build/i, "Draught must not expose an actionable Best Build result");
    assert.deepEqual({ compareDisabled: draughtAfterResult.compareDisabled, bestBuildDisabled: draughtAfterResult.bestBuildDisabled }, { compareDisabled: true, bestBuildDisabled: true }, "safe overview must retain unavailable Compare and Best Build controls after path switching");
    await clickPath("Bamboocut-Dust");
    const dustAfterReturn = await evaluate("document.body.innerText");
    assert.doesNotMatch(dustAfterReturn, /Equip this build/i, "an unavailable Dust result must not appear after returning from Draught");
    assert.match(dustAfterReturn, /Explicit timing is required/i);

    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await navigate("#pve/build");
    const dustMobileText = await evaluate("document.body.innerText");
    assert.match(dustMobileText, /Numerical (result|model) unavailable/i);
    assert.match(dustMobileText, /Provisional model/i);
    const relevantErrors = cdp.events.filter((event) => !event.params?.entry?.url?.endsWith("/favicon.ico"));
    assert.equal(relevantErrors.length, 0, `unexpected browser errors: ${JSON.stringify(relevantErrors)}`);
    console.log(`[v13-kite-navigation] ${JSON.stringify({ kiteDesktop, kiteMobile, martialArts: "Heavenwill Gauntlets + Skygrasp Rope Dart", mobileLabelsVerified: true, directRouteGuarded: true, browserFailures: relevantErrors })}`);
    console.log(`[v13-bamboocut-navigation] PASS — Draught desktop/mobile navigation is unavailable and non-navigating; Dust retains structured timing/provenance unavailability; Dust -> Jade mounts without TDZ; direct routes stay guarded. DOM=${JSON.stringify({ draughtDesktop, draughtMobile, jadePath: jadeDesktop.path, dustActionableVisible: /Equip this build/i.test(dustDesktopText), draughtActionableVisible: /Equip this build/i.test(draughtAfterResult), dustReturnActionableVisible: /Equip this build/i.test(dustAfterReturn) })}`);
    cdp.socket.close();
  } finally {
    browser.kill();
  }
}

try {
  await main();
} finally {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try { await rm(profile, { recursive: true, force: true, maxRetries: 0 }); break; } catch (error) {
      if (attempt === 19) throw error;
      await pause(250);
    }
  }
}
