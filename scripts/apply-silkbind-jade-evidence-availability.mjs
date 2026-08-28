import fs from 'node:fs';

const modelPath = 'src/pathModels/silkbindJade.mjs';
const attPath = 'src/data/gearAttunement.ts';
let model = fs.readFileSync(modelPath, 'utf8');
let att = fs.readFileSync(attPath, 'utf8');

function replaceRequired(source, from, to, label) {
  const normalizedSource = source.replace(/\r\n/g, "\n");
  if (normalizedSource.includes(to)) return source;
  if (!normalizedSource.includes(from)) throw new Error(`[jade-evidence] Missing anchor: ${label}`);
  const eol = source.includes("\r\n") ? "\r\n" : "\n";
  return source.replace(from.replaceAll("\n", eol), to.replaceAll("\n", eol));
}

// Global 2.1 makes the intended T96 pool current. Special and Charged are
// legacy identities only; the model must resolve each saved row to one canonical
// Frequent Projectile family without inventing a coefficient.
const legacyFamilies = `  'vernal-high-frequency-ballistic': { id:'vernal-high-frequency-ballistic', activeAtT96:true, provenance:PROVENANCE.CONFIRMED_OFFICIAL, displayAliases:['Vernal Umbrella Frequent Ballistic DMG Boost','Vernal Umbrella Frequent Projectile DMG Boost','Frequent Ballistic DMG Boost','Frequent Projectile DMG Boost'], legacyAliases:[], covers:['spring-away','unfading-flower'] },
  'vernal-special': { id:'vernal-special', activeAtT96:true, provenance:PROVENANCE.CONFIRMED_OFFICIAL, displayAliases:['Vernal Umbrella Special Skill DMG Boost','Special Skill Damage Boost'], legacyAliases:['Ninefold Spring: Special Skill DMG Bonus'], covers:['unfading-flower'] },
  'vernal-charged': { id:'vernal-charged', activeAtT96:true, provenance:PROVENANCE.CONFIRMED_OFFICIAL, displayAliases:['Vernal Umbrella Charged Skill DMG Boost','Charged Skill Damage Boost'], legacyAliases:[], covers:['spring-away'] },
  'vernal-light-heavy-derived': { id:'vernal-light-heavy-derived', activeAtT96:true, provenance:PROVENANCE.CONFIRMED_OFFICIAL, displayAliases:['Vernal Umbrella Light/Heavy Attack & Varied Combo DMG Boost','Vernal Umbrella Light/Heavy Follow-up DMG Boost','Light/Heavy Attack & Varied Combo DMG Boost'], legacyAliases:[], covers:['umbrella-light','umbrella-heavy-light'] },`;
const currentFamilies = `  'vernal-frequent-projectile': { id:'vernal-frequent-projectile', activeAtT96:true, provenance:PROVENANCE.CONFIRMED_OFFICIAL, displayAliases:['Vernal Umbrella Frequent Projectile DMG Boost','Frequent Projectile DMG Boost'], legacyAliases:['Vernal Umbrella Frequent Ballistic DMG Boost','Frequent Ballistic DMG Boost','Vernal Umbrella Special Skill DMG Boost','Special Skill Damage Boost','Ninefold Spring: Special Skill DMG Bonus','Vernal Umbrella Charged Skill DMG Boost','Charged Skill Damage Boost'], covers:['spring-away','unfading-flower'] },
  'vernal-light-heavy-derived': { id:'vernal-light-heavy-derived', activeAtT96:true, provenance:PROVENANCE.CONFIRMED_OFFICIAL, displayAliases:['Vernal Umbrella Light/Heavy Attack & Varied Combo DMG Boost','Vernal Umbrella Light/Heavy Follow-up DMG Boost','Light/Heavy Attack & Varied Combo DMG Boost'], legacyAliases:[], covers:['umbrella-light','umbrella-heavy-light'] },`;
model = replaceRequired(model, legacyFamilies, currentFamilies, 'Global 2.1 Vernal Attunement families');

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

// Earlier generated states can still carry the old current selector rows. They
// are removed here; aliases in the canonical row preserve imports and saved data.
for (const id of ['vernal-high-frequency-ballistic', 'vernal-special-t96', 'vernal-charged-t96']) {
  att = att.replace(new RegExp(`  \\{ id: "${id}",[^\\n]*\\n`, 'g'), '');
}

if (!model.includes("'vernal-frequent-projectile': { id:'vernal-frequent-projectile', activeAtT96:true")) throw new Error('[jade-evidence] Global 2.1 Frequent Projectile contract missing.');
if (model.includes('OFFICIAL_POOL_FIX_PENDING')) throw new Error('[jade-evidence] Superseded pool-pending availability remains.');
if (!model.includes("'forsaken-fame'")) throw new Error('[jade-evidence] Forsaken Fame contract missing.');
if (!att.includes('id: "vernal-frequent-projectile"') || !att.includes('id: "vernal-light-heavy-derived"')) throw new Error('[jade-evidence] Current Global 2.1 selector rows missing.');
if (att.includes('id: "vernal-high-frequency-ballistic"') || att.includes('id: "vernal-special-t96"') || att.includes('id: "vernal-charged-t96"')) throw new Error('[jade-evidence] Legacy Vernal rows still exposed in current selector.');

fs.writeFileSync(modelPath, model, 'utf8');
fs.writeFileSync(attPath, att, 'utf8');
console.log('[jade-evidence] PASS — Global 2.1 exposes Frequent Projectile and Light/Heavy current families; legacy Special/Charged resolve through aliases without fabricated coefficients.');
