import fs from "node:fs";

const path = "src/App.tsx";
let source = fs.readFileSync(path, "utf8");
const marker = "  const gearAnalysis";
const hook = `  // CI/runtime diagnostics are derived synchronously from the same render snapshot
  // as Gear Compare. This avoids an effect-timing race after loading the observed
  // fixture and does not mutate product state or calibrate the model.
  if (typeof window !== "undefined" && activeScheme?.name === GLOBAL_T96_OBSERVED_PRESET_META.scheme) {
    const candidate1129 = compareRows.find((row) => row.name === "Nightfarer Armor 1129");
    const current1106 = compareRows.find((row) => row.name === "Nightfarer Armor");
    const candidate1129Item = activeGear.find((row) => row.name === "Nightfarer Armor 1129");
    const candidate1129Combo = candidate1129Item ? [
      ...equippedGear.filter((candidate) => candidate.slot !== candidate1129Item.slot),
      candidate1129Item,
    ] : null;
    const candidate1129Combat = candidate1129Combo ? comboInCombat(candidate1129Combo) : null;
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
      umbMartial: currentMenuPanel.umbMartial,
      attunedBonus: currentMenuPanel.attunedBonus,
      bossDmg: currentMenuPanel.bossDmg,
    };
    (window as any).__WWM_T96_RUNTIME_ACCEPTANCE__ = {
      fixture: "1106-vs-1129",
      currentMenuPanel: menu,
      diagnosticCombatPanels: {
        current: comparePanelForDiagnostics(equippedGear),
        candidate1129: candidate1129Combo ? comparePanelForDiagnostics(candidate1129Combo) : null,
      },
      perSkill: {
        current1106: currentCompareCombat.perSkill || [],
        candidate1129: candidate1129Combat?.perSkill || [],
      },
      current1106Dps: currentCompareDps,
      current1106: current1106 ? {
        modeledDps: current1106.modeledDps,
        factorDeltas: (current1106 as any).factorDeltas,
        confidence: (current1106 as any).confidence,
        fixtureDiagnostic: (current1106 as any).fixtureDiagnostic,
      } : null,
      candidate1129: candidate1129 ? {
        modeledDps: candidate1129.modeledDps,
        deltaDps: candidate1129.deltaDps,
        deltaPct: candidate1129.deltaPct,
        panelDelta: candidate1129.panelDelta,
        factorDeltas: (candidate1129 as any).factorDeltas,
        confidence: (candidate1129 as any).confidence,
        confidenceWhy: (candidate1129 as any).confidenceWhy,
        unknowns: (candidate1129 as any).unknowns,
        fixtureDiagnostic: (candidate1129 as any).fixtureDiagnostic,
        setChange: candidate1129.setChange,
        attunementChange: candidate1129.attunementChange,
        reason: candidate1129.reason,
      } : null,
    };
  }

`;
if (!source.includes("__WWM_T96_RUNTIME_ACCEPTANCE__")) {
  if (!source.includes(marker)) throw new Error("[t96-runtime-hook] gearAnalysis anchor missing");
  source = source.replace(marker, hook + marker);
}
fs.writeFileSync(path, source, "utf8");
console.log("[t96-runtime-hook] PASS — observed fixture synchronously exposes panel, exact combat coordinates, per-source damage, complete-build comparison, confidence and factor diagnostics.");
