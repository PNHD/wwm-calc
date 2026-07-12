// Curated from “The Ultimate WWM Speedrun Guide”, updated 2026-07-10.
// Execution guidance is intentionally separate from calc.ts: boss AI, ping and
// animation-cancel results are not stable numerical inputs to the Global formula.
export interface SpeedrunPlaybook {
  role: string;
  gear: string;
  innerWays: string;
  prepull: string[];
  rotation: string[];
  team: string[];
  cautions: string[];
}

export const SPEEDRUN_PLAYBOOK: Record<string, SpeedrunPlaybook> = {
  "bellstrike-splendor": {
    role: "Nameless — Qi Imbalance / Mountain’s Might support burst",
    gear: "Jadeware; prioritize Max Physical, All Martial, Boss DMG, then Sword boost. Guide targets depend on the chosen affinity setup.",
    innerWays: "Sword Morph + Battle Anthem + Mountain’s Might, then Insightful Strike for ceiling or Morale Chant for consistent uptime.",
    prepull: ["Pre-Spear Q cancel → pre-Flute is the smoother opener.", "Use Ghostly Step prepull only when a perfect dodge can be fitted for its 8s damage window."],
    rotation: ["Keep Qi Imbalance active (15s); sync Spear Q and Jadeware on their 12s cadence.", "Save Spear Q and Dian Jian for Exhausted burst; use Energy Surge for animation cancellation."],
    team: ["Nameless contributes +10% team Qi break in the guide.", "Assign only one Dragon’s Breath user for the fire DoT."],
    cautions: ["Guide rotations vary materially by ping; do not treat its wave counts as a Global DPS coefficient.", "Use the boss-specific plan when moonwalk or downtime changes the loop."],
  },
  "bellstrike-umbra": {
    role: "Strategic Sword — bleed explosion and armor-shred maintenance",
    gear: "Eaglerise recommended; Max Physical, Power, Affinity Rate, Momentum, Max Bellstrike, then Crit/Precision.",
    innerWays: "Tier 6 preferred; Morale Chant is the stable option while the affinity setup has the higher ceiling.",
    prepull: ["Pre-drink Poet → Flute cancel.", "Start with Sword Q ×2 and cancel Spear Q on its 10-hit combo."],
    rotation: ["Maintain armor shred by remaining duration, not only by cooldown.", "Use Spear Special at two bleed stacks, then cancel Sword/Spear specials after the valuable hit."],
    team: ["Good Dragon’s Breath assignee when its DoT bonus is available."],
    cautions: ["High ping (>75ms in the guide) makes the execution unreliable.", "Never reset the loop except for mechanics."],
  },
  "bamboocut-wind": {
    role: "Twinblade / Rope Dart — rat-steal, perfect-dodge and Qi-break specialist",
    gear: "Crit / Max ATK / Hawkwing (guide target: 18% affinity, 66% crit) or Swallowcall.",
    innerWays: "Echoes of Oblivion + Vendetta; Breaking Point, Five Fold Bleed, Morale Chant or Bitter Seasons by team setup.",
    prepull: ["Ghostly Step → charge rats → spawn at 3 → charge again → Rope Q around 0.5s."],
    rotation: ["Use 123Q / 123E to reset Flamelash and preserve the ring attack (rat-steal).", "Align perfect dodge for Breaking Point, Ghostly Step and Samsara buffs."],
    team: ["Bone Corrosion adds +5% Qi damage for its applier; poison Divinecraft is suggested if break is slow."],
    cautions: ["The source explicitly marks this path WIP and boss/ping dependent.", "Do not price rat-steal or dodge RNG as a fixed DPS bonus."],
  },
  "bamboocut-dust": {
    role: "Dust — Soulbreak applier and team Qi-break support",
    gear: "Use the existing Global-stat ranking; guide emphasizes keeping Soul Loss/Soulbreak and Umbrella perfect catches flowing.",
    innerWays: "Phantom Rally is described as crucial for fading-crimson restoration; choose remaining ways by boss and team plan.",
    prepull: ["Pre-buff only effects that persist to first hit; align long casts before combat starts."],
    rotation: ["Soul Loss reaches seven stacks then converts to Soulbreak; Burn and Bury resets its timer.", "Perfect-catch Scarlet Spin is the umbrella damage core."],
    team: ["Dust contributes +5% team Qi break in the guide.", "Soulbreak grants the applier +5% Qi and damage taken on the boss."],
    cautions: ["Assign Dragon’s Breath to one member only; do not add it to every member rotation."],
  },
  "silkbind-jade": {
    role: "Fanbrella — Lingering Bone, Jadebreak and drone coordination",
    gear: "Crit / Max ATK with Rainwhisper, Mistwillow or Hawkwing; attune Physical Penetration and Vernal Umbrella Special DMG.",
    innerWays: "Blossom Barrage + Star Reacher required by the guide; Morale Chant, Breaking Point, Thunderous Bloom or Throat-Piercing Art are matchup choices.",
    prepull: ["Flute → wall → Umbrella Q baseline starter.", "For a Lingering opener: drink at 3 → Fan Q at 2 → Umbrella QQ → drone."],
    rotation: ["Keep Jadebreak, Lingering Bone and Combo active; either collect blossoms or keep drone up.", "Offset drone timing with other Fanbrellas to extend Lingering Bone."],
    team: ["Enable teammate Lingering when another Fanbrella coordinates drone extension.", "Fan Q, Umbrella Heavy+Light and Soaring Spin provide perfect-dodge windows."],
    cautions: ["Qi-break timing changes the correct route; use the boss playbook rather than one static rotation."],
  },
  "silkbind-deluge": {
    role: "Healer — survival, downtime extension and mystic damage support",
    gear: "Crit / Max or Min ATK with Rainwhisper/Ivorybloom/Hawkwing; attune Physical Penetration and Fan Martial Art.",
    innerWays: "Fury Harvest, Seasonal Edge and Royal Remedy for vitality; healing setup depends on the fight.",
    prepull: ["Pre-cast long skills; coordinate Flute roughly 3s before Qi break when its burst window matters."],
    rotation: ["Use healing output for team stability and the agreed down-time extension rather than forcing a DPS loop."],
    team: ["Only apply a healing-umbrella damage buff after the prior one ends; overlapping wastes it.", "Healers are a useful Dragon’s Breath assignee when mystic damage is boosted."],
    cautions: ["Healing is not currently priced by the DPS engine; recommendations remain a playbook, not a score."],
  },
  "stonesplit-might": {
    role: "Tank / vulnerability maintainer",
    gear: "Crit / Max ATK with Hawkwing or Rainwhisper; guide caps orange critical around 56% for Stonesplit-Might.",
    innerWays: "Match the team’s support plan; retain enough durability to keep vulnerability and mechanics stable.",
    prepull: ["Pre-wall or pre-drink only when the incoming boss schedule allows it."],
    rotation: ["Keep Vulnerability active; hold spear for mystic skills when assigned fire/frog duty."],
    team: ["Vulnerability is +8% HP/Qi damage for everyone; Stonesplit-Might attacks receive +16%.", "Strong Dragon’s Breath/Toad assignee when no better fire user exists."],
    cautions: ["Do not trade required mechanic uptime for a theoretical personal-DPS gain."],
  },
};

export const SPEEDRUN_BOSSES = [
  { id: "wolf-maiden", name: "Wolf Maiden", notes: ["Chasing Moon begins around 75% and 40% HP; a first-break push below 40% can remove the second phase.", "Save Breaking Point T6 dodge for the second-last/last Chasing Moon hit; use wolf assignment to collect Blood Moon while others build vitality.", "Qi immunity during Severing Howl: hold the break for immediately after it."] },
  { id: "snake-doctor", name: "Snake Doctor", notes: ["Prioritize reliable hits: movement can make Soaring Spin miss.", "Fanbrella teams should align Umbrella Q to maximize drone extension."] },
  { id: "tian-ying", name: "Tian Ying", notes: ["Burst to Qi break before Golden Blast when possible.", "If not killing during staff attack, spread staff mechanics and re-break one staff after Heavenly Wrath."] },
  { id: "guo-xin", name: "Guo Xin", notes: ["Assign three low-loss players to deflect Mo Blade soldiers; highest DPS carry flags.", "Bird skip needs no birds hitting flags and a 22–24s kill timing for the bird wave."] },
  { id: "everdeer", name: "Everdeer", notes: ["Break then push to 50% before the HP lock; kill wolves after the lock.", "A spark pickup at start can prevent the first fly; movement skills can avoid ritual teleport."] },
] as const;
