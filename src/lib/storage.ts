import type {
  ChoiceQuestion,
  ComposeQuestion,
  Grade,
  LevelRecord,
  Question,
  SaveData,
  SetId,
  SetProgress,
  WrongBookEntry,
} from '../types';
import { ERROR_TYPE_BY_KIND, rateLevel } from '../data/levels';
import { cleanHint } from './utils';

/**
 * 儲存結構（每位同學獨立）：
 *   xiaoziling_save_<班別學號>   兩套題目的通關進度與星級
 *   xiaoziling_typos_<班別學號>  跨關錯字圖鑑
 * 例如 3F01 與 3F02 的資料完全分開，互不干擾。
 * 目前使用中的同學記在 sessionStorage：重新整理頁面會保留；關閉分頁後需重新輸入，
 * 避免下一位同學在共用 iPad 上誤用上一位的帳號。
 */
const saveKey = (student: string) => `xiaoziling_save_${student}`;
const typosKey = (student: string) => `xiaoziling_typos_${student}`;
const CURRENT_STUDENT_KEY = 'xiaoziling_current_student';
const SETTINGS_KEY = 'xiaoziling.settings.v1';

function read<T>(key: string, store: Storage = localStorage): T | null {
  try {
    const raw = store.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown, store: Storage = localStorage) {
  try {
    store.setItem(key, JSON.stringify(value));
  } catch {
    /* 私隱模式或空間不足時忽略 */
  }
}

/* ----------------------------- 班別學號 ----------------------------- */

export const STUDENT_ID_MAX_LENGTH = 10;

/**
 * 整理輸入的班別學號：
 * - NFKC：iPad 中文鍵盤輸入的全形「３ｆ０１」轉為半形「3f01」
 * - 去除前後空格、轉為大寫
 */
export function normalizeStudentId(raw: string): string {
  return raw.normalize('NFKC').trim().toUpperCase().slice(0, STUDENT_ID_MAX_LENGTH);
}

export function loadCurrentStudent(): string | null {
  const s = read<string>(CURRENT_STUDENT_KEY, sessionStorage);
  return s ? normalizeStudentId(s) || null : null;
}

export function writeCurrentStudent(student: string | null) {
  if (student) write(CURRENT_STUDENT_KEY, student, sessionStorage);
  else {
    try {
      sessionStorage.removeItem(CURRENT_STUDENT_KEY);
    } catch {
      /* 忽略 */
    }
  }
}

/* ----------------------------- 遊戲存檔 ----------------------------- */

const emptyRecord = (): LevelRecord => ({ cleared: false, firstRoundScore: 0, finalScore: 0, wrongFirstTries: 0 });

export function emptyProgress(setId: SetId): SetProgress {
  return { setId, levelIndex: 0, records: [emptyRecord(), emptyRecord(), emptyRecord()], updatedAt: 0 };
}

function emptySave(): SaveData {
  return { version: 2, storySeen: false, sets: { 1: emptyProgress(1), 2: emptyProgress(2) } };
}

export function loadSave(student: string): SaveData {
  const s = read<SaveData>(saveKey(student));
  if (s && s.version === 2 && s.sets?.[1] && s.sets?.[2]) return s;
  return emptySave();
}

export function writeSave(student: string, save: SaveData) {
  write(saveKey(student), save);
}

/** 已通關關數（0-3） */
export function clearedCount(p: SetProgress): number {
  return p.records.filter((r) => r.cleared).length;
}

/** 已獲星數（最多 9 顆） */
export function starCount(p: SetProgress): number {
  return p.records.reduce((n, r) => n + (r.cleared ? rateLevel(r.firstRoundScore).stars : 0), 0);
}

/* ----------------------------- 錯字圖鑑 ----------------------------- */

export function loadWrongBook(student: string): WrongBookEntry[] {
  return read<WrongBookEntry[]>(typosKey(student)) ?? [];
}

function correctWord(q: Question): string {
  return q.kind === 'compose' ? (q as ComposeQuestion).word : (q as ChoiceQuestion).answer;
}

/** 首答答錯 / 超時時錄入當前同學的圖鑑；同一題去重合併，累計錯誤次數 */
export function addToWrongBook(student: string, q: Question, grade: Grade): WrongBookEntry[] {
  const book = loadWrongBook(student);
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
  write(typosKey(student), book);
  return book;
}

export function clearWrongBook(student: string) {
  localStorage.removeItem(typosKey(student));
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
