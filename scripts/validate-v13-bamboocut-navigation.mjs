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
    } else if (message.method === "Runtime.exceptionThrown" || message.method === "Log.entryAdded") events.push(message);
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
    await cdp.send("Page.enable"); await cdp.send("Runtime.enable"); await cdp.send("Log.enable");
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
      const clicked = await evaluate(`(() => { const button = [...document.querySelectorAll('.build-path-list button')].find((candidate) => candidate.textContent.trim().startsWith(${JSON.stringify(label)})); if (!button) return false; button.click(); return true; })()`);
      assert.equal(clicked, true, `${label} path selector must be present`);
      await pause(500);
    };
    const navState = async (navigationLabel) => evaluate(`(() => { const nav = document.querySelector(${JSON.stringify(`[aria-label="${navigationLabel}"]`)}); const button = [...(nav?.querySelectorAll('button') || [])].find((candidate) => /Best Build|Unavailable|^Best$/.test(candidate.textContent || '')); if (!button) return null; const before = document.activeElement; button.focus(); const focused = document.activeElement === button; button.click(); const style = getComputedStyle(button); return { disabled: button.disabled, ariaDisabled: button.getAttribute('aria-disabled'), ariaLabel: button.getAttribute('aria-label'), focused, hash: location.hash, cursor: style.cursor, opacity: style.opacity, text: button.textContent.trim() }; })()`);

    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 960, deviceScaleFactor: 1, mobile: false });
    await clickPath("Bamboocut - Draught");
    const draughtDesktop = await navState("PvE navigation");
    assert.deepEqual({ disabled: draughtDesktop.disabled, ariaDisabled: draughtDesktop.ariaDisabled, ariaLabel: draughtDesktop.ariaLabel, focused: draughtDesktop.focused, hash: draughtDesktop.hash }, { disabled: true, ariaDisabled: "true", ariaLabel: "Best Build unavailable: numerical model unavailable", focused: false, hash: "#pve/build" });
    assert.notEqual(draughtDesktop.cursor, "pointer"); assert.ok(Number(draughtDesktop.opacity) < 1);

    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true }); await pause(100);
    const draughtMobile = await navState("PvE mobile navigation");
    assert.deepEqual({ disabled: draughtMobile.disabled, ariaDisabled: draughtMobile.ariaDisabled, ariaLabel: draughtMobile.ariaLabel, focused: draughtMobile.focused, hash: draughtMobile.hash }, { disabled: true, ariaDisabled: "true", ariaLabel: "Best Build unavailable: numerical model unavailable", focused: false, hash: "#pve/build" });
    assert.notEqual(draughtMobile.cursor, "pointer"); assert.ok(Number(draughtMobile.opacity) < 1);

    await navigate("#pve/best-build");
    const directRoute = await evaluate("({ path: localStorage.getItem('wwm_selected_build'), text: document.body.innerText })");
    assert.equal(directRoute.path, "bamboocut-draught", "direct route must retain the selected Draught path");
    assert.match(directRoute.text, /Best Build unavailable\. It cannot be ranked using another path's coefficients\./i, "direct Draught Best Build route must retain its unavailable destination guard");

    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 960, deviceScaleFactor: 1, mobile: false });
    await clickPath("Bamboocut-Dust");
    const dustDesktop = await navState("PvE navigation");
    assert.deepEqual({ disabled: dustDesktop.disabled, ariaDisabled: dustDesktop.ariaDisabled, hash: dustDesktop.hash }, { disabled: false, ariaDisabled: null, hash: "#pve/best-build" });
    const bestBuildStarted = await evaluate(`(() => { const button = [...document.querySelectorAll('button')].find((candidate) => /^(Find best build|Re-run search)$/i.test(candidate.textContent.trim())); if (!button) return false; button.click(); return true; })()`);
    assert.equal(bestBuildStarted, true, "normal modeled Best Build control must be available");
    let completedResult = null;
    for (let attempt = 0; attempt < 200; attempt += 1) {
      completedResult = await evaluate(`(() => ({ completed: Boolean([...document.querySelectorAll('button')].find((candidate) => /Equip this build/i.test(candidate.textContent || ''))), text: document.body.innerText }))()`);
      if (completedResult.completed) break;
      await pause(50);
    }
    assert.equal(completedResult.completed, true, `a real completed Dust Best Build result must render before ownership switching; observed=${completedResult.text.match(/.{0,80}(?:Best|gear|slot).{0,120}/gi)?.join(" | ") || completedResult.text.slice(-500)}`);
    assert.match(completedResult.text, /Equip this build/i, "completed Dust result must be visible in the running app");
    await clickPath("Bamboocut - Draught");
    await navigate("#pve/best-build");
    const draughtAfterResult = await evaluate("document.body.innerText");
    assert.doesNotMatch(draughtAfterResult, /Equip this build/i, "completed Dust Best Build result must disappear after switching to Draught");
    assert.match(draughtAfterResult, /Best Build unavailable\. It cannot be ranked using another path's coefficients\./i, "Draught must remain explicitly unavailable after result switching");
    await clickPath("Bamboocut-Dust");
    const dustAfterReturn = await evaluate("document.body.innerText");
    assert.doesNotMatch(dustAfterReturn, /Equip this build/i, "stale Dust result must not reappear after returning from Draught");
    const dustReturnNavigation = await navState("PvE navigation");
    assert.deepEqual({ disabled: dustReturnNavigation.disabled, ariaDisabled: dustReturnNavigation.ariaDisabled, hash: dustReturnNavigation.hash }, { disabled: false, ariaDisabled: null, hash: "#pve/best-build" });
    assert.equal(await evaluate("Boolean([...document.querySelectorAll('button')].find((candidate) => /^(Find best build|Re-run search)$/i.test(candidate.textContent.trim())))"), true, "Dust Best Build remains normally usable after returning");

    await cdp.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
    await navigate("#pve/build");
    const dustMobile = await navState("PvE mobile navigation");
    assert.deepEqual({ disabled: dustMobile.disabled, ariaDisabled: dustMobile.ariaDisabled, hash: dustMobile.hash }, { disabled: false, ariaDisabled: null, hash: "#pve/best-build" });
    const relevantErrors = cdp.events.filter((event) => !event.params?.entry?.url?.endsWith("/favicon.ico"));
    assert.equal(relevantErrors.length, 0, `unexpected browser errors: ${JSON.stringify(relevantErrors)}`);
    console.log(`[v13-bamboocut-navigation] PASS — Draught desktop/mobile navigation is unavailable and non-navigating; Dust remains enabled; direct route remains guarded; completed Dust result disappears on Draught switch. DOM=${JSON.stringify({ draughtDesktop, draughtMobile, dustDesktop, dustMobile, completedResult: { completed: completedResult.completed }, draughtResultVisible: /Equip this build/i.test(draughtAfterResult), dustReturnResultVisible: /Equip this build/i.test(dustAfterReturn) })}`);
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
