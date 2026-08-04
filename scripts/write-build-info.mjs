import fs from "node:fs";
import { execFileSync } from "node:child_process";

const safeExec = (args, fallback) => {
  try {
    return execFileSync("git", args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return fallback;
  }
};

const commit = process.env.CF_PAGES_COMMIT_SHA
  || process.env.GITHUB_SHA
  || safeExec(["rev-parse", "HEAD"], "unknown");
const branch = process.env.CF_PAGES_BRANCH
  || process.env.GITHUB_REF_NAME
  || safeExec(["branch", "--show-current"], "unknown");

const info = {
  product: "Where Winds Meet Build Calculator",
  dataVersion: "Global 2.0 · Tier 96 · 100上 calibration",
  schemaVersion: 1,
  commit,
  shortCommit: commit === "unknown" ? "unknown" : commit.slice(0, 8),
  branch,
  builtAt: new Date().toISOString(),
  evidence: {
    gearCaps: "Global screenshots + workbook 100上",
    innerWays: "English Global client + official Global patch notes",
    dummyFixture: "Level 96 Sword Trial Boss · 60 seconds",
  },
};

fs.mkdirSync("public", { recursive: true });
fs.writeFileSync("public/build-info.json", `${JSON.stringify(info, null, 2)}\n`, "utf8");
console.log(`[build-info] ${info.dataVersion} · ${info.shortCommit} · ${info.branch}`);
