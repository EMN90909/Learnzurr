/**
 * Crops the center icon from struta.png (removes outer vector/frame).
 * Run: pnpm logo:crop
 */
import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const input = path.resolve(__dirname, "..", "public", "struta.png");
const output = path.resolve(__dirname, "..", "public", "struta-icon.png");

const image = sharp(input);
const meta = await image.metadata();
const size = Math.min(meta.width || 512, meta.height || 512);
const cropSize = Math.round(size * 0.52);
const left = Math.round(((meta.width || size) - cropSize) / 2);
const top = Math.round(((meta.height || size) - cropSize) / 2);

await image
  .extract({ left, top, width: cropSize, height: cropSize })
  .resize(512, 512, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile(output);

console.log(`Wrote ${output}`);
