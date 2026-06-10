import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const outputDir = "public/icons";
fs.mkdirSync(outputDir, { recursive: true });

function iconSvg(size, padding = 0) {
  const scale = (size - padding * 2) / 64;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.22)}" fill="#0f766e"/>
  <g transform="translate(${padding} ${padding}) scale(${scale})">
    <path d="M18 44V20h15.5c6.2 0 10.5 4 10.5 9.9 0 5.8-4.3 9.8-10.5 9.8h-6.8V44H18Zm8.7-11.4h5.8c2 0 3.3-1.1 3.3-2.8 0-1.8-1.3-2.9-3.3-2.9h-5.8v5.7Z" fill="#fff"/>
    <path d="M43 44h-8l9-24h8l-9 24Z" fill="#f2c94c"/>
  </g>
</svg>`;
}

const icons = [
  ["icon-192.png", 192, 0],
  ["icon-512.png", 512, 0],
  ["maskable-192.png", 192, 30],
  ["maskable-512.png", 512, 82],
  ["apple-touch-icon.png", 180, 0],
];

await Promise.all(
  icons.map(([filename, size, padding]) =>
    sharp(Buffer.from(iconSvg(size, padding))).png().toFile(path.join(outputDir, filename)),
  ),
);
