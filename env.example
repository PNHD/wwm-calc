import React, { useState } from "react";

export default function AttrConverter({ onApply }: { onApply: (stats: any) => void }) {
  const [attrs, setAttrs] = useState({ constitution: 0, defense: 0, agility: 0, power: 0, strength: 0 });

  const conversions = {
    constitution: { hp: 60 },
    defense: { hp: 17, physDef: 0.5 },
    agility: { minOuter: 0.9, crit: 0.076 },
    power: { maxOuter: 0.9, aff: 0.038 },
    strength: { minOuter: 0.225, maxOuter: 1.36 },
  };

  const calculate = () => {
    let result = { minOuter: 0, maxOuter: 0, crit: 0, aff: 0 };
    // Simplified conversion logic based on user request
    result.minOuter += attrs.agility * 0.9 + attrs.strength * 0.225;
    result.maxOuter += attrs.power * 0.9 + attrs.strength * 1.36;
    result.crit += attrs.agility * 0.076;
    result.aff += attrs.power * 0.038;
    return result;
  };

  return (
    <div className="bg-[#141210] p-4 rounded-xl border border-amber-900/20">
      <h3 className="text-amber-500 font-bold mb-3">5-Attribute Helper</h3>
      <div className="grid grid-cols-2 gap-3 text-xs mb-3">
        {Object.keys(attrs).map((key) => (
          <div key={key} className="flex flex-col">
            <label className="text-slate-400 capitalize">{key}</label>
            <input type="number" className="bg-slate-900 p-1 rounded" value={attrs[key as keyof typeof attrs]} onChange={e => setAttrs({...attrs, [key]: parseFloat(e.target.value) || 0})} />
          </div>
        ))}
      </div>
      <button className="bg-amber-600 text-white w-full py-2 rounded text-sm font-bold" onClick={() => onApply(calculate())}>Apply to Panel</button>
    </div>
  );
}
