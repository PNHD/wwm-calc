# Agent Crawl Commands

## Workbook

List sheets and first cells:

```powershell
python tools\workbook_probe.py "C:\Users\phamn\Downloads\WWM 燕云调律计算器.xlsx" --max 1
```

Find DPS/graduation cells in hidden sheets:

```powershell
python tools\workbook_probe.py "C:\Users\phamn\Downloads\WWM 燕云调律计算器.xlsx" --hidden --term DPS --term "秒伤" --term "毕业" --max 80
```

Inspect tier/template formulas:

```powershell
python tools\workbook_probe.py "C:\Users\phamn\Downloads\WWM 燕云调律计算器.xlsx" --sheet "各等级模板" --term "95上" --term "95下" --term "100上" --term "100下" --max 120
```

Inspect formula sheets:

```powershell
python tools\workbook_probe.py "C:\Users\phamn\Downloads\WWM 燕云调律计算器.xlsx" --sheet "伤害公式" --max 160
python tools\workbook_probe.py "C:\Users\phamn\Downloads\WWM 燕云调律计算器.xlsx" --sheet "各种机制说明" --max 160
```

## Reference Sites

Use these only for cross-checking. Keep the workbook and live Global patch notes higher priority.

```powershell
Invoke-WebRequest "https://wherewindsmeetcalculator.com/wiki/damage-formula" -OutFile "$env:TEMP\wwm_formula.html"
Invoke-WebRequest "https://wwm-stats-calculator.com/mechanics" -OutFile "$env:TEMP\wwm_stats_mechanics.html"
Invoke-WebRequest "https://wherewindsmath.pages.dev/" -OutFile "$env:TEMP\wherewindsmath.html"
```

## Minified JS

```powershell
Select-String -Path "C:\Users\phamn\Downloads\app.min.js","C:\Users\phamn\Downloads\optimizerWorker.js" -Pattern "crit|affinity|precision|DPS|damage|pen" -CaseSensitive:$false
```
