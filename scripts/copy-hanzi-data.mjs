// 把題庫用到的漢字筆順數據，由 node_modules/hanzi-writer-data 複製到 public/hanzi-data/
// 令遊戲離線亦可播放筆順動畫及繪製 SVG 筆畫對比（無需 CDN、無需後端）。
// 若某個繁體字在 hanzi-writer-data 中缺失，可自行把同格式 JSON 放入 public/hanzi-data/<字>.json。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const bankFile = path.join(root, 'src/data/questionBank.ts');
const srcDir = path.join(root, 'node_modules/hanzi-writer-data');
const outDir = path.join(root, 'public/hanzi-data');

if (!fs.existsSync(srcDir)) {
  console.warn('[hanzi-data] 未找到 node_modules/hanzi-writer-data，將於執行時改用 CDN 載入筆順數據。');
  process.exit(0);
}

const text = fs.readFileSync(bankFile, 'utf8');
const chars = new Set(text.match(/[\u3400-\u9fff\uf900-\ufaff]/gu) ?? []);
fs.mkdirSync(outDir, { recursive: true });

let copied = 0;
const missing = [];
for (const ch of chars) {
  const src = path.join(srcDir, `${ch}.json`);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(outDir, `${ch}.json`));
    copied++;
  } else {
    missing.push(ch);
  }
}
console.log(`[hanzi-data] 已複製 ${copied} 個字的筆順數據到 public/hanzi-data/`);
if (missing.length) {
  console.log(`[hanzi-data] 數據包內沒有以下字（題幹用字一般不影響遊戲）：${missing.join('')}`);
}
