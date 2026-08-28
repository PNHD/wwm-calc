import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const normalizeToLf = (value) => value.replace(/\r\n/g, "\n");
const transformPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "apply-bamboocut-best-build-trust.mjs");
const targetApp = normalizeToLf(fs.readFileSync("src/App.tsx", "utf8"));
const helperStart = "                          const pathMaturity = PATH_MODEL_MATURITY[selectedBuild];\n";
const helperEnd = "                          const bestTrust = bestBuildTrustSummary(best);\n                          // Best Build recommendation confidence";
const helperTargetStart = targetApp.indexOf(helperStart);
const helperTargetEnd = targetApp.indexOf(helperEnd, helperTargetStart) + helperEnd.length;
if (helperTargetStart < 0 || helperTargetEnd < helperTargetStart) throw new Error("[bamboocut-transform-regression] target helper fixture is missing");

const helperTarget = targetApp.slice(helperTargetStart, helperTargetEnd);
const helperHistorical = `${helperStart}                          // Best Build recommendation confidence`;
const historicalLf = targetApp.replace(helperTarget, helperHistorical);

function runFixture(name, fixture, expected) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), `wwm-bamboocut-${name}-`));
  try {
    fs.mkdirSync(path.join(root, "src"), { recursive: true });
    fs.writeFileSync(path.join(root, "src", "App.tsx"), fixture, "utf8");
    execFileSync(process.execPath, [transformPath], { cwd: root, stdio: "pipe" });
    const once = fs.readFileSync(path.join(root, "src", "App.tsx"), "utf8");
    if (once !== expected) throw new Error(`[bamboocut-transform-regression] ${name} did not converge`);
    execFileSync(process.execPath, [transformPath], { cwd: root, stdio: "pipe" });
    if (fs.readFileSync(path.join(root, "src", "App.tsx"), "utf8") !== expected) throw new Error(`[bamboocut-transform-regression] ${name} was not idempotent`);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

runFixture("target-lf", targetApp, targetApp);
runFixture("target-crlf", targetApp.replace(/\n/g, "\r\n"), targetApp.replace(/\n/g, "\r\n"));
runFixture("historical-lf", historicalLf, targetApp);
runFixture("historical-crlf", historicalLf.replace(/\n/g, "\r\n"), targetApp.replace(/\n/g, "\r\n"));

console.log("[bamboocut-transform-regression] PASS — LF/CRLF target and historical helper fixtures converge exactly once.");
