/** FitStage 的純計算部分（無 React 依賴，方便測試） */

export type Orientation = 'landscape' | 'portrait';

export interface StageInfo {
  orientation: Orientation;
  /** 設計畫布寬高（排版用的 px） */
  width: number;
  height: number;
  /** 畫布 → 螢幕的縮放比例 */
  scale: number;
}

const LANDSCAPE = { height: 800, minWidth: 1060, maxWidth: 1600 };
const PORTRAIT = { width: 820, minHeight: 1000, maxHeight: 1400 };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function computeStage(vw: number, vh: number): StageInfo {
  if (vw <= 0 || vh <= 0) return { orientation: 'landscape', width: LANDSCAPE.minWidth, height: LANDSCAPE.height, scale: 1 };
  if (vw / vh >= 1) {
    const height = LANDSCAPE.height;
    const width = Math.round(clamp((height * vw) / vh, LANDSCAPE.minWidth, LANDSCAPE.maxWidth));
    return { orientation: 'landscape', width, height, scale: Math.min(vw / width, vh / height) };
  }
  const width = PORTRAIT.width;
  const height = Math.round(clamp((width * vh) / vw, PORTRAIT.minHeight, PORTRAIT.maxHeight));
  return { orientation: 'portrait', width, height, scale: Math.min(vw / width, vh / height) };
}
