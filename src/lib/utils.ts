export function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 去掉「（自動播放……）」提示前綴，作圖鑑 / Excel 用 */
export function cleanHint(hint: string): string {
  return hint.replace(/^（自動播放[^）]*）/, '').trim();
}

export function yyyymmdd(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}

export function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

/**
 * public/ 內資源的網址。vite.config.ts 的 base 為 './'，所以結果是相對路徑，
 * 例如 assetUrl('images/strokes/s1-l1-q3_a.jpg') → './images/strokes/s1-l1-q3_a.jpg'，
 * 部署在 GitHub Pages 子路徑 /xiaoziling-images/ 時亦不會破圖。
 */
export function assetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
}
