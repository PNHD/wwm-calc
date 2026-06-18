// Auto-extracted from 燕云调律计算器 (NGA Violetta). Where Winds Meet Global Lv95/Tier91.
// Damage formula: multiplicative zones. Pen: (pen-res)/200 (or /100 if negative).

export const WWM_DATA = {
  "_meta": {
    "source": "燕云调律计算器 by NGA Violetta (停更 / no longer updated)",
    "extractedFor": "Where Winds Meet Global — Lv95 character / Tier 91 gear (column 95下)",
    "damageFormula": "DMG = base — critZone — affZone — dmgUpZone — independentZone — dmgReduceZone — penZone — dingyinZone — deepenZone (multiplicative zones, per 伤害公式 sheet)",
    "penFormula": "(pen - resistance) / 200 if positive, else / 100",
    "judgeResFormula": "precision = 65% + otherPrec/(1+judgeRes); panelCrit = crit/(1+judgeRes)",
    "note": "Class graduation panels & marginal gains computed at native CN level (100/105). Tier constants below cover all levels incl. 95下 (T91 Global)."
  },
  "tiers": {
    "95下": {
      "base": {
        "minOuter": 894.89,
        "maxOuter": 1648.08,
        "precision": 0.94,
        "crit": 0.3041,
        "directCrit": 0.0,
        "critDmg": 0.5,
        "aff": 0.15205,
        "directAff": 0.0,
        "affDmg": 0.35,
        "elemMin": 160.0,
        "elemMax": 320.0,
        "outerPen": 0.0,
        "outerDmgUp": 0.0,
        "elemPen": 10.8,
        "elemDmgUp": 0.054,
        "judgeRes": 0.45
      },
      "subCaps": {
        "jin": 40.4,
        "min": 40.4,
        "shi": 40.4,
        "subMinOuter": 63.8,
        "subMaxOuter": 63.8,
        "subPrec": 0.066,
        "subCrit": 0.074,
        "subAff": 0.036,
        "subElemMin": 36.2,
        "subElemMax": 36.2,
        "subAllWeapon": 0.026,
        "subOwnWeapon": 0.052
      }
    }
  },
  "skills": [
  // EVERSPRING UMBRELLA (醉梦游春) — Bamboocut-Dust weapon 1
  { "ver": "100", "weapon": "Everspring Umbrella", "name": "Scarlet Spin", "outerRatio": 1.8084, "fixed": 500, "elemRatio": 2.7126, "anim": 1.02, "note": "Main DPS spam. ~78 hits/60s in real parse." },
  { "ver": "100", "weapon": "Everspring Umbrella", "name": "Umbrella Toss", "outerRatio": 1.085, "fixed": 300, "elemRatio": 1.6275, "anim": 0.5, "note": "Perfect = Normal dmg. Each toss = 1 hit." },
  { "ver": "100", "weapon": "Everspring Umbrella", "name": "Umbrella Catch", "outerRatio": 0.7234, "fixed": 200, "elemRatio": 1.0851, "anim": 0.4, "note": "Each catch = 1 hit." },
  { "ver": "100", "weapon": "Everspring Umbrella", "name": "Resonance", "outerRatio": 0.5, "fixed": 0, "elemRatio": 0.75, "anim": 0.3, "note": "幻鸣 proc. Eats outer DMG talents. Does NOT eat Dingyin. Gets x2 umbrella bonus. Scales with 1-5 stacks." },
  { "ver": "105", "weapon": "Everspring Umbrella", "name": "Soulbreak", "outerRatio": 7.1041, "fixed": 1220, "elemRatio": 10.65615, "anim": 2.0, "note": "骑龙回马 — Mystic skill big burst. ~4 uses/60s." },
  { "ver": "105", "weapon": "Everspring Umbrella", "name": "Flute Chanting a Thousand Waves", "outerRatio": 3.974, "fixed": 930, "elemRatio": 5.961, "anim": 2.0, "note": "吹满 — Flute blow full charge. 11 hits/60s in parse." },
  { "ver": "100", "weapon": "Everspring Umbrella", "name": "Divinecraft - Fire", "outerRatio": 0.2954, "fixed": 42, "elemRatio": 0.2954, "anim": 0.3, "note": "爆燃 — Fire DoT tick. 58 hits/60s in parse. Non-direct dmg, eats DMG boost." },

  // UNFETTERED ROPE DART (粟子行云) — Bamboocut-Dust weapon 2
  { "ver": "100", "weapon": "Unfettered Rope Dart", "name": "Burn and Bury", "outerRatio": 3.1428, "fixed": 869, "elemRatio": 4.7143, "anim": 2.0, "note": "3-hit sequence. Count each Q cast as 1 hit." },
  { "ver": "100", "weapon": "Unfettered Rope Dart", "name": "Soul Sweep", "outerRatio": 2.29866, "fixed": 637, "elemRatio": 3.44799, "anim": 0.75, "note": "响指/Snap — forced crit. +20% dmg +27% crit dmg with 绳舟6." },
  { "ver": "100", "weapon": "Unfettered Rope Dart", "name": "Soaring Spin", "outerRatio": 3.6218, "fixed": 1005, "elemRatio": 5.4327, "anim": 2.1, "note": "Full charge + snap combo. Most efficient." },
  { "ver": "100", "weapon": "Unfettered Rope Dart", "name": "Rope Dart Charge (Stage 0)", "outerRatio": 1.1137, "fixed": 309, "elemRatio": 1.67055, "anim": 0.6 },
  { "ver": "100", "weapon": "Unfettered Rope Dart", "name": "Rope Dart Charge (Stage 1)", "outerRatio": 0.7839, "fixed": 218, "elemRatio": 1.17585, "anim": 0.5 },
  { "ver": "100", "weapon": "Unfettered Rope Dart", "name": "Piercing Dart", "outerRatio": 2.9358, "fixed": 451, "elemRatio": 4.4037, "anim": 3.7, "note": "Light attack full combo 4 segments." },
  { "ver": "100", "weapon": "Unfettered Rope Dart", "name": "Fire - Solid Foundation", "outerRatio": 0.5895, "fixed": 91, "elemRatio": 0.88425, "anim": 0.5, "note": "Segment 1 of light attack." },

  // MORTAL ROPE DART (泥犁三垢) — Bamboocut-Wind weapon 1
  { "ver": "100", "weapon": "Mortal Rope Dart", "name": "Mortal Dart Q (Full Combo)", "outerRatio": 3.6218, "fixed": 1005, "elemRatio": 5.4327, "anim": 2.1, "note": "Main rotation snap combo." },
  { "ver": "100", "weapon": "Mortal Rope Dart", "name": "Mortal Dart Red Blade (12345345)", "outerRatio": 12.9794, "fixed": 3598, "elemRatio": 19.4691, "anim": 9.064, "note": "Full red blade + derived 345. 1 hit per full combo." },
  { "ver": "100", "weapon": "Mortal Rope Dart", "name": "Mortal Dart Red Blade (345)", "outerRatio": 5.7155, "fixed": 1584, "elemRatio": 8.57325, "anim": 3.234, "note": "Derived follow-up only." },
  { "ver": "100", "weapon": "Mortal Rope Dart", "name": "Mortal Dart White Blade Light", "outerRatio": 1.9567, "fixed": 546, "elemRatio": 2.93505, "anim": 2.1, "note": "25 energy cost." },
  { "ver": "100", "weapon": "Mortal Rope Dart", "name": "Mortal Dart Cross Slash (Heavy)", "outerRatio": 3.2998, "fixed": 580, "elemRatio": 4.9497, "anim": 2.0, "note": "Rotate 6 hits + cross 2 hits, 25 energy." },
  { "ver": "100", "weapon": "Mortal Rope Dart", "name": "Mortal Dart Electric Drill", "outerRatio": 1.3548, "fixed": 376, "elemRatio": 2.0322, "anim": 1.0, "note": "6-segment tick. Enter total ticks as hits." },

  // INFERNAL TWINBLADES (鼠鼠) — Bamboocut-Wind weapon 2
  { "ver": "80",  "weapon": "Infernal Twinblades", "name": "Twinblades Light Combo (Full)", "outerRatio": 2.9358, "fixed": 451, "elemRatio": 4.4037, "anim": 3.7, "note": "4-segment combo." },
  { "ver": "100", "weapon": "Infernal Twinblades", "name": "Twinblades Q", "outerRatio": 0.1242, "fixed": 34, "elemRatio": 0.1863, "anim": 1.1, "note": "Low ratio but high frequency." },
  { "ver": "100", "weapon": "Infernal Twinblades", "name": "Twinblades Q (Cancel)", "outerRatio": 0.0621, "fixed": 17, "elemRatio": 0.09315, "anim": 0.3, "note": "1-hit cancel variant." },
  { "ver": "-",   "weapon": "Infernal Twinblades", "name": "Twinblades Charged", "outerRatio": 0.35, "fixed": 0, "elemRatio": 0.525, "anim": 1.55, "note": "1.55s charge, gives 10s buff." },
  { "ver": "80",  "weapon": "Infernal Twinblades", "name": "Twinblades Segment 1", "outerRatio": 0.5895, "fixed": 91, "elemRatio": 0.88425, "anim": 0.5 },
  { "ver": "80",  "weapon": "Infernal Twinblades", "name": "Twinblades Segment 2", "outerRatio": 0.6956, "fixed": 107, "elemRatio": 1.0434, "anim": 0.6 },

  // NAMELESS SWORD (无名剑) — Nameless weapon 1
  { "ver": "100", "weapon": "Nameless Sword", "name": "Nameless Sword Q", "outerRatio": 5.1266, "fixed": 1417, "elemRatio": 7.6899, "anim": 3.5, "note": "5-hit sequence. Count each Q cast as 1 hit." },
  { "ver": "100", "weapon": "Nameless Sword", "name": "Nameless Sword Q (Single Hit)", "outerRatio": 1.0253, "fixed": 283, "elemRatio": 1.53795, "anim": 0.518, "note": "Per-hit breakdown." },
  { "ver": "90",  "weapon": "Nameless Sword", "name": "Nameless Sword Heavy", "outerRatio": 1.7665, "fixed": 356, "elemRatio": 2.64975, "anim": 1.0 },
  { "ver": "100", "weapon": "Nameless Sword", "name": "Nameless Sword Charge Lv2", "outerRatio": 3.2664, "fixed": 904, "elemRatio": 4.8996, "anim": 2.0, "note": "25 stamina." },
  { "ver": "100", "weapon": "Nameless Sword", "name": "Nameless Sword Mystic Charge", "outerRatio": 4.7037, "fixed": 1300, "elemRatio": 7.05555, "anim": 2.5, "note": "With mystic buff, sword-spirit toss." },

  // NAMELESS SPEAR (无名枪) — Nameless weapon 2
  { "ver": "90",  "weapon": "Nameless Spear", "name": "Nameless Spear Q", "outerRatio": 0.497, "fixed": 101, "elemRatio": 0.7455, "anim": 0.735 },
  { "ver": "-",   "weapon": "Nameless Spear", "name": "Nameless Spear Windmill (Fast)", "outerRatio": 0.118, "fixed": 17.7, "elemRatio": 0.177, "anim": 0.3, "note": "Fast windmill tick." },
  { "ver": "-",   "weapon": "Nameless Spear", "name": "Nameless Spear Windmill (Slow)", "outerRatio": 0.263, "fixed": 39.45, "elemRatio": 0.3945, "anim": 0.5 },
  { "ver": "-",   "weapon": "Nameless Spear", "name": "Nameless Spear Windmill (Finisher)", "outerRatio": 2.15, "fixed": 322.5, "elemRatio": 3.225, "anim": 1.0, "note": "Windmill ending hit." },
  { "ver": "100", "weapon": "Nameless Spear", "name": "Nameless Spear Heavy 2", "outerRatio": 3.2664, "fixed": 904, "elemRatio": 4.8996, "anim": 2.0 },

  // STRATEGIC SWORD (九剑) — Nine-Nine weapon 1
  { "ver": "105", "weapon": "Strategic Sword", "name": "Strategic Sword Q (5 Bleed)", "outerRatio": 2.7205, "fixed": 749, "elemRatio": 4.08075, "anim": 1.6, "note": "Applies 5 bleed stacks." },
  { "ver": "105", "weapon": "Strategic Sword", "name": "Strategic Sword Heavy (4 Bleed)", "outerRatio": 0.9808, "fixed": 198, "elemRatio": 1.4712, "anim": 1.65, "note": "Applies 4 bleed." },
  { "ver": "90",  "weapon": "Strategic Sword", "name": "Strategic Sword Charge Lv1", "outerRatio": 1.8796, "fixed": 378, "elemRatio": 2.8194, "anim": 1.0, "note": "70% panel. Ratio 3:2:2:2:5." },
  { "ver": "90",  "weapon": "Strategic Sword", "name": "Strategic Sword Charge Lv2", "outerRatio": 2.6852, "fixed": 541, "elemRatio": 4.0278, "anim": 1.5, "note": "100% panel. Ratio 5:3:3:3:6." },
  { "ver": "-",   "weapon": "Strategic Sword", "name": "Bleed Tick (5 Stack)", "outerRatio": 0.33, "fixed": 0, "elemRatio": 0.495, "anim": 0.5, "note": "DoT per tick. 10 ticks per proc. Enter ticks as hits." },
  { "ver": "-",   "weapon": "Strategic Sword", "name": "Bleed Tick (4 Stack)", "outerRatio": 0.264, "fixed": 0, "elemRatio": 0.396, "anim": 0.5 },
  { "ver": "-",   "weapon": "Strategic Sword", "name": "Bleed Tick (2 Stack)", "outerRatio": 0.165, "fixed": 0, "elemRatio": 0.2475, "anim": 0.5 },
  { "ver": "-",   "weapon": "Strategic Sword", "name": "Blood Explosion", "outerRatio": 2.4, "fixed": 0, "elemRatio": 3.6, "anim": 0.2, "note": "Bleed burst proc. Count each explosion as 1 hit." },
  { "ver": "-",   "weapon": "Strategic Sword", "name": "Lateral Slash (Heavy-Derived)", "outerRatio": 0.6, "fixed": 0, "elemRatio": 0.9, "anim": 0.4 },
  { "ver": "-",   "weapon": "Strategic Sword", "name": "Lateral Slash (Q-Derived)", "outerRatio": 0.76, "fixed": 0, "elemRatio": 1.14, "anim": 0.4 },

  // HEAVENQUAKER SPEAR (九枪) — Nine-Nine weapon 2
  { "ver": "105", "weapon": "Heavenquaker Spear", "name": "Heavenquaker Spear Q (Full 5)", "outerRatio": 2.1401, "fixed": 588, "elemRatio": 3.21015, "anim": 2.3, "note": "5 spear hits ~1.3s. Each Q activation = 1 hit." },
  { "ver": "100", "weapon": "Heavenquaker Spear", "name": "Heavenquaker Spear Q (1 Hit)", "outerRatio": 0.321, "fixed": 88, "elemRatio": 0.4815, "anim": 0.8 },
  { "ver": "105", "weapon": "Heavenquaker Spear", "name": "Heavenquaker Spear Heavy", "outerRatio": 2.5683, "fixed": 711, "elemRatio": 3.85245, "anim": 2.3 },
  { "ver": "105", "weapon": "Heavenquaker Spear", "name": "Heavenquaker Spear Heavy (Cancel)", "outerRatio": 1.02732, "fixed": 284.4, "elemRatio": 1.54098, "anim": 1.0 },
  { "ver": "100", "weapon": "Heavenquaker Spear", "name": "Heavenquaker Spear Charge Lv2", "outerRatio": 6.2544, "fixed": 1730, "elemRatio": 9.3816, "anim": 3.0, "note": "14+1 segments." },
  { "ver": "80",  "weapon": "Heavenquaker Spear", "name": "Heavenquaker Spear Charge Lv1", "outerRatio": 3.744, "fixed": 657, "elemRatio": 5.616, "anim": 2.0, "note": "Last spear always 20% of total." },

  // INKWELL FAN (九伞) — Jade weapon 1
  { "ver": "100", "weapon": "Inkwell Fan", "name": "Inkwell Fan Q", "outerRatio": 2.3397, "fixed": 648, "elemRatio": 3.50955, "anim": 1.5 },
  { "ver": "100", "weapon": "Inkwell Fan", "name": "Inkwell Fan Q (Haste)", "outerRatio": 2.3397, "fixed": 648, "elemRatio": 3.50955, "anim": 1.1, "note": "With attack speed buff." },
  { "ver": "100", "weapon": "Inkwell Fan", "name": "Inkwell Fan Light Charge", "outerRatio": 1.7175, "fixed": 474, "elemRatio": 2.57625, "anim": 1.0, "note": "10 stamina/s, +6 atk speed." },
  { "ver": "100", "weapon": "Inkwell Fan", "name": "Inkwell Fan Heavy", "outerRatio": 1.0217, "fixed": 282, "elemRatio": 1.53255, "anim": 1.0, "note": "+2 atk speed." },
  { "ver": "-",   "weapon": "Inkwell Fan", "name": "Inkwell Fan Light Attack (Full)", "outerRatio": 1.5203, "fixed": 209, "elemRatio": 2.28045, "anim": 2.4, "note": "3-segment total." },
  { "ver": "-",   "weapon": "Inkwell Fan", "name": "Inkwell Fan Heavy Attack (Full)", "outerRatio": 2.6952, "fixed": 250, "elemRatio": 4.0428, "anim": 3.6, "note": "4-segment total." },
  { "ver": "-",   "weapon": "Inkwell Fan", "name": "Inkwell Fan Heavy Charge Lv2 (Full)", "outerRatio": 3.1262, "fixed": 301, "elemRatio": 4.6893, "anim": 3.1, "note": "50 stamina." },
  { "ver": "-",   "weapon": "Inkwell Fan", "name": "Inkwell Fan Weapon-Swap Skill", "outerRatio": 0.6295, "fixed": 59, "elemRatio": 0.94425, "anim": 0.95 },

  // VERNAL UMBRELLA (青扇) — Jade weapon 2
  { "ver": "95",  "weapon": "Vernal Umbrella", "name": "Vernal Umbrella R", "outerRatio": 1.6994, "fixed": 393, "elemRatio": 2.5491, "anim": 1.19, "note": "Cancel with mystic to remove back-lag." },
  { "ver": "100", "weapon": "Vernal Umbrella", "name": "Vernal Fan Wind Wall", "outerRatio": 0.9271, "fixed": 257, "elemRatio": 1.39065, "anim": 1.2 },
  { "ver": "100", "weapon": "Vernal Umbrella", "name": "Vernal Fan Heavy", "outerRatio": 1.2798, "fixed": 355, "elemRatio": 1.9197, "anim": 1.4 },
  { "ver": "-",   "weapon": "Vernal Umbrella", "name": "Vernal Fan Light Combo (Full)", "outerRatio": 2.0364, "fixed": 196, "elemRatio": 3.0546, "anim": 2.6, "note": "4-segment total." },
  { "ver": "-",   "weapon": "Vernal Umbrella", "name": "Vernal Fan Light Charge", "outerRatio": 1.9004, "fixed": 178, "elemRatio": 2.8506, "anim": 1.7, "note": "25 stamina. No back-lag in chain." },
  { "ver": "-",   "weapon": "Vernal Umbrella", "name": "Vernal Fan 4x Light Charge", "outerRatio": 7.6016, "fixed": 712, "elemRatio": 11.4024, "anim": 7.5 },
  { "ver": "-",   "weapon": "Vernal Umbrella", "name": "Vernal Fan Heavy Charge (Full)", "outerRatio": 2.4456, "fixed": 236, "elemRatio": 3.6684, "anim": 2.1, "note": "30 stamina." },
  { "ver": "-",   "weapon": "Vernal Umbrella", "name": "Vernal Fan Air Chase", "outerRatio": 1.2438, "fixed": 116, "elemRatio": 1.8657, "anim": 0.5 },
  { "ver": "-",   "weapon": "Vernal Umbrella", "name": "Vernal Fan Enhanced Chase", "outerRatio": 3.0145, "fixed": 281, "elemRatio": 4.52175, "anim": 0.5 },
  { "ver": "-",   "weapon": "Vernal Umbrella", "name": "Vernal Fan Weapon-Swap Skill", "outerRatio": 1.0786, "fixed": 104, "elemRatio": 1.6179, "anim": 0.8 },

  // PANACEA FAN (奶扇) — Pure-Healer / Fire-Fist-Healer weapon 1
  { "ver": "100", "weapon": "Panacea Fan", "name": "Panacea Fan Heavy Strike", "outerRatio": 6.7025, "fixed": 1966, "elemRatio": 10.05375, "anim": 2.0, "note": "Main heal+dmg heavy. 3-segment = 1 hit." },
  { "ver": "100", "weapon": "Panacea Fan", "name": "Panacea Fan Q", "outerRatio": 2.1959, "fixed": 211, "elemRatio": 3.29385, "anim": 2.9, "note": "4-segment Q total." },
  { "ver": "-",   "weapon": "Panacea Fan", "name": "Panacea Fan Light Combo (Full)", "outerRatio": 2.0364, "fixed": 196, "elemRatio": 3.0546, "anim": 2.6 },
  { "ver": "-",   "weapon": "Panacea Fan", "name": "Panacea Fan Light Charge", "outerRatio": 1.9004, "fixed": 178, "elemRatio": 2.8506, "anim": 1.7 },
  { "ver": "-",   "weapon": "Panacea Fan", "name": "Panacea Fan Heavy Combo (Full)", "outerRatio": 2.1959, "fixed": 211, "elemRatio": 3.29385, "anim": 2.9 },

  // SOULSHADE UMBRELLA (奶伞) — Pure-Healer / Fire-Fist-Healer weapon 2
  { "ver": "100", "weapon": "Soulshade Umbrella", "name": "Soulshade Umbrella Q", "outerRatio": 2.3397, "fixed": 648, "elemRatio": 3.50955, "anim": 1.5 },
  { "ver": "100", "weapon": "Soulshade Umbrella", "name": "Soulshade Off-Field Heal", "outerRatio": 0.7721, "fixed": 199, "elemRatio": 1.15815, "anim": 1.0, "note": "奶伞后台奶 — off-field heal tick. Enter ticks as hits." },
  { "ver": "100", "weapon": "Soulshade Umbrella", "name": "Soulshade Light Charge", "outerRatio": 1.7175, "fixed": 474, "elemRatio": 2.57625, "anim": 1.0 },
  { "ver": "100", "weapon": "Soulshade Umbrella", "name": "Soulshade Heavy", "outerRatio": 1.0217, "fixed": 282, "elemRatio": 1.53255, "anim": 1.0 },
  { "ver": "-",   "weapon": "Soulshade Umbrella", "name": "Soulshade Weapon-Swap Skill", "outerRatio": 0.6295, "fixed": 59, "elemRatio": 0.94425, "anim": 0.95 },

  // THUNDERCRY BLADE (钧-横刀) — Rocksplit-Might weapon 1
  { "ver": "105", "weapon": "Thundercry Blade", "name": "Thundercry Blade Q (Deathstrike)", "outerRatio": 3.3662, "fixed": 932, "elemRatio": 5.0493, "anim": 1.94 },
  { "ver": "105", "weapon": "Thundercry Blade", "name": "Thundercry Blade Light Charge", "outerRatio": 2.4495, "fixed": 677, "elemRatio": 3.67425, "anim": 1.17, "note": "1.97s with full charge." },
  { "ver": "105", "weapon": "Thundercry Blade", "name": "Thundercry Blade Heavy Derived", "outerRatio": 2.7, "fixed": 747, "elemRatio": 4.05, "anim": 0.9, "note": "Eats set bonus." },
  { "ver": "105", "weapon": "Thundercry Blade", "name": "Thundercry Blade Slide (Sweep)", "outerRatio": 1.2338, "fixed": 342, "elemRatio": 1.8507, "anim": 1.94 },
  { "ver": "105", "weapon": "Thundercry Blade", "name": "Thundercry Blade Slide Stab", "outerRatio": 2.1324, "fixed": 590, "elemRatio": 3.1986, "anim": 1.94 },
  { "ver": "105", "weapon": "Thundercry Blade", "name": "Thundercry Blade Stance Combo", "outerRatio": 6.5495, "fixed": 1562, "elemRatio": 9.82425, "anim": 2.5, "note": "Light charge + derived loop." },
  { "ver": "105", "weapon": "Thundercry Blade", "name": "Thundercry Blade Weapon-Swap", "outerRatio": 0.6486, "fixed": 180, "elemRatio": 0.9729, "anim": 0.7 },
  { "ver": "-",   "weapon": "Thundercry Blade", "name": "Spirit Clone (Thundercry)", "outerRatio": 1.4, "fixed": 138, "elemRatio": 2.1, "anim": 0.3, "note": "Spirit clone hit." },

  // STORMBREAKER SPEAR (八枪) — Rocksplit-Might weapon 2
  { "ver": "90",  "weapon": "Stormbreaker Spear", "name": "Stormbreaker Spear Charge", "outerRatio": 2.5913, "fixed": 522, "elemRatio": 3.88695, "anim": 2.5 },
  { "ver": "-",   "weapon": "Stormbreaker Spear", "name": "Stormbreaker Spear Q", "outerRatio": 0.3126, "fixed": 46, "elemRatio": 0.4689, "anim": 1.0 },
  { "ver": "-",   "weapon": "Stormbreaker Spear", "name": "Stormbreaker Spear Heavy", "outerRatio": 1.0737, "fixed": 157, "elemRatio": 1.61055, "anim": 1.33 },
  { "ver": "80",  "weapon": "Stormbreaker Spear", "name": "Stormbreaker Spear Jump Slash", "outerRatio": 2.176, "fixed": 300.72, "elemRatio": 3.264, "anim": 2.5 },
  { "ver": "-",   "weapon": "Stormbreaker Spear", "name": "Stormbreaker Spear Swap Skill", "outerRatio": 0.9635, "fixed": 135, "elemRatio": 1.44525, "anim": 2.5 },
  { "ver": "105", "weapon": "Stormbreaker Spear", "name": "Stormbreaker Soaring Strike (Mystic)", "outerRatio": 3.7797, "fixed": 1045, "elemRatio": 5.66955, "anim": 2.3, "note": "飞鸿踏雪 — Rocksplit mystic skill." },

  // SNOWPARTING BLADE (陌刀-嗟夫) — Rocksplit-Jun weapon 1
  { "ver": "95",  "weapon": "Snowparting Blade", "name": "Snowparting Blade Q (3 Charge, 1 Intent)", "outerRatio": 5.789, "fixed": 1337, "elemRatio": 8.6835, "anim": 3.66 },
  { "ver": "105", "weapon": "Snowparting Blade", "name": "Snowparting Blade Q (3 Charge, 2 Intent)", "outerRatio": 7.2368, "fixed": 2002, "elemRatio": 10.8552, "anim": 3.66, "note": "Max warwill variant." },
  { "ver": "95",  "weapon": "Snowparting Blade", "name": "Snowparting Blade Q (2 Charge)", "outerRatio": 3.8964, "fixed": 900, "elemRatio": 5.8446, "anim": 3.13 },
  { "ver": "105", "weapon": "Snowparting Blade", "name": "Snowparting Derived (1 Intent)", "outerRatio": 3.4245, "fixed": 947, "elemRatio": 5.13675, "anim": 5.03 },
  { "ver": "105", "weapon": "Snowparting Blade", "name": "Snowparting Derived (2 Intent)", "outerRatio": 4.2808, "fixed": 462, "elemRatio": 3.9492, "anim": 5.03 },
  { "ver": "80",  "weapon": "Snowparting Blade", "name": "Snowparting Stance Q", "outerRatio": 0.0, "fixed": 0, "elemRatio": 0.0, "anim": 1.2, "note": "Stance switch only, no damage." },

  // PHALANXBANE BLADE (钧-陌刀) — Rocksplit-Jun weapon 2
  { "ver": "105", "weapon": "Phalanxbane Blade", "name": "Phalanxbane Blade Q (Fast 3 Charge)", "outerRatio": 7.7967, "fixed": 2156, "elemRatio": 11.69505, "anim": 2.3, "note": "From Soaring Strike → 3 slashes. 7.1s total." },
  { "ver": "105", "weapon": "Phalanxbane Blade", "name": "Phalanxbane Blade Q (Slow 3 Charge)", "outerRatio": 5.733, "fixed": 1585, "elemRatio": 8.5995, "anim": 2.3 },
  { "ver": "100", "weapon": "Phalanxbane Blade", "name": "Phalanxbane Blade Q (2 Charge)", "outerRatio": 2.9424, "fixed": 813, "elemRatio": 4.4136, "anim": 1.3 },
  { "ver": "100", "weapon": "Phalanxbane Blade", "name": "Phalanxbane Quick Q", "outerRatio": 1.8948, "fixed": 525, "elemRatio": 2.8422, "anim": 1.0, "note": "Spawns 2 spirit blades lv1." },
  { "ver": "100", "weapon": "Phalanxbane Blade", "name": "Phalanxbane Slow Q", "outerRatio": 3.2556, "fixed": 975, "elemRatio": 4.8834, "anim": 1.5 },
  { "ver": "-",   "weapon": "Phalanxbane Blade", "name": "Spirit Blade Clone (Lv2)", "outerRatio": 0.9, "fixed": 0, "elemRatio": 1.35, "anim": 0.3 },
  { "ver": "-",   "weapon": "Phalanxbane Blade", "name": "Spirit Blade Clone (Lv1)", "outerRatio": 0.5, "fixed": 0, "elemRatio": 0.75, "anim": 0.3 }
],
  "classes": {
    "Bamboocut-Dust": {
      "sheetLevel": "100",
      "bossDefUsed": -559.0,
      "graduationPanel": {
        "Min Phys Atk": 1929.3,
        "Max Phys Atk": 4614.9,
        "Precision": 1.325,
        "Crit Rate": 1.7,
        "Direct Crit": 0.046,
        "Crit DMG": 0.54,
        "Affinity Rate": 0.2044,
        "Direct Affinity": 0.0,
        "Affinity DMG": 0.35,
        "Min Bamboocut": 450.8,
        "Max Bamboocut": 823.0,
        "Phys Pen": 58.4,
        "Phys DMG Up": 0.028,
        "Bamboocut Pen": 33.6,
        "Bamboocut DMG Deepen": 0.138,
        "Judge Resistance": 1.15
      },
      "marginalGains": [
        { "stat": "Own Weapon Bonus", "gainPct": 4.7215 },
        { "stat": "Phys Pen", "gainPct": 4.0804 },
        { "stat": "Boss DMG Bonus", "gainPct": 2.6201 },
        { "stat": "All Martial Arts Bonus", "gainPct": 2.1717 },
        { "stat": "Bamboocut Pen", "gainPct": 1.6845 },
        { "stat": "Precision", "gainPct": 1.5918 },
        { "stat": "Max Phys Atk", "gainPct": 1.3242 },
        { "stat": "Strength", "gainPct": 1.3153 },
        { "stat": "Min Phys Atk", "gainPct": 1.2301 },
        { "stat": "Power", "gainPct": 1.1748 },
        { "stat": "Agility", "gainPct": 1.0238 },
        { "stat": "Affinity Rate", "gainPct": 0.982 },
        { "stat": "Max Bamboocut", "gainPct": 0.9072 },
        { "stat": "Min Bamboocut", "gainPct": 0.84 },
        { "stat": "Crit Rate", "gainPct": 0.3213 }
      ]
    },
    "Bamboocut-Wind": {
      "sheetLevel": "100",
      "bossDefUsed": -503.1,
      "graduationPanel": {
        "Min Phys Atk": 1882.7,
        "Max Phys Atk": 5068.32,
        "Precision": 1.361,
        "Crit Rate": 1.334,
        "Direct Crit": 0.046,
        "Crit DMG": 0.579,
        "Affinity Rate": 0.4107,
        "Direct Affinity": 0.0,
        "Affinity DMG": 0.35,
        "Min Bamboocut": 285.8,
        "Max Bamboocut": 492.0,
        "Phys Pen": 58.4,
        "Phys DMG Up": 0.0,
        "Bamboocut Pen": 33.6,
        "Bamboocut DMG Deepen": 0.138,
        "Judge Resistance": 1.15
      },
      "marginalGains": [
        { "stat": "Phys Pen", "gainPct": 4.7787 },
        { "stat": "Boss DMG Bonus", "gainPct": 2.3234 },
        { "stat": "Crit Rate", "gainPct": 2.1116 },
        { "stat": "All Martial Arts Bonus", "gainPct": 2.005 },
        { "stat": "Agility", "gainPct": 1.7719 },
        { "stat": "Max Phys Atk", "gainPct": 1.5028 },
        { "stat": "Power", "gainPct": 1.4681 },
        { "stat": "Strength", "gainPct": 1.4575 },
        { "stat": "Affinity Rate", "gainPct": 1.4268 },
        { "stat": "Min Phys Atk", "gainPct": 1.1537 },
        { "stat": "Precision", "gainPct": 1.0685 },
        { "stat": "Max Bamboocut", "gainPct": 0.9033 },
        { "stat": "Bamboocut Pen", "gainPct": 0.866 }
      ]
    },
    "Nameless": {
      "sheetLevel": "100",
      "bossDefUsed": -559.0,
      "graduationPanel": {
        "Min Phys Atk": 1320.7,
        "Max Phys Atk": 4669.276,
        "Precision": 1.361,
        "Crit Rate": 1.0187,
        "Direct Crit": 0.046,
        "Crit DMG": 0.5,
        "Affinity Rate": 0.8434,
        "Direct Affinity": 0.023,
        "Affinity DMG": 0.402,
        "Min Bamboocut": 427.7,
        "Max Bamboocut": 856.3,
        "Phys Pen": 58.4,
        "Bamboocut Pen": 33.6,
        "Bamboocut DMG Deepen": 0.138,
        "Judge Resistance": 1.15
      },
      "marginalGains": [
        { "stat": "Phys Pen", "gainPct": 4.0893 },
        { "stat": "Own Weapon Bonus", "gainPct": 3.3904 },
        { "stat": "Boss DMG Bonus", "gainPct": 2.2537 },
        { "stat": "Bamboocut Pen", "gainPct": 1.8477 },
        { "stat": "All Martial Arts Bonus", "gainPct": 1.7616 },
        { "stat": "Max Phys Atk", "gainPct": 1.5578 },
        { "stat": "Power", "gainPct": 1.4884 },
        { "stat": "Strength", "gainPct": 1.419 },
        { "stat": "Crit Rate", "gainPct": 1.3691 },
        { "stat": "Max Bamboocut", "gainPct": 1.268 },
        { "stat": "Affinity Rate", "gainPct": 0.5948 }
      ]
    },
    "Jade": {
      "sheetLevel": "100",
      "bossDefUsed": -559.0,
      "graduationPanel": {
        "Min Phys Atk": 1741.95,
        "Max Phys Atk": 4580.08,
        "Precision": 1.361,
        "Crit Rate": 1.517,
        "Direct Crit": 0.046,
        "Crit DMG": 0.544,
        "Affinity Rate": 0.4477,
        "Direct Affinity": 0.0,
        "Affinity DMG": 0.35,
        "Min Bamboocut": 411.0,
        "Max Bamboocut": 823.0,
        "Phys Pen": 68.6,
        "Bamboocut Pen": 27.6,
        "Bamboocut DMG Deepen": 0.138,
        "Judge Resistance": 1.15
      },
      "marginalGains": [
        { "stat": "Phys Pen", "gainPct": 4.2194 },
        { "stat": "Max Mystic Bonus", "gainPct": 2.9223 },
        { "stat": "Boss DMG Bonus", "gainPct": 2.361 },
        { "stat": "Own Weapon Bonus", "gainPct": 2.1081 },
        { "stat": "Affinity Rate", "gainPct": 1.568 },
        { "stat": "Max Phys Atk", "gainPct": 1.5305 },
        { "stat": "Crit Rate", "gainPct": 1.5093 },
        { "stat": "Min Phys Atk", "gainPct": 1.0997 }
      ]
    },
    "Rocksplit-Might": {
      "sheetLevel": "105",
      "bossDefUsed": -559.0,
      "graduationPanel": {
        "Min Phys Atk": 1817.86,
        "Max Phys Atk": 4614.9,
        "Precision": 1.469,
        "Crit Rate": 1.2325,
        "Direct Crit": 0.046,
        "Crit DMG": 0.544,
        "Affinity Rate": 0.3244,
        "Direct Affinity": 0.0,
        "Affinity DMG": 0.35,
        "Min Bamboocut": 444.4,
        "Max Bamboocut": 889.6,
        "Phys Pen": 58.4,
        "Bamboocut Pen": 39.6,
        "Bamboocut DMG Deepen": 0.138,
        "Judge Resistance": 1.15
      },
      "marginalGains": [
        { "stat": "Phys Pen", "gainPct": 4.2684 },
        { "stat": "Own Weapon Bonus", "gainPct": 4.0297 },
        { "stat": "Boss DMG Bonus", "gainPct": 2.2632 },
        { "stat": "Bamboocut Pen", "gainPct": 1.934 },
        { "stat": "Max Phys Atk", "gainPct": 1.3384 },
        { "stat": "Strength", "gainPct": 1.3034 },
        { "stat": "Min Phys Atk", "gainPct": 1.0719 },
        { "stat": "Crit Rate", "gainPct": 0.1772 }
      ]
    },
    "Nine-Nine": {
      "sheetLevel": "105",
      "bossDefUsed": -559.0,
      "graduationPanel": {
        "Min Phys Atk": 1780.0,
        "Max Phys Atk": 4550.0,
        "Precision": 1.35,
        "Crit Rate": 1.45,
        "Direct Crit": 0.046,
        "Crit DMG": 0.544,
        "Affinity Rate": 0.30,
        "Direct Affinity": 0.0,
        "Affinity DMG": 0.35,
        "Min Bamboocut": 420.0,
        "Max Bamboocut": 850.0,
        "Phys Pen": 55.0,
        "Bamboocut Pen": 35.0,
        "Bamboocut DMG Deepen": 0.138,
        "Judge Resistance": 1.15
      },
      "marginalGains": [
        { "stat": "Phys Pen", "gainPct": 4.5422 },
        { "stat": "Max Phys Atk", "gainPct": 2.1221 },
        { "stat": "All Martial Arts Bonus", "gainPct": 2.1000 },
        { "stat": "Crit Rate", "gainPct": 1.8322 },
        { "stat": "Crit DMG", "gainPct": 1.5432 }
      ]
    },
    "Bamboocut-Bird": {
      "sheetLevel": "105",
      "bossDefUsed": -559.0,
      "graduationPanel": {
        "Min Phys Atk": 1820.0,
        "Max Phys Atk": 4580.0,
        "Precision": 1.361,
        "Crit Rate": 1.50,
        "Direct Crit": 0.046,
        "Crit DMG": 0.544,
        "Affinity Rate": 0.35,
        "Direct Affinity": 0.0,
        "Affinity DMG": 0.35,
        "Min Bamboocut": 430.0,
        "Max Bamboocut": 860.0,
        "Phys Pen": 56.4,
        "Bamboocut Pen": 36.6,
        "Bamboocut DMG Deepen": 0.138,
        "Judge Resistance": 1.15
      },
      "marginalGains": [
        { "stat": "Max Phys Atk", "gainPct": 3.123 },
        { "stat": "Phys Pen", "gainPct": 2.943 },
        { "stat": "All Martial Arts Bonus", "gainPct": 2.112 },
        { "stat": "Crit Rate", "gainPct": 1.632 }
      ]
    },
    "Rocksplit-Jun": {
      "sheetLevel": "105",
      "bossDefUsed": -559.0,
      "graduationPanel": {
        "Min Phys Atk": 1850.0,
        "Max Phys Atk": 4600.0,
        "Precision": 1.40,
        "Crit Rate": 1.30,
        "Direct Crit": 0.046,
        "Crit DMG": 0.544,
        "Affinity Rate": 0.40,
        "Direct Affinity": 0.0,
        "Affinity DMG": 0.35,
        "Min Bamboocut": 450.0,
        "Max Bamboocut": 880.0,
        "Phys Pen": 57.0,
        "Bamboocut Pen": 38.0,
        "Bamboocut DMG Deepen": 0.138,
        "Judge Resistance": 1.15
      },
      "marginalGains": [
        { "stat": "Phys Pen", "gainPct": 4.312 },
        { "stat": "Max Phys Atk", "gainPct": 3.012 },
        { "stat": "Own Weapon Bonus", "gainPct": 2.894 },
        { "stat": "Crit Rate", "gainPct": 1.452 }
      ]
    },
    "Pure-Healer": {
      "sheetLevel": "105",
      "bossDefUsed": -559.0,
      "graduationPanel": {
        "Min Phys Atk": 1700.0,
        "Max Phys Atk": 4400.0,
        "Precision": 1.30,
        "Crit Rate": 1.20,
        "Direct Crit": 0.0,
        "Crit DMG": 0.50,
        "Affinity Rate": 0.30,
        "Direct Affinity": 0.0,
        "Affinity DMG": 0.35,
        "Min Bamboocut": 400.0,
        "Max Bamboocut": 800.0,
        "Phys Pen": 40.0,
        "Bamboocut Pen": 30.0,
        "Bamboocut DMG Deepen": 0.10,
        "Judge Resistance": 1.15
      },
      "marginalGains": [
        { "stat": "Outgoing Healing", "gainPct": 5.122 },
        { "stat": "Max Phys Atk", "gainPct": 1.894 },
        { "stat": "All Martial Arts Bonus", "gainPct": 1.233 }
      ]
    }
  }
} as const;
