import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import sharp from "sharp";
import * as path from "path";

// Register the Anton display font once (bundled in functions/assets/fonts).
let fontLoaded = false;
function ensureFont() {
  if (fontLoaded) return;
  // Compiled to lib/lib/compose.js, so assets is two levels up.
  GlobalFonts.registerFromPath(
    path.join(__dirname, "../../assets/fonts/Anton-Regular.ttf"),
    "Anton"
  );
  fontLoaded = true;
}

const SIZE = 1024;
const OLIVE = "#4B5A33";
const BONE = "#F4F4F1";

// Composites the AI image with (optionally) the hook headline and the AD badge.
// canvas draws a transparent text/badge overlay; sharp loads the photo and
// composites the overlay on top (sharp handles the PNG decode reliably).
export async function composeImage(
  bytes: Buffer,
  opts: { hook?: string; overlayHook?: boolean }
): Promise<Buffer> {
  ensureFont();

  const canvas = createCanvas(SIZE, SIZE);
  const ctx = canvas.getContext("2d");
  if (opts.overlayHook && opts.hook) drawHook(ctx, opts.hook.toUpperCase());
  drawBadge(ctx);
  const overlay = canvas.toBuffer("image/png");

  return sharp(bytes)
    .resize(SIZE, SIZE, { fit: "cover" })
    .composite([{ input: overlay, top: 0, left: 0 }])
    .png()
    .toBuffer();
}

function drawHook(ctx: any, hook: string) {
  // Dark gradient scrim across the bottom so the text stays legible.
  const grad = ctx.createLinearGradient(0, SIZE * 0.4, 0, SIZE);
  grad.addColorStop(0, "rgba(11,11,15,0)");
  grad.addColorStop(1, "rgba(11,11,15,0.9)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, SIZE * 0.4, SIZE, SIZE * 0.6);

  const margin = 64;
  const fontSize = 94;
  ctx.font = `${fontSize}px Anton`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const lines = wrap(ctx, hook, SIZE - margin * 2);
  const lineHeight = fontSize * 1.05;
  ctx.fillStyle = BONE;
  let y = SIZE - margin - (lines.length - 1) * lineHeight;
  for (const line of lines) {
    ctx.fillText(line, margin, y);
    y += lineHeight;
  }
}

function wrap(ctx: any, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function drawBadge(ctx: any) {
  const s = 88;
  const m = 40;
  const x = SIZE - s - m;
  const y = m; // top-right, clear of the bottom hook
  ctx.fillStyle = OLIVE;
  roundRect(ctx, x, y, s, s, 20);
  ctx.fill();
  ctx.fillStyle = BONE;
  ctx.font = "44px Anton";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("AD", x + s / 2, y + s / 2 + 3);
  ctx.textAlign = "left";
}

function roundRect(
  ctx: any,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
