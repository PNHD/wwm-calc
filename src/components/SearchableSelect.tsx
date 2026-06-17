import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom';

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; group?: string }[];
  placeholder?: string;
  className?: string;
}

export default function SearchableSelect({ value, onChange, options, placeholder = 'Select...', className = '' }: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  const updatePos = useCallback(() => {
    if (inputRef.current) {
      const r = inputRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 2, left: r.left, width: Math.max(r.width, 280) });
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePos();
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (inputRef.current?.contains(t)) return;
      if (dropdownRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, updatePos]);

  const selectedLabel = useMemo(() => {
    const opt = options.find(o => o.value === value);
    return opt ? opt.label : '';
  }, [value, options]);

  const filtered = useMemo(() => {
    if (!search) return options;
    const s = search.toLowerCase();
    return options.filter(o => o.label.toLowerCase().includes(s) || o.value.toLowerCase().includes(s));
  }, [search, options]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const o of filtered) {
      const g = o.group || '';
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(o);
    }
    return map;
  }, [filtered]);

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
    setSearch('');
    inputRef.current?.blur();
  };

  const dropdown = open ? ReactDOM.createPortal(
    <div
      ref={dropdownRef}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        width: pos.width,
        maxHeight: 320,
        overflowY: 'auto',
        background: '#0f172a',
        border: '1px solid #334155',
        borderRadius: 4,
        zIndex: 9999,
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
      }}
    >
      {filtered.length === 0 && (
        <div style={{ padding: '4px 6px', fontSize: 11, color: '#64748b' }}>No results</div>
      )}
      {[...grouped.entries()].map(([group, items]) => (
        <React.Fragment key={group}>
          {group && (
            <div style={{
              padding: '5px 8px',
              fontSize: 10,
              color: '#94a3b8',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              borderTop: '1px solid #1e293b',
            }}>
              {group}
            </div>
          )}
          {items.map(o => (
            <div
              key={o.value}
              onMouseDown={e => { e.preventDefault(); handleSelect(o.value); }}
              style={{
                padding: '5px 8px',
                fontSize: 12,
                color: o.value === value ? '#60a5fa' : '#f1f5f9',
                cursor: 'pointer',
                background: 'transparent',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#1e293b')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {o.label}
            </div>
          ))}
        </React.Fragment>
      ))}
    </div>,
    document.body
  ) : null;

  return (
    <div style={{ position: 'relative', display: 'inline-block', width: '100%', flex: '1.5' }} className={className}>
      <input
        ref={inputRef}
        type="text"
        value={open ? search : selectedLabel}
        placeholder={placeholder}
        onChange={e => setSearch(e.target.value)}
        onFocus={() => { setOpen(true); setSearch(''); updatePos(); }}
        onKeyDown={e => { if (e.key === 'Escape') { setOpen(false); setSearch(''); inputRef.current?.blur(); } }}
        style={{
          width: '100%',
          height: 28,
          padding: '2px 6px',
          fontSize: 11,
          background: '#0f172a',
          color: '#f1f5f9',
          border: '1px solid #334155',
          borderRadius: 4,
          outline: 'none',
          boxSizing: 'border-box',
        }}
      />
      {dropdown}
    </div>
  );
}
