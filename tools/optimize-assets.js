const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const OUTPUT_DIR = path.join(ASSETS_DIR, 'optimized');

const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.webp'];
const TARGET_SIZES = [1920, 1280, 800, 400];
const WEBP_QUALITY = 80;
const AVIF_QUALITY = 50;

function hasSharp() {
  try {
    execSync('npx sharp --version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function optimizeImage(inputPath, outputPath, width, format, quality) {
  const sharp = require('sharp');
  return sharp(inputPath)
    .resize({ width, withoutEnlargement: true })
    .toFormat(format, { quality, effort: 6 })
    .toFile(outputPath);
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  if (!hasSharp()) {
    console.log('Instalando sharp...');
    execSync('npm install sharp --save-dev', { stdio: 'inherit' });
  }

  const files = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (IMAGE_EXTS.includes(path.extname(entry.name).toLowerCase())) {
        files.push(full);
      }
    }
  }
  walk(ASSETS_DIR);

  if (files.length === 0) {
    console.log('No images found in assets/');
    return;
  }

  let totalOriginal = 0;
  let totalOptimized = 0;

  for (const file of files) {
    const stat = fs.statSync(file);
    totalOriginal += stat.size;
    const relPath = path.relative(ASSETS_DIR, file);
    const baseName = path.basename(file, path.extname(file));
    const dirName = path.dirname(relPath);

    for (const width of TARGET_SIZES) {
      if (width > stat.size) continue; // skip if width larger than file likely smaller
      
      // WebP
      const webpOut = path.join(OUTPUT_DIR, dirName, `${baseName}-${width}w.webp`);
      const webpDir = path.dirname(webpOut);
      if (!fs.existsSync(webpDir)) fs.mkdirSync(webpDir, { recursive: true });
      
      try {
        await optimizeImage(file, webpOut, width, 'webp', WEBP_QUALITY);
        console.log(`✅ ${relPath} → ${path.relative(OUTPUT_DIR, webpOut)}`);
      } catch (e) {
        console.error(`❌ ${relPath} (${width}w webp):`, e.message);
      }

      // AVIF
      const avifOut = path.join(OUTPUT_DIR, dirName, `${baseName}-${width}w.avif`);
      try {
        await optimizeImage(file, avifOut, width, 'avif', AVIF_QUALITY);
        console.log(`✅ ${relPath} → ${path.relative(OUTPUT_DIR, avifOut)}`);
      } catch (e) {
        console.error(`❌ ${relPath} (${width}w avif):`, e.message);
      }
    }
  }

  // Calculate total optimized size
  function getDirSize(dir) {
    let size = 0;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) size += getDirSize(full);
      else size += fs.statSync(full).size;
    }
    return size;
  }

  totalOptimized = getDirSize(OUTPUT_DIR);
  const savings = ((totalOriginal - totalOptimized) / totalOriginal * 100).toFixed(1);
  
  console.log(`\n📊 Original: ${(totalOriginal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`📊 Optimizado: ${(totalOptimized / 1024 / 1024).toFixed(2)} MB`);
  console.log(`💾 Ahorro: ${savings}%`);

  // Generate srcset helper
  const srcsetMap = {};
  for (const file of fs.readdirSync(OUTPUT_DIR, { recursive: true })) {
    if (typeof file === 'string' && (file.endsWith('.webp') || file.endsWith('.avif'))) {
      const rel = path.relative(OUTPUT_DIR, file);
      const base = rel.replace(/-(webp|avif)$/, '').replace(/\.(webp|avif)$/, '');
      if (!srcsetMap[base]) srcsetMap[base] = [];
      srcsetMap[base].push(rel);
    }
  }

  const srcsetJson = path.join(OUTPUT_DIR, 'srcset-map.json');
  fs.writeFileSync(srcsetJson, JSON.stringify(srcsetMap, null, 2));
  console.log(`📝 Generado ${srcsetJson}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});