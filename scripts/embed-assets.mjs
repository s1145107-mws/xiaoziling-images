// 產生 src/generated/embeddedAssets.ts
//   node scripts/embed-assets.mjs           → 寫入空白版本（一般 dev / build 用，資源照舊由 public/ 載入）
//   node scripts/embed-assets.mjs --embed   → 把手寫圖片和筆順數據轉成 data URL / JSON 寫入（單一 HTML 版用）
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outFile = path.join(root, 'src/generated/embeddedAssets.ts');
const strokeDir = path.join(root, 'public/images/strokes');
const hanziDir = path.join(root, 'public/hanzi-data');
const embed = process.argv.includes('--embed');

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };
const images = {};
const hanzi = {};

if (embed) {
  for (const f of fs.existsSync(strokeDir) ? fs.readdirSync(strokeDir).sort() : []) {
    const ext = path.extname(f).toLowerCase();
    const m = /^(s\d-l\d-q\d_[abc])\.(png|jpe?g)$/i.exec(f);
    if (!m || !MIME[ext]) continue;
    // 與遊戲一致：同名時 .png 優先
    if (images[m[1]] && ext !== '.png') continue;
    images[m[1]] = `data:${MIME[ext]};base64,${fs.readFileSync(path.join(strokeDir, f)).toString('base64')}`;
  }
  for (const f of fs.existsSync(hanziDir) ? fs.readdirSync(hanziDir) : []) {
    if (!f.endsWith('.json')) continue;
    const data = JSON.parse(fs.readFileSync(path.join(hanziDir, f), 'utf8'));
    hanzi[f.slice(0, -5)] = { strokes: data.strokes, medians: data.medians, radStrokes: data.radStrokes };
  }
}

const src = `// 此檔由 scripts/embed-assets.mjs 自動產生，請勿手動修改。
import type { HanziCharData } from '../lib/hanziData';

/** 手寫選項圖片：鍵為「題號_選項」，例如 s1-l1-q3_a */
export const EMBEDDED_STROKE_IMAGES: Record<string, string> = ${JSON.stringify(images)};

/** 筆順數據：鍵為漢字 */
export const EMBEDDED_HANZI: Record<string, HanziCharData> = ${JSON.stringify(hanzi)};
`;

fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, src);
console.log(
  embed
    ? `[embed] 已嵌入 ${Object.keys(images).length} 張手寫圖片、${Object.keys(hanzi).length} 個字的筆順數據`
    : '[embed] 已寫入空白 embeddedAssets.ts',
);
