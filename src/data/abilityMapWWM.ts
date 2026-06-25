// Hand-built mapping: wherewindsmath bundle ability name -> app RotationItem fields, per build.
// Mechanic fields (isDingyin/generalBonus/yishui/tiaozhan) are COPIED verbatim from the app's
// existing verified rotation for that build (ClassConfig.ROTATIONS[cnClass].rotation in
// src/data/referenceData.ts), matched to the bundle ability by skill semantics — never invented.
//
// HONESTY RULE: a bundle ability with no clear app-skill equivalent has NO entry here. The
// DPS Compare engine reports unmapped abilities to the user; that is correct and intended.
// Do not add a guessed entry just to fill a gap.
export interface AppMapping {
  appName: string;        // must exist in SKILL_DB or the build's CN skillDatabase (calc.ts:406-431)
  isDingyin?: boolean;
  generalBonus?: number;
  yishui?: number;
  tiaozhan?: number;
}

export const ABILITY_MAP_WWM: Record<string, Record<string, AppMapping>> = {
  // ===========================================================================================
  // bamboocut_dust (破竹尘) — verification anchor, 40694 DPS benchmark. 17 bundle abilities.
  // Source rows: ClassConfig.ROTATIONS["破竹尘"].rotation (58 unique names / 77 rows).
  // ===========================================================================================
  bamboocut_dust: {
    "Umbrella Q Perfect Catch": { appName: "Scarlet Spin (5 Echo)", isDingyin: true, generalBonus: 0.315, yishui: 10, tiaozhan: 1 },
    "Umbrella Q Empowered Perfect Catch": { appName: "Scarlet Spin (5 Echo + Blossom Song)", isDingyin: true, generalBonus: 0.515, yishui: 10, tiaozhan: 1 },
    // "Umbrella Q" (base, no Perfect Catch) -> umbrella's xinfa-resonance hit, the other half
    // of the umbrella's damage kit alongside Scarlet Spin.
    "Umbrella Q": { appName: "Umbrella Resonance (5 Echo)", isDingyin: true, generalBonus: 0.515, yishui: 10, tiaozhan: 1 },
    "Rope Q": { appName: "尘绳标Q(失魂+5幻鸣)", isDingyin: false, generalBonus: 0.315, yishui: 10, tiaozhan: 1 },
    "Rope Special": { appName: "Rope Dart Special (Dart Song Max + Soul Loss)", isDingyin: false, generalBonus: 0.465, yishui: 10, tiaozhan: 1 },
    "Rope Charge 1-3 Hit": { appName: "Rope Dart R1-3 (Dart Song 3tk + Soul Loss)", isDingyin: false, generalBonus: 0.315, yishui: 10, tiaozhan: 1 },
    "Rope Charge 4-5 Hit": { appName: "Rope Dart R4-5 (Dart Song 3tk + Soul Loss)", isDingyin: false, generalBonus: 0.315, yishui: 10, tiaozhan: 1 },
    "Fire Breath 2-Hit": { appName: "Dragon's Breath Full Strike (5 Echo)", isDingyin: false, generalBonus: 0.315, yishui: 10, tiaozhan: 1 },
    "Flute of the Tides Full": { appName: "Flute of the Tides (AoE + Soul Loss)", isDingyin: false, generalBonus: 0.465, yishui: 10, tiaozhan: 1 },
    // NOTE left out (no clear app-skill equivalent — utility/traversal/defensive, not modeled
    // as a separate damage row in ClassConfig.ROTATIONS["破竹尘"]):
    // "Flute of the Tides Prepull", "Flute of the Tides Cancel", "Soaring", "Toad[Cancel]",
    // "Deflect Cancel", "Ghostly Steps", "Perfect Dodge[Full]", "Delay"
  },

  // ===========================================================================================
  // bellstrike_umbra (鸣金影) — Sword/Spear hybrid. 18 bundle abilities.
  // Source rows: ClassConfig.ROTATIONS["鸣金影"].rotation (112 rows; 九剑=Sword, 九枪=Spear,
  // 血爆="blood burst"=SwordSpecial, 神龙吐火="dragon fire"=Fire Breath).
  // ===========================================================================================
  bellstrike_umbra: {
    "SwordQ": { appName: "九剑Q（枪特）", isDingyin: false, generalBonus: 0.58, yishui: 10, tiaozhan: 1 },
    "SpearQ": { appName: "九枪Q拉满（枪特+非玉斗）", isDingyin: false, generalBonus: 0.58, yishui: 10, tiaozhan: 1 },
    "SpearHeavy": { appName: "九枪～第一段（非玉斗）", isDingyin: false, generalBonus: 0.58, yishui: 10, tiaozhan: 1 },
    "SwordSpecial 3-Hit": { appName: "血爆(枪特)", isDingyin: true, generalBonus: 1.23, yishui: 10, tiaozhan: 1 },
    "Fire Breath 1-Hit": { appName: "神龙吐火两段(枪特)", isDingyin: false, generalBonus: 0.58, yishui: 10, tiaozhan: 1 },
    "Fire Breath 2-Hit": { appName: "神龙吐火两段额外(枪特)", isDingyin: false, generalBonus: 0.58, yishui: 10, tiaozhan: 1 },
    // NOTE left out (no distinguishable app-skill equivalent for these exact bundle variants —
    // mapping them would mean guessing which CN hit-count/stack variant they correspond to):
    // "Fire Breath 1-Hit Prepull", "Deflect Cancel", "SwordQFollowup", "Soaring",
    // "Crosswind Blade", "SpearHeavy 1-Hit Prepull", "DrunkenPoet Prepull",
    // "Flute of the Tides Prepull", "Deflect Cancel Prepull", "SpearQ 5-Hit Cancel",
    // "SwordSpecial 4-Hit", "Sword Charge Stage 1, 4-Hit"
  },

  // ===========================================================================================
  // bellstrike_splendor (鸣金虹) — Sword/Spear/Umbrella hybrid. 15 bundle abilities.
  // Source rows: ClassConfig.ROTATIONS["鸣金虹"].rotation (56 rows; 多道剑气="Sword Charge
  // Stage", 飞剑="Crosswind Blade", 枪Q=SpearQ, 骑龙回马="Fire Breath" stages).
  // ===========================================================================================
  bellstrike_splendor: {
    "SwordQ": { appName: "多道剑气+10%威猛+60%耐", isDingyin: true, generalBonus: 0.755, yishui: 10, tiaozhan: 1 },
    "SwordHeavyCharged": { appName: "多道剑气12(额外20耐+笛)+5%威猛+看破/长风/真气失衡", isDingyin: true, generalBonus: 1.255, yishui: 10, tiaozhan: 1 },
    "SwordHeavyCharged 2 Hit": { appName: "多道剑气3(额外20耐+笛)+5%威猛+看破", isDingyin: true, generalBonus: 1.255, yishui: 10, tiaozhan: 1 },
    "SpearQ": { appName: "枪Q+60%耐/看破", isDingyin: false, generalBonus: 0.215, yishui: 10, tiaozhan: 1 },
    "Fire Breath 1-Hit": { appName: "骑龙回马一段+60%耐/看破/长风/低真气", isDingyin: false, generalBonus: 0.215, yishui: 10, tiaozhan: 1 },
    // NOTE left out (no clear app-skill equivalent):
    // "DrunkenPoet Prepull", "Deflect Cancel Prepull", "Flute of the Tides Prepull",
    // "SpearQ Prepull", "SwordHeavyCharged[Prepull]", "EnergySurge", "Soaring",
    // "Ghostly Steps", "SpearQ 0-Hit Cancel", "Deflect Cancel"
  },

  // ===========================================================================================
  // stonesplit_might (裂石威) — Modao/Spear. Only 11 bundle abilities AND only 11 unique CN
  // rotation rows for this build, so coverage is necessarily thin — most bundle abilities have
  // no distinguishable CN counterpart (only 2 base skills exist in the verified rotation:
  // Modao Charge "陌刀R蓄" and Modao Combo "陌刀派生").
  // ===========================================================================================
  stonesplit_might: {
    "MoBladeHeavyCharge-2BW": { appName: "陌刀R蓄3战意加成(破阵+山河6+盾+易伤)", isDingyin: true, generalBonus: 0.845, yishui: 10, tiaozhan: 1 },
    "MoBladeVariedCombo-2BW[Cancel]": { appName: "陌刀派生(破阵+2战意+盾+易伤)", isDingyin: true, generalBonus: 0.845, yishui: 10, tiaozhan: 1 },
    // NOTE left out (no distinguishable app-skill equivalent — "SpearQ"/"MoBladeQ" do not
    // appear as separate named rows in ClassConfig.ROTATIONS["裂石威"]; only the R蓄/派生
    // pair plus the AoE Flute and Yishui Song are verified there):
    // "SpearQ Prepull", "MoBladeQ", "SpearSpecial[Cancel]", "Deflect Cancel", "SpearQ",
    // "MoBladeQ Prepull", "BlockPerception", "MoBladeHeavyCharge-2BW[Perception][Cancel]",
    // "MoBladeHeavyCharge-2BW[Perception]"
  },

  // ===========================================================================================
  // silkbind_jade (牵丝玉) — Umbrella/Fan hybrid. 36 bundle abilities (most variety of the 6).
  // Source rows: ClassConfig.ROTATIONS["牵丝玉"].rotation (52 rows; 伞=Umbrella, 扇=Fan,
  // 丢伞="throw umbrella"=Drone launch, 太白醉月="Taibai Drunk Moon"=DrunkenPoet combo,
  // 金蟾腾跃="Golden Toad Leap"). NOTE: this build's rotation rows use `chunlei`/`included`
  // fields, not `tiaozhan` — tiaozhan is correctly omitted below (defaults to 1 in calc.ts).
  // ===========================================================================================
  silkbind_jade: {
    "UmbQ": { appName: "伞Q(风墙无纵地)", isDingyin: false, generalBonus: 0.365, yishui: 0 },
    "UmbLightCharge": { appName: "伞～(连中风墙无纵地)", isDingyin: true, generalBonus: 0.795, yishui: 6.00000000000001 },
    "Umb HeavyLight": { appName: "伞重击派生(无纵地)", isDingyin: false, generalBonus: 0.185, yishui: 4 },
    "UmbDrone": { appName: "丢伞(无纵地)", isDingyin: false, generalBonus: 0.195, yishui: 6.00000000000001 },
    "UmbDroneLaunch[20hit]": { appName: "丢伞(无纵地)", isDingyin: false, generalBonus: 0.195, yishui: 6.00000000000001 },
    "Fire Breath 1-Hit": { appName: "骑龙回马打满(纵地阴阳断石)", isDingyin: false, generalBonus: 0.215, yishui: 10 },
    "FanQ": { appName: "扇Q(近距离命中)+阴阳鬼掣", isDingyin: false, generalBonus: 0.365, yishui: 10 },
    "FanLightCharged": { appName: "扇左蓄(风墙3惊春阴阳鬼掣)", isDingyin: false, generalBonus: 0.885, yishui: 10 },
    "FanHeavyPursuit 3-Hit": { appName: "扇普通重击派生(风墙阴阳低真气鬼掣)", isDingyin: false, generalBonus: 0.545, yishui: 10 },
    "Poet1": { appName: "太白醉月1-4(鬼掣)", isDingyin: false, generalBonus: 0.215, yishui: 10 },
    "Poet2": { appName: "太白醉月1-4(鬼掣)", isDingyin: false, generalBonus: 0.215, yishui: 10 },
    "Poet3": { appName: "太白醉月1-4(鬼掣)", isDingyin: false, generalBonus: 0.215, yishui: 10 },
    "Poet4": { appName: "太白醉月1-4(鬼掣)", isDingyin: false, generalBonus: 0.215, yishui: 10 },
    "Poet Final Hit[Cancel]": { appName: "太白醉月爆炸(鬼掣)", isDingyin: false, generalBonus: 0.215, yishui: 10 },
    // NOTE left out (no clear app-skill equivalent — prepull/cancel/utility/defensive, or a
    // weapon (spear/modao) this build's verified rotation never actually uses):
    // "FanQ Prepull", "UmbQ Prepull", "FanSpecial", "Soaring", "Toad[Cancel]", "FanQCancel",
    // "FanHeavyPursuit 5-Hit", "Deflect Cancel", "UmbDroneLaunch[12hit]", "UmbDroneLaunch[26hit]",
    // "Mo Blade Q Shield [AoR T4]", "Flute of the Tides Cancel", "DrunkenPoet Prepull",
    // "Ghostly Steps", "Perfect Dodge", "Golden Body Cancel", "Flute of the Tides Prepull",
    // "Delay", "Golden Body + Deflect Cancel", "UmbDroneLaunch[23hit]", "SpearSpecial[Cancel]",
    // "SpearQ"
  },

  // ===========================================================================================
  // stonesplit_strength (裂石钧（纯唐）) — Hengdao ("Snowparting" in the bundle's naming).
  // 22 bundle abilities. Source rows: ClassConfig.ROTATIONS["裂石钧（纯唐）"].rotation (18
  // rows; 横刀=Hengdao/Snowparting, 滑铲="slide-shovel"=Slide, 重击派生=heavy-derived=Charged,
  // 安西军="Anxi Army" formation combo=Phalanx, 杀将刺="stab"=Q-Stab). This build's rows have
  // no `tiaozhan` field at all — omitted below (defaults to 1 in calc.ts), not invented.
  // ===========================================================================================
  stonesplit_strength: {
    "SnowpartingSlide": { appName: "横刀滑铲(穿喉5)", isDingyin: false, generalBonus: 0.295, yishui: 10 },
    "SnowpartingCharged": { appName: "横刀重击派生(穿喉5)", isDingyin: true, generalBonus: 0.395, yishui: 10 },
    "SnowpartingVC": { appName: "横刀左蓄(穿喉5)", isDingyin: false, generalBonus: 0.315, yishui: 10 },
    "SnowpartingQ-Stab": { appName: "白刃杀将刺(12%胆寒+穿喉5+近战笛)", isDingyin: false, generalBonus: 0.435, yishui: 10 },
    "PhalanxQ": { appName: "横刀安西军(穿喉5)", isDingyin: false, generalBonus: 0.295, yishui: 10 },
    // NOTE left out (no distinguishable app-skill equivalent — these are prepull/cancel
    // variants, or Phalanx hit-stages the verified rotation doesn't separately track):
    // "Flute of the Tides Prepull", "PhalanxSpecial Prepull", "SnowpartingDual Prepull",
    // "SnowpartingSlide Prepull[Hit]", "SnowpartingCharged[Forgetfulness]", "SnowpartingSpecial",
    // "SnowpartingDual", "Soaring", "Toad[Cancel]", "Deflect Cancel", "PhalanxSpecial",
    // "Flute of the Tides Cancel", "SnowpartingSlide Prepull", "Deflect",
    // "PhalanxCharged-S3[InnerPassion]", "Delay", "SnowpartingVC Prepull"
  },
};
