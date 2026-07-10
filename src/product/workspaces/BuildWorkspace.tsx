import { Check, Gauge, Settings2 } from "lucide-react";

interface BuildOption { id: string; label: string; weapons: string; tier: string; estimated: boolean }
interface InnerWayOption { id: string; name: string; image?: string; category: string; trigger: string; effect: string }
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
  equipped: { slot: string; name: string; image: string }[];
  innerWays: (SelectedInnerWay | null)[];
  innerWayOptions: InnerWayOption[];
  onBuildChange: (id: string) => void;
  onWeaponSetChange: (id: string) => void;
  onArmorSetChange: (id: string) => void;
  onApplySets: () => void;
  onRingChange: (id: string) => void;
  onCalibrate: () => void;
  onInnerWayChange: (index: number, id: string) => void;
  onInnerWayTierChange: (id: string, tier: number) => void;
}

export default function BuildWorkspace(props: BuildWorkspaceProps) {
  const current = props.builds.find((build) => build.id === props.selectedBuild) ?? props.builds[0];

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
                <span><em>{build.tier}</em>{build.estimated && <small>Estimated</small>}</span>
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
            <div className="product-section-heading"><div><h2>Equipment effects</h2><p>Set bonuses and ring attribute</p></div></div>
            <div className="build-control-grid">
              <label><span>Weapon set</span><select value={props.weaponSet} onChange={(event) => props.onWeaponSetChange(event.target.value)}>{props.weaponSets.map((set) => <option key={set.id} value={set.id}>{set.label}</option>)}</select></label>
              <label><span>Armor set</span><select value={props.armorSet} onChange={(event) => props.onArmorSetChange(event.target.value)}>{props.armorSets.map((set) => <option key={set.id} value={set.id}>{set.label}</option>)}</select></label>
              <label><span>Ring attribute</span><select value={props.ring} onChange={(event) => props.onRingChange(event.target.value)}><option value="crit">Critical Rate +3.7%</option><option value="prec">Precision +3.3%</option><option value="aff">Affinity Rate +1.8%</option></select></label>
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
                  <span className="build-innerway-image">{innerWay?.image ? <img src={innerWay.image} alt="" /> : <span>+</span>}</span>
                  <label>
                    <span className="sr-only">Inner Way slot {index + 1}</span>
                    <select value={innerWay?.id ?? ""} onChange={(event) => props.onInnerWayChange(index, event.target.value)}>
                      <option value="">Empty slot</option>
                      {props.innerWayOptions.map((option) => <option key={option.id} value={option.id}>{option.category === current.label.toUpperCase() ? "Recommended / " : ""}{option.name}</option>)}
                    </select>
                    {innerWay ? <small>{innerWay.trigger} / {innerWay.effect}</small> : <small>Select an Inner Way from the complete library.</small>}
                  </label>
                  {innerWay && <label className="build-tier-control"><span>Tier</span><select value={innerWay.tier} onChange={(event) => props.onInnerWayTierChange(innerWay.id, Number(event.target.value))}>{[1,2,3,4,5,6].map((tier) => <option key={tier} value={tier}>T{tier}</option>)}</select></label>}
                  {innerWay && <Check className="build-innerway-check" size={17} aria-hidden="true" />}
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
