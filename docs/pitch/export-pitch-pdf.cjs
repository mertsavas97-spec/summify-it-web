/**
 * Export Summify pitch deck HTML → multi-page PDF (16:9, design-faithful).
 * Each slide is screenshotted at high DPI and embedded as a full page.
 */
const { chromium } = require("playwright");
const { PDFDocument } = require("pdf-lib");
const path = require("path");
const fs = require("fs");

const HTML = path.resolve(__dirname, "summify-google-for-startups-pitch-deck.html");
const OUT = path.resolve(__dirname, "Summify-Google-for-Startups-Pitch-Deck.pdf");
const WIDTH = 1920;
const HEIGHT = 1080;
const SLIDES = 10;

async function main() {
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
  });

  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 2,
  });

  await page.goto(`file://${HTML}`, { waitUntil: "networkidle" });

  // Lock deck to exact 16:9 fill; hide UI chrome for clean export
  await page.addStyleTag({
    content: `
      body {
        display: block !important;
        padding: 0 !important;
        margin: 0 !important;
        background: #0e1016 !important;
        min-height: 100vh !important;
      }
      .hint, .nav, .progress { display: none !important; }
      .deck-shell {
        width: ${WIDTH}px !important;
        height: ${HEIGHT}px !important;
        max-width: none !important;
        aspect-ratio: auto !important;
        border-radius: 0 !important;
        border: none !important;
        box-shadow: none !important;
        margin: 0 !important;
        position: relative !important;
      }
      .slide {
        padding: 48px 64px !important;
      }
    `,
  });

  // Wait for brand icon
  await page.waitForTimeout(800);

  const pdf = await PDFDocument.create();
  const tmpDir = path.resolve(__dirname, ".pdf-export-tmp");
  fs.mkdirSync(tmpDir, { recursive: true });

  for (let i = 0; i < SLIDES; i++) {
    await page.evaluate((n) => {
      const slides = Array.from(document.querySelectorAll(".slide"));
      slides.forEach((s, idx) => s.classList.toggle("active", idx === n));
    }, i);

    await page.waitForTimeout(200);

    const pngPath = path.join(tmpDir, `slide-${i + 1}.png`);
    const shell = page.locator(".deck-shell");
    await shell.screenshot({ path: pngPath, type: "png" });

    const bytes = fs.readFileSync(pngPath);
    const image = await pdf.embedPng(bytes);
    const pagePdf = pdf.addPage([WIDTH, HEIGHT]);
    pagePdf.drawImage(image, {
      x: 0,
      y: 0,
      width: WIDTH,
      height: HEIGHT,
    });
    console.log(`Rendered slide ${i + 1}/${SLIDES}`);
  }

  const outBytes = await pdf.save();
  fs.writeFileSync(OUT, outBytes);

  fs.rmSync(tmpDir, { recursive: true, force: true });
  await browser.close();

  console.log(`Wrote ${OUT}`);
  console.log(`Size: ${(outBytes.length / 1024 / 1024).toFixed(2)} MB`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
