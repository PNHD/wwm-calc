import { Check, ChevronLeft, ChevronRight, Pencil, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";

export interface ArsenalRow {
  id: string;
  slot: string;
  slotLabel: string;
  name: string;
  image: string;
  quality: "gold" | "purple" | "blue";
  setName: string;
  weaponType?: string;
  subs: { type: string; value: string; tuned: boolean }[];
  mastery?: number;
  equipped: boolean;
  grade: string;
  score: number;
}

interface ArsenalWorkspaceProps {
  rows: ArsenalRow[];
  slots: { key: string; label: string }[];
  activeSlot: string;
  sortBy: "name" | "mastery";
  onSlotChange: (slot: string) => void;
  onSortChange: (sort: "name" | "mastery") => void;
  onEquip: (id: string) => void;
  onEdit: (id: string) => void;
  onAdd: () => void;
  analysis: { slot: string; slotKey: string; name: string; score: number; dpsLoss: number; lossPct: number }[];
  modeledDps: number;
  priorities: { name: string; dps: number }[];
  onOpenCompare: () => void;
  onOpenOptimizer: () => void;
  onOpenTransmute: () => void;
}

export default function ArsenalWorkspace({
  rows,
  slots,
  activeSlot,
  sortBy,
  onSlotChange,
  onSortChange,
  onEquip,
  onEdit,
  onAdd,
  analysis,
  modeledDps,
  priorities,
  onOpenCompare,
  onOpenOptimizer,
  onOpenTransmute,
}: ArsenalWorkspaceProps) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rerollPath, setRerollPath] = useState("build");
  const equipped = slots
    .filter((slot) => slot.key !== "ALL")
    .map((slot) => ({ ...slot, item: rows.find((row) => row.slot === slot.key && row.equipped) }));
  const visibleRows = rows.filter((row) => {
    const matchesSlot = activeSlot === "ALL" || row.slot === activeSlot;
    const matchesQuery = `${row.name} ${row.setName} ${row.subs.map((sub) => sub.type).join(" ")}`
      .toLowerCase()
      .includes(query.toLowerCase());
    return matchesSlot && matchesQuery;
  });
  const pageSize = 12;
  const pageCount = Math.max(1, Math.ceil(visibleRows.length / pageSize));
  const pageRows = visibleRows.slice((page - 1) * pageSize, page * pageSize);
  const maxLoss = Math.max(1, ...analysis.map((item) => item.dpsLoss));
  const advisedItem = rows.find((row) => row.equipped && row.slot === activeSlot) ?? rows.find((row) => row.equipped);
  const selectedItem = rows.find((row) => row.id === selectedId) ?? advisedItem;
  const rank = (name: string) => {
    const key = name.toLowerCase().replace(/[^a-z]/g, "");
    const index = priorities.findIndex((item) => {
      const candidate = item.name.toLowerCase().replace(/[^a-z]/g, "");
      return candidate.includes(key) || key.includes(candidate);
    });
    return index < 0 ? priorities.length + 1 : index;
  };
  const weakestSub = advisedItem?.subs.filter((sub) => !sub.tuned).sort((a, b) => rank(b.type) - rank(a.type))[0];
  const bestMissing = priorities.find((priority) => !advisedItem?.subs.some((sub) => rank(sub.type) === priorities.indexOf(priority)));
  useEffect(() => setPage(1), [activeSlot, query, sortBy]);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);

  return (
    <main className="arsenal-workspace" id="main-content">
      <header className="product-page-heading">
        <div>
          <span className="product-kicker">PvE / Gear</span>
          <h1>Gear</h1>
          <p>Manage the equipped loadout and saved inventory without mixing selection, analysis, and diagnostics.</p>
        </div>
        <button className="product-primary-button" type="button" onClick={onAdd}>
          <Plus size={17} aria-hidden="true" /> Add gear
        </button>
      </header>

      {rows.length === 0 && <section className="arsenal-empty arsenal-empty-primary" aria-label="Empty gear inventory">
        <strong>No gear yet</strong><span>Add your first gear piece to calculate and compare your build.</span><button type="button" onClick={onAdd}><Plus size={14} aria-hidden="true" /> Add gear</button>
      </section>}

      <section className="arsenal-loadout" aria-label="Equipped gear">
        <div className="product-section-heading">
          <div><h2>Equipped</h2><p>{equipped.filter((slot) => slot.item).length}/8 slots equipped</p></div>
        </div>
        <div className="arsenal-slot-rail">
          {equipped.map(({ key, label, item }) => (
            <button key={key} type="button" onClick={() => onSlotChange(key)} className={activeSlot === key ? "is-active" : ""}>
              <span className="arsenal-slot-image">
                {item ? <img src={item.image} alt="" /> : <span aria-hidden="true">+</span>}
              </span>
              <span><small>{label}</small><strong>{item?.name ?? "Empty"}</strong></span>
              {item && <em data-grade={item.grade}>{item.grade}</em>}
            </button>
          ))}
        </div>
      </section>

      {selectedItem && <section className="gear-inspector" aria-label="Selected gear analyzer">
        <header><div><span className="product-kicker">Selected gear</span><h2>{selectedItem.name}</h2><p>{selectedItem.slotLabel} / {selectedItem.setName} / {selectedItem.quality}</p></div><strong>{selectedItem.grade}<small>{selectedItem.score.toFixed(2)}%</small></strong></header>
        <div className="gear-inspector-layout">
          <div className="gear-inspector-stats">{selectedItem.subs.slice(0, 6).map((sub, index) => <span key={`${sub.type}-${index}`}><i>{index + 1}</i><strong>{sub.type}{sub.tuned ? " (tuned)" : ""}</strong><b>{sub.value}</b></span>)}</div>
          <div className="gear-inspector-advice"><small>Reroll calculator</small><label><span>Path</span><select value={rerollPath} onChange={(event) => setRerollPath(event.target.value)}><option value="build">{selectedItem.slotLabel} path</option><option value="bamboocut">Bamboocut path</option><option value="general">General path</option></select></label><strong>{weakestSub && bestMissing ? `${weakestSub.type} -> ${bestMissing.name}` : "No verified upgrade found"}</strong><span>{bestMissing ? `About +${Math.round(bestMissing.dps).toLocaleString()} DPS for one Global max roll.` : "Current lines already cover the ranked priorities."}</span></div>
          <div className="gear-inspector-actions">
            <button type="button" onClick={() => onEdit(selectedItem.id)}>Edit 6 stat lines</button>
            <button type="button" onClick={() => onEquip(selectedItem.id)}>{selectedItem.equipped ? "Unequip" : "Equip this gear"}</button>
            <button type="button" onClick={onOpenTransmute}>Retune / re-attune</button>
            <button type="button" onClick={onOpenCompare}>Compare slot</button>
          </div>
        </div>
      </section>}

      <section className="arsenal-analysis" aria-label="Equipped gear analysis">
        <div className="product-section-heading">
          <div><h2>Equipped gear analysis</h2><p>DPS lost when each equipped piece is removed from the current build.</p></div>
          <strong>{Math.round(modeledDps).toLocaleString()} modeled DPS</strong>
        </div>
        <div className="arsenal-analysis-layout">
          <div className="arsenal-contribution-list">
            {analysis.map((item) => (
              <button type="button" key={item.slotKey} onClick={() => onSlotChange(item.slotKey)}>
                <span><strong>{item.slot}</strong><small>{item.name}</small></span>
                <i><b style={{ width: `${Math.max(3, item.dpsLoss / maxLoss * 100)}%` }} /></i>
                <span><strong>-{Math.round(item.dpsLoss).toLocaleString()}</strong><small>{item.lossPct.toFixed(2)}% DPS</small></span>
              </button>
            ))}
          </div>
          <div className="arsenal-analysis-actions">
            <div><small>Weakest slot</small><strong>{analysis.at(-1)?.slot ?? "-"}</strong><span>{analysis.at(-1)?.score.toFixed(2) ?? "0.00"}% graduation contribution</span></div>
            {advisedItem && <div><small>Reroll advisor</small><strong>{advisedItem.name}</strong><span>{weakestSub && bestMissing ? `${weakestSub.type} -> ${bestMissing.name} (about +${Math.round(bestMissing.dps).toLocaleString()} DPS/roll)` : "No clear reroll upgrade from current priority data."}</span></div>}
            {advisedItem && <button type="button" onClick={() => onEdit(advisedItem.id)}>Edit selected gear</button>}
            <button type="button" onClick={onOpenCompare}>Compare one replacement</button>
            <button type="button" onClick={onOpenTransmute}>Retune advice</button>
            <button type="button" className="is-primary" onClick={onOpenOptimizer}>Optimize full inventory</button>
          </div>
        </div>
      </section>

      <section className="arsenal-inventory" aria-label="Inventory">
        <div className="product-section-heading">
          <div><h2>Inventory</h2><p>{rows.length} saved pieces · filter by slot, name, set, or stat.</p></div>
        </div>
        <div className="arsenal-toolbar">
          <div className="arsenal-slot-filter" role="group" aria-label="Filter by gear slot">
            {slots.map((slot) => (
              <button key={slot.key} type="button" className={activeSlot === slot.key ? "is-active" : ""} onClick={() => onSlotChange(slot.key)}>
                {slot.label}<small>{slot.key === "ALL" ? rows.length : rows.filter((row) => row.slot === slot.key).length}</small>
              </button>
            ))}
          </div>
          <label className="arsenal-search">
            <Search size={16} aria-hidden="true" />
            <input type="search" placeholder="Filter shown gear" value={query} onChange={(event) => setQuery(event.target.value)} />
          </label>
          <select aria-label="Sort gear" value={sortBy} onChange={(event) => onSortChange(event.target.value as "name" | "mastery")}>
            <option value="name">Best score</option>
            <option value="mastery">Mastery</option>
          </select>
        </div>

        <div className="arsenal-results-heading"><span>{visibleRows.length} gear pieces</span><span>Page {page} of {pageCount}</span></div>
        <div className="arsenal-card-grid" aria-label="Gear inventory">
          {visibleRows.length === 0 ? (
            <div className="arsenal-empty"><strong>No gear in this slot</strong><span>Add a piece or choose another slot.</span><button type="button" onClick={onAdd}><Plus size={14} aria-hidden="true" /> Add gear</button></div>
          ) : pageRows.map((row) => (
            <article
              key={row.id}
              className={`arsenal-gear-card is-${row.quality} ${row.equipped ? "is-equipped" : ""} ${selectedItem?.id === row.id ? "is-selected" : ""}`}
              tabIndex={0}
              onClick={() => setSelectedId(row.id)}
              onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") setSelectedId(row.id); }}
            >
              <header>
                <span className="arsenal-card-image"><img src={row.image} alt="" /></span>
                <span><strong>{row.name}</strong><small>{row.slotLabel}{row.weaponType ? ` / ${row.weaponType}` : ""}</small><em>{row.setName}</em></span>
                <span className="arsenal-card-grade"><strong>{row.grade}</strong><small>{row.score.toFixed(2)}%</small></span>
              </header>
              <div className="arsenal-card-substats">
                {row.subs.slice(0, 6).map((sub, index) => (
                  <span key={`${sub.type}-${index}`}><small>{sub.type}{sub.tuned ? " *" : ""}</small><strong>{sub.value}</strong></span>
                ))}
              </div>
              <footer>
                <button type="button" className="arsenal-equip-command" onClick={(event) => { event.stopPropagation(); onEquip(row.id); }}>{row.equipped ? <><Check size={13} aria-hidden="true" /> Equipped</> : "Equip"}</button>
                {row.mastery !== undefined && <span>MM {row.mastery}</span>}
                <button type="button" title={`Edit ${row.name}`} aria-label={`Edit ${row.name}`} onClick={(event) => { event.stopPropagation(); onEdit(row.id); }}>
                  <Pencil size={16} aria-hidden="true" />
                </button>
              </footer>
            </article>
          ))}
        </div>
        {pageCount > 1 && <nav className="arsenal-pagination" aria-label="Gear pages"><button type="button" aria-label="Previous page" disabled={page === 1} onClick={() => setPage((value) => value - 1)}><ChevronLeft size={17} /></button><span>Page {page} / {pageCount}</span><button type="button" aria-label="Next page" disabled={page === pageCount} onClick={() => setPage((value) => value + 1)}><ChevronRight size={17} /></button></nav>}
      </section>
    </main>
  );
}
