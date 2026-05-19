/**
 * Generates public/og-default.png (1200×630) for Open Graph / Twitter cards.
 * Run: npm run generate:og
 */
import sharp from "sharp";
import { join } from "path";

const WIDTH = 1200;
const HEIGHT = 630;
const OUT = join(process.cwd(), "public/og-default.png");

const svg = `
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0e1016"/>
      <stop offset="55%" style="stop-color:#14121f"/>
      <stop offset="100%" style="stop-color:#1f1535"/>
    </linearGradient>
    <radialGradient id="glow" cx="72%" cy="18%" r="50%">
      <stop offset="0%" style="stop-color:#7c3aed;stop-opacity:0.4"/>
      <stop offset="100%" style="stop-color:#7c3aed;stop-opacity:0"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect width="100%" height="100%" fill="url(#glow)"/>
  <rect x="48" y="48" width="1104" height="534" rx="24" fill="none" stroke="#ffffff" stroke-opacity="0.07" stroke-width="1"/>
  <circle cx="600" cy="220" r="44" fill="#7c3aed" fill-opacity="0.2" stroke="#a78bfa" stroke-opacity="0.5" stroke-width="2"/>
  <text x="600" y="232" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="36" font-weight="700" fill="#e9d5ff">S</text>
  <text x="600" y="318" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="64" font-weight="600" fill="#fafafa">Summify</text>
  <text x="600" y="386" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="30" font-weight="500" fill="#c4b5fd">AI Document Intelligence Workspace</text>
  <text x="600" y="438" text-anchor="middle" font-family="system-ui,-apple-system,sans-serif" font-size="20" fill="#71717a">PDFs · YouTube · PowerPoint · Web · Study notes</text>
</svg>
`;

const meta = await sharp(Buffer.from(svg)).png().toFile(OUT);
console.log(`Wrote ${OUT} (${meta.width}×${meta.height})`);
