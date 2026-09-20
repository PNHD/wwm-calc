export const WEAPON_DATA_VERSION = '2026-09-20.v1';

export const WEAPONS = [
  'Cloudsplitter',
  'Phoenix Cry',
  'Kun Umbra',
  'Cosmos Sweep',
  'Dawnriven',
  'Beyond All Forms',
  "Aeon's Dirge",
  'Sunstriking',
  'Phoenix Ascent',
  "Dragon's Vault",
  'Crest Aria'
];

export const APPEARANCES = Object.freeze({
  1: {
    blue: ['Set 1', 'Rouge', 'Lapis', 'Vast', 'Vermilion', 'Pine Green', 'Sprout Yellow', 'Dusk Violet', 'Feather Gray', 'Ink Dust'],
    purple: ['Set 1', 'Set 2', 'Apricot Pink', 'Smoke Blue', 'Water Hue', 'Azalea', 'Young Grass', 'Tangerine', 'Wisteria', 'White Shell', 'Jackdaw'],
    gold: ['Set 1', 'Set 2', 'Peach Crystal', 'Dragon Abyss', 'Ice Spring', 'Red Brocade', 'Jade', 'Gold', 'Violet Glaze', 'Pearl', 'Obsidian']
  },
  234: {
    blue: ['Set 1'],
    purple: ['Set 1', 'Set 2'],
    gold: ['Set 1', 'Set 2']
  },
  5: { gold: ['Sunlight'] }
});

export function appearancesFor(slotId, quality) {
  if (slotId === 5) return ['Sunlight'];
  const group = slotId === 1 ? APPEARANCES[1] : APPEARANCES[234];
  return group[quality] || group.blue;
}

