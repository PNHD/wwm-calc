import fs from 'node:fs';

const modelPath = 'src/pathModels/silkbindJade.mjs';
const attPath = 'src/data/gearAttunement.ts';
let model = fs.readFileSync(modelPath, 'utf8');
let att = fs.readFileSync(attPath, 'utf8');

function replaceRequired(source, from, to, label) {
  if (source.includes(to)) return source;
  if (!source.includes(from)) throw new Error(`[jade-evidence] Missing anchor: ${label}`);
  return source.replace(from, to);
}

// Latest official evidence available to this model is the July 24 correction:
// the mistakenly displayed Frequent Ballistic and Light/Heavy+derived rows were
// corrected to Charged and Special, while the former two were explicitly still
// missing from the Attunement pool. Preserve their semantic families for legacy /
// intended-design compatibility, but do not advertise them as currently obtainable.
model = replaceRequired(
  model,
  "'vernal-high-frequency-ballistic': { id:'vernal-high-frequency-ballistic', activeAtT96:true, provenance:PROVENANCE.CONFIRMED_OFFICIAL,",
  "'vernal-high-frequency-ballistic': { id:'vernal-high-frequency-ballistic', activeAtT96:false, availability:'OFFICIAL_POOL_FIX_PENDING', provenance:PROVENANCE.CONFIRMED_OFFICIAL,",
  'Frequent Ballistic current availability',
);
model = replaceRequired(
  model,
  "'vernal-light-heavy-derived': { id:'vernal-light-heavy-derived', activeAtT96:true, provenance:PROVENANCE.CONFIRMED_OFFICIAL,",
  "'vernal-light-heavy-derived': { id:'vernal-light-heavy-derived', activeAtT96:false, availability:'OFFICIAL_POOL_FIX_PENDING', provenance:PROVENANCE.CONFIRMED_OFFICIAL,",
  'Light/Heavy derived current availability',
);

// Account for the official 1.7 Forsaken Fame change without fabricating a base
// coefficient. The +45% PvE modifier and Endurance recovery are recorded in the
// event contract; pricing stays disabled until a trustworthy current coefficient /
// app-skill mapping exists.
model = replaceRequired(
  model,
  "  'fan-pursuit': { name:'Fan Pursuit', duration:1.15, tags:['weapon','fan','pursuit'], appSkill:'扇普通重击派生(风墙阴阳低真气鬼掣)', priced:true },\n",
  "  'fan-pursuit': { name:'Fan Pursuit', duration:1.15, tags:['weapon','fan','pursuit'], appSkill:'扇普通重击派生(风墙阴阳低真气鬼掣)', priced:true },\n  'forsaken-fame': { name:'Forsaken Fame', duration:0, tags:['weapon','fan','charged','pve'], appSkill:null, priced:false, pveDamageBonusPct:45, enduranceRecovery:true, provenance:PROVENANCE.CONFIRMED_OFFICIAL },\n",
  'Forsaken Fame event contract',
);
model = replaceRequired(
  model,
  "  if(event.id==='unfading-flower'||event.id==='spring-away'){m*=1.15;reasons.push('Official 1.7 PvE +15%');}\n",
  "  if(event.id==='unfading-flower'||event.id==='spring-away'){m*=1.15;reasons.push('Official 1.7 PvE +15%');}\n  if(event.id==='forsaken-fame'){m*=1.45;reasons.push('Official 1.7 Forsaken Fame PvE +45%');}\n",
  'Forsaken Fame official multiplier',
);

// The manual current-T96 Attunement selector must expose only the families that
// official July 24 evidence supports as actually present. Semantic resolution of
// the other two remains in the Jade path model for non-destructive saved data.
const unavailableCurrentRows = [
  '  { id: "vernal-high-frequency-ballistic", family: "umbrella", statKey: "Vernal Frequent Ballistic DMG Boost", weaponName: "Vernal Umbrella", aliases: ["vernal umbrella frequent ballistic dmg boost", "vernal umbrella frequent projectile dmg boost", "frequent ballistic dmg boost", "frequent projectile dmg boost"], displayName: "Vernal Umbrella — Frequent Ballistic DMG Boost" },\n',
  '  { id: "vernal-light-heavy-derived", family: "umbrella", statKey: "Vernal Light Heavy Derived DMG Boost", weaponName: "Vernal Umbrella", aliases: ["vernal umbrella light heavy attack varied combo dmg boost", "vernal umbrella light heavy follow up dmg boost", "light heavy attack varied combo dmg boost"], displayName: "Vernal Umbrella — Light/Heavy + Derived DMG Boost" },\n',
];
for (const row of unavailableCurrentRows) att = att.replace(row, '');

if (!model.includes("activeAtT96:false, availability:'OFFICIAL_POOL_FIX_PENDING'")) throw new Error('[jade-evidence] Availability correction missing.');
if (!model.includes("'forsaken-fame'")) throw new Error('[jade-evidence] Forsaken Fame contract missing.');
if (att.includes('id: "vernal-high-frequency-ballistic"') || att.includes('id: "vernal-light-heavy-derived"')) throw new Error('[jade-evidence] Unavailable T96 rows still exposed in current selector.');
if (!att.includes('id: "vernal-special-t96"') || !att.includes('id: "vernal-charged-t96"')) throw new Error('[jade-evidence] Current Special/Charged rows missing.');

fs.writeFileSync(modelPath, model, 'utf8');
fs.writeFileSync(attPath, att, 'utf8');
console.log('[jade-evidence] PASS — current T96 Attunement availability follows July 24 evidence; Forsaken Fame 1.7 effect is explicitly accounted for without fabricated base damage.');
