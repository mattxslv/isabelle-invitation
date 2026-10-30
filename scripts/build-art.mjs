// Generates the watercolor garden artwork as SVG and pre-renders it to WebP.
//
// Rendering at build time keeps runtime cheap on phones: the page only
// composites plain images instead of running SVG filters while scrolling.
// Output: public/art/*.webp. Re-run with `npm run art`.
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const OUT = "public/art";
const PREVIEW = process.argv.includes("--preview");
mkdirSync(OUT, { recursive: true });

// ---------------------------------------------------------------------------
// Utilities

function mulberry32(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let rand = mulberry32(1);
const between = (a, b) => a + rand() * (b - a);
const pick = (list) => list[Math.floor(rand() * list.length)];
const f = (n) => Number(n.toFixed(1));
let uid = 0;
const id = (prefix) => `${prefix}${++uid}`;

// Palettes: [light, mid, edge, deep]
const PAL = {
  blush: ["#FFF4F6", "#F7D3DC", "#EBA6BA", "#CF7C98"],
  rose: ["#FEEFF2", "#F4C6D1", "#E296AD", "#BE6886"],
  lavender: ["#F7F2FD", "#E1D2F3", "#BEA3E0", "#9273C2"],
  lilac: ["#F4EFFB", "#D8C9EF", "#AE95D8", "#8065B2"],
  peach: ["#FFF6EF", "#F9E0D0", "#EEBFA6", "#CF9576"],
  cream: ["#FFFDF9", "#F7EDE0", "#E7D3B9", "#C4A47F"],
};
const LEAF = ["#E3EDDB", "#BED3B1", "#94B38B", "#6F8F68"];
const EUCA = ["#E6EEE4", "#C3D3C1", "#9DB39C", "#7D957D"];
const GOLD = "#B18B5C";

function defs(extra = "") {
  return `<defs>
  <filter id="wc" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="3" seed="7" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="2" seed="3" result="g"/>
    <feColorMatrix in="g" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -0.35 1.12" result="ga"/>
    <feComposite in="d" in2="ga" operator="in" result="t"/>
    <feGaussianBlur in="t" stdDeviation="0.55"/>
  </filter>
  <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
    <feGaussianBlur stdDeviation="22"/>
  </filter>
  <filter id="line" x="-10%" y="-10%" width="120%" height="120%">
    <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="11" result="n"/>
    <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" xChannelSelector="R" yChannelSelector="G"/>
  </filter>
  ${extra}
</defs>`;
}

function radial(cx, cy, r, stops) {
  const gid = id("g");
  const s = stops
    .map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`)
    .join("");
  return {
    gid,
    def: `<radialGradient id="${gid}" gradientUnits="userSpaceOnUse" cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}">${s}</radialGradient>`,
  };
}

function linear(x1, y1, x2, y2, stops) {
  const gid = id("l");
  const s = stops
    .map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`)
    .join("");
  return {
    gid,
    def: `<linearGradient id="${gid}" gradientUnits="userSpaceOnUse" x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}">${s}</linearGradient>`,
  };
}

// ---------------------------------------------------------------------------
// Shapes (petals point toward -y from the origin)

function roundPetal(L, W) {
  const j = () => between(0.9, 1.1);
  return `M0 0 C ${f(-W * j())} ${f(-L * 0.22)} ${f(-W * 1.05 * j())} ${f(-L * 0.9)} ${f(-W * 0.35)} ${f(-L)} Q 0 ${f(-L * between(0.88, 0.96))} ${f(W * 0.35)} ${f(-L)} C ${f(W * 1.05 * j())} ${f(-L * 0.9)} ${f(W * j())} ${f(-L * 0.22)} 0 0 Z`;
}

function pointPetal(L, W) {
  const j = () => between(0.88, 1.12);
  return `M0 0 C ${f(-W * j())} ${f(-L * 0.3)} ${f(-W * 0.65 * j())} ${f(-L * 0.85)} 0 ${f(-L)} C ${f(W * 0.65 * j())} ${f(-L * 0.85)} ${f(W * j())} ${f(-L * 0.3)} 0 0 Z`;
}

function leafPath(L, W) {
  const j = () => between(0.85, 1.15);
  return `M0 0 C ${f(W * j())} ${f(-L * 0.25)} ${f(W * 0.75 * j())} ${f(-L * 0.75)} 0 ${f(-L)} C ${f(-W * 0.75 * j())} ${f(-L * 0.75)} ${f(-W * j())} ${f(-L * 0.25)} 0 0 Z`;
}

// ---------------------------------------------------------------------------
// Flowers. Each returns { defs, body }.

function rose(cx, cy, R, pal, rot = between(0, 360)) {
  const [light, mid, edge, deep] = pal;
  // Each layer gets its own gradient so every petal ring reads as a cupped
  // petal: deeper at its base, luminous toward the rim, with a pigment edge.
  const layers = [
    { n: 8, L: R, W: R * 0.46 },
    { n: 7, L: R * 0.82, W: R * 0.44 },
    { n: 6, L: R * 0.64, W: R * 0.4 },
    { n: 6, L: R * 0.46, W: R * 0.34 },
    { n: 5, L: R * 0.3, W: R * 0.26 },
  ];
  let d = "";
  let body = "";
  layers.forEach((layer, li) => {
    const g = radial(cx, cy, layer.L, [
      [0, deep],
      [0.3, edge],
      [0.72, li < 2 ? light : mid],
      [1, li < 2 ? mid : edge],
    ]);
    d += g.def;
    const offset = rot + li * 23;
    for (let i = 0; i < layer.n; i++) {
      const a = offset + (360 / layer.n) * i + between(-6, 6);
      const petal = roundPetal(layer.L * between(0.92, 1.05), layer.W);
      body += `<path d="${petal}" transform="translate(${f(cx)} ${f(cy)}) rotate(${f(a)})" fill="url(#${g.gid})" fill-opacity="${f(between(0.9, 0.98))}" stroke="${edge}" stroke-opacity="0.6" stroke-width="${f(R * 0.014 + 0.7)}"/>`;
      // luminous rim just inside the petal edge
      body += `<path d="${petal}" transform="translate(${f(cx)} ${f(cy)}) rotate(${f(a)}) scale(0.9)" fill="none" stroke="#FFFFFF" stroke-opacity="${li < 2 ? 0.55 : 0.4}" stroke-width="${f(R * 0.02 + 0.6)}"/>`;
    }
  });
  // tight bud at the heart of the bloom
  const c = radial(cx, cy, R * 0.18, [
    [0, deep],
    [1, edge],
  ]);
  d += c.def;
  for (let i = 0; i < 4; i++) {
    body += `<path d="${roundPetal(R * 0.16, R * 0.14)}" transform="translate(${f(cx)} ${f(cy)}) rotate(${f(rot + i * 90 + 45)})" fill="url(#${c.gid})" stroke="${deep}" stroke-opacity="0.6" stroke-width="0.8"/>`;
  }
  body += `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(R * 0.06)}" ry="${f(R * 0.045)}" fill="${deep}" fill-opacity="0.85"/>`;
  return { defs: d, body: `<g filter="url(#wc)">${body}</g>` };
}

// Leaves tucked around a bloom so it sits in foliage rather than floating.
function nest(cx, cy, R, count = 6, pal = LEAF) {
  const parts = [];
  for (let i = 0; i < count; i++) {
    const a = (360 / count) * i + between(-20, 20);
    const rad = ((a - 90) * Math.PI) / 180;
    parts.push(leaf(cx + Math.cos(rad) * R * 0.55, cy + Math.sin(rad) * R * 0.55, a, R * between(0.85, 1.15), R * between(0.32, 0.4), pal));
  }
  return parts;
}

function cosmos(cx, cy, R, pal, rot = between(0, 360)) {
  const [light, mid, edge, deep] = pal;
  const g = radial(cx, cy, R, [
    [0, deep],
    [0.18, edge],
    [0.5, mid],
    [0.9, light],
    [1, mid],
  ]);
  const n = pick([6, 7, 8]);
  let body = "";
  for (let i = 0; i < n; i++) {
    const a = rot + (360 / n) * i + between(-7, 7);
    body += `<path d="${roundPetal(R * between(0.9, 1.04), R * 0.42)}" transform="translate(${f(cx)} ${f(cy)}) rotate(${f(a)})" fill="url(#${g.gid})" fill-opacity="0.95" stroke="${edge}" stroke-opacity="0.6" stroke-width="${f(R * 0.014 + 0.7)}"/>`;
    // petal vein
    body += `<path d="M0 ${f(-R * 0.16)} L0 ${f(-R * 0.7)}" transform="translate(${f(cx)} ${f(cy)}) rotate(${f(a)})" stroke="${deep}" stroke-opacity="0.25" stroke-width="${f(R * 0.012 + 0.4)}"/>`;
  }
  const cg = radial(cx, cy, R * 0.2, [
    [0, "#F3DC9C"],
    [0.7, "#D9B66E"],
    [1, "#B18B5C"],
  ]);
  body += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(R * 0.17)}" fill="url(#${cg.gid})"/>`;
  for (let i = 0; i < 14; i++) {
    const a = between(0, Math.PI * 2);
    const d = between(0, R * 0.15);
    body += `<circle cx="${f(cx + Math.cos(a) * d)}" cy="${f(cy + Math.sin(a) * d)}" r="${f(R * 0.022 + 0.6)}" fill="#8C6A45" fill-opacity="0.6"/>`;
  }
  return { defs: g.def + cg.def, body: `<g filter="url(#wc)">${body}</g>` };
}

function hydrangea(cx, cy, R, pal) {
  const [light, mid, edge, deep] = pal;
  let body = "";
  let d = "";
  const count = Math.round(R / 3.2);
  for (let k = 0; k < count; k++) {
    const a = between(0, Math.PI * 2);
    const dist = Math.sqrt(rand()) * R * 0.82;
    const x = cx + Math.cos(a) * dist;
    const y = cy + Math.sin(a) * dist;
    const r = R * between(0.16, 0.22);
    const shade = pick([light, mid, mid, edge]);
    const g = radial(x, y, r, [
      [0, deep, 0.9],
      [0.25, edge],
      [0.75, shade],
      [1, mid],
    ]);
    d += g.def;
    const rot = between(0, 90);
    for (let i = 0; i < 4; i++) {
      body += `<path d="${roundPetal(r, r * 0.55)}" transform="translate(${f(x)} ${f(y)}) rotate(${f(rot + i * 90)})" fill="url(#${g.gid})" fill-opacity="0.94" stroke="${edge}" stroke-opacity="0.55" stroke-width="0.9"/>`;
    }
  }
  return { defs: d, body: `<g filter="url(#wc)">${body}</g>` };
}

function bud(cx, cy, R, pal, angle) {
  const [light, mid, edge, deep] = pal;
  const g = linear(0, 0, 0, -R, [
    [0, deep],
    [0.5, edge],
    [1, mid],
  ]);
  const gl = linear(0, 0, 0, -R, [
    [0, LEAF[3]],
    [1, LEAF[1]],
  ]);
  const body = `<g transform="translate(${f(cx)} ${f(cy)}) rotate(${f(angle)})" filter="url(#wc)">
    <path d="M0 ${f(R * 0.9)} Q ${f(R * 0.15)} ${f(R * 0.4)} 0 0" stroke="${LEAF[3]}" stroke-width="${f(R * 0.06 + 1)}" fill="none" stroke-linecap="round"/>
    <path d="${pointPetal(R, R * 0.42)}" fill="url(#${g.gid})" fill-opacity="0.9" stroke="${edge}" stroke-opacity="0.5" stroke-width="1"/>
    <path d="${pointPetal(R * 0.75, R * 0.3)}" transform="rotate(-14)" fill="${light}" fill-opacity="0.55"/>
    <path d="${pointPetal(R * 0.42, R * 0.26)}" transform="rotate(-28)" fill="url(#${gl.gid})" fill-opacity="0.9"/>
    <path d="${pointPetal(R * 0.42, R * 0.26)}" transform="rotate(28)" fill="url(#${gl.gid})" fill-opacity="0.9"/>
  </g>`;
  return { defs: g.def + gl.def, body };
}

function leaf(x, y, angle, L, W, pal = LEAF) {
  const g = linear(0, 0, 0, -L, [
    [0, pal[3]],
    [0.45, pal[2]],
    [1, pal[1]],
  ]);
  const body = `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(angle)})" filter="url(#wc)">
    <path d="${leafPath(L, W)}" fill="url(#${g.gid})" fill-opacity="${f(between(0.86, 0.96))}" stroke="${pal[3]}" stroke-opacity="0.45" stroke-width="1"/>
    <path d="M0 ${f(-L * 0.04)} Q ${f(W * 0.12)} ${f(-L * 0.5)} 0 ${f(-L * 0.92)}" stroke="${pal[3]}" stroke-opacity="0.45" stroke-width="1.1" fill="none"/>
  </g>`;
  return { defs: g.def, body };
}

// A curved stem with alternating leaves, grown from (x, y) toward `angle`.
function branch(x, y, angle, length, opts = {}) {
  const { pal = LEAF, leafL = 42, leafW = 16, count = 6, round = false } = opts;
  const rad = ((angle - 90) * Math.PI) / 180;
  const bend = between(-0.35, 0.35);
  const ex = x + Math.cos(rad) * length;
  const ey = y + Math.sin(rad) * length;
  const mx = x + Math.cos(rad + bend) * length * 0.55;
  const my = y + Math.sin(rad + bend) * length * 0.55;
  let defsOut = "";
  let body = `<path d="M ${f(x)} ${f(y)} Q ${f(mx)} ${f(my)} ${f(ex)} ${f(ey)}" stroke="${pal[3]}" stroke-opacity="0.75" stroke-width="2.2" fill="none" stroke-linecap="round" filter="url(#line)"/>`;
  for (let i = 1; i <= count; i++) {
    const t = i / (count + 0.6);
    const px = (1 - t) * (1 - t) * x + 2 * (1 - t) * t * mx + t * t * ex;
    const py = (1 - t) * (1 - t) * y + 2 * (1 - t) * t * my + t * t * ey;
    const side = i % 2 ? 1 : -1;
    const scale = 1 - t * 0.45;
    if (round) {
      const r = leafL * 0.38 * scale;
      const g = radial(px + side * r, py, r * 1.2, [
        [0, pal[1]],
        [0.7, pal[2]],
        [1, pal[3]],
      ]);
      defsOut += g.def;
      body += `<ellipse cx="${f(px + side * r * 0.9)}" cy="${f(py)}" rx="${f(r)}" ry="${f(r * 0.9)}" fill="url(#${g.gid})" fill-opacity="0.92" stroke="${pal[3]}" stroke-opacity="0.4" filter="url(#wc)"/>`;
    } else {
      const l = leaf(px, py, angle + side * between(35, 55), leafL * scale, leafW * scale, pal);
      defsOut += l.defs;
      body += l.body;
    }
  }
  return { defs: defsOut, body };
}

function goldVine(x, y, angle, length) {
  const rad = ((angle - 90) * Math.PI) / 180;
  const ex = x + Math.cos(rad) * length;
  const ey = y + Math.sin(rad) * length;
  const bend = between(-0.5, 0.5);
  const mx = x + Math.cos(rad + bend) * length * 0.5;
  const my = y + Math.sin(rad + bend) * length * 0.5;
  let body = `<path d="M ${f(x)} ${f(y)} Q ${f(mx)} ${f(my)} ${f(ex)} ${f(ey)}" stroke="${GOLD}" stroke-width="1.4" fill="none" stroke-linecap="round" opacity="0.8"/>`;
  for (let i = 1; i <= 5; i++) {
    const t = i / 6;
    const px = (1 - t) * (1 - t) * x + 2 * (1 - t) * t * mx + t * t * ex;
    const py = (1 - t) * (1 - t) * y + 2 * (1 - t) * t * my + t * t * ey;
    const side = i % 2 ? 1 : -1;
    body += `<path d="${leafPath(16 - i, 6)}" transform="translate(${f(px)} ${f(py)}) rotate(${f(angle + side * 50)})" fill="none" stroke="${GOLD}" stroke-width="1.1" opacity="0.75"/>`;
  }
  body += `<circle cx="${f(ex)}" cy="${f(ey)}" r="2.2" fill="${GOLD}" opacity="0.8"/>`;
  return { defs: "", body };
}

function sparkles(n, bounds) {
  let body = "";
  for (let i = 0; i < n; i++) {
    const x = between(bounds[0], bounds[2]);
    const y = between(bounds[1], bounds[3]);
    body += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(between(1, 2.6))}" fill="${GOLD}" opacity="${f(between(0.35, 0.7))}"/>`;
  }
  return { defs: "", body };
}

function babysBreath(x, y, angle, length) {
  const rad = ((angle - 90) * Math.PI) / 180;
  let body = "";
  for (let s = 0; s < 4; s++) {
    const a = rad + between(-0.4, 0.4);
    const l = length * between(0.6, 1);
    const ex = x + Math.cos(a) * l;
    const ey = y + Math.sin(a) * l;
    body += `<path d="M ${f(x)} ${f(y)} L ${f(ex)} ${f(ey)}" stroke="${LEAF[2]}" stroke-width="1" opacity="0.7"/>`;
    for (let k = 0; k < 4; k++) {
      body += `<circle cx="${f(ex + between(-9, 9))}" cy="${f(ey + between(-9, 9))}" r="${f(between(2.5, 4.5))}" fill="#FFFFFF" stroke="${PAL.blush[2]}" stroke-opacity="0.5" opacity="0.9"/>`;
    }
  }
  return { defs: "", body: `<g filter="url(#wc)">${body}</g>` };
}

function wash(cx, cy, r, color, opacity) {
  return {
    defs: "",
    body: `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(r)}" ry="${f(r * between(0.7, 0.95))}" fill="${color}" opacity="${opacity}" filter="url(#soft)"/>`,
  };
}

// `fade` softens edges that are NOT anchored to a page edge, so artwork never
// shows a rectangular cut-off. Values are fractions of the canvas size.
function svg(width, height, parts, extraDefs = "", fade = {}) {
  const d = parts.map((p) => p.defs).join("");
  let b = parts.map((p) => p.body).join("\n");
  const { l = 0, r = 0, t = 0, b: bot = 0 } = fade;
  let maskDefs = "";
  const stops = (a, z) =>
    `<stop offset="0" stop-color="#fff" stop-opacity="${a ? 0 : 1}"/><stop offset="${a}" stop-color="#fff"/><stop offset="${1 - z}" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="${z ? 0 : 1}"/>`;
  if (l || r) {
    maskDefs += `<linearGradient id="fx" x1="0" y1="0" x2="1" y2="0">${stops(l, r)}</linearGradient><mask id="mx" maskUnits="userSpaceOnUse" x="0" y="0" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="url(#fx)"/></mask>`;
    b = `<g mask="url(#mx)">${b}</g>`;
  }
  if (t || bot) {
    maskDefs += `<linearGradient id="fy" x1="0" y1="0" x2="0" y2="1">${stops(t, bot)}</linearGradient><mask id="my" maskUnits="userSpaceOnUse" x="0" y="0" width="${width}" height="${height}"><rect width="${width}" height="${height}" fill="url(#fy)"/></mask>`;
    b = `<g mask="url(#my)">${b}</g>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${defs(extraDefs + d + maskDefs)}${b}</svg>`;
}

function corner() {
  rand = mulberry32(42);
  const parts = [
    wash(150, 130, 220, "#F4C6D1", 0.35),
    wash(70, 360, 170, "#D8C9EF", 0.35),
    wash(360, 80, 160, "#E1D2F3", 0.3),
  ];
  // greenery radiating from the corner (angle measured from "up", clockwise)
  const greens = [
    [100, 400, false],
    [118, 330, true],
    [135, 380, false],
    [152, 320, true],
    [170, 400, false],
  ];
  for (const [ang, len, round] of greens) {
    parts.push(
      branch(between(60, 110), between(60, 110), ang, len, {
        round,
        pal: round ? EUCA : LEAF,
        count: round ? 9 : 8,
        leafL: round ? 52 : 64,
        leafW: 24,
      }),
    );
  }
  parts.push(goldVine(170, 170, 112, 420));
  parts.push(goldVine(150, 190, 165, 380));
  parts.push(...nest(105, 105, 140, 9), ...nest(330, 90, 90, 6), ...nest(80, 330, 95, 6), ...nest(265, 265, 85, 6, EUCA));
  parts.push(babysBreath(360, 280, 130, 90));
  parts.push(babysBreath(190, 420, 165, 80));
  parts.push(babysBreath(470, 150, 105, 80));
  parts.push(bud(500, 92, 44, PAL.rose, 108));
  parts.push(bud(92, 500, 42, PAL.lavender, 162));
  parts.push(bud(395, 345, 36, PAL.blush, 135));
  parts.push(hydrangea(262, 262, 80, PAL.lilac));
  parts.push(cosmos(345, 88, 80, PAL.lavender));
  parts.push(rose(84, 345, 84, PAL.lavender));
  parts.push(cosmos(200, 400, 52, PAL.blush));
  parts.push(rose(420, 210, 52, PAL.rose));
  parts.push(rose(108, 108, 132, PAL.blush));
  parts.push(sparkles(22, [60, 60, 560, 560]));
  return svg(640, 640, parts, "", { r: 0.3, b: 0.3 });
}


function spray(seed, palA, palB) {
  rand = mulberry32(seed);
  const cx = 330;
  const cy = 250;
  const parts = [wash(cx, cy, 170, palA[1], 0.45), wash(cx + 120, cy - 40, 110, palB[1], 0.4)];
  for (const a of [250, 272, 292, 235]) parts.push(branch(cx, cy, a, between(200, 260), { count: 8, leafL: 60, leafW: 22 }));
  for (const a of [72, 92, 112]) parts.push(branch(cx, cy, a, between(180, 230), { round: rand() > 0.5, pal: EUCA, count: 8, leafL: 52 }));
  parts.push(goldVine(cx, cy, 285, 260));
  parts.push(goldVine(cx, cy, 95, 230));
  parts.push(...nest(cx, cy, 120, 9), ...nest(cx + 95, cy - 30, 80, 5, EUCA), ...nest(cx - 85, cy + 45, 70, 5));
  parts.push(babysBreath(cx - 120, cy - 60, 300, 70));
  parts.push(babysBreath(cx + 150, cy + 50, 100, 70));
  parts.push(bud(cx - 200, cy - 10, 40, palA, 270));
  parts.push(bud(cx + 210, cy + 10, 38, palB, 95));
  parts.push(hydrangea(cx - 85, cy + 45, 62, PAL.lilac));
  parts.push(cosmos(cx + 95, cy - 30, 70, palB));
  parts.push(rose(cx + 70, cy + 70, 46, PAL.rose));
  parts.push(rose(cx, cy, 96, palA));
  parts.push(sparkles(14, [cx - 260, cy - 160, cx + 260, cy + 160]));
  return svg(660, 500, parts, "", { l: 0.22, r: 0.22, t: 0.22, b: 0.22 });
}


function garland() {
  rand = mulberry32(7);
  const W = 1500;
  const H = 460;
  const parts = [];
  for (let x = 60; x < W; x += 260) parts.push(wash(x + between(-40, 40), H - 60, 190, pick(["#F4C6D1", "#D8C9EF", "#E1D2F3"]), 0.35));
  for (let x = 20; x < W; x += 60) {
    parts.push(branch(x + between(-20, 20), H + 10, between(-35, 35), between(150, 280), { round: rand() > 0.6, pal: rand() > 0.6 ? EUCA : LEAF, count: 7, leafL: 58, leafW: 22 }));
  }
  for (let x = 40; x < W; x += 110) parts.push(...nest(x, H - 50, 90, 5));
  for (let x = 80; x < W; x += 210) parts.push(babysBreath(x, H - 120, between(-30, 30), 70));
  for (let x = 140; x < W; x += 300) parts.push(goldVine(x, H, between(-30, 30), between(200, 280)));
  const flowers = [];
  for (let x = 40; x < W + 40; x += between(120, 170)) flowers.push(x);
  flowers.forEach((x, i) => {
    const y = H - between(30, 90);
    const type = i % 4;
    if (type === 0) parts.push(rose(x, y, between(70, 95), pick([PAL.blush, PAL.rose])));
    else if (type === 1) parts.push(cosmos(x, y - 20, between(52, 68), pick([PAL.lavender, PAL.lilac])));
    else if (type === 2) parts.push(hydrangea(x, y, between(56, 70), PAL.lilac));
    else parts.push(rose(x, y - 10, between(55, 70), PAL.lavender));
    if (rand() > 0.4) parts.push(bud(x + between(40, 70), y - between(90, 140), between(30, 40), pick([PAL.blush, PAL.lavender]), between(-25, 25)));
  });
  parts.push(sparkles(40, [0, 120, W, H - 40]));
  return svg(W, H, parts, "", { t: 0.35 });
}


function paper() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <filter id="grain" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="2" stitchTiles="stitch"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.45  0 0 0 0 0.36  0 0 0 0 0.26  0 0 0 0.09 0"/>
    </filter>
    <filter id="mottle" x="0" y="0" width="100%" height="100%">
      <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="5" stitchTiles="stitch"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0.86  0 0 0 0 0.78  0 0 0 0 0.68  0 0 0 0.16 -0.03"/>
    </filter>
  </defs>
  <rect width="512" height="512" fill="#FBF8F2"/>
  <rect width="512" height="512" filter="url(#mottle)"/>
  <rect width="512" height="512" filter="url(#grain)"/>
</svg>`;
}


// Bouquet growing in from the LEFT page edge. Mirror it for the right edge.
function edge(seed, palA, palB) {
  rand = mulberry32(seed);
  const W = 360;
  const H = 420;
  const cy = 210;
  const parts = [wash(40, cy, 150, palA[1], 0.4), wash(90, cy - 80, 90, palB[1], 0.35)];
  for (const a of [20, 45, 70, 95, 120, 145, 165]) {
    parts.push(branch(between(0, 30), cy + between(-50, 50), a, between(170, 250), { round: rand() > 0.6, pal: rand() > 0.6 ? EUCA : LEAF, count: 7, leafL: 54, leafW: 21 }));
  }
  parts.push(goldVine(20, cy, 70, 230), goldVine(20, cy + 20, 120, 200));
  parts.push(...nest(30, cy, 110, 8), ...nest(110, cy - 85, 60, 5, EUCA), ...nest(95, cy + 90, 60, 5));
  parts.push(babysBreath(150, cy - 40, 60, 60), babysBreath(140, cy + 70, 120, 60));
  parts.push(bud(205, cy - 70, 32, palB, 70), bud(200, cy + 95, 30, palA, 115));
  parts.push(hydrangea(105, cy + 85, 52, PAL.lilac));
  parts.push(cosmos(118, cy - 80, 56, palB));
  parts.push(rose(130, cy + 10, 40, PAL.rose));
  parts.push(rose(28, cy, 96, palA));
  parts.push(sparkles(10, [40, 40, 300, 380]));
  return svg(W, H, parts, "", { r: 0.32, t: 0.2, b: 0.2 });
}

// --- butterflies -----------------------------------------------------------
// Painted at 2x, then split down the body into two wing halves so the page
// can fold them in 3D for a natural flap.
const BUTTERFLY_PALETTES = {
  lavender: ["#F8F3FD", "#DCCBF1", "#B395DC", "#7E5FB0"],
  blush: ["#FFF5F7", "#F6CDD8", "#E59CB3", "#B9668A"],
  ivory: ["#FFFCF4", "#F6E7CB", "#E2C391", "#B28A57"],
  periwinkle: ["#F4F5FD", "#D3D7F3", "#A6ADE0", "#6F78BC"],
};

function wingSide(pal, seed) {
  const [light, mid, edgeC, deep] = pal;
  rand = mulberry32(seed);
  const fore = "M104 74 C 118 40 150 14 186 12 C 198 12 200 24 194 38 C 184 62 176 80 160 92 C 140 100 120 96 106 88 Z";
  const hind = "M104 94 C 124 98 150 104 166 118 C 178 130 172 150 156 158 C 138 166 122 150 114 132 C 108 118 104 106 104 94 Z";
  const gf = radial(104, 82, 100, [[0, deep, 0.95], [0.25, edgeC], [0.62, mid], [0.9, light], [1, mid]]);
  const gh = radial(104, 98, 72, [[0, deep, 0.95], [0.3, edgeC], [0.7, mid], [1, light]]);
  let veins = "";
  for (const [x, y] of [[180, 20], [188, 40], [176, 70], [160, 90], [150, 30]]) {
    veins += `<path d="M106 80 Q ${f((106 + x) / 2 + between(-6, 6))} ${f((80 + y) / 2 + between(-6, 6))} ${x} ${y}" stroke="${deep}" stroke-opacity="0.35" stroke-width="1.1" fill="none"/>`;
  }
  for (const [x, y] of [[160, 150], [168, 126], [140, 160]]) {
    veins += `<path d="M106 98 Q ${f((106 + x) / 2)} ${f((98 + y) / 2 - 4)} ${x} ${y}" stroke="${deep}" stroke-opacity="0.3" stroke-width="1" fill="none"/>`;
  }
  let spots = "";
  for (const [x, y, r] of [[186, 22, 2.6], [190, 32, 2.2], [182, 48, 2], [176, 62, 1.8], [160, 150, 2.2], [150, 156, 1.8]]) {
    spots += `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" fill-opacity="0.85"/>`;
  }
  return {
    defs: gf.def + gh.def,
    body: `<g filter="url(#wc)">
      <path d="${hind}" fill="url(#${gh.gid})" stroke="${deep}" stroke-opacity="0.55" stroke-width="1.6"/>
      <path d="${fore}" fill="url(#${gf.gid})" stroke="${deep}" stroke-opacity="0.6" stroke-width="1.6"/>
      <path d="M150 40 C 165 30 180 24 188 24" stroke="${light}" stroke-width="5" stroke-opacity="0.6" fill="none" stroke-linecap="round"/>
      <path d="M128 112 C 140 118 152 126 158 138" stroke="${light}" stroke-width="4" stroke-opacity="0.5" fill="none" stroke-linecap="round"/>
      <circle cx="146" cy="134" r="7" fill="${deep}" fill-opacity="0.35"/><circle cx="146" cy="134" r="3" fill="#fff" fill-opacity="0.7"/>
      ${veins}${spots}
    </g>`,
  };
}

function butterfly(pal, seed) {
  const right = wingSide(pal, seed);
  const left = wingSide(pal, seed + 1);
  const body = linear(100, 60, 100, 130, [[0, "#6E5338"], [1, "#9C7A55"]]);
  const all = right.defs + left.defs + body.def;
  const markup = `${right.body}<g transform="translate(200 0) scale(-1 1)">${left.body}</g>
    <ellipse cx="100" cy="96" rx="4.2" ry="30" fill="url(#${body.gid})"/>
    <circle cx="100" cy="64" r="5" fill="#6E5338"/>
    <path d="M98 60 C 92 44 86 34 78 28 M102 60 C 108 44 114 34 122 28" stroke="#7E5F3C" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    <circle cx="78" cy="28" r="2.4" fill="#B18B5C"/><circle cx="122" cy="28" r="2.4" fill="#B18B5C"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="340" viewBox="0 0 200 170">${defs(all)}${markup}</svg>`;
}

// --- petals ----------------------------------------------------------------

function petal(pal, seed, kind = "petal") {
  rand = mulberry32(seed);
  const [light, mid, edgeC, deep] = pal;
  if (kind === "blossom") {
    const c = cosmos(60, 60, 44, pal, between(0, 60));
    return `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">${defs(c.defs)}${c.body}</svg>`;
  }
  const g = linear(0, 0, 0, -90, [[0, edgeC], [0.4, mid], [0.85, light], [1, mid]]);
  const shape = rand() > 0.5 ? roundPetal(92, 40) : pointPetal(92, 44);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120">${defs(g.def)}
    <g transform="translate(60 106) rotate(${f(between(-14, 14))})" filter="url(#wc)">
      <path d="${shape}" fill="url(#${g.gid})" stroke="${deep}" stroke-opacity="0.45" stroke-width="1.4"/>
      <path d="M0 -6 Q 4 -46 0 -80" stroke="${deep}" stroke-opacity="0.22" stroke-width="1.2" fill="none"/>
      <path d="M-10 -30 Q -16 -56 -8 -78" stroke="#fff" stroke-opacity="0.55" stroke-width="3" fill="none" stroke-linecap="round"/>
    </g></svg>`;
}

// --- reception landmark: St. Bernard Subdivision entrance (painted) --------

function shrubs(x0, x1, y, r = 18) {
  let body = "";
  let d = "";
  for (let x = x0; x <= x1; x += r * between(1.3, 1.8)) {
    const rr = r * between(0.8, 1.15);
    const g = radial(x - rr * 0.3, y - rr * 0.4, rr * 1.4, [[0, LEAF[0]], [0.5, LEAF[1]], [1, LEAF[3]]]);
    d += g.def;
    body += `<circle cx="${f(x)}" cy="${f(y - rr * between(0.4, 0.9))}" r="${f(rr)}" fill="url(#${g.gid})"/>`;
    if (rand() > 0.5) body += `<circle cx="${f(x + rr * 0.5)}" cy="${f(y - rr * 1.3)}" r="${f(rr * 0.7)}" fill="url(#${g.gid})"/>`;
  }
  return { defs: d, body: `<g filter="url(#wc)">${body}</g>` };
}

function gateScene() {
  rand = mulberry32(91);
  const W = 1000;
  const H = 620;
  const INK2 = "#7A5A40";
  const parts = [wash(500, 170, 420, "#E7EEF8", 0.75), wash(300, 140, 220, "#EFE6F7", 0.45), wash(800, 160, 200, "#F6E3EA", 0.35)];
  // distant trees along the road
  for (const [x, y, r] of [[60, 370, 70], [140, 350, 60], [210, 380, 50], [900, 380, 60], [970, 360, 70]]) {
    parts.push(wash(x, y, r, pick(["#BFD4B2", "#AFC8A3", "#C6D8BB"]), 0.75));
  }
  const yellow = linear(0, 240, 0, 520, [[0, "#F7DC8E"], [1, "#EDC468"]]);
  const peach = linear(0, 370, 0, 530, [[0, "#E2B184"], [1, "#CF9767"]]);
  const roof = linear(0, 214, 0, 252, [[0, "#9A463E"], [0.45, "#86352F"], [0.5, "#FBF4E8"], [1, "#EEE2CF"]]);
  // ground and road
  let fill = `<path d="M0 515 C 250 505 650 500 1000 508 L1000 620 L0 620 Z" fill="#EEE5D6"/>
    <path d="M0 540 C 300 530 700 528 1000 536" stroke="#E0D3BE" stroke-width="3" fill="none"/>`;
  // small guardhouse behind the sign wall
  fill += `<rect x="236" y="336" width="124" height="78" fill="url(#${yellow.gid})"/>
    <rect x="216" y="318" width="164" height="20" fill="url(#${roof.gid})"/>
    <rect x="268" y="356" width="26" height="30" fill="#4A4542" opacity="0.85"/>`;
  // sign wall with lettering band and planter
  fill += `<rect x="140" y="410" width="340" height="92" fill="url(#${yellow.gid})"/>
    <rect x="132" y="402" width="356" height="10" fill="#F4E0A6"/>
    <rect x="150" y="500" width="320" height="18" fill="#F1DFA8"/>`;
  // gate pillars
  fill += `<rect x="478" y="360" width="22" height="160" fill="url(#${peach.gid})"/><rect x="628" y="360" width="22" height="160" fill="url(#${peach.gid})"/>`;
  // main guardhouse
  fill += `<rect x="690" y="250" width="172" height="122" fill="url(#${yellow.gid})"/>
    <rect x="690" y="372" width="172" height="150" fill="url(#${peach.gid})"/>
    <rect x="642" y="214" width="262" height="38" fill="url(#${roof.gid})"/>
    <rect x="742" y="276" width="36" height="66" fill="#3F3B3A" opacity="0.88"/>
    <rect x="770" y="402" width="52" height="82" fill="#3F3B3A" opacity="0.85"/>
    <ellipse cx="770" cy="530" rx="112" ry="16" fill="#C99A70" opacity="0.8"/>`;
  parts.push({ defs: yellow.def + peach.def + roof.def, body: `<g filter="url(#wc)">${fill}</g>` });

  // ink linework
  let ink = `<g fill="none" stroke="${INK2}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" filter="url(#line)">
    <path d="M236 414 L236 336 L360 336 L360 414 M216 318 L380 318 L380 338 L216 338 Z"/>
    <path d="M140 502 L140 410 L480 410 M132 402 L488 402 L488 412 L132 412 Z M150 518 L470 518"/>
    <path d="M478 520 L478 360 L500 360 L500 520 M628 520 L628 360 L650 360 L650 520"/>
    <path d="M690 522 L690 252 M862 252 L862 522 M690 372 L862 372 M642 214 L904 214 L904 252 L642 252 Z M642 226 L904 226"/>
    <rect x="742" y="276" width="36" height="66"/><rect x="770" y="402" width="52" height="82"/>
    <path d="M783 402 L783 484 M796 402 L796 484 M809 402 L809 484 M770 443 L822 443"/>
  </g>`;
  // arched wrought-iron gate between the pillars
  ink += `<g stroke="#6B4636" stroke-width="2.6" fill="none" stroke-linecap="round">`;
  const top = (x) => 392 - 34 * Math.sin((Math.PI * (x - 500)) / 128);
  let arch = "M500 392";
  for (let x = 504; x <= 628; x += 4) arch += ` L${x} ${f(top(x))}`;
  ink += `<path d="${arch}"/><path d="M500 470 L628 470 M500 512 L628 512"/>`;
  for (let x = 508; x < 628; x += 11) ink += `<path d="M${x} 512 L${x} ${f(top(x) + 2)}"/>`;
  for (let x = 512; x < 628; x += 16) ink += `<circle cx="${x}" cy="454" r="5"/>`;
  ink += `</g>`;
  // lettering
  ink += `<text x="310" y="468" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-weight="700" font-size="25" letter-spacing="2" fill="#5E4330">ST. BERNARD SUBD.</text>`;
  parts.push({ defs: "", body: ink });

  parts.push(shrubs(150, 470, 506, 17), shrubs(680, 870, 534, 21), shrubs(520, 610, 520, 12));
  // watercolor florals framing the scene, tying it into the invitation
  parts.push(...nest(70, 585, 100, 7), ...nest(930, 585, 100, 7));
  parts.push(hydrangea(150, 580, 46, PAL.lilac), cosmos(40, 560, 52, PAL.lavender), rose(95, 600, 64, PAL.blush));
  parts.push(cosmos(860, 590, 44, PAL.blush), hydrangea(965, 560, 46, PAL.lilac), rose(915, 600, 62, PAL.lavender));
  parts.push(bud(190, 520, 30, PAL.rose, 20), bud(820, 525, 28, PAL.lavender, -20));
  parts.push(sparkles(18, [80, 80, 920, 420]));
  // Drop the empty sky: shift the painting up into a shorter canvas.
  const shifted = parts.map((p) => ({ defs: p.defs, body: `<g transform="translate(0 -110)">${p.body}</g>` }));
  return svg(W, H - 110, shifted, "", { l: 0.06, r: 0.06, t: 0.14, b: 0.04 });
}

// ---------------------------------------------------------------------------

const ART = [
  ["corner", corner(), 82],
  ["spray-blush", spray(5, PAL.blush, PAL.lavender), 82],
  ["spray-lavender", spray(9, PAL.lavender, PAL.rose), 82],
  ["garland", garland(), 80],
  ["edge-blush", edge(31, PAL.blush, PAL.lavender), 82],
  ["edge-lavender", edge(37, PAL.lavender, PAL.rose), 82],
  ["gate", gateScene(), 84],
];

for (const [name, markup, quality] of ART) {
  // The reception scene keeps only its lower, painted area.
  const img = name === "reception" ? sharp(await sharp(Buffer.from(markup)).png().toBuffer()).extract({ left: 0, top: 230, width: 1000, height: 490 }) : sharp(Buffer.from(markup));
  await img.webp({ quality, alphaQuality: 85, effort: 6 }).toFile(join(OUT, `${name}.webp`));
  if (PREVIEW) {
    mkdirSync("private/previews", { recursive: true });
    await sharp(Buffer.from(markup)).flatten({ background: "#FBF8F2" }).jpeg({ quality: 80 }).toFile(`private/previews/art-${name}.jpg`);
  }
  console.log(`✓ ${name}`);
}

// Butterflies: left and right wing halves.
mkdirSync(join(OUT, "butterflies"), { recursive: true });
let seed = 100;
for (const [name, pal] of Object.entries(BUTTERFLY_PALETTES)) {
  const png = await sharp(Buffer.from(butterfly(pal, (seed += 10)))).png().toBuffer();
  await sharp(png).extract({ left: 0, top: 0, width: 200, height: 340 }).webp({ quality: 86, alphaQuality: 90 }).toFile(join(OUT, "butterflies", `${name}-l.webp`));
  await sharp(png).extract({ left: 200, top: 0, width: 200, height: 340 }).webp({ quality: 86, alphaQuality: 90 }).toFile(join(OUT, "butterflies", `${name}-r.webp`));
  if (PREVIEW) await sharp(png).flatten({ background: "#FBF8F2" }).jpeg().toFile(`private/previews/bfly-${name}.jpg`);
  console.log(`✓ butterfly ${name}`);
}

// Petals for the celebration shower.
mkdirSync(join(OUT, "petals"), { recursive: true });
const PETALS = [
  ["blush-1", PAL.blush, 1, "petal"],
  ["blush-2", PAL.rose, 2, "petal"],
  ["lavender-1", PAL.lavender, 3, "petal"],
  ["lavender-2", PAL.lilac, 4, "petal"],
  ["ivory-1", PAL.cream, 5, "petal"],
  ["blossom-1", PAL.lavender, 6, "blossom"],
  ["blossom-2", PAL.blush, 7, "blossom"],
];
for (const [name, pal, s2, kind] of PETALS) {
  await sharp(Buffer.from(petal(pal, s2, kind))).webp({ quality: 84, alphaQuality: 90 }).toFile(join(OUT, "petals", `${name}.webp`));
}
console.log("✓ petals");

await sharp(Buffer.from(paper())).webp({ quality: 70 }).toFile(join(OUT, "paper.webp"));
console.log("✓ paper");
