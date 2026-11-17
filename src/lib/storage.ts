import type { ChoiceQuestion, ComposeQuestion, Grade, Question, SaveData, WrongBookEntry } from '../types';
import { ERROR_TYPE_BY_KIND } from '../data/levels';
import { cleanHint } from './utils';

const SAVE_KEY = 'xiaoziling.save.v1';
const WRONG_KEY = 'xiaoziling.wrongbook.v1';
const SETTINGS_KEY = 'xiaoziling.settings.v1';

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 私隱模式或空間不足時忽略 */
  }
}

/* ----------------------------- 遊戲存檔 ----------------------------- */

export function loadSave(): SaveData | null {
  const s = read<SaveData>(SAVE_KEY);
  return s && s.version === 1 ? s : null;
}

export function writeSave(save: SaveData) {
  write(SAVE_KEY, { ...save, updatedAt: Date.now() });
}

export function clearSave() {
  localStorage.removeItem(SAVE_KEY);
}

/* ----------------------------- 錯字圖鑑 ----------------------------- */

export function loadWrongBook(): WrongBookEntry[] {
  return read<WrongBookEntry[]>(WRONG_KEY) ?? [];
}

function correctWord(q: Question): string {
  return q.kind === 'compose' ? (q as ComposeQuestion).word : (q as ChoiceQuestion).answer;
}

/** 首答答錯 / 超時時錄入；同一題去重合併，累計錯誤次數 */
export function addToWrongBook(q: Question, grade: Grade): WrongBookEntry[] {
  const book = loadWrongBook();
  const key = q.id;
  const existing = book.find((e) => e.key === key);
  if (existing) {
    existing.count += 1;
    existing.lastAt = Date.now();
  } else {
    book.push({
      key,
      grade,
      errorType: ERROR_TYPE_BY_KIND[q.kind],
      word: correctWord(q),
      hint: cleanHint(q.hint),
      keyStroke: q.keyStroke,
      count: 1,
      lastAt: Date.now(),
    });
  }
  write(WRONG_KEY, book);
  return book;
}

export function clearWrongBook() {
  localStorage.removeItem(WRONG_KEY);
}

/* ------------------------------- 設定 ------------------------------- */

export interface Settings {
  muted: boolean;
}

export function loadSettings(): Settings {
  return read<Settings>(SETTINGS_KEY) ?? { muted: false };
}

export function writeSettings(s: Settings) {
  write(SETTINGS_KEY, s);
}
