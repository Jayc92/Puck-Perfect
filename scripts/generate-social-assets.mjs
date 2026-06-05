import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i];
    for (let j = 0; j < 8; j += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function createPng(width, height, draw) {
  const pixels = Buffer.alloc(width * height * 4, 0);

  const setPixel = (x, y, rgba) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const idx = (y * width + x) * 4;
    pixels[idx] = rgba[0];
    pixels[idx + 1] = rgba[1];
    pixels[idx + 2] = rgba[2];
    pixels[idx + 3] = rgba[3];
  };

  const api = {
    setPixel,
    fillRect(x, y, w, h, rgba) {
      for (let yy = y; yy < y + h; yy += 1) {
        for (let xx = x; xx < x + w; xx += 1) {
          setPixel(xx, yy, rgba);
        }
      }
    },
    fillRoundedRect(x, y, w, h, r, rgba) {
      const rr = r * r;
      for (let yy = y; yy < y + h; yy += 1) {
        for (let xx = x; xx < x + w; xx += 1) {
          const cx = xx < x + r ? x + r : xx > x + w - r - 1 ? x + w - r - 1 : xx;
          const cy = yy < y + r ? y + r : yy > y + h - r - 1 ? y + h - r - 1 : yy;
          const dx = xx - cx;
          const dy = yy - cy;
          if (dx * dx + dy * dy <= rr) {
            setPixel(xx, yy, rgba);
          }
        }
      }
    },
    line(x1, y1, x2, y2, thickness, rgba) {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const steps = Math.max(Math.abs(dx), Math.abs(dy));
      for (let i = 0; i <= steps; i += 1) {
        const x = Math.round(x1 + (dx * i) / steps);
        const y = Math.round(y1 + (dy * i) / steps);
        api.fillRect(x - Math.floor(thickness / 2), y - Math.floor(thickness / 2), thickness, thickness, rgba);
      }
    },
    circle(cx, cy, radius, thickness, rgba) {
      for (let angle = 0; angle < Math.PI * 2; angle += 0.0025) {
        const x = Math.round(cx + Math.cos(angle) * radius);
        const y = Math.round(cy + Math.sin(angle) * radius);
        api.fillRect(x - Math.floor(thickness / 2), y - Math.floor(thickness / 2), thickness, thickness, rgba);
      }
    },
    fillCircle(cx, cy, radius, rgba) {
      const rr = radius * radius;
      for (let yy = cy - radius; yy <= cy + radius; yy += 1) {
        for (let xx = cx - radius; xx <= cx + radius; xx += 1) {
          const dx = xx - cx;
          const dy = yy - cy;
          if (dx * dx + dy * dy <= rr) {
            setPixel(xx, yy, rgba);
          }
        }
      }
    },
    fillVerticalGradient(x, y, w, h, top, bottom) {
      for (let yy = 0; yy < h; yy += 1) {
        const t = yy / Math.max(h - 1, 1);
        const rgba = [
          Math.round(top[0] + (bottom[0] - top[0]) * t),
          Math.round(top[1] + (bottom[1] - top[1]) * t),
          Math.round(top[2] + (bottom[2] - top[2]) * t),
          Math.round(top[3] + (bottom[3] - top[3]) * t),
        ];
        api.fillRect(x, y + yy, w, 1, rgba);
      }
    },
  };

  draw(api);

  const rowSize = width * 4 + 1;
  const raw = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * rowSize;
    raw[rowStart] = 0;
    pixels.copy(raw, rowStart + 1, y * width * 4, (y + 1) * width * 4);
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function drawRink(api, x, y, w, h) {
  const board = [24, 34, 51, 255];
  const blue = [58, 152, 229, 255];
  const red = [214, 105, 118, 255];
  const ice = [247, 251, 255, 255];
  const crease = [149, 224, 246, 120];

  api.fillRoundedRect(x, y, w, h, Math.round(w * 0.08), board);
  api.fillRoundedRect(x + 10, y + 10, w - 20, h - 20, Math.round(w * 0.07), ice);

  const innerX = x + 32;
  const innerY = y + 32;
  const innerW = w - 64;
  const innerH = h - 64;

  api.line(innerX, innerY + innerH * 0.2, innerX + innerW, innerY + innerH * 0.2, 6, blue);
  api.line(innerX, innerY + innerH * 0.84, innerX + innerW, innerY + innerH * 0.84, 5, red);
  api.circle(x + w / 2, y + h * 0.38, Math.round(w * 0.09), 3, red);
  api.circle(x + w * 0.28, y + h * 0.47, Math.round(w * 0.1), 3, red);
  api.circle(x + w * 0.72, y + h * 0.47, Math.round(w * 0.1), 3, red);
  api.fillCircle(Math.round(x + w / 2), Math.round(y + h * 0.38), 3, red);

  const creaseY = y + h * 0.94;
  api.fillCircle(Math.round(x + w / 2), Math.round(creaseY), Math.round(w * 0.07), crease);
  api.circle(Math.round(x + w / 2), Math.round(creaseY), Math.round(w * 0.07), 3, [122, 204, 230, 255]);
  api.fillRoundedRect(Math.round(x + w / 2 - w * 0.035), Math.round(y + h * 0.85), Math.round(w * 0.07), Math.round(h * 0.025), 4, board);
}

const iconBuffer = createPng(180, 180, (api) => {
  api.fillVerticalGradient(0, 0, 180, 180, [8, 19, 35, 255], [13, 25, 46, 255]);
  drawRink(api, 18, 18, 144, 144);
  api.fillRoundedRect(55, 54, 70, 42, 14, [17, 27, 39, 214]);
  api.fillRoundedRect(55, 102, 70, 42, 14, [17, 27, 39, 214]);
});

const previewBuffer = createPng(1200, 630, (api) => {
  api.fillVerticalGradient(0, 0, 1200, 630, [7, 18, 32, 255], [10, 19, 37, 255]);
  api.fillRoundedRect(30, 30, 1140, 570, 34, [14, 24, 43, 255]);
  api.fillRoundedRect(60, 60, 1080, 510, 28, [12, 21, 38, 255]);
  drawRink(api, 520, 80, 560, 470);
  api.fillRoundedRect(100, 100, 340, 54, 20, [16, 30, 52, 255]);
  api.fillRoundedRect(100, 190, 360, 180, 28, [15, 27, 47, 255]);
  api.fillRoundedRect(100, 402, 170, 112, 24, [17, 29, 49, 255]);
  api.fillRoundedRect(292, 402, 240, 112, 24, [17, 29, 49, 255]);
  api.fillRoundedRect(86, 92, 6, 440, 4, [159, 232, 255, 255]);
  api.fillRoundedRect(78, 538, 460, 8, 4, [124, 240, 218, 255]);
});

writeFileSync(path.join(root, "public", "apple-touch-icon.png"), iconBuffer);
writeFileSync(path.join(root, "public", "icon-192.png"), createPng(192, 192, (api) => {
  api.fillVerticalGradient(0, 0, 192, 192, [8, 19, 35, 255], [13, 25, 46, 255]);
  drawRink(api, 18, 18, 156, 156);
  api.fillRoundedRect(58, 58, 76, 46, 14, [17, 27, 39, 214]);
  api.fillRoundedRect(58, 108, 76, 46, 14, [17, 27, 39, 214]);
}));
writeFileSync(path.join(root, "public", "og-preview.png"), previewBuffer);
