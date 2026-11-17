import * as XLSX from 'xlsx';
import type { Grade, WrongBookEntry } from '../types';
import { yyyymmdd } from './utils';

const GRADE_ORDER: Record<Grade, number> = { 小一: 1, 小二: 2, 小三: 3 };

export function sortWrongBook(entries: WrongBookEntry[]): WrongBookEntry[] {
  return entries.slice().sort((a, b) => GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade] || a.key.localeCompare(b.key));
}

/** 匯出錯字圖鑑為 小字靈_錯字圖鑑_YYYYMMDD.xlsx（純前端生成並下載） */
export function exportWrongBook(entries: WrongBookEntry[]): string {
  const header = ['年級', '錯字類型', '正字', '字源提示', '關鍵筆畫'];
  const rows = sortWrongBook(entries).map((e) => [e.grade, e.errorType, e.word, e.hint, e.keyStroke]);

  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  ws['!cols'] = [{ wch: 8 }, { wch: 14 }, { wch: 14 }, { wch: 60 }, { wch: 36 }];
  ws['!autofilter'] = { ref: `A1:E${rows.length + 1}` };

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '錯字圖鑑');

  const filename = `小字靈_錯字圖鑑_${yyyymmdd()}.xlsx`;
  XLSX.writeFile(wb, filename, { bookType: 'xlsx', compression: true });
  return filename;
}
