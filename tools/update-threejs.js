const https = require('https');
const fs = require('fs');
const path = require('path');

const THREE_VERSION = 'r158';
const BASE_URL = `https://cdn.jsdelivr.net/npm/three@${THREE_VERSION}/`;
const FILES = [
  'build/three.module.js',
  'examples/jsm/Addons.js',
];

const VENDOR_DIR = path.join(__dirname, '..', 'vendor', 'three');
const ADDONS_DIR = path.join(VENDOR_DIR, 'addons');

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  console.log(`Actualizando Three.js a ${THREE_VERSION}...`);
  
  if (!fs.existsSync(VENDOR_DIR)) fs.mkdirSync(VENDOR_DIR, { recursive: true });
  if (!fs.existsSync(ADDONS_DIR)) fs.mkdirSync(ADDONS_DIR, { recursive: true });

  for (const file of FILES) {
    const url = BASE_URL + file;
    const dest = path.join(VENDOR_DIR, path.basename(file));
    console.log(`Descargando ${file}...`);
    await downloadFile(url, dest);
  }

  // También descargar addons necesarios
  const addonFiles = [
    'examples/jsm/postprocessing/EffectComposer.js',
    'examples/jsm/postprocessing/RenderPass.js',
    'examples/jsm/postprocessing/UnrealBloomPass.js',
    'examples/jsm/postprocessing/ShaderPass.js',
    'examples/jsm/postprocessing/OutputPass.js',
    'examples/jsm/postprocessing/MaskPass.js',
    'examples/jsm/environments/RoomEnvironment.js',
    'examples/jsm/shaders/CopyShader.js',
    'examples/jsm/shaders/LuminosityHighPassShader.js',
    'examples/jsm/shaders/OutputShader.js',
    'examples/jsm/utils/BufferGeometryUtils.js',
  ];

  for (const file of addonFiles) {
    const url = BASE_URL + file;
    const dest = path.join(VENDOR_DIR, file.replace('examples/jsm/', ''));
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
    console.log(`Descargando addon ${file}...`);
    await downloadFile(url, dest);
  }

  console.log('Three.js actualizado correctamente');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});