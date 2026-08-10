import fs from "node:fs";

const path = "src/App.tsx";
let source = fs.readFileSync(path, "utf8");

function replaceRequired(from, to, label) {
  if (source.includes(to)) return;
  if (!source.includes(from)) throw new Error(`[t96-menu-panel] Missing patch anchor: ${label}`);
  source = source.replace(from, to);
}

// Global T96 Bamboocut menu panel = residual + equipped gear + attribute
// conversions + static Inner Way Attribute Buffs + static set bonuses.
// The calibration residual already subtracts static Inner Way values, so add them
// back here exactly once before the panel is displayed/persisted.
replaceRequired(
`  const basePanel = useMemo((): PanelStats => {
    if (autoGearPanel) {
      const allGear = getActiveGear();
      const equippedGear = allGear.filter((it) => isItemEquipped(it, allGear));
      return computeGearPanel(panel, equippedGear, activeScheme?.baseOverride, innerAttrName(selectedBuild));
    }
    return { ...panel };
  }, [panel, autoGearPanel, activeScheme?.gear, activeScheme?.baseOverride, selectedBuild]);`,
`  const basePanel = useMemo((): PanelStats => {
    if (autoGearPanel) {
      const allGear = getActiveGear();
      const equippedGear = allGear.filter((it) => isItemEquipped(it, allGear));
      const projected = computeGearPanel(panel, equippedGear, activeScheme?.baseOverride, innerAttrName(selectedBuild));
      if (selectedBuild === "bamboocut-dust") {
        projected.outerPen += iwStats.outerPen; projected.pzPen += iwStats.pzPen;
        projected.crit += iwStats.crit; projected.aff += iwStats.aff;
        projected.dcrit += iwStats.dcrit; projected.daff += iwStats.daff;
        projected.critDmg += iwStats.critDmg; projected.affDmg += iwStats.affDmg;
        projected.outerDmg += iwStats.outerDmg; projected.pzDmg += iwStats.pzDmg;
        projected.prec += iwStats.prec; projected.minOuter += iwStats.minOuter;
        projected.maxOuter += iwStats.maxOuter;
      }
      return projected;
    }
    // Manual input represents the actual in-game menu panel, which already
    // contains always-on Attribute Buffs. Never add selected Inner Ways twice.
    return { ...panel };
  }, [panel, autoGearPanel, activeScheme?.gear, activeScheme?.baseOverride, selectedBuild, iwStats]);`,
"menu panel static Inner Way contract",
);

// For the active Bamboocut product, static Inner Way Attribute Buffs are now in
// `basePanel`. `adjustedPanel` adds only temporary scenario inputs. Preserve the
// legacy behavior for other paths until they receive equivalent Global evidence.
replaceRequired(
`    // Inner ways are IN-COMBAT buffs (proc/stack effects) — they do NOT appear in
    // the game's character-menu panel. The manual \`panel\` fields therefore represent
    // the naked character-menu panel ("base trần"); here we add the selected inner
    // ways' stats on top to produce the effective in-combat panel used by the DPS
    // formula and the stat readout. (Previously only generalDmg was applied, so
    // pen / crit / crit-dmg / etc. from inner ways were silently ignored.)
    p.outerPen += iwStats.outerPen;
    p.pzPen += iwStats.pzPen;
    p.crit += iwStats.crit;
    p.aff += iwStats.aff;
    p.dcrit += iwStats.dcrit;
    p.daff += iwStats.daff;
    p.critDmg += iwStats.critDmg;
    p.affDmg += iwStats.affDmg;
    p.outerDmg += iwStats.outerDmg;
    p.pzDmg += iwStats.pzDmg;
    p.prec += iwStats.prec;
    p.minOuter += iwStats.minOuter;
    p.maxOuter += iwStats.maxOuter;
    // generalDmg stays in its own "general DMG%" multiplier bucket in the formula.
    p.iwGeneralDmg = iwStats.generalDmg;
    p.iwOuterPen = iwStats.outerPen;
    p.iwPzPen = iwStats.pzPen;
    p.iwPzDmg = iwStats.pzDmg;`,
`    if (selectedBuild !== "bamboocut-dust") {
      p.outerPen += iwStats.outerPen;
      p.pzPen += iwStats.pzPen;
      p.crit += iwStats.crit;
      p.aff += iwStats.aff;
      p.dcrit += iwStats.dcrit;
      p.daff += iwStats.daff;
      p.critDmg += iwStats.critDmg;
      p.affDmg += iwStats.affDmg;
      p.outerDmg += iwStats.outerDmg;
      p.pzDmg += iwStats.pzDmg;
      p.prec += iwStats.prec;
      p.minOuter += iwStats.minOuter;
      p.maxOuter += iwStats.maxOuter;
      p.iwGeneralDmg = iwStats.generalDmg;
      p.iwOuterPen = iwStats.outerPen;
      p.iwPzPen = iwStats.pzPen;
      p.iwPzDmg = iwStats.pzDmg;
    } else {
      // Conditional Yi River / Tang Melody / Phantom Chime / Starweave are owned
      // by the event timeline, never baked into this deterministic panel object.
      p.iwGeneralDmg = 0; p.iwOuterPen = 0; p.iwPzPen = 0; p.iwPzDmg = 0;
    }`,
"remove Bamboocut static Inner Way double count",
);

// The observed 1106 preset is a calibration fixture, not a naked panel. Build a
// versioned residual from that exact snapshot, gear and the four supplied T6
// Inner Ways so loading it reproduces the game panel and can immediately compare
// the spare 1129 chest without asking the owner to re-enter anything.
replaceRequired(
`              const character: Character = {
                id: \`char-t96-\${now}\`,
                name: GLOBAL_T96_OBSERVED_PRESET_META.name,
                schemes: [{
                  id: \`scheme-t96-\${now}\`,
                  name: GLOBAL_T96_OBSERVED_PRESET_META.scheme,
                  panel: { ...GLOBAL_T96_OBSERVED_PANEL } as PanelStats,
                  gear: GLOBAL_T96_OBSERVED_GEAR.map((item) => ({ ...item, subs: item.subs.map((sub) => ({ ...sub })) })) as GearItem[],
                }],
              };
              const next = { ...charsData, chars: [...charsData.chars, character], activeCharId: character.id, activeSchemeId: character.schemes[0].id };
              setCharsData(next);
              setPanel({ ...GLOBAL_T96_OBSERVED_PANEL } as PanelStats);
              setSelectedBuild(GLOBAL_T96_OBSERVED_PRESET_META.buildKey);
              setTierKey(GLOBAL_T96_OBSERVED_PRESET_META.tierKey);
              setSelectedInnerWays(["", "", "", ""]);
              localStorage.setItem("wwm_chars_v3", JSON.stringify(next));`,
`              const observedInnerWayIds = ["phantom_rally", "morale_chant", "towline_sweep", "song_of_tang"];
              const observedInnerWayTiers = Object.fromEntries(observedInnerWayIds.map((id) => [id, 6]));
              const observedIw: Record<string, number> = {};
              observedInnerWayIds.forEach((id) => {
                const iw = INNER_WAYS.find((item) => item.id === id);
                const stat = iw?.tiers.find((tier) => tier.tier === 6)?.stat;
                if (!stat) return;
                Object.entries(stat).forEach(([key, value]) => { observedIw[key] = (observedIw[key] || 0) + Number(value || 0); });
              });
              const observedGear = GLOBAL_T96_OBSERVED_GEAR.map((item) => ({ ...item, subs: item.subs.map((sub) => ({ ...sub })) })) as GearItem[];
              const observedEquipped = observedGear.filter((item) => isItemEquipped(item, observedGear));
              const observedGearSum = sumGearSubs(observedEquipped);
              const observedResidual: Partial<PanelStats> = {};
              CALIB_FIELDS.forEach((field) => {
                const key = field.key;
                const observed = Number((GLOBAL_T96_OBSERVED_PANEL as any)[key]);
                if (Number.isFinite(observed)) (observedResidual[key] as number) = observed - (observedGearSum[key] || 0) - (observedIw[key as string] || 0);
              });
              const character: Character = {
                id: \`char-t96-\${now}\`,
                name: GLOBAL_T96_OBSERVED_PRESET_META.name,
                schemes: [{
                  id: \`scheme-t96-\${now}\`,
                  name: GLOBAL_T96_OBSERVED_PRESET_META.scheme,
                  panel: { ...GLOBAL_T96_OBSERVED_PANEL } as PanelStats,
                  gear: observedGear,
                  baseOverride: observedResidual,
                  panelModelVersion: PANEL_MODEL_VERSION,
                }],
              };
              const next = { ...charsData, chars: [...charsData.chars, character], activeCharId: character.id, activeSchemeId: character.schemes[0].id };
              setCharsData(next);
              setPanel({ ...GLOBAL_T96_OBSERVED_PANEL } as PanelStats);
              setSelectedBuild(GLOBAL_T96_OBSERVED_PRESET_META.buildKey);
              setTierKey(GLOBAL_T96_OBSERVED_PRESET_META.tierKey);
              setSelectedInnerWays(observedInnerWayIds);
              setInnerWayTiers(observedInnerWayTiers);
              localStorage.setItem("wwm_chars_v3", JSON.stringify(next));`,
"observed preset residual + four T6 Inner Ways",
);

if (!source.includes("observedResidual")) throw new Error("[t96-menu-panel] observed residual was not generated");
if (!source.includes('selectedBuild === "bamboocut-dust"')) throw new Error("[t96-menu-panel] Bamboocut menu contract missing");
fs.writeFileSync(path, source, "utf8");
console.log("[t96-menu-panel] PASS — Bamboocut MENU PANEL now includes static Inner Ways exactly once and observed preset is version-calibrated.");
