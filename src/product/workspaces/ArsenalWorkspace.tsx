import { Check, Pencil, Plus, Search } from "lucide-react";
import { useState } from "react";

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
                {slot.label}
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

        <div className="arsenal-table" role="table" aria-label="Gear inventory">
          <div className="arsenal-table-head" role="row">
            <span role="columnheader">Item</span>
            <span role="columnheader">Set</span>
            <span role="columnheader">Substats</span>
            <span role="columnheader">Mastery</span>
            <span role="columnheader">Grade</span>
            <span role="columnheader"><span className="sr-only">Actions</span></span>
          </div>
          {visibleRows.length === 0 ? (
            <div className="arsenal-empty"><strong>No gear in this slot</strong><span>Add a piece or choose another slot.</span></div>
          ) : visibleRows.map((row) => (
            <div
              key={row.id}
              className={`arsenal-table-row ${row.equipped ? "is-equipped" : ""}`}
              role="row"
              tabIndex={0}
              onClick={() => onEquip(row.id)}
              onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onEquip(row.id); }}
            >
              <span className="arsenal-item-cell" role="cell">
                <span className={`arsenal-item-image is-${row.quality}`}><img src={row.image} alt="" /></span>
                <span><strong>{row.name}</strong><small>{row.slotLabel}{row.weaponType ? ` / ${row.weaponType}` : ""}</small></span>
                {row.equipped && <i><Check size={12} aria-hidden="true" /> Equipped</i>}
              </span>
              <span className="arsenal-set-cell" role="cell">{row.setName}</span>
              <span className="arsenal-substats" role="cell">
                {row.subs.slice(0, 4).map((sub, index) => (
                  <span key={`${sub.type}-${index}`}><small>{sub.type}{sub.tuned ? " *" : ""}</small><strong>{sub.value}</strong></span>
                ))}
              </span>
              <span className="arsenal-mastery" role="cell">{row.mastery ?? "-"}</span>
              <span className="arsenal-grade" role="cell" data-grade={row.grade}><strong>{row.grade}</strong><small>{row.score.toFixed(2)}%</small></span>
              <span className="arsenal-row-actions" role="cell">
                <button type="button" title={`Edit ${row.name}`} aria-label={`Edit ${row.name}`} onClick={(event) => { event.stopPropagation(); onEdit(row.id); }}>
                  <Pencil size={16} aria-hidden="true" />
                </button>
              </span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
