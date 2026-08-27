import fs from 'node:fs';

const path = 'src/App.tsx';
let source = fs.readFileSync(path, 'utf8');

const normalizeEol = (value) => value.replace(/\r\n/g, '\n');
const hasNormalized = (value, expected) => normalizeEol(value).includes(expected);
const replaceNormalized = (value, from, to, label) => {
  if (!hasNormalized(value, from)) throw new Error(`[jade-objectives-cache] ${label}`);
  const eol = value.includes('\r\n') ? '\r\n' : '\n';
  return value.replace(from.replaceAll('\n', eol), to.replaceAll('\n', eol));
};

const before = `  const jadeScenarioForCombo = (combo: GearItem[]) => ({
    ...jadeScenario,
    attunementBonuses: jadeAttunementsForCombo(combo),
    cacheSalt: \`\${activeTier.name}|\${food ? 1 : 0}|\${bowSelect}|\${selectedInnerWays.join(",")}\`,
  });`;

const after = `  const jadeScenarioForCombo = (combo: GearItem[]) => {
    const objectiveScenario = jadeObjective === JADE_OBJECTIVES.SHORT_FIGHT_BURST
      ? {
          duration: Math.min(Number(jadeScenario.duration || 60), 20),
          firstQiBreakTime: Math.min(Number(jadeScenario.firstQiBreakTime ?? 5), 5),
          qiBreakDuration: Math.min(Number(jadeScenario.qiBreakDuration || 8), 8),
        }
      : {};
    const gearSignature = combo.map((gear) => gear.id).sort().join(",");
    return {
      ...jadeScenario,
      ...objectiveScenario,
      attunementBonuses: jadeAttunementsForCombo(combo),
      // Candidate identity is intentionally part of the cache key because two
      // pieces can aggregate to the same visible panel while differing in set /
      // Attunement semantics that are consumed by event pricing.
      cacheSalt: \`\${activeTier.name}|\${food ? 1 : 0}|\${bowSelect}|\${selectedInnerWays.join(",")}|\${gearSignature}\`,
    };
  };`;

const hasCurrentObjectiveCacheHelper = hasNormalized(source, 'const jadeScenarioForCombo = (combo: GearItem[]) => {')
  && hasNormalized(source, 'const objectiveScenario = jadeObjective === JADE_OBJECTIVES.SHORT_FIGHT_BURST')
  && hasNormalized(source, 'const gearSignature = combo.map((gear) => gear.id).sort().join(",")')
  && hasNormalized(source, '|${gearSignature}`');

if (!hasCurrentObjectiveCacheHelper) {
  source = replaceNormalized(source, before, after, 'Missing generated Jade scenario helper anchor.');
}

if (!hasNormalized(source, 'const gearSignature = combo.map((gear) => gear.id).sort().join(",")')) {
  throw new Error('[jade-objectives-cache] Gear signature cache key missing.');
}
if (!hasNormalized(source, 'jadeObjective === JADE_OBJECTIVES.SHORT_FIGHT_BURST')) {
  throw new Error('[jade-objectives-cache] Short-fight objective scenario missing.');
}

fs.writeFileSync(path, source, 'utf8');
console.log('[jade-objectives-cache] PASS — Best Build cache keys include gear identity and Short-fight Burst gets a distinct default scenario.');
