#!/usr/bin/env python3
import json, os, re, urllib.request
from pathlib import Path

REPO=os.environ.get('GITHUB_REPOSITORY','PNHD/wwm-calc')
TARGET=os.environ['TARGET_SHA']
TOKEN=os.environ.get('GH_TOKEN') or os.environ.get('GITHUB_TOKEN') or ''
STATE=Path('verification-work/live_state.json')

def headers():
    h={'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'wwm-main-cloudflare-guard'}
    if TOKEN: h['Authorization']=f'Bearer {TOKEN}'
    return h

def gh(path):
    req=urllib.request.Request(f'https://api.github.com{path}',headers=headers())
    with urllib.request.urlopen(req,timeout=45) as r:return json.loads(r.read().decode())

def uuid(text):
    m=re.search(r'\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b',text or '')
    return m.group(0) if m else None

def pages_url(text):
    m=re.search(r'https://[a-zA-Z0-9-]+\.wonton-wwm\.pages\.dev/?',text or '')
    return m.group(0) if m else None

state=json.loads(STATE.read_text())
suites=gh(f'/repos/{REPO}/commits/{TARGET}/check-suites?per_page=100').get('check_suites',[])
main_cf=[]
for s in suites:
    app=s.get('app') or {}
    if s.get('head_sha')==TARGET and s.get('head_branch')=='main' and s.get('status')=='completed' and s.get('conclusion')=='success' and ('cloudflare' in str(app.get('name','')).lower() or 'cloudflare' in str(app.get('slug','')).lower()):
        main_cf.append(s)
if not main_cf: raise RuntimeError('No successful Cloudflare check suite with head_branch=main at target SHA')
main_cf.sort(key=lambda s:s.get('updated_at') or s.get('created_at') or '')
suite=main_cf[-1]
checks=gh(f"/repos/{REPO}/check-suites/{suite['id']}/check-runs?per_page=100").get('check_runs',[])
good=[]
for c in checks:
    app=c.get('app') or {}
    hay=' '.join(map(str,[c.get('name'),app.get('name'),app.get('slug'),c.get('details_url'),c.get('external_id')])).lower()
    if c.get('head_sha')==TARGET and c.get('status')=='completed' and c.get('conclusion')=='success' and ('cloudflare' in hay or 'pages' in hay): good.append(c)
if not good: raise RuntimeError(f'Cloudflare main suite {suite["id"]} has no successful Pages check run')
good.sort(key=lambda c:c.get('completed_at') or c.get('started_at') or '')
cf=good[-1]
raw=json.dumps(cf,ensure_ascii=False)
dep_id=uuid(str(cf.get('external_id') or '')) or uuid(str(cf.get('details_url') or '')) or uuid(raw)
if not dep_id: raise RuntimeError('Production Cloudflare deployment ID not exposed')
state['cloudflare']={
    'project':'wonton-wwm','production_branch':'main','check_suite_id':suite.get('id'),'check_suite_head_branch':suite.get('head_branch'),'check_run_id':cf.get('id'),'check_name':cf.get('name'),'head_sha':cf.get('head_sha'),'status':cf.get('status'),'conclusion':cf.get('conclusion'),'started_at':cf.get('started_at'),'completed_at':cf.get('completed_at'),'deployment_id':dep_id,'production_url':os.environ.get('PRODUCTION_URL','https://wonton-wwm.pages.dev/'),'deployment_url':pages_url(raw),'details_url':cf.get('details_url'),'external_id':cf.get('external_id')
}
if state['cloudflare']['head_sha']!=TARGET or state['cloudflare']['check_suite_head_branch']!='main': raise RuntimeError('Cloudflare guard failed exact main SHA semantics')
STATE.write_text(json.dumps(state,indent=2,ensure_ascii=False),encoding='utf-8')
print(json.dumps(state['cloudflare'],indent=2))
