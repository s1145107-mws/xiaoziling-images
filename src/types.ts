export type Grade = '小一' | '小二' | '小三';
export type ErrorType = '誤寫成同音字' | '筆劃誤寫' | '誤寫成形近字';
export type QuestionKind = 'homophone' | 'stroke' | 'compose';

/** 筆畫選擇器：數字為筆畫序號（負數由最後一筆倒數，-1 = 最後一筆）；或自動偵測最長的豎/橫 */
export type StrokeSelector = number | 'longestVertical' | 'longestHorizontal';

/**
 * 筆畫誤寫變體的操作（作用於 hanzi-writer 筆畫數據，座標為 1024 × 1024，y 軸向上）
 * - remove：刪去筆畫（少一筆）
 * - copy：複製某一筆並位移 / 變形（多一筆）
 * - copyMid：複製 from 筆，放到 from 與 to 兩筆中心點之間（例如在兩橫中間多加一橫）
 * - scale：把某一筆以自身中心縮放（例如豎筆變短、未貫穿）
 */
export type StrokeOp =
  | { op: 'remove'; strokes: StrokeSelector[] }
  | { op: 'copy'; stroke: StrokeSelector; dx?: number; dy?: number; sx?: number; sy?: number }
  | { op: 'copyMid'; from: StrokeSelector; to: StrokeSelector }
  | { op: 'scale'; stroke: StrokeSelector; sx?: number; sy?: number; anchor?: 'center' | 'top' | 'bottom' };

export interface StrokeVariant {
  /** 在詞語中第幾個字（0 起計）出錯 */
  charIndex: number;
  ops: StrokeOp[];
}

export interface ChoiceOption {
  id: string; // 'a' | 'b' | 'c'
  text: string;
  correct: boolean;
  /** 筆畫題專用：誘錯的筆畫變化 */
  variant?: StrokeVariant;
  /** 筆畫題專用：給老師看的錯處描述（不在作答時顯示） */
  note?: string;
}

interface QuestionBase {
  id: string; // 例：s1-l1-q1
  kind: QuestionKind;
  hint: string; // 錯後提示
  think: string; // 思考問題
  keyStroke: string; // 關鍵筆畫
}

export interface ChoiceQuestion extends QuestionBase {
  kind: 'homophone' | 'stroke';
  answer: string;
  options: ChoiceOption[];
}

export interface ComposeQuestion extends QuestionBase {
  kind: 'compose';
  /** 配詞提示，例：？璃 */
  wordHint: string;
  /** 完整正字詞語，例：玻璃 */
  word: string;
  /** 正字，例：玻 */
  target: string;
  /** 結構槽，'？' 代表空槽，例：['？', '皮'] */
  structure: string[];
  /** 'lr' 左右 / 'lmr' 左中右 / 'wrap' 半包圍（戴） */
  layout: 'lr' | 'lmr' | 'wrap';
  answer: string;
  components: string[]; // 3 個部件（含正確部件）
  /** 部件組合後若是真實存在的字，用來即時預覽 */
  previews: Record<string, string>;
}

export type Question = ChoiceQuestion | ComposeQuestion;

export interface LevelData {
  questions: Question[]; // 6 題
}

export interface QuestionSet {
  id: 1 | 2;
  name: string;
  levels: [LevelData, LevelData, LevelData];
}

export interface LevelMeta {
  index: number;
  name: string;
  grade: Grade;
  boss: string;
  bossTitle: string;
  shard: string;
  badge: string;
  intro: string;
  bossLine: string;
  defeatLine: string;
  theme: 'forest' | 'castle' | 'space';
}

export interface LevelRecord {
  cleared: boolean;
  firstRoundScore: number; // 首輪得分（用作評價）
  finalScore: number; // 最終得分（含重試錯題）
  wrongFirstTries: number;
}

export interface SaveData {
  version: 1;
  setId: 1 | 2;
  levelIndex: number; // 目前要挑戰的關卡 0-2；3 = 已全部通關
  records: LevelRecord[];
  storySeen: boolean;
  updatedAt: number;
}

export interface WrongBookEntry {
  key: string; // 去重鍵：題組+題號
  grade: Grade;
  errorType: ErrorType;
  word: string; // 正字（完整詞語）
  hint: string; // 字源提示
  keyStroke: string; // 關鍵筆畫
  count: number;
  lastAt: number;
}
