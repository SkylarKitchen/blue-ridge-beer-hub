/**
 * Builds the owners' guide figures (public/guide/*.webp) from raw Studio
 * captures: crop, draw the numbered callouts, encode as WebP, and write
 * src/app/guide/figures.json with each image's intrinsic size for the page.
 *
 *   node scripts/guide-figures.mjs <dir-of-raw-captures>
 *
 * The captures are the Studio at a 1384×853 viewport on a 2x display (a
 * 1440×900 Chrome window with its toolbar cropped off), so every coordinate
 * below is in CSS px of that viewport and the script scales by 2. Re-capture
 * at the same size after a Studio change and the callouts line up again.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import sharp from "sharp";

const SHOTS = process.argv[2];
if (!SHOTS) {
  console.error("usage: node scripts/guide-figures.mjs <dir-of-raw-captures>");
  process.exit(1);
}
const OUT = path.resolve("public/guide");
const MANIFEST = path.resolve("src/app/guide/figures.json");
mkdirSync(OUT, { recursive: true });

const AMBER = "#c08427";
const NAVY = "#1b3560";
const CREAM = "#faf7ef";

// All coordinates below are CSS px in the 1384x853 viewport; S scales to the 2x capture.
const S = 2;

/** @typedef {{n:number, box:[number,number,number,number], corner?: "tl"|"tr"|"bl"|"br"}} Callout */

/**
 * @type {Record<string, {src:string, crop?:[number,number,number,number], callouts?:Callout[], mask?:[number,number,number,number][], maskColor?:string}>}
 */
const figures = {
  "studio-overview": {
    src: "overview.png",
    callouts: [
      { n: 1, box: [6, 96, 750, 752], corner: "bl" },
      { n: 2, box: [762, 96, 618, 700], corner: "tr" },
      { n: 3, box: [806, 336, 534, 60], badge: [1362, 366] },
      { n: 4, box: [1240, 804, 100, 46], badge: [1222, 827] },
      { n: 5, box: [614, 6, 86, 38], badge: [714, 54] },
      { n: 6, box: [6, 58, 96, 34], badge: [120, 75] },
    ],
  },
  "studio-edit-on-page": {
    src: "edit-on-page.png",
    crop: [0, 430, 756, 423],
  },
  "studio-chips": {
    src: "overview.png",
    crop: [756, 52, 628, 46],
  },
  "studio-publish-menu": {
    src: "doc-menu.png",
    crop: [880, 560, 504, 293],
    callouts: [{ n: 1, box: [1240, 804, 100, 46], badge: [1222, 827] }, { n: 2, box: [1166, 720, 206, 40], badge: [1148, 740] }],
  },
  "studio-structure-events": {
    src: "events-list.png",
    mask: [[0, 822, 250, 31]],
    callouts: [
      { n: 1, box: [614, 6, 86, 38], badge: [714, 54] },
      { n: 2, box: [12, 140, 316, 38], badge: [342, 159] },
      { n: 3, box: [628, 58, 36, 36], badge: [608, 76] },
    ],
  },
  "studio-event-new": { src: "event-form-new.png", crop: [642, 54, 742, 799], cursor: [1000, 600] },
  "studio-event-filled": { src: "event-form.png", crop: [642, 54, 742, 799], cursor: [1000, 600] },
  "studio-weekly": { src: "weekly-event.png", crop: [322, 54, 1046, 640] },
  "studio-gallery-list": {
    src: "gallery-list.png",
    crop: [16, 54, 684, 740],
    callouts: [
      { n: 1, box: [24, 214, 304, 38], badge: [342, 233] },
      { n: 2, box: [628, 58, 36, 36], badge: [608, 76] },
    ],
  },
  "studio-photo-form": { src: "photo-form.png", crop: [642, 54, 742, 799], cursor: [1000, 820] },
  "studio-contact-links": { src: "contact-links.png", crop: [540, 160, 640, 677], cursor: [1000, 830] },
  "studio-announcement": {
    src: "announcement.png",
    crop: [500, 440, 700, 360],
    callouts: [{ n: 1, box: [552, 470, 620, 130], badge: [524, 490] }, { n: 2, box: [552, 632, 620, 160], badge: [524, 652] }],
  },
  "studio-hours": { src: "hours.png", crop: [540, 216, 640, 580] },
  "studio-hours-day": { src: "hours-day.png", crop: [536, 164, 664, 630] },
  "studio-sections": {
    src: "home-sections.png",
    crop: [548, 150, 648, 640],
    // The capture's pointer left a "Field actions" tooltip over the list header.
    mask: [[1070, 160, 112, 38]],
    maskColor: "#13141a",
  },
  "studio-section-add": { src: "home-section-add.png", crop: [548, 150, 648, 460] },
  "studio-section-open": { src: "home-section-open.png", crop: [540, 150, 664, 656] },
  "studio-to-go": { src: "home-to-go.png", crop: [540, 150, 664, 656] },
  "flyer-email": { src: "email.png", crop: [356, 26, 672, 580] },
};

function svgOverlay(width, height, callouts, masks) {
  const parts = [];
  for (const { rect: [x, y, w, h], color } of masks ?? []) {
    parts.push(`<rect x="${x * S}" y="${y * S}" width="${w * S}" height="${h * S}" fill="${color}"/>`);
  }
  for (const c of callouts ?? []) {
    const [x, y, w, h] = c.box.map((v) => v * S);
    const r = 28; // badge radius (2x px)
    const corner = c.corner ?? "tl";
    const inset = r + 10;
    let bx = corner.endsWith("l") ? x + inset : x + w - inset;
    let by = corner.startsWith("t") ? y + inset : y + h - inset;
    if (c.badge) [bx, by] = c.badge.map((v) => v * S);
    parts.push(
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" ry="10" fill="none" stroke="${AMBER}" stroke-width="5"/>`,
      `<circle cx="${bx}" cy="${by}" r="${r}" fill="${NAVY}" stroke="${CREAM}" stroke-width="4"/>`,
      `<text x="${bx}" y="${by + 1}" text-anchor="middle" dominant-baseline="central" font-family="Helvetica Neue, Helvetica, Arial, sans-serif" font-weight="700" font-size="32" fill="${CREAM}">${c.n}</text>`,
    );
  }
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${parts.join("")}</svg>`);
}

// A run only rebuilds the figures whose raw capture is in SHOTS; the rest keep
// their existing .webp and manifest entry, so one figure can be re-shot alone.
const manifest = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : {};
for (const [name, spec] of Object.entries(figures)) {
  const src = path.join(SHOTS, spec.src);
  if (!existsSync(src)) {
    if (!manifest[`${name}.webp`]) console.warn(`skip ${name}: no ${spec.src} in ${SHOTS} and no existing figure`);
    continue;
  }
  let img = sharp(src);
  const meta = await img.metadata();
  const masks = (spec.mask ?? []).map((rect) => ({ rect, color: spec.maskColor ?? "#ffffff" }));
  if (spec.cursor) {
    // The browser extension paints a glowing pointer into the page; cover it with the
    // colour sampled just left of it (these all sit on flat form backgrounds).
    const [cx, cy] = spec.cursor;
    const px = await sharp(src).extract({ left: (cx - 40) * S, top: cy * S, width: 1, height: 1 }).raw().toBuffer();
    const color = `rgb(${px[0]},${px[1]},${px[2]})`;
    masks.push({ rect: [cx - 22, cy - 22, 62, 66], color });
  }
  if (spec.callouts?.length || masks.length) {
    img = img.composite([{ input: svgOverlay(meta.width, meta.height, spec.callouts, masks), top: 0, left: 0 }]);
  }
  if (spec.crop) {
    const [x, y, w, h] = spec.crop.map((v) => v * S);
    // composite must be flattened before extract, so round-trip through a buffer
    const buf = await img.toBuffer();
    img = sharp(buf).extract({ left: x, top: y, width: Math.min(w, meta.width - x), height: Math.min(h, meta.height - y) });
  }
  const out = path.join(OUT, `${name}.webp`);
  const info = await img.webp({ quality: 84 }).toFile(out);
  manifest[`${name}.webp`] = { width: info.width, height: info.height };
  console.log(name, info.width, info.height, Math.round(info.size / 1024) + "KB");
}
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
console.log("manifest ->", MANIFEST);
