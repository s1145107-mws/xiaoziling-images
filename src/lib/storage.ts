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

const SAVE_KEY = 'xiaoziling.save.v2';
const SAVE_KEY_V1 = 'xiaoziling.save.v1';
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

const emptyRecord = (): LevelRecord => ({ cleared: false, firstRoundScore: 0, finalScore: 0, wrongFirstTries: 0 });

export function emptyProgress(setId: SetId): SetProgress {
  return { setId, levelIndex: 0, records: [emptyRecord(), emptyRecord(), emptyRecord()], updatedAt: 0 };
}

function emptySave(): SaveData {
  return { version: 2, storySeen: false, sets: { 1: emptyProgress(1), 2: emptyProgress(2) } };
}

/** 舊版（v1）只有一套隨機抽取的進度：轉移到對應的題庫 */
interface SaveDataV1 {
  version: 1;
  setId: SetId;
  levelIndex: number;
  records: LevelRecord[];
  storySeen: boolean;
  updatedAt: number;
}

function migrateV1(): SaveData | null {
  const old = read<SaveDataV1>(SAVE_KEY_V1);
  if (!old || old.version !== 1 || (old.setId !== 1 && old.setId !== 2)) return null;
  const save = emptySave();
  save.storySeen = !!old.storySeen;
  save.sets[old.setId] = {
    setId: old.setId,
    levelIndex: old.levelIndex,
    records: old.records,
    updatedAt: old.updatedAt,
  };
  return save;
}

export function loadSave(): SaveData {
  const s = read<SaveData>(SAVE_KEY);
  if (s && s.version === 2 && s.sets?.[1] && s.sets?.[2]) return s;
  const migrated = migrateV1();
  if (migrated) {
    writeSave(migrated);
    localStorage.removeItem(SAVE_KEY_V1);
    return migrated;
  }
  return emptySave();
}

export function writeSave(save: SaveData) {
  write(SAVE_KEY, save);
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
