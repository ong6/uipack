/**
 * Just enough PNG to compare two browser screenshots: 8-bit RGB or RGBA, not interlaced (what
 * Chromium writes). Node only (zlib); no dependency.
 */
import { inflateSync } from "node:zlib";
import type { Box } from "./measure";

export interface Bitmap {
  width: number;
  height: number;
  /** RGBA, 4 bytes per pixel, row by row. */
  data: Uint8Array;
}

export function decodePng(buf: Uint8Array): Bitmap {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const sig = [137, 80, 78, 71, 13, 10, 26, 10];
  if (!sig.every((b, i) => buf[i] === b)) throw new Error("not a PNG");
  let pos = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  const idat: Uint8Array[] = [];
  while (pos < buf.length) {
    const len = view.getUint32(pos);
    const type = String.fromCharCode(...buf.subarray(pos + 4, pos + 8));
    const body = buf.subarray(pos + 8, pos + 8 + len);
    if (type === "IHDR") {
      width = view.getUint32(pos + 8);
      height = view.getUint32(pos + 12);
      const depth = body[8];
      colorType = body[9];
      if (depth !== 8 || (colorType !== 2 && colorType !== 6) || body[12] !== 0)
        throw new Error(`unsupported PNG (depth ${depth}, colour type ${colorType}, interlace ${body[12]})`);
    } else if (type === "IDAT") idat.push(body);
    else if (type === "IEND") break;
    pos += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const bpp = colorType === 6 ? 4 : 3;
  const stride = width * bpp;
  const px = new Uint8Array(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const src = y * (stride + 1) + 1;
    const out = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? px[out + x - bpp] : 0;
      const b = y ? px[out - stride + x] : 0;
      const c = x >= bpp && y ? px[out - stride + x - bpp] : 0;
      const v = raw[src + x];
      let pred = 0;
      if (filter === 1) pred = a;
      else if (filter === 2) pred = b;
      else if (filter === 3) pred = (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      }
      px[out + x] = (v + pred) & 0xff;
    }
  }
  if (bpp === 4) return { width, height, data: px };
  const data = new Uint8Array(width * height * 4);
  for (let i = 0, j = 0; i < px.length; i += 3, j += 4) {
    data[j] = px[i];
    data[j + 1] = px[i + 1];
    data[j + 2] = px[i + 2];
    data[j + 3] = 255;
  }
  return { width, height, data };
}

/**
 * Where two same-sized bitmaps differ: the bounding box of changed pixels and their count, or null
 * when every pixel matches within `tolerance` (per channel, 0–255).
 */
export function diffBitmaps(a: Bitmap, b: Bitmap, tolerance = 8): { box: Box; changedPixels: number } | null {
  if (a.width !== b.width || a.height !== b.height)
    return { box: { x: 0, y: 0, w: Math.max(a.width, b.width), h: Math.max(a.height, b.height) }, changedPixels: -1 };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -1;
  let maxY = -1;
  let changed = 0;
  for (let y = 0; y < a.height; y++)
    for (let x = 0; x < a.width; x++) {
      const i = (y * a.width + x) * 4;
      if (
        Math.abs(a.data[i] - b.data[i]) > tolerance ||
        Math.abs(a.data[i + 1] - b.data[i + 1]) > tolerance ||
        Math.abs(a.data[i + 2] - b.data[i + 2]) > tolerance
      ) {
        changed++;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  return changed ? { box: { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 }, changedPixels: changed } : null;
}

/**
 * The darkest and lightest background in a box of a bitmap: the pixels at the 10th and 90th
 * percentile of luminance (so an underline or a stray pixel does not decide it). Null for an empty box.
 */
export function sampleBackground(
  bmp: Bitmap,
  box: Box,
): [[number, number, number, number], [number, number, number, number]] | null {
  const x0 = Math.max(0, Math.floor(box.x));
  const y0 = Math.max(0, Math.floor(box.y));
  const x1 = Math.min(bmp.width, Math.ceil(box.x + box.w));
  const y1 = Math.min(bmp.height, Math.ceil(box.y + box.h));
  if (x1 <= x0 || y1 <= y0) return null;
  // Every pixel of a small box; a grid of about 4,000 points in a large one.
  const step = Math.max(1, Math.floor(Math.sqrt(((x1 - x0) * (y1 - y0)) / 4000)));
  const px: { l: number; c: [number, number, number, number] }[] = [];
  for (let y = y0; y < y1; y += step)
    for (let x = x0; x < x1; x += step) {
      const i = (y * bmp.width + x) * 4;
      const c: [number, number, number, number] = [bmp.data[i], bmp.data[i + 1], bmp.data[i + 2], 1];
      px.push({ l: 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2], c });
    }
  px.sort((a, b) => a.l - b.l);
  return [px[Math.floor((px.length - 1) * 0.1)].c, px[Math.floor((px.length - 1) * 0.9)].c];
}
