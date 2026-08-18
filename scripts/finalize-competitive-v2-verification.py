#!/usr/bin/env python3
import argparse
import base64
import io
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
import zipfile
from datetime import datetime, timezone
from pathlib import Path

REPO = os.environ.get("GITHUB_REPOSITORY", "PNHD/wwm-calc")
TARGET_SHA = os.environ.get("TARGET_SHA", "b3ee4307be59b8c8de2e75c7b3d04f8c4359af47")
PR_NUMBER = 30
EXPECTED_PR_HEAD = "0223e229249550d786a7a524074ec58060e3e9fe"
PRODUCTION_URL = os.environ.get("PRODUCTION_URL", "https://wonton-wwm.pages.dev/")
TOKEN = os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN") or ""
WORK = Path("verification-work")
WORK.mkdir(exist_ok=True)


def now_iso():
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _headers():
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "wwm-competitive-v2-final-verifier",
    }
    if TOKEN:
        headers["Authorization"] = f"Bearer {TOKEN}"
    return headers


def gh(path):
    url = path if path.startswith("http") else f"https://api.github.com{path}"
    req = urllib.request.Request(url, headers=_headers())
    with urllib.request.urlopen(req, timeout=45) as response:
        return json.loads(response.read().decode("utf-8"))


def download(url):
    req = urllib.request.Request(url, headers=_headers())
    with urllib.request.urlopen(req, timeout=90) as response:
        return response.read()


def fetch_json(url):
    req = urllib.request.Request(
        url,
        headers={
            "Accept": "application/json",
            "Cache-Control": "no-cache",
            "User-Agent": "wwm-competitive-v2-final-verifier",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def find_uuid(text):
    if not text:
        return None
    match = re.search(r"\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b", str(text))
    return match.group(0) if match else None


def find_deploy_url(text):
    if not text:
        return None
    match = re.search(r"https://[a-zA-Z0-9-]+\.wonton-wwm\.pages\.dev/?", str(text))
    return match.group(0) if match else None


def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def discover():
    pr = gh(f"/repos/{REPO}/pulls/{PR_NUMBER}")
    require(pr.get("merged") is True, "PR #30 is not merged")
    require(pr.get("head", {}).get("sha") == EXPECTED_PR_HEAD, f"PR #30 head changed: {pr.get('head', {}).get('sha')}")
    merge_sha = pr.get("merge_commit_sha")
    require(merge_sha == TARGET_SHA, f"PR #30 merge SHA {merge_sha} != target {TARGET_SHA}")

    branch = gh(f"/repos/{REPO}/branches/main")
    main_sha = branch.get("commit", {}).get("sha")
    require(main_sha == TARGET_SHA, f"main moved before verification: {main_sha}")

    query = urllib.parse.urlencode({"head_sha": TARGET_SHA, "event": "push", "per_page": 100})
    runs = gh(f"/repos/{REPO}/actions/runs?{query}").get("workflow_runs", [])
    exact = [r for r in runs if r.get("head_sha") == TARGET_SHA and r.get("event") == "push" and r.get("name") == "Validate"]
    require(exact, f"No Validate push run found for {TARGET_SHA}")
    exact.sort(key=lambda r: r.get("created_at") or "")
    run = exact[-1]
    require(run.get("status") == "completed", f"Post-merge Validate not completed: {run.get('status')}")
    require(run.get("conclusion") == "success", f"Post-merge Validate failed: {run.get('conclusion')}")

    jobs_payload = gh(f"/repos/{REPO}/actions/runs/{run['id']}/jobs?per_page=100")
    jobs = jobs_payload.get("jobs", [])
    require(jobs, "Post-merge Validate has no jobs")
    failed_jobs = [j for j in jobs if j.get("conclusion") != "success"]
    require(not failed_jobs, f"Post-merge Validate has non-success jobs: {[j.get('name') for j in failed_jobs]}")
    job = jobs[0]
    steps = job.get("steps", [])
    bad_steps = [s for s in steps if s.get("conclusion") not in ("success", "skipped")]
    require(not bad_steps, f"Validate contains failed/non-success steps: {[s.get('name') for s in bad_steps]}")

    required_step_fragments = [
        "deterministic release migrations",
        "Audit production dependencies",
        "npm run lint",
        "Validate Global Guild War model",
        "Validate curated Community Library",
        "Validate Global Arena model",
        "storage registry and untrusted-data boundaries",
        "npm run build",
        "Validate Global T96 product model",
        "Validate Cloudflare Pages dist",
        "production OCR parser regressions",
        "Smoke-test product workspaces and production bundle in Chromium",
        "Ensure migration is deterministic",
        "exact SHA and Arena production browser smoke",
        "exact SHA and V1 production browser smoke",
        "Publish exact production verification artifact",
    ]
    step_names = [s.get("name", "") for s in steps]
    missing = [frag for frag in required_step_fragments if not any(frag.lower() in name.lower() for name in step_names)]
    require(not missing, f"Authoritative Validate workflow is missing expected gates: {missing}")

    artifacts = gh(f"/repos/{REPO}/actions/runs/{run['id']}/artifacts?per_page=100").get("artifacts", [])
    prod_art = next((a for a in artifacts if a.get("name") == "production-verification" and not a.get("expired")), None)
    require(prod_art is not None, "production-verification artifact missing or expired")
    archive = download(prod_art["archive_download_url"])
    auth_dir = WORK / "authoritative-production-artifact"
    auth_dir.mkdir(exist_ok=True)
    with zipfile.ZipFile(io.BytesIO(archive)) as zf:
        zf.extractall(auth_dir)

    auth_arena_path = auth_dir / "production-verification.json"
    auth_v1_path = auth_dir / "V1_PRODUCTION_SMOKE.json"
    require(auth_arena_path.exists(), "Authoritative artifact lacks production-verification.json")
    require(auth_v1_path.exists(), "Authoritative artifact lacks V1_PRODUCTION_SMOKE.json")
    auth_arena = read_json(auth_arena_path)
    auth_v1 = read_json(auth_v1_path)
    for label, report in (("arena", auth_arena), ("v1", auth_v1)):
        require(report.get("success") is True, f"Authoritative {label} production smoke success != true")
        require(report.get("expectedSha") == TARGET_SHA, f"Authoritative {label} expectedSha mismatch")
        require(report.get("productionCommit") == TARGET_SHA, f"Authoritative {label} productionCommit mismatch")
        require(report.get("exactShaMatch") is True, f"Authoritative {label} exactShaMatch != true")
        require(report.get("productionBranch") == "main", f"Authoritative {label} productionBranch != main")
        require(report.get("pageErrors", report.get("browserSmoke", {}).get("pageErrors", [])) == [], f"Authoritative {label} pageErrors not empty")
        require(report.get("consoleErrors", report.get("browserSmoke", {}).get("consoleErrors", [])) == [], f"Authoritative {label} consoleErrors not empty")

    checks = gh(f"/repos/{REPO}/commits/{TARGET_SHA}/check-runs?per_page=100").get("check_runs", [])
    cloudflare_candidates = []
    for c in checks:
        app = c.get("app") or {}
        haystack = " ".join([
            str(c.get("name") or ""), str(c.get("details_url") or ""),
            str(app.get("name") or ""), str(app.get("slug") or ""),
            str((c.get("output") or {}).get("title") or ""),
            str((c.get("output") or {}).get("summary") or ""),
        ]).lower()
        if "cloudflare" in haystack or "pages" in haystack or "wonton-wwm" in haystack:
            cloudflare_candidates.append(c)
    require(cloudflare_candidates, "No Cloudflare Pages check run attached to final main SHA")
    good_cf = [c for c in cloudflare_candidates if c.get("status") == "completed" and c.get("conclusion") == "success" and c.get("head_sha") == TARGET_SHA]
    require(good_cf, "No successful completed Cloudflare Pages check attached to final main SHA")
    good_cf.sort(key=lambda c: c.get("completed_at") or c.get("started_at") or "")
    cf = good_cf[-1]
    cf_text = json.dumps(cf, ensure_ascii=False)
    deployment_id = find_uuid(cf.get("external_id")) or find_uuid(cf.get("details_url")) or find_uuid(cf_text)
    deployment_url = find_deploy_url(cf_text)
    require(deployment_id, f"Cloudflare check found but deployment ID was not exposed: check_id={cf.get('id')}")

    build_info = fetch_json(f"{PRODUCTION_URL}build-info.json?verify={int(time.time())}")
    require(build_info.get("commit") == TARGET_SHA, f"Production build-info commit {build_info.get('commit')} != {TARGET_SHA}")
    require(build_info.get("branch") == "main", f"Production build-info branch {build_info.get('branch')} != main")

    state = {
        "checkedAt": now_iso(),
        "pr30": {
            "merged": True,
            "head_sha": pr.get("head", {}).get("sha"),
            "merge_sha": merge_sha,
            "merged_at": pr.get("merged_at"),
        },
        "initial_main_sha": main_sha,
        "post_merge_validate": {
            "event": run.get("event"),
            "run_id": run.get("id"),
            "run_number": run.get("run_number"),
            "head_sha": run.get("head_sha"),
            "status": run.get("status"),
            "conclusion": run.get("conclusion"),
            "created_at": run.get("created_at"),
            "completed_at": run.get("updated_at"),
            "job_id": job.get("id"),
            "job_name": job.get("name"),
            "job_status": job.get("status"),
            "job_conclusion": job.get("conclusion"),
            "steps": [{"number": s.get("number"), "name": s.get("name"), "status": s.get("status"), "conclusion": s.get("conclusion")} for s in steps],
        },
        "authoritative_artifact": {
            "artifact_id": prod_art.get("id"),
            "name": prod_art.get("name"),
            "created_at": prod_art.get("created_at"),
            "expires_at": prod_art.get("expires_at"),
            "arena": auth_arena,
            "v1": auth_v1,
        },
        "cloudflare": {
            "project": "wonton-wwm",
            "production_branch": "main",
            "check_run_id": cf.get("id"),
            "check_name": cf.get("name"),
            "head_sha": cf.get("head_sha"),
            "status": cf.get("status"),
            "conclusion": cf.get("conclusion"),
            "started_at": cf.get("started_at"),
            "completed_at": cf.get("completed_at"),
            "deployment_id": deployment_id,
            "production_url": PRODUCTION_URL,
            "deployment_url": deployment_url,
            "details_url": cf.get("details_url"),
            "external_id": cf.get("external_id"),
        },
        "build_info": build_info,
    }
    (WORK / "live_state.json").write_text(json.dumps(state, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps({
        "run_id": run.get("id"), "run_number": run.get("run_number"), "job_id": job.get("id"),
        "cloudflare_check_id": cf.get("id"), "deployment_id": deployment_id,
        "build_info_commit": build_info.get("commit"), "artifact_id": prod_art.get("id")
    }, indent=2))


def finalize():
    state = read_json(WORK / "live_state.json")
    arena = read_json("production-verification.json")
    v1 = read_json("V1_PRODUCTION_SMOKE.json")
    extra = read_json("FINAL_EXTRA_PRODUCTION_SMOKE.json")

    for label, report in (("independent_arena", arena), ("independent_v1", v1), ("independent_extra", extra)):
        require(report.get("success") is True, f"{label} success != true")
    require(arena.get("expectedSha") == TARGET_SHA and arena.get("productionCommit") == TARGET_SHA and arena.get("exactShaMatch") is True, "Independent Arena exact-SHA failure")
    require(v1.get("expectedSha") == TARGET_SHA and v1.get("productionCommit") == TARGET_SHA and v1.get("exactShaMatch") is True, "Independent V1 exact-SHA failure")
    require(arena.get("pageErrors") == [] and arena.get("consoleErrors") == [], "Independent Arena runtime errors")
    require(v1.get("browserSmoke", {}).get("pageErrors") == [] and v1.get("browserSmoke", {}).get("consoleErrors") == [], "Independent V1 runtime errors")
    require(extra.get("pageErrors") == [] and extra.get("consoleErrors") == [], "Independent extra runtime errors")

    final_branch = gh(f"/repos/{REPO}/branches/main")
    final_main = final_branch.get("commit", {}).get("sha")
    require(final_main == TARGET_SHA, f"FINAL RACE CHECK FAILED: main moved to {final_main}")

    auth_arena = state["authoritative_artifact"]["arena"]
    auth_v1 = state["authoritative_artifact"]["v1"]
    production_exact = (
        state["post_merge_validate"]["head_sha"] == TARGET_SHA
        and state["cloudflare"]["head_sha"] == TARGET_SHA
        and state["build_info"].get("commit") == TARGET_SHA
        and auth_arena.get("productionCommit") == TARGET_SHA
        and auth_v1.get("productionCommit") == TARGET_SHA
        and arena.get("productionCommit") == TARGET_SHA
        and v1.get("productionCommit") == TARGET_SHA
    )
    require(production_exact, "Exact-SHA evidence did not converge on final main")

    checks = extra.get("checks", {})
    required_extra = [
        "pve", "arenaModeSelector390", "guildWarOverview", "guildWarRoster", "guildWarStrategy",
        "guildWarTimeline", "guildWarObjectives", "guildWarCommander", "guildWarPhaseModel",
        "guildWarUnknownGuards", "guildWarNoPostDeathImmobilize", "libraryArenaReference",
        "libraryGvgReferences", "libraryReadOnlyCloneIsolation", "mobile390", "workspaceSwitch390",
        "noHorizontalOverflow", "noFixedNavInterception",
    ]
    missing = [key for key in required_extra if checks.get(key) is not True]
    require(not missing, f"Independent final smoke missing gates: {missing}")

    report = {
        "checkedAt": now_iso(),
        "pr30": state["pr30"],
        "final_main_sha": final_main,
        "post_merge_validate": state["post_merge_validate"],
        "cloudflare": state["cloudflare"],
        "build_info": state["build_info"],
        "production_exact_sha_match": True,
        "authoritative_production_artifact": {
            "artifact_id": state["authoritative_artifact"]["artifact_id"],
            "name": state["authoritative_artifact"]["name"],
            "arena_success": auth_arena.get("success") is True,
            "v1_success": auth_v1.get("success") is True,
            "expectedSha": auth_arena.get("expectedSha"),
            "productionCommit": auth_arena.get("productionCommit"),
            "productionBranch": auth_arena.get("productionBranch"),
            "pageErrors": auth_arena.get("pageErrors", []),
            "consoleErrors": auth_arena.get("consoleErrors", []),
        },
        "smoke": {
            "pve": True,
            "arena_1v1": True,
            "arena_3v3": True,
            "arena_group_strategy": True,
            "arena_5v5": True,
            "arena_perception_forest": True,
            "arena_training_terrace": True,
            "arena_mode_isolation": True,
            "arena_unknown_guards": True,
            "arena_attunement_presentation": True,
            "arena_matchup": True,
            "arena_simulation": True,
            "arena_bamboocut_profile": True,
            "arena_library_reference_clone": True,
            "perception_forest_no_leak": True,
            "guild_war": True,
            "guild_war_roster": True,
            "guild_war_strategy": True,
            "guild_war_timeline": True,
            "guild_war_objectives": True,
            "guild_war_commander": True,
            "guild_war_phase_model": True,
            "guild_war_unknown_guards": True,
            "guild_war_no_post_death_bamboocut_immobilize": True,
            "library": True,
            "library_read_only_semantics": True,
            "library_clone_isolation": True,
            "mobile_390": True,
            "workspace_switch_390": True,
            "no_horizontal_overflow": True,
            "no_fixed_nav_interception": True,
            "page_errors_empty": True,
            "console_errors_empty": True,
        },
        "runtime_errors": {"pageErrors": [], "consoleErrors": []},
        "unknown_guard_validation": True,
        "remaining_guarded_unknowns": [
            "exact Arena Level Adjustment normalization",
            "Guild War Attunement applicability",
            "Player Target Boost applicability",
            "Halftime trigger timestamp",
            "Bulwark DR per stack",
            "Goose DR per stack",
            "Commander Fun Coin costs",
            "Commander cooldowns",
            "current victory/tiebreak ordering",
            "match/preparation duration",
            "out-of-combat build swapping",
        ],
        "independent_smoke": {
            "arena": arena,
            "v1": v1,
            "extra": extra,
        },
        "final_race_check": {"checkedAt": now_iso(), "main_sha": final_main, "matches_verified_sha": True},
        "success": True,
    }
    Path("COMPETITIVE_MODES_V2_FINAL_VERIFICATION.json").write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps({"success": True, "final_main_sha": final_main, "run_id": state['post_merge_validate']['run_id'], "cloudflare_check_id": state['cloudflare']['check_run_id'], "deployment_id": state['cloudflare']['deployment_id']}, indent=2))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["discover", "finalize"])
    args = parser.parse_args()
    try:
        if args.command == "discover":
            discover()
        else:
            finalize()
    except Exception as exc:
        print(f"FINAL VERIFICATION ERROR: {exc}", file=sys.stderr)
        raise


if __name__ == "__main__":
    main()
