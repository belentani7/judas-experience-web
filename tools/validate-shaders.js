const fs = require('fs');
const path = require('path');

const SHADER_DIRS = [
  path.join(__dirname, '..', 'sources', 'shaders'),
  path.join(__dirname, '..', 'vendor', 'three', 'addons', 'shaders'),
];

const SHADER_EXTS = ['.glsl', '.vert', '.frag', '.vs', '.fs'];

function validateGLSL(content, filename) {
  const errors = [];
  const warnings = [];

  // Basic syntax checks
  const lines = content.split('\n');
  
  let braceCount = 0;
  let inMain = false;
  let hasMain = false;

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    
    // Count braces
    for (const ch of line) {
      if (ch === '{') braceCount++;
      if (ch === '}') braceCount--;
    }

    // Check for main()
    if (trimmed.startsWith('void main()') || trimmed.startsWith('void main (')) {
      hasMain = true;
      inMain = true;
    }

    // Performance hints
    if (trimmed.includes('for(') && trimmed.includes(';') && !trimmed.includes('//')) {
      const loopContent = trimmed.substring(trimmed.indexOf('{') + 1, trimmed.lastIndexOf('}'));
      if (loopContent.includes('texture2D') || loopContent.includes('texture(')) {
        warnings.push(`L${i+1}: Texture sampling inside loop may hurt performance`);
      }
      if (loopContent.includes('sin(') || loopContent.includes('cos(') || loopContent.includes('tan(')) {
        warnings.push(`L${i+1}: Trigonometric function in loop - consider precomputing`);
      }
    }

    // Discard in fragment shader
    if (trimmed.startsWith('discard;') && filename.endsWith('.frag')) {
      warnings.push(`L${i+1}: discard; in fragment shader breaks early-z optimization`);
    }

    // Non-const uniform arrays
    if (trimmed.match(/uniform\s+\w+\s+\w+\[\s*[^0-9\]]/)) {
      warnings.push(`L${i+1}: Non-const uniform array size - may not compile on all GPUs`);
    }
  });

  if (braceCount !== 0) {
    errors.push(`Mismatched braces (count: ${braceCount})`);
  }

  if (!hasMain && filename.endsWith(('.vert', '.frag', '.glsl'))) {
    errors.push('Missing main() function');
  }

  return { errors, warnings };
}

function main() {
  let totalErrors = 0;
  let totalWarnings = 0;

  for (const dir of SHADER_DIRS) {
    if (!fs.existsSync(dir)) continue;
    
    const files = fs.readdirSync(dir, { recursive: true })
      .filter(f => SHADER_EXTS.some(ext => f.endsWith(ext)));

    for (const file of files) {
      const fullPath = path.join(dir, file);
      const content = fs.readFileSync(fullPath, 'utf-8');
      const { errors, warnings } = validateGLSL(content, file);

      if (errors.length > 0 || warnings.length > 0) {
        console.log(`\n${file}:`);
        errors.forEach(e => console.log(`  ❌ ERROR: ${e}`));
        warnings.forEach(w => console.log(`  ⚠️  WARN: ${w}`));
        totalErrors += errors.length;
        totalWarnings += warnings.length;
      } else {
        console.log(`✅ ${file} - OK`);
      }
    }
  }

  console.log(`\nResumen: ${totalErrors} errores, ${totalWarnings} advertencias`);
  process.exit(totalErrors > 0 ? 1 : 0);
}

main();