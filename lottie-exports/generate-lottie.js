/**
 * Premium Lottie Animation Generator - UI Icon Pack
 * Programmatically constructs 10 marketplace-ready animated UI icons (Iconly Pro style).
 * Outputs files to: d:/WWM Calc/lottie-exports/*.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure output directory exists
const outputDir = path.resolve(__dirname, '../public/lottie-exports');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// ==========================================
// Lottie JSON Builder Helper Functions
// ==========================================

function createAnimation({ w = 500, h = 500, duration = 60, fps = 30, name = "Animation" }) {
  return {
    v: "5.5.0",
    fr: fps,
    ip: 0,
    op: duration,
    w: w,
    h: h,
    nm: name,
    ddd: 0,
    assets: [],
    layers: []
  };
}

function staticVal(val) {
  return { a: 0, k: val };
}

function keyframedVal(keyframes) {
  // Deep clone keyframes
  const cloned = JSON.parse(JSON.stringify(keyframes));
  if (cloned.length > 0) {
    const firstVal = cloned[0].s;
    const dim = Array.isArray(firstVal) ? firstVal.length : 1;

    cloned.forEach((kf) => {
      if (kf.i && kf.o) {
        // Expand tangents to match dimensions of the value array
        kf.i = {
          x: Array(dim).fill(kf.i.x[0] !== undefined ? kf.i.x[0] : 0.66),
          y: Array(dim).fill(kf.i.y[0] !== undefined ? kf.i.y[0] : 0.66)
        };
        kf.o = {
          x: Array(dim).fill(kf.o.x[0] !== undefined ? kf.o.x[0] : 0.33),
          y: Array(dim).fill(kf.o.y[0] !== undefined ? kf.o.y[0] : 0.33)
        };
      }
    });

    // Strip in/out tangents from the final keyframe as it does not interpolate forward
    delete cloned[cloned.length - 1].i;
    delete cloned[cloned.length - 1].o;
  }
  return { a: 1, k: cloned };
}

// Easing Curves
const easeInOut = {
  i: { x: [0.66], y: [0.66] },
  o: { x: [0.33], y: [0.33] }
};

const easeElastic = {
  i: { x: [0.15], y: [0.85] },
  o: { x: [0.30], y: [1.15] }
};

const easeLinear = {
  i: { x: [1], y: [1] },
  o: { x: [0], y: [0] }
};

function createKeyframe(time, value, ease = easeInOut) {
  const wrappedValue = Array.isArray(value) ? value : [value];
  return {
    t: time,
    s: wrappedValue,
    i: JSON.parse(JSON.stringify(ease.i)),
    o: JSON.parse(JSON.stringify(ease.o))
  };
}

function pad3D(val, defaultZ = 0) {
  if (Array.isArray(val)) {
    if (val.length === 2) {
      return [val[0], val[1], defaultZ];
    }
    return val;
  }
  return val;
}

function padProperty(val, isLayer, defaultZ = 0) {
  if (!val) return val;

  if (val.a === 1 && Array.isArray(val.k)) {
    // Keyframed property
    if (isLayer) {
      val.k.forEach(kf => {
        if (kf.s) {
          kf.s = pad3D(kf.s, defaultZ);
        }
        // Expand tangent dimensions to match
        const dim = kf.s ? kf.s.length : 1;
        if (kf.i && kf.i.x) {
          kf.i.x = Array(dim).fill(kf.i.x[0] !== undefined ? kf.i.x[0] : 0.66);
          kf.i.y = Array(dim).fill(kf.i.y[0] !== undefined ? kf.i.y[0] : 0.66);
        }
        if (kf.o && kf.o.x) {
          kf.o.x = Array(dim).fill(kf.o.x[0] !== undefined ? kf.o.x[0] : 0.33);
          kf.o.y = Array(dim).fill(kf.o.y[0] !== undefined ? kf.o.y[0] : 0.33);
        }
      });
    }
    return val;
  } else {
    // Static property
    let innerValue = val.k !== undefined ? val.k : val;
    if (isLayer) {
      innerValue = pad3D(innerValue, defaultZ);
    }
    return staticVal(innerValue);
  }
}

function createTransform({ 
  anchor = [0, 0], 
  pos = [0, 0], 
  scale = [100, 100], 
  rot = 0, 
  opacity = 100 
}, isLayer = false) {
  return {
    a: padProperty(anchor, isLayer, 0),
    p: padProperty(pos, isLayer, 0),
    s: padProperty(scale, isLayer, 100),
    r: (rot && rot.a !== undefined) ? rot : staticVal(rot),
    o: (opacity && opacity.a !== undefined) ? opacity : staticVal(opacity),
    sk: staticVal(0),
    sa: staticVal(0)
  };
}

function createShapeLayer({ name, index, transform = {}, shapes = [] }) {
  return {
    ty: 4, // Shape Layer
    ind: index,
    nm: name,
    sr: 1,
    ks: createTransform(transform, true), // Layer transform is 3D
    ao: 0,
    shapes: shapes,
    ip: 0,
    op: 1200,
    st: 0,
    bm: 0
  };
}

function createGroup(name, items, transform = {}) {
  return {
    ty: "gr",
    nm: name,
    np: items.length,
    cix: 2,
    bm: 0,
    ix: 1,
    it: [
      ...items,
      {
        ty: "tr",
        nm: "Transform",
        ...createTransform(transform, false) // Shape transforms remain 2D
      }
    ]
  };
}

function createEllipse(name, size, pos = [0, 0]) {
  return {
    ty: "el",
    nm: name,
    d: 1,
    s: (size && size.a !== undefined) ? size : staticVal(size),
    p: (pos && pos.a !== undefined) ? pos : staticVal(pos)
  };
}

function createRect(name, size, pos = [0, 0], roundness = 0) {
  return {
    ty: "rc",
    nm: name,
    d: 1,
    s: (size && size.a !== undefined) ? size : staticVal(size),
    p: (pos && pos.a !== undefined) ? pos : staticVal(pos),
    r: (roundness && roundness.a !== undefined) ? roundness : staticVal(roundness)
  };
}

function createPath(name, points, isClosed = false, inTangents = null, outTangents = null) {
  const n = points.length;
  return {
    ty: "sh",
    nm: name,
    ks: {
      a: 0,
      k: {
        c: isClosed,
        v: points,
        i: inTangents || Array(n).fill([0, 0]),
        o: outTangents || Array(n).fill([0, 0])
      }
    }
  };
}

function createFill(name, color = [1, 1, 1, 1]) {
  return {
    ty: "fl",
    nm: name,
    c: (color && color.a !== undefined) ? color : staticVal(color),
    o: staticVal(100),
    r: 1,
    bm: 0
  };
}

function createStroke(name, color = [1, 1, 1, 1], width = 4) {
  return {
    ty: "st",
    nm: name,
    c: (color && color.a !== undefined) ? color : staticVal(color),
    o: staticVal(100),
    w: (width && width.a !== undefined) ? width : staticVal(width),
    lc: 2, // Round cap
    lj: 2, // Round join
    ml: 4,
    bm: 0
  };
}

function createTrimPaths(name, start = 0, end = 100, offset = 0) {
  return {
    ty: "tm",
    nm: name,
    s: (start && start.a !== undefined) ? start : staticVal(start),
    e: (end && end.a !== undefined) ? end : staticVal(end),
    o: (offset && offset.a !== undefined) ? offset : staticVal(offset),
    m: 1
  };
}

// Consistent Palette
const COLORS = {
  bg: [0.082, 0.051, 0.125, 1],       // Midnight Purple #150D20
  cyan: [0, 0.95, 1, 1],             // Neon Cyan #00F2FE
  magenta: [0.95, 0.18, 0.45, 1],     // Neon Pink #F35588
  indigo: [0.48, 0.17, 0.75, 1],      // Neon Purple #7B2CBF
  gold: [1, 0.73, 0, 1],             // Gold #FFB100
  mint: [0, 1, 0.53, 1],             // Mint #00FF87
  white: [0.92, 0.94, 0.97, 1],       // White #ECEFF4
  slate: [0.45, 0.51, 0.60, 1],       // Slate #738299
  transparent: [0, 0, 0, 0]
};

// ==========================================
// 1. Search Icon
// ==========================================
function generateSearch() {
  const anim = createAnimation({ w: 500, h: 500, duration: 60, name: "Search" });

  const rotation = keyframedVal([
    createKeyframe(0, [0]),
    createKeyframe(25, [15], easeElastic),
    createKeyframe(45, [-10], easeElastic),
    createKeyframe(60, [0])
  ]);

  const scale = keyframedVal([
    createKeyframe(0, [100, 100]),
    createKeyframe(25, [110, 110], easeElastic),
    createKeyframe(60, [100, 100])
  ]);

  const flareTrim = keyframedVal([
    createKeyframe(0, 0),
    createKeyframe(15, 0),
    createKeyframe(40, 100, easeInOut),
    createKeyframe(60, 100)
  ]);

  anim.layers.push(createShapeLayer({
    name: "Search Icon Base",
    index: 1,
    transform: { pos: [250, 250], rot: rotation, scale: scale },
    shapes: [
      createGroup("MagnifierGlass", [
        createEllipse("GlassRing", [80, 80], [-15, -15]),
        createStroke("RingStroke", COLORS.cyan, 6)
      ]),
      createGroup("Handle", [
        createPath("HandleLine", [[13, 13], [48, 48]]),
        createStroke("HandleStroke", COLORS.white, 8)
      ]),
      createGroup("Flare", [
        createEllipse("GlassFlare", [60, 60], [-15, -15]),
        createStroke("FlareStroke", COLORS.mint, 4),
        createTrimPaths("FlareTrim", 0, flareTrim)
      ])
    ]
  }));

  return anim;
}

// ==========================================
// 2. Notification Bell
// ==========================================
function generateBell() {
  const anim = createAnimation({ w: 500, h: 500, duration: 60, name: "Bell" });

  const rotation = keyframedVal([
    createKeyframe(0, [0]),
    createKeyframe(12, [-15], easeElastic),
    createKeyframe(24, [15], easeElastic),
    createKeyframe(36, [-8], easeElastic),
    createKeyframe(48, [4], easeElastic),
    createKeyframe(60, [0])
  ]);

  const badgeScale = keyframedVal([
    createKeyframe(0, [0, 0]),
    createKeyframe(20, [0, 0]),
    createKeyframe(32, [130, 130], easeElastic),
    createKeyframe(42, [100, 100]),
    createKeyframe(60, [100, 100])
  ]);

  anim.layers.push(createShapeLayer({
    name: "Bell Base",
    index: 1,
    transform: { pos: [250, 250], rot: rotation, anchor: [0, -40] },
    shapes: [
      // Bell body
      createGroup("BellBody", [
        createPath("BellBodyPath", [
          [-35, 40], [-35, 10], [-25, -25], [0, -35], [25, -25], [35, 10], [35, 40]
        ], true, [
          [0, 0], [0, 10], [5, 5], [10, 0], [-5, 5], [0, -10], [0, 0]
        ], [
          [0, 0], [0, -10], [-5, -5], [-10, 0], [5, -5], [0, 10], [0, 0]
        ]),
        createStroke("BodyStroke", COLORS.cyan, 6)
      ]),
      // Bell clapper
      createGroup("Clapper", [
        createEllipse("ClapperCircle", [26, 26], [0, 48]),
        createFill("ClapperFill", COLORS.white)
      ]),
      // Ring top
      createGroup("TopRing", [
        createEllipse("TopRingShape", [24, 24], [0, -45]),
        createStroke("TopRingStroke", COLORS.white, 5)
      ]),
      // Bottom flare
      createGroup("BellBaseLine", [
        createPath("BaseLine", [[-45, 40], [45, 40]]),
        createStroke("BaseLineStroke", COLORS.cyan, 7)
      ])
    ]
  }));

  // Badge Notification Dot
  anim.layers.push(createShapeLayer({
    name: "Notification Badge",
    index: 2,
    transform: { pos: [280, 210], scale: badgeScale },
    shapes: [
      createGroup("BadgeDot", [
        createEllipse("BadgeCircle", [22, 22]),
        createFill("BadgeFill", COLORS.magenta)
      ])
    ]
  }));

  return anim;
}

// ==========================================
// 3. Settings Gear
// ==========================================
function generateSettings() {
  const anim = createAnimation({ w: 500, h: 500, duration: 60, name: "Settings" });

  const rotation = keyframedVal([
    createKeyframe(0, [0]),
    createKeyframe(30, [180], easeElastic),
    createKeyframe(60, [360], easeElastic)
  ]);

  const gearShapes = [
    // Outer Circle
    createEllipse("GearRim", [90, 90]),
    createStroke("RimStroke", COLORS.indigo, 8),
    // Spoke horizontal
    createRect("SpokeH", [110, 8], [0, 0], 4),
    createFill("SpokeHFill", COLORS.indigo),
    // Spoke vertical
    createRect("SpokeV", [8, 110], [0, 0], 4),
    createFill("SpokeVFill", COLORS.indigo),
    // Hub cutout
    createEllipse("HubCircle", [36, 36]),
    createStroke("HubStroke", COLORS.cyan, 6)
  ];

  // 8 Teeth around outer rim
  for (let i = 0; i < 8; i++) {
    const angle = i * 45;
    gearShapes.push(
      createGroup(`Tooth_${i}`, [
        createRect("ToothShape", [22, 26], [0, -50], 4),
        createFill("ToothFill", COLORS.indigo)
      ], { rot: angle })
    );
  }

  anim.layers.push(createShapeLayer({
    name: "Gear",
    index: 1,
    transform: { pos: [250, 250], rot: rotation },
    shapes: gearShapes
  }));

  return anim;
}

// ==========================================
// 4. Heart / Like
// ==========================================
function generateHeart() {
  const anim = createAnimation({ w: 500, h: 500, duration: 60, name: "Heart" });

  const scale = keyframedVal([
    createKeyframe(0, [100, 100]),
    createKeyframe(10, [75, 75], easeInOut),
    createKeyframe(20, [130, 130], easeElastic),
    createKeyframe(30, [100, 100]),
    createKeyframe(60, [100, 100])
  ]);

  const sparkOpacity = keyframedVal([
    createKeyframe(0, [0]),
    createKeyframe(16, [0]),
    createKeyframe(20, [100]),
    createKeyframe(40, [0])
  ]);

  const sparkTranslate = keyframedVal([
    createKeyframe(0, [0, 0]),
    createKeyframe(16, [0, 0]),
    createKeyframe(40, [0, -40]) // Spark travels outwards
  ]);

  anim.layers.push(createShapeLayer({
    name: "Heart Icon",
    index: 1,
    transform: { pos: [250, 250], scale: scale },
    shapes: [
      createGroup("HeartBody", [
        createPath("HeartPath", [
          [0, 25], [-35, -10], [-35, -35], [-17, -45], [0, -25], [17, -45], [35, -35], [35, -10]
        ], true, [
          [0, 0], [0, 15], [-10, 0], [-10, -5], [0, 0], [10, -5], [10, 0], [0, 15]
        ], [
          [0, 0], [0, -15], [10, 0], [10, 5], [0, 0], [-10, 5], [-10, 0], [0, -15]
        ]),
        createFill("HeartFill", COLORS.magenta)
      ])
    ]
  }));

  // Spark burst layers
  const sparkAngles = [0, 72, 144, 216, 288];
  const sparkShapes = sparkAngles.map((angle, idx) => {
    return createGroup(`Spark_${idx}`, [
      createEllipse("SparkDot", [10, 10], [0, -45]),
      createFill("SparkFill", COLORS.cyan)
    ], { rot: angle });
  });

  anim.layers.push(createShapeLayer({
    name: "Sparks",
    index: 2,
    transform: { pos: [250, 250], opacity: sparkOpacity, scale: [100, 100] },
    shapes: sparkShapes
  }));

  return anim;
}

// ==========================================
// 5. Chat Message
// ==========================================
function generateChat() {
  const anim = createAnimation({ w: 500, h: 500, duration: 60, name: "Chat" });

  const bubbleScale = keyframedVal([
    createKeyframe(0, [0, 0]),
    createKeyframe(14, [115, 115], easeElastic),
    createKeyframe(24, [100, 100]),
    createKeyframe(60, [100, 100])
  ]);

  // Dot bouncing keyframes
  function makeDotBounce(delay) {
    return keyframedVal([
      createKeyframe(0, [0, 0]),
      createKeyframe(delay, [0, 0]),
      createKeyframe(delay + 6, [0, -15], easeInOut),
      createKeyframe(delay + 12, [0, 0], easeInOut),
      createKeyframe(60, [0, 0])
    ]);
  }

  anim.layers.push(createShapeLayer({
    name: "Chat Bubble",
    index: 1,
    transform: { pos: [250, 250], scale: bubbleScale, anchor: [-30, 45] },
    shapes: [
      // Bubble Body
      createGroup("Bubble", [
        createRect("BubbleShape", [130, 95], [0, 0], 20),
        createStroke("BubbleStroke", COLORS.indigo, 6)
      ]),
      // Bubble tail
      createGroup("Tail", [
        createPath("TailShape", [[-30, 45], [-48, 55], [-16, 45]], true),
        createStroke("TailStroke", COLORS.indigo, 6)
      ])
    ]
  }));

  // 3 Bouncing Dots
  const dotX = [-30, 0, 30];
  dotX.forEach((x, idx) => {
    anim.layers.push(createShapeLayer({
      name: `Dot_${idx}`,
      index: idx + 2,
      transform: { pos: [250 + x, 250], scale: bubbleScale }, // scales along with bubble
      shapes: [
        createGroup("DotShape", [
          createEllipse("DotCircle", [12, 12]),
          createFill("DotFill", COLORS.cyan)
        ], { pos: makeDotBounce(18 + idx * 4) })
      ]
    }));
  });

  return anim;
}

// ==========================================
// 6. Shopping Cart
// ==========================================
function generateCart() {
  const anim = createAnimation({ w: 500, h: 500, duration: 60, name: "Cart" });

  const cartPos = keyframedVal([
    createKeyframe(0, [-120, 0]),
    createKeyframe(20, [15, 0], easeElastic),
    createKeyframe(30, [-5, 0], easeInOut),
    createKeyframe(36, [0, 0]),
    createKeyframe(60, [0, 0])
  ]);

  const cartRot = keyframedVal([
    createKeyframe(0, [0]),
    createKeyframe(20, [6], easeInOut),
    createKeyframe(28, [-4], easeInOut),
    createKeyframe(36, [0])
  ]);

  const boxPos = keyframedVal([
    createKeyframe(0, [0, -160]),
    createKeyframe(20, [0, -160]),
    createKeyframe(36, [0, -25], easeElastic), // Drops box into cart
    createKeyframe(60, [0, -25])
  ]);

  const boxScale = keyframedVal([
    createKeyframe(0, [0, 0]),
    createKeyframe(20, [0, 0]),
    createKeyframe(26, [120, 120], easeElastic),
    createKeyframe(36, [100, 100]),
    createKeyframe(60, [100, 100])
  ]);

  // Main Cart Shape Layer
  anim.layers.push(createShapeLayer({
    name: "Shopping Cart",
    index: 1,
    transform: { pos: [250, 250], rot: cartRot },
    shapes: [
      createGroup("CartTranslater", [
        // Wheels
        createGroup("WheelFront", [
          createEllipse("W1", [22, 22], [30, 48]),
          createStroke("W1Stroke", COLORS.white, 5)
        ]),
        createGroup("WheelBack", [
          createEllipse("W2", [22, 22], [-25, 48]),
          createStroke("W2Stroke", COLORS.white, 5)
        ]),
        // Cart Basket
        createGroup("Basket", [
          createPath("BasketLine", [
            [-50, -40], [45, -40], [30, 30], [-35, 30], [-55, -45], [-65, -45]
          ]),
          createStroke("BasketStroke", COLORS.cyan, 6)
        ]),
        // Inner divider line
        createGroup("InnerGrid", [
          createPath("DividerLine", [[-45, 10], [35, 10]]),
          createStroke("DividerStroke", COLORS.slate, 4)
        ])
      ], { pos: cartPos })
    ]
  }));

  // Falling Package/Box Layer
  anim.layers.push(createShapeLayer({
    name: "Cart Package",
    index: 2,
    transform: { pos: [250, 250] },
    shapes: [
      createGroup("Box", [
        createRect("BoxShape", [54, 44], [0, 0], 8),
        createFill("BoxFill", COLORS.magenta)
      ], { pos: boxPos, scale: boxScale })
    ]
  }));

  return anim;
}

// ==========================================
// 7. Edit Document
// ==========================================
function generateDocument() {
  const anim = createAnimation({ w: 500, h: 500, duration: 60, name: "Document" });

  const line1End = keyframedVal([
    createKeyframe(0, 0),
    createKeyframe(10, 0),
    createKeyframe(22, 100, easeInOut)
  ]);

  const line2End = keyframedVal([
    createKeyframe(0, 0),
    createKeyframe(18, 0),
    createKeyframe(30, 100, easeInOut)
  ]);

  const line3End = keyframedVal([
    createKeyframe(0, 0),
    createKeyframe(26, 0),
    createKeyframe(38, 100, easeInOut)
  ]);

  const pencilPos = keyframedVal([
    createKeyframe(0, [30, -25]),
    createKeyframe(10, [-25, -25], easeInOut), // write line 1
    createKeyframe(14, [25, 0]),
    createKeyframe(22, [-30, 0], easeInOut),  // write line 2
    createKeyframe(26, [20, 25]),
    createKeyframe(34, [-20, 25], easeInOut), // write line 3
    createKeyframe(46, [30, -25], easeElastic),
    createKeyframe(60, [30, -25])
  ]);

  anim.layers.push(createShapeLayer({
    name: "Paper Sheet",
    index: 1,
    transform: { pos: [250, 250] },
    shapes: [
      // Base Document
      createGroup("Sheet", [
        createRect("SheetBase", [105, 135], [0, 0], 12),
        createStroke("SheetStroke", COLORS.white, 6)
      ]),
      // Line 1
      createGroup("Line1", [
        createPath("P1", [[-30, -25], [30, -25]]),
        createStroke("S1", COLORS.cyan, 5),
        createTrimPaths("T1", 0, line1End)
      ]),
      // Line 2
      createGroup("Line2", [
        createPath("P2", [[-30, 0], [25, 0]]),
        createStroke("S2", COLORS.cyan, 5),
        createTrimPaths("T2", 0, line2End)
      ]),
      // Line 3
      createGroup("Line3", [
        createPath("P3", [[-30, 25], [20, 25]]),
        createStroke("S3", COLORS.cyan, 5),
        createTrimPaths("T3", 0, line3End)
      ])
    ]
  }));

  // Writing Pencil Layer
  anim.layers.push(createShapeLayer({
    name: "Pencil Layer",
    index: 2,
    transform: { pos: [250, 250] },
    shapes: [
      createGroup("Pencil", [
        // Pencil Body
        createRect("PBody", [10, 45], [0, -22], 2),
        createFill("PBodyFill", COLORS.indigo),
        // Tip
        createPath("PTip", [[-5, -45], [5, -45], [0, -55]], true),
        createFill("PTipFill", COLORS.gold)
      ], { pos: pencilPos, rot: 45 })
    ]
  }));

  return anim;
}

// ==========================================
// 8. Calendar
// ==========================================
function generateCalendar() {
  const anim = createAnimation({ w: 500, h: 500, duration: 60, name: "Calendar" });

  const rotation = keyframedVal([
    createKeyframe(0, [0]),
    createKeyframe(20, [-5], easeInOut),
    createKeyframe(40, [5], easeInOut),
    createKeyframe(60, [0])
  ]);

  const highlightScale = keyframedVal([
    createKeyframe(0, [0, 0]),
    createKeyframe(20, [0, 0]),
    createKeyframe(32, [130, 130], easeElastic),
    createKeyframe(42, [100, 100]),
    createKeyframe(60, [100, 100])
  ]);

  anim.layers.push(createShapeLayer({
    name: "Calendar Plate",
    index: 1,
    transform: { pos: [250, 250], rot: rotation },
    shapes: [
      // Base Calendar card
      createGroup("Plate", [
        createRect("PlateBase", [115, 110], [0, 5], 14),
        createStroke("PlateStroke", COLORS.cyan, 6)
      ]),
      // Top header band
      createGroup("HeaderBar", [
        createRect("Bar", [115, 24], [0, -32], 6),
        createFill("BarFill", COLORS.indigo)
      ]),
      // Binder Ring 1
      createGroup("RingLeft", [
        createEllipse("R1", [16, 26], [-30, -42]),
        createStroke("R1Stroke", COLORS.white, 5)
      ]),
      // Binder Ring 2
      createGroup("RingRight", [
        createEllipse("R2", [16, 26], [30, -42]),
        createStroke("R2Stroke", COLORS.white, 5)
      ]),
      // Day dots grid (9 small placeholder dots)
      createGroup("Day1", [createEllipse("D1", [10, 10], [-30, 5]), createFill("DF1", COLORS.slate)]),
      createGroup("Day2", [createEllipse("D2", [10, 10], [0, 5]), createFill("DF2", COLORS.slate)]),
      createGroup("Day3", [createEllipse("D3", [10, 10], [30, 5]), createFill("DF3", COLORS.slate)]),
      createGroup("Day4", [createEllipse("D4", [10, 10], [-30, 25]), createFill("DF4", COLORS.slate)]),
      createGroup("Day5", [createEllipse("D5", [10, 10], [0, 25]), createFill("DF5", COLORS.slate)]),
      createGroup("Day6", [createEllipse("D6", [10, 10], [30, 25]), createFill("DF6", COLORS.slate)]),
      createGroup("Day7", [createEllipse("D7", [10, 10], [-30, 45]), createFill("DF7", COLORS.slate)]),
      // Target Selected Day (Day 8 slot)
      createGroup("TargetDaySlot", [
        createEllipse("D8", [10, 10], [0, 45]),
        createFill("DF8", COLORS.magenta)
      ]),
      createGroup("Day9", [createEllipse("D9", [10, 10], [30, 45]), createFill("DF9", COLORS.slate)])
    ]
  }));

  // Selected Day Highlight Pulse Circle
  anim.layers.push(createShapeLayer({
    name: "Highlight Circle",
    index: 2,
    transform: { pos: [250, 295], scale: highlightScale },
    shapes: [
      createGroup("HCircle", [
        createEllipse("Ring", [26, 26]),
        createStroke("RingStroke", COLORS.magenta, 4)
      ])
    ]
  }));

  return anim;
}

// ==========================================
// 9. Trash Bin
// ==========================================
function generateTrash() {
  const anim = createAnimation({ w: 500, h: 500, duration: 60, name: "Trash" });

  const lidRot = keyframedVal([
    createKeyframe(0, [0]),
    createKeyframe(14, [-60], easeElastic), // Lift lid
    createKeyframe(38, [-60]),
    createKeyframe(50, [0], easeInOut)      // Snaps closed
  ]);

  const lidPos = keyframedVal([
    createKeyframe(0, [0, 0]),
    createKeyframe(14, [-20, -15], easeElastic),
    createKeyframe(38, [-20, -15]),
    createKeyframe(50, [0, 0], easeInOut)
  ]);

  const binShakeX = keyframedVal([
    createKeyframe(0, [0]),
    createKeyframe(18, [0]),
    createKeyframe(24, [8], easeInOut),
    createKeyframe(30, [-8], easeInOut),
    createKeyframe(36, [5], easeInOut),
    createKeyframe(42, [0])
  ]);

  anim.layers.push(createShapeLayer({
    name: "Trash Base Bin",
    index: 1,
    transform: { pos: [250, 250] },
    shapes: [
      createGroup("BinBase", [
        // Trapezoidal bucket shape
        createPath("Bucket", [[-30, 45], [-36, -30], [36, -30], [30, 45]], true),
        createStroke("BucketStroke", COLORS.cyan, 6)
      ], { pos: { a: 1, k: binShakeX.k } })
    ]
  }));

  // Trash Lid Layer
  anim.layers.push(createShapeLayer({
    name: "Trash Lid",
    index: 2,
    transform: { pos: [250, 220] },
    shapes: [
      createGroup("LidGroup", [
        // Horizontal Lid Plate
        createRect("LidPlate", [92, 10], [0, 0], 4),
        createStroke("LidPlateStroke", COLORS.white, 5),
        // Handle Loop
        createPath("LidHandle", [[-16, -5], [-16, -18], [16, -18], [16, -5]]),
        createStroke("HandleStroke", COLORS.white, 5)
      ], { pos: lidPos, rot: lidRot, anchor: [40, 0] })
    ]
  }));

  return anim;
}

// ==========================================
// 10. Profile / User
// ==========================================
function generateProfile() {
  const anim = createAnimation({ w: 500, h: 500, duration: 60, name: "Profile" });

  const scale = keyframedVal([
    createKeyframe(0, [0, 0]),
    createKeyframe(16, [120, 120], easeElastic),
    createKeyframe(26, [100, 100]),
    createKeyframe(60, [100, 100])
  ]);

  const rippleScale = keyframedVal([
    createKeyframe(0, [60, 60]),
    createKeyframe(12, [60, 60]),
    createKeyframe(36, [150, 150], easeInOut),
    createKeyframe(60, [150, 150])
  ]);

  const rippleOpacity = keyframedVal([
    createKeyframe(0, [0]),
    createKeyframe(12, [100]),
    createKeyframe(36, [0]),
    createKeyframe(60, [0])
  ]);

  anim.layers.push(createShapeLayer({
    name: "User Avatar",
    index: 1,
    transform: { pos: [250, 250], scale: scale },
    shapes: [
      // Avatar Head
      createGroup("Head", [
        createEllipse("HeadCircle", [44, 44], [0, -32]),
        createStroke("HeadStroke", COLORS.indigo, 6)
      ]),
      // Avatar Shoulders
      createGroup("Shoulders", [
        createPath("ShouldersArc", [[-55, 45], [-45, 10], [45, 10], [55, 45]], true, [
          [0, 0], [-10, 10], [10, -10], [0, 0]
        ], [
          [0, 0], [10, -10], [-10, 10], [0, 0]
        ]),
        createStroke("ShoulderStroke", COLORS.indigo, 6)
      ])
    ]
  }));

  // Expanding profile ring ripple
  anim.layers.push(createShapeLayer({
    name: "Ripple Ring",
    index: 2,
    transform: { pos: [250, 250], scale: rippleScale, opacity: rippleOpacity },
    shapes: [
      createGroup("Ripple", [
        createEllipse("RCircle", [90, 90]),
        createStroke("RStroke", COLORS.cyan, 3)
      ])
    ]
  }));

  return anim;
}

// ==========================================
// File Exporter Trigger
// ==========================================

const animationsToBuild = [
  { file: "search.json", data: generateSearch() },
  { file: "bell.json", data: generateBell() },
  { file: "settings.json", data: generateSettings() },
  { file: "heart.json", data: generateHeart() },
  { file: "chat.json", data: generateChat() },
  { file: "cart.json", data: generateCart() },
  { file: "document.json", data: generateDocument() },
  { file: "calendar.json", data: generateCalendar() },
  { file: "trash.json", data: generateTrash() },
  { file: "profile.json", data: generateProfile() }
];

console.log("⚡ Starting Lottie JSON Compilation...");

animationsToBuild.forEach(item => {
  const filePath = path.join(outputDir, item.file);
  fs.writeFileSync(filePath, JSON.stringify(item.data, null, 2), "utf8");
  console.log(`✅ Saved: ${item.file} -> ${filePath}`);
});

console.log("🚀 All 10 UI animations generated successfully!");
