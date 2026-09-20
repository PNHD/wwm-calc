export const WEAPON_DATA_VERSION = '2026-09-20.v2-shadovex-2026-08-02';

const BLUE_COLORS = Object.freeze([
  'Azure Gold', 'Bud Yellow', 'Dusk Purple', 'Feather Gray', 'Ink Dust',
  'Pine Green', 'Rouge', 'Vast Expanse', 'Vermilion Railing'
]);

const PURPLE_COLORS = Object.freeze([
  'Apricot Pink', 'Cold Crow', 'Cuckoo', 'Smoke Blue', 'Southern Tangerine',
  'Tiny Grass', 'Water Hue', 'White Shell', 'Wisteria Purple'
]);

const GOLD_COLORS = Object.freeze([
  'Crystal Peach', 'Dragon Abyss', 'Gold', 'Ice Spring', 'Jasper',
  'Obsidian', 'Pearl', 'Purple Glass', 'Red Brocade'
]);

export const WEAPON_PROFILES = Object.freeze({
  Cloudsplitter: Object.freeze({
    type: 'Sword',
    sets: Object.freeze({
      blue: Object.freeze(['Set - Winter Gale']),
      purple: Object.freeze(['Set - Night Mist', 'Set - Bright Sky']),
      gold: Object.freeze(['Set - Flying Fire', 'Set - Startling Thunder'])
    })
  }),
  'Phoenix Cry': Object.freeze({
    type: 'Spear',
    sets: Object.freeze({
      blue: Object.freeze(['Set - Magnificent Splendor']),
      purple: Object.freeze(['Set - Guardian Auspice', 'Set - Morning Star']),
      gold: Object.freeze(['Set - Evening Star', 'Set - Sparkling Confusion'])
    })
  }),
  'Kun Umbra': Object.freeze({
    type: 'Umbrella',
    sets: Object.freeze({
      blue: Object.freeze(['Set - Towering Peaks']),
      purple: Object.freeze(['Set - Rainbow', 'Set - Grand Purity']),
      gold: Object.freeze(['Set - Layered Sky', 'Set - Holding Light'])
    })
  }),
  'Cosmos Sweep': Object.freeze({
    type: 'Fan',
    sets: Object.freeze({
      blue: Object.freeze(['Set - Jade Stage']),
      purple: Object.freeze(['Set - Gold Pavilion', 'Set - Mountain Pass']),
      gold: Object.freeze(['Set - Nine Lands', 'Set - Vast Ocean', 'Set - Deep Abyss'])
    })
  }),
  Dawnriven: Object.freeze({
    type: 'Twinblades',
    sets: Object.freeze({
      blue: Object.freeze(['Set - Lingering Bone']),
      purple: Object.freeze(['Set - Flame Dragon', 'Set - Sky East']),
      gold: Object.freeze(['Set - Flying Light', 'Set - Supreme Oneness'])
    })
  }),
  'Beyond All Forms': Object.freeze({
    type: 'Rope Dart',
    sets: Object.freeze({
      blue: Object.freeze(['Set - Pure Lotus']),
      purple: Object.freeze(['Set - Mountain Wraith', 'Set - Truth Listener']),
      gold: Object.freeze(['Set - Delicate', 'Set - Life and Ruin'])
    })
  }),
  "Aeon's Dirge": Object.freeze({
    type: 'Mo Blade',
    sets: Object.freeze({
      blue: Object.freeze(['Set - Flint Spark']),
      purple: Object.freeze(['Set - Ethereal Wind', 'Set - Wine Song']),
      gold: Object.freeze(['Set - Night Dream', 'Set - Western Wilds'])
    })
  }),
  Sunstriking: Object.freeze({
    type: 'Heng Blade',
    sets: Object.freeze({
      blue: Object.freeze(['Set - Candle Smoke']),
      purple: Object.freeze(['Set - Calamity Ash', 'Set - Clear Sea']),
      gold: Object.freeze(['Set - Burning Sun', 'Set - Frost Moon'])
    })
  }),
  'Phoenix Ascent': Object.freeze({
    type: 'Bow',
    sets: Object.freeze({
      blue: Object.freeze(['Set - Swift Plume']),
      purple: Object.freeze(['Set - Dawn Light', 'Set - Night Shadow']),
      gold: Object.freeze(['Set - Pure Grace', 'Set - Soaring Light'])
    })
  }),
  "Dragon's Vault": Object.freeze({
    type: 'Sword',
    sets: Object.freeze({
      blue: Object.freeze(['Set - Mountain Bearer']),
      purple: Object.freeze(['Set - Biting Edge', 'Set - Coiling Branch']),
      gold: Object.freeze(['Set - Forged Rainbow', 'Set - Ice Bearer'])
    })
  }),
  'Crest Aria': Object.freeze({
    type: 'Gauntlet',
    sets: Object.freeze({
      blue: Object.freeze(['Set - Jadechime']),
      purple: Object.freeze(['Set - Cloudlight', 'Set - Darkecho']),
      gold: Object.freeze(['Set - Firesong', 'Set - Voidchant'])
    })
  })
});

export const WEAPONS = Object.freeze(Object.keys(WEAPON_PROFILES));

export const APPEARANCES = Object.freeze({
  1: Object.freeze({
    blue: Object.freeze([...BLUE_COLORS, 'Set 1']),
    purple: Object.freeze([...PURPLE_COLORS, 'Set 1', 'Set 2']),
    gold: Object.freeze([...GOLD_COLORS, 'Set 1', 'Set 2'])
  }),
  234: Object.freeze({
    blue: Object.freeze(['Set 1']),
    purple: Object.freeze(['Set 1', 'Set 2']),
    gold: Object.freeze(['Set 1', 'Set 2'])
  }),
  5: Object.freeze({ gold: Object.freeze(['Sunlight']) })
});

function profileFor(weapon) {
  return WEAPON_PROFILES[String(weapon || '')] || null;
}

export function setsForWeapon(weapon, quality) {
  const profile = profileFor(weapon);
  const normalized = ['blue', 'purple', 'gold'].includes(quality) ? quality : 'blue';
  return profile ? [...profile.sets[normalized]] : [...APPEARANCES[234][normalized]];
}

export function appearancesFor(slotId, quality, weapon = '') {
  const id = Number(slotId);
  const normalized = ['blue', 'purple', 'gold'].includes(quality) ? quality : 'blue';
  if (id === 5) return ['Sunlight'];

  const profile = profileFor(weapon);
  if (!profile) {
    const group = id === 1 ? APPEARANCES[1] : APPEARANCES[234];
    return [...(group[normalized] || group.blue)];
  }

  if (id === 1) {
    const colors = normalized === 'blue' ? BLUE_COLORS : normalized === 'purple' ? PURPLE_COLORS : GOLD_COLORS;
    return [...colors, ...profile.sets[normalized]];
  }
  return [...profile.sets[normalized]];
}

export function matchingSetName(slots, weapon = '') {
  const firstFour = Array.isArray(slots) ? slots.slice(0, 4) : [];
  if (firstFour.length !== 4 || firstFour.some(slot => !slot?.active)) return '';
  const candidate = String(firstFour[0]?.attribute || '');
  if (!candidate || !firstFour.every(slot => slot.attribute === candidate)) return '';

  const profile = profileFor(weapon);
  if (profile) {
    const knownSets = new Set(['blue', 'purple', 'gold'].flatMap(quality => profile.sets[quality]));
    return knownSets.has(candidate) ? candidate : '';
  }

  return candidate.startsWith('Set - ') || candidate === 'Set 1' || candidate === 'Set 2' ? candidate : '';
}

export function brightLightAppearance(slots, weapon = '') {
  return matchingSetName(slots, weapon) || 'Sunlight';
}
