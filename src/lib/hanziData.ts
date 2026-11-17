import { assetUrl } from './utils';
import { EMBEDDED_HANZI } from '../generated/embeddedAssets';

/** hanzi-writer 的字形數據格式（座標系 1024×1024，y 軸向上，需以 translate(0,900) scale(1,-1) 顯示） */
export interface HanziCharData {
  strokes: string[];
  medians: number[][][];
  radStrokes?: number[];
}

const CDN = 'https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1';
const cache = new Map<string, Promise<HanziCharData>>();

async function fetchJson(url: string): Promise<HanziCharData> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const data = (await res.json()) as HanziCharData;
  if (!Array.isArray(data.strokes)) throw new Error('bad data');
  return data;
}

/**
 * 載入次序：
 * 1. 本地 /hanzi-data/<字>.json（npm run dev/build 時由 hanzi-writer-data 自動複製，可自行補充繁體字形）
 * 2. jsDelivr CDN 上的 hanzi-writer-data
 */
export function loadCharData(char: string): Promise<HanziCharData> {
  let p = cache.get(char);
  // 單一 HTML 版：筆順數據已嵌入，毋須讀取檔案
  if (!p && EMBEDDED_HANZI[char]) {
    p = Promise.resolve(EMBEDDED_HANZI[char]);
    cache.set(char, p);
  }
  if (!p) {
    const enc = encodeURIComponent(char);
    p = fetchJson(assetUrl(`hanzi-data/${enc}.json`)).catch(() => fetchJson(`${CDN}/${enc}.json`));
    p.catch(() => cache.delete(char)); // 失敗不快取，下次可重試
    cache.set(char, p);
  }
  return p;
}

/** 給 HanziWriter 的 charDataLoader */
export function hanziWriterLoader(char: string, onLoad: (d: HanziCharData) => void, onError: (e?: unknown) => void) {
  loadCharData(char).then(onLoad, onError);
}
