// Builds web-optimized photo sets from the private originals.
//
// - Reads private/originals (gitignored, never deployed).
// - Writes metadata-free AVIF and WebP files to public/photos.
// - Writes src/content/photos.generated.json with sizes and blur placeholders.
//
// All processing is local. Nothing is uploaded anywhere.
import sharp from "sharp";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const SRC = "private/originals";
const OUT = "public/photos";
const MANIFEST = "src/content/photos.generated.json";

// Crops are in original pixel coordinates. They keep natural framing and
// leave out the photographer's corner watermarks. `full` is the uncropped
// image shown in the lightbox.
const PHOTOS = [
  {
    id: "hero",
    file: "IMG_1650.jpeg.jpg",
    crop: { left: 580, top: 430, width: 2436, height: 3045 },
    widths: [360, 540, 720, 1080],
  },
  {
    id: "birthday",
    file: "IMG_1649.jpeg.jpg",
    crop: { left: 261, top: 0, width: 4872, height: 3654 },
    widths: [400, 640, 960, 1280],
  },
  {
    id: "letter",
    file: "IMG_1645.jpeg.jpg",
    crop: { left: 1392, top: 200, width: 2610, height: 3262 },
    widths: [320, 480, 720, 960],
  },
  {
    id: "closing",
    file: "IMG_1651.jpeg.jpg",
    crop: { left: 812, top: 1655, width: 2088, height: 2610 },
    widths: [280, 420, 640, 840],
  },
];

const FULL_LONG_EDGE = 1800;

mkdirSync(OUT, { recursive: true });
const manifest = {};

for (const photo of PHOTOS) {
  const input = join(SRC, photo.file);
  if (!existsSync(input)) {
    throw new Error(`Missing original: ${input}`);
  }

  const cropped = () => sharp(input).rotate().extract(photo.crop);
  const sources = [];
  for (const width of photo.widths) {
    const height = Math.round((width * photo.crop.height) / photo.crop.width);
    const base = `${photo.id}-${width}`;
    await cropped().resize(width, height).avif({ quality: 58, effort: 6 }).toFile(join(OUT, `${base}.avif`));
    await cropped().resize(width, height).webp({ quality: 80, effort: 6 }).toFile(join(OUT, `${base}.webp`));
    sources.push({ width, height, avif: `/photos/${base}.avif`, webp: `/photos/${base}.webp` });
  }

  // Lightbox version: the whole original frame, downscaled.
  const meta = await sharp(input).rotate().metadata();
  const landscape = meta.width >= meta.height;
  const fullW = landscape ? FULL_LONG_EDGE : Math.round((FULL_LONG_EDGE * meta.width) / meta.height);
  const fullH = landscape ? Math.round((FULL_LONG_EDGE * meta.height) / meta.width) : FULL_LONG_EDGE;
  await sharp(input).rotate().resize(fullW, fullH).avif({ quality: 60, effort: 6 }).toFile(join(OUT, `${photo.id}-full.avif`));
  await sharp(input).rotate().resize(fullW, fullH).webp({ quality: 82, effort: 6 }).toFile(join(OUT, `${photo.id}-full.webp`));

  // Tiny blurred placeholder, inlined as a data URL.
  const placeholder = await cropped().resize(16).blur(1).webp({ quality: 40 }).toBuffer();

  manifest[photo.id] = {
    width: photo.crop.width,
    height: photo.crop.height,
    sources,
    full: {
      width: fullW,
      height: fullH,
      avif: `/photos/${photo.id}-full.avif`,
      webp: `/photos/${photo.id}-full.webp`,
    },
    placeholder: `data:image/webp;base64,${placeholder.toString("base64")}`,
  };
  console.log(`✓ ${photo.id}`);
}

writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote ${MANIFEST}`);
