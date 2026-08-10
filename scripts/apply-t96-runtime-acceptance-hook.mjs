import fs from "node:fs";

const path = "src/App.tsx";
let source = fs.readFileSync(path, "utf8");
const marker = "  const gearAnalysis";
const hook = `  useEffect(() => {
    if (activeScheme?.name !== GLOBAL_T96_OBSERVED_PRESET_META.scheme) return;
    const candidate1129 = compareRows.find((row) => row.name === "Nightfarer Armor 1129");
    const menu = {
      minOuter: currentMenuPanel.minOuter,
      maxOuter: currentMenuPanel.maxOuter,
      minPz: currentMenuPanel.minPz,
      maxPz: currentMenuPanel.maxPz,
      prec: currentMenuPanel.prec,
      crit: currentMenuPanel.crit,
      aff: currentMenuPanel.aff,
      dcrit: currentMenuPanel.dcrit,
      outerPen: currentMenuPanel.outerPen,
      critDmg: currentMenuPanel.critDmg,
      allArts: currentMenuPanel.allArts,
    };
    (window as any).__WWM_T96_RUNTIME_ACCEPTANCE__ = {
      fixture: "1106-vs-1129",
      currentMenuPanel: menu,
      current1106Dps: currentCompareDps,
      candidate1129: candidate1129 ? {
        modeledDps: candidate1129.modeledDps,
        deltaDps: candidate1129.deltaDps,
        deltaPct: candidate1129.deltaPct,
        panelDelta: candidate1129.panelDelta,
        setChange: candidate1129.setChange,
        attunementChange: candidate1129.attunementChange,
        reason: candidate1129.reason,
      } : null,
    };
  }, [activeScheme?.name, currentMenuPanel, currentCompareDps, compareRows]);

`;
if (!source.includes("__WWM_T96_RUNTIME_ACCEPTANCE__")) {
  if (!source.includes(marker)) throw new Error("[t96-runtime-hook] gearAnalysis anchor missing");
  source = source.replace(marker, hook + marker);
}
fs.writeFileSync(path, source, "utf8");
console.log("[t96-runtime-hook] PASS — observed fixture exposes runtime panel/compare snapshot for Chromium acceptance.");
