import sharp from "sharp";
import { readdir, stat } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const cardsDir = join(__dirname, "..", "public", "cards");

async function compress() {
  const files = await readdir(cardsDir);
  const webpFiles = files.filter((f) => f.endsWith(".webp"));

  const sizes = [];
  for (const file of webpFiles) {
    const inputPath = join(cardsDir, file);
    const origSize = (await stat(inputPath)).size;

    const tmpPath = inputPath + ".tmp";
    await sharp(inputPath)
      .resize({ width: 300, withoutEnlargement: true })
      .webp({ quality: 60 })
      .toFile(tmpPath);

    const newSize = (await stat(tmpPath)).size;

    const { rename } = await import("fs/promises");
    await rename(tmpPath, inputPath);

    sizes.push({ file, origSize, newSize });
    console.log(`  ${file}: ${(origSize / 1024).toFixed(0)}KB → ${(newSize / 1024).toFixed(0)}KB`);
  }

  const origTotal = sizes.reduce((a, s) => a + s.origSize, 0);
  const newTotal = sizes.reduce((a, s) => a + s.newSize, 0);
  console.log(`\nTotal: ${(origTotal / 1024 / 1024).toFixed(1)}MB → ${(newTotal / 1024 / 1024).toFixed(1)}MB (${((1 - newTotal / origTotal) * 100).toFixed(0)}% reduction)`);
}

compress().catch((e) => { console.error(e); process.exit(1); });
