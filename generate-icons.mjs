import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [
  { name: 'favicon.ico', size: 32 },
  { name: 'pwa-64x64.png', size: 64 },
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'maskable-icon-512x512.png', size: 512, maskable: true }
];

const svgPath = join(__dirname, 'public', 'icon.svg');
const svgBuffer = readFileSync(svgPath);

async function generateIcons() {
  for (const { name, size, maskable } of sizes) {
    let svg = svgBuffer;
    
    // Pour les icônes maskable, ajouter du padding
    if (maskable) {
      const svgStr = svgBuffer.toString();
      // L'icône maskable a besoin de safe area (10% de padding)
      svg = Buffer.from(svgStr.replace('viewBox="0 0 512 512"', 'viewBox="-51 -51 614 614"'));
    }

    const outputPath = join(__dirname, 'public', name);
    
    if (name.endsWith('.ico')) {
      await sharp(svg)
        .resize(size, size)
        .png()
        .toFile(outputPath.replace('.ico', '.png'));
      console.log(`✓ Generated ${name.replace('.ico', '.png')}`);
    } else {
      await sharp(svg)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      console.log(`✓ Generated ${name}`);
    }
  }
  console.log('\n✅ All icons generated!');
}

generateIcons().catch(console.error);
