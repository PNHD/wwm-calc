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
}: ArsenalWorkspaceProps) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
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
  useEffect(() => setPage(1), [activeSlot, query, sortBy]);
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);

  return (
    <main className="arsenal-workspace" id="main-content">
      <header className="product-page-heading">
        <div>
          <span className="product-kicker">Arsenal</span>
          <h1>Gear inventory</h1>
          <p>Equip, inspect, and compare every saved piece.</p>
        </div>
        <button className="product-primary-button" type="button" onClick={onAdd}>
          <Plus size={17} aria-hidden="true" /> Add gear
        </button>
      </header>

      <section className="arsenal-loadout" aria-label="Equipped gear">
        <div className="product-section-heading">
          <div><h2>Current loadout</h2><p>{equipped.filter((slot) => slot.item).length}/8 slots equipped</p></div>
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

      <section className="arsenal-inventory">
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
            <div className="arsenal-empty"><strong>No gear in this slot</strong><span>Add a piece or choose another slot.</span></div>
          ) : pageRows.map((row) => (
            <article
              key={row.id}
              className={`arsenal-gear-card is-${row.quality} ${row.equipped ? "is-equipped" : ""}`}
              tabIndex={0}
              onClick={() => onEquip(row.id)}
              onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onEquip(row.id); }}
            >
              <header>
                <span className="arsenal-card-image"><img src={row.image} alt="" /></span>
                <span><strong>{row.name}</strong><small>{row.slotLabel}{row.weaponType ? ` / ${row.weaponType}` : ""}</small><em>{row.setName}</em></span>
                <span className="arsenal-card-grade"><strong>{row.grade}</strong><small>{row.score.toFixed(2)}%</small></span>
              </header>
              <div className="arsenal-card-substats">
                {row.subs.slice(0, 4).map((sub, index) => (
                  <span key={`${sub.type}-${index}`}><small>{sub.type}{sub.tuned ? " *" : ""}</small><strong>{sub.value}</strong></span>
                ))}
              </div>
              <footer>
                <span>{row.equipped ? <><Check size={13} aria-hidden="true" /> Equipped</> : "Click to equip"}</span>
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
