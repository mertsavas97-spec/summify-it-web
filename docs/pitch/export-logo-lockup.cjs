/**
 * High-res Summify wordmark lockup for white/clear backgrounds (Google for Startups).
 */
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const ROOT = path.resolve(__dirname, "../..");
const ICON = path.resolve(ROOT, "public/brand-icon.png");
const OUT_DIR = path.resolve(__dirname, "brand");
const WIDTH = 2400;
const HEIGHT = 800;

async function render(variant) {
  const isTransparent = variant === "transparent";
  const bg = isTransparent ? "transparent" : "#ffffff";
  const text = "#18181b";
  const iconData = fs.readFileSync(ICON).toString("base64");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Geist:wght@600;700&display=swap" rel="stylesheet" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: ${WIDTH}px;
      height: ${HEIGHT}px;
      background: ${bg};
      overflow: hidden;
    }
    .lockup {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 56px;
      padding: 80px 120px;
    }
    .icon {
      width: 320px;
      height: 320px;
      border-radius: 72px;
      object-fit: cover;
      flex-shrink: 0;
      box-shadow: 0 1px 0 rgba(0,0,0,0.04), 0 18px 40px -24px rgba(91, 33, 182, 0.35);
    }
    .wordmark {
      font-family: "Geist", system-ui, -apple-system, sans-serif;
      font-weight: 650;
      font-size: 220px;
      letter-spacing: -0.045em;
      color: ${text};
      line-height: 1;
      white-space: nowrap;
    }
  </style>
</head>
<body>
  <div class="lockup">
    <img class="icon" src="data:image/png;base64,${iconData}" alt="" />
    <span class="wordmark">Summify</span>
  </div>
</body>
</html>`;

  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
  });
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);

  const outName =
    variant === "transparent"
      ? "summify-logo-horizontal-transparent.png"
      : "summify-logo-horizontal-white.png";
  const outPath = path.join(OUT_DIR, outName);
  await page.screenshot({
    path: outPath,
    type: "png",
    omitBackground: isTransparent,
  });
  await browser.close();
  const size = fs.statSync(outPath).size;
  console.log(`Wrote ${outPath} (${(size / 1024).toFixed(0)} KB)`);
  return outPath;
}

function writeSvg() {
  const iconData = fs.readFileSync(ICON).toString("base64");
  // Vector wordmark + embedded raster icon (official mark)
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  width="2400" height="800" viewBox="0 0 2400 800" role="img" aria-label="Summify">
  <title>Summify</title>
  <!-- Clear / transparent canvas — use on white or light backgrounds -->
  <image x="420" y="240" width="320" height="320" href="data:image/png;base64,${iconData}"
    xlink:href="data:image/png;base64,${iconData}" />
  <text x="800" y="470"
    font-family="Geist, Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
    font-size="220" font-weight="650" letter-spacing="-10"
    fill="#18181b">Summify</text>
</svg>
`;
  const outPath = path.join(OUT_DIR, "summify-logo-horizontal.svg");
  fs.writeFileSync(outPath, svg);
  console.log(`Wrote ${outPath}`);
  return outPath;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  await render("white");
  await render("transparent");
  writeSvg();

  // Also copy primary submission file to a clear name
  const primary = path.join(OUT_DIR, "Summify-Logo-HighRes-White.png");
  fs.copyFileSync(path.join(OUT_DIR, "summify-logo-horizontal-white.png"), primary);
  console.log(`Primary submission file: ${primary}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
