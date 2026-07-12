import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.resolve(__dirname, '..', 'public');

async function generateIcon(size, outputPath) {
  const padding = Math.round(size * 0.22);
  const logoSize = size - padding * 2;

  // SVG gradient background with rounded corners
  const svgBg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FF6A00"/>
        <stop offset="100%" stop-color="#E05500"/>
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" rx="${Math.round(size * 0.2)}" fill="url(#bg)"/>
  </svg>`;

  // 1. Create gradient background
  const bg = await sharp(Buffer.from(svgBg))
    .resize(size, size)
    .png()
    .toBuffer();

  // 2. Resize logo to fit in safe zone
  const resizedLogo = await sharp(path.join(publicDir, 'logo.jpg'))
    .resize(logoSize, logoSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png()
    .toBuffer();

  // 3. Composite: logo centered on background
  await sharp(bg)
    .composite([{
      input: resizedLogo,
      top: padding,
      left: padding
    }])
    .png()
    .toFile(outputPath);

  console.log(`✓ Generated ${outputPath} (${size}x${size})`);
}

async function generateAppleIcon(size, outputPath) {
  const padding = Math.round(size * 0.22);
  const logoSize = size - padding * 2;

  const svgBg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#FF6A00"/>
        <stop offset="100%" stop-color="#E05500"/>
      </linearGradient>
    </defs>
    <rect width="${size}" height="${size}" rx="${Math.round(size * 0.2)}" fill="url(#bg)"/>
  </svg>`;

  const bg = await sharp(Buffer.from(svgBg)).resize(size, size).png().toBuffer();
  const logo = await sharp(path.join(publicDir, 'logo.jpg'))
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  await sharp(bg).composite([{ input: logo, top: padding, left: padding }]).png().toFile(outputPath);
  console.log(`✓ Generated ${outputPath} (${size}x${size})`);
}

async function main() {
  await generateIcon(512, path.join(publicDir, 'manifest-icon-512.maskable.png'));
  await generateIcon(192, path.join(publicDir, 'manifest-icon-192.maskable.png'));
  await generateAppleIcon(180, path.join(publicDir, 'apple-icon-180.png'));
  console.log('\nDone! Icons generated with proper maskable padding.');
}

main().catch(err => { console.error(err); process.exit(1); });
