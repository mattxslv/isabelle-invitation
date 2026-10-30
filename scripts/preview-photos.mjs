// Creates small private previews of the originals for crop review.
// Output stays in private/previews (gitignored), never in public/.
import sharp from "sharp";
import { mkdirSync, readdirSync } from "node:fs";
import { join, basename } from "node:path";

const src = "private/originals";
const out = "private/previews";
mkdirSync(out, { recursive: true });

for (const file of readdirSync(src)) {
  const image = sharp(join(src, file)).rotate();
  const meta = await image.metadata();
  await image
    .resize({ width: 640 })
    .jpeg({ quality: 70 })
    .toFile(join(out, `${basename(file).split(".")[0]}.jpg`));
  console.log(file, `${meta.width}x${meta.height}`, `orientation=${meta.orientation ?? 1}`);
}
