import { Check, Gauge, Search, Settings2, X } from "lucide-react";
import { useState } from "react";

interface BuildOption { id: string; label: string; weapons: string; tier: string; estimated: boolean }
interface InnerWayOption { id: string; name: string; image?: string; category: string; trigger: string; effect: string; recommended: boolean }
interface SelectedInnerWay extends InnerWayOption { tier: number }

interface BuildWorkspaceProps {
  builds: BuildOption[];
  selectedBuild: string;
  buildNotes: string;
  weaponSet: string;
  armorSet: string;
  weaponSets: { id: string; label: string }[];
  armorSets: { id: string; label: string }[];
  ring: string;
  calibrated: boolean;
  food: boolean;
  efficiency: number;
  tier: string;
  tiers: { id: string; label: string }[];
  customDef: number;
  customRes: number;
  equipped: { slot: string; name: string; image: string }[];
  innerWays: (SelectedInnerWay | null)[];
  innerWayOptions: InnerWayOption[];
  onBuildChange: (id: string) => void;
  onWeaponSetChange: (id: string) => void;
  onArmorSetChange: (id: string) => void;
  onApplySets: () => void;
  onRingChange: (id: string) => void;
  onCalibrate: () => void;
  onFoodChange: (value: boolean) => void;
  onEfficiencyChange: (value: number) => void;
  onTierChange: (value: string) => void;
  onCustomDefChange: (value: number) => void;
  onCustomResChange: (value: number) => void;
  onInnerWayChange: (index: number, id: string) => void;
  onInnerWayTierChange: (id: string, tier: number) => void;
}

export default function BuildWorkspace(props: BuildWorkspaceProps) {
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const current = props.builds.find((build) => build.id === props.selectedBuild) ?? props.builds[0];
  const pickerOptions = props.innerWayOptions.filter((option) => option.name.toLowerCase().includes(query.toLowerCase()));
  const openPicker = (index: number) => { setPickerIndex(index); setQuery(""); };

  return (
    <main className="build-workspace" id="main-content">
      <header className="product-page-heading">
        <div><span className="product-kicker">Build</span><h1>Loadout configuration</h1><p>Define the path and effects used by every calculation.</p></div>
        <button className="product-secondary-button" type="button" title="Calibrate panel from in-game Combat Attributes" onClick={props.onCalibrate}>
          <Gauge size={17} aria-hidden="true" /> {props.calibrated ? "Calibrated" : "Calibrate panel"}
        </button>
      </header>

      <div className="build-layout">
        <section className="build-path-panel">
          <div className="product-section-heading"><div><h2>Martial path</h2><p>Weapons and rotation profile</p></div></div>
          <div className="build-path-list">
            {props.builds.map((build) => (
              <button key={build.id} type="button" className={build.id === props.selectedBuild ? "is-active" : ""} onClick={() => props.onBuildChange(build.id)}>
                <span><strong>{build.label}</strong><small>{build.weapons}</small></span>
              </button>
            ))}
          </div>
        </section>

        <div className="build-main-column">
          <section className="build-summary-band">
            <div><small>Selected path</small><strong>{current.label}</strong><span>{current.weapons}</span></div>
            <p>{props.buildNotes}</p>
          </section>

          <section className="build-config-section">
            <div className="product-section-heading"><div><h2>Combat settings</h2><p>Global assumptions used by Details, Simulation, Team and optimization.</p></div></div>
            <div className="build-control-grid">
              <label><span>Target tier</span><select value={props.tier} onChange={(event) => props.onTierChange(event.target.value)}>{props.tiers.map((tier) => <option key={tier.id} value={tier.id}>{tier.label}</option>)}</select></label>
              <label className="product-switch"><input type="checkbox" checked={props.food} onChange={(event) => props.onFoodChange(event.target.checked)} /><span aria-hidden="true" /><strong>Food bonus<small>Uses the selected tier's verified ATK values</small></strong></label>
              <label className="combat-efficiency"><span>Execution efficiency <strong>{Math.round(props.efficiency * 100)}%</strong></span><input type="range" min="50" max="100" value={Math.round(props.efficiency * 100)} onChange={(event) => props.onEfficiencyChange(Number(event.target.value) / 100)} /></label>
              {props.tier === "custom" && <><label><span>Enemy DEF</span><input type="number" min="0" value={props.customDef} onChange={(event) => props.onCustomDefChange(Math.max(0, Number(event.target.value) || 0))} /></label><label><span>Judgment resistance %</span><input type="number" min="0" step="0.01" value={Math.round(props.customRes * 100)} onChange={(event) => props.onCustomResChange(Math.max(0, Number(event.target.value) || 0) / 100)} /></label></>}
              <button type="button" onClick={props.onCalibrate}><Gauge size={16} aria-hidden="true" /> {props.calibrated ? "Recalibrate panel" : "Calibrate from game"}</button>
            </div>
          </section>

          <section className="build-config-section">
            <div className="product-section-heading"><div><h2>Weapon set, armor set &amp; Bow/Ring</h2><p>These selections are included in the combat calculation.</p></div></div>
            <div className="build-control-grid">
              <label><span>Weapon set (weapon, disc, pendant)</span><select value={props.weaponSet} onChange={(event) => props.onWeaponSetChange(event.target.value)}>{props.weaponSets.map((set) => <option key={set.id} value={set.id}>{set.label}</option>)}</select></label>
              <label><span>Armor set (helmet, chest, hands, legs)</span><select value={props.armorSet} onChange={(event) => props.onArmorSetChange(event.target.value)}>{props.armorSets.map((set) => <option key={set.id} value={set.id}>{set.label}</option>)}</select></label>
              <label><span>Bow / Ring attribute</span><select value={props.ring} onChange={(event) => props.onRingChange(event.target.value)}><option value="crit">Critical Rate +3.7%</option><option value="prec">Precision +3.3%</option><option value="aff">Affinity Rate +1.8%</option></select></label>
              <button type="button" onClick={props.onApplySets}><Settings2 size={16} aria-hidden="true" /> Apply sets to equipped gear</button>
            </div>
            <div className="build-equipped-strip">
              {props.equipped.map((item) => <span key={item.slot}><img src={item.image} alt="" /><span><small>{item.slot}</small><strong>{item.name}</strong></span></span>)}
            </div>
          </section>

          <section className="build-innerways-section">
            <div className="product-section-heading"><div><h2>Inner Ways</h2><p>Attribute effects apply automatically; conditional effects remain labeled.</p></div><span>{props.innerWays.filter(Boolean).length}/4 selected</span></div>
            <div className="build-innerway-list">
              {props.innerWays.map((innerWay, index) => (
                <div className={`build-innerway-row ${innerWay ? "is-selected" : ""}`} key={index}>
                  <span className="build-innerway-index">{index + 1}</span>
                  <button type="button" className="build-innerway-image" aria-label={`Choose Inner Way for slot ${index + 1}`} onClick={() => openPicker(index)}>{innerWay?.image ? <img src={innerWay.image} alt="" /> : <span>+</span>}</button>
                  <div className="build-innerway-copy">
                    <button type="button" onClick={() => openPicker(index)}>{innerWay?.name ?? "Choose Inner Way"}</button>
                    {innerWay ? <small>{innerWay.trigger} / {innerWay.effect}</small> : <small>Select an Inner Way from the complete library.</small>}
                  </div>
                  {innerWay && <label className="build-tier-control"><span>Tier</span><select value={innerWay.tier} onChange={(event) => props.onInnerWayTierChange(innerWay.id, Number(event.target.value))}>{[1,2,3,4,5,6].map((tier) => <option key={tier} value={tier}>T{tier}</option>)}</select></label>}
                  {innerWay && <Check className="build-innerway-check" size={17} aria-hidden="true" />}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
      {pickerIndex !== null && (
        <div className="product-picker-backdrop" onClick={() => setPickerIndex(null)}>
          <section className="product-innerway-picker" role="dialog" aria-modal="true" aria-label="Choose Inner Way" onClick={(event) => event.stopPropagation()}>
            <header>
              <div><span className="product-kicker">Inner Way slot {pickerIndex + 1}</span><h2>Choose Inner Way</h2></div>
              <button type="button" aria-label="Close Inner Way picker" onClick={() => setPickerIndex(null)}><X size={20} /></button>
            </header>
            <label className="product-picker-search"><Search size={17} /><input autoFocus type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Inner Ways" /></label>
            <div className="product-picker-list">
              {props.innerWays[pickerIndex] && <button type="button" className="product-picker-clear" onClick={() => { props.onInnerWayChange(pickerIndex, ""); setPickerIndex(null); }}>Clear this slot</button>}
              {pickerOptions.map((option) => {
                const selected = props.innerWays.some((innerWay, index) => index !== pickerIndex && innerWay?.id === option.id);
                return (
                  <button type="button" key={option.id} disabled={selected} onClick={() => { props.onInnerWayChange(pickerIndex, option.id); setPickerIndex(null); }}>
                    <span className="product-picker-image">{option.image ? <img src={option.image} alt="" /> : option.name[0]}</span>
                    <span><strong>{option.name}</strong><small>{option.recommended ? "Recommended for this path" : option.category}</small><p>{option.trigger} / {option.effect}</p></span>
                    {selected && <em>Already selected</em>}
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
