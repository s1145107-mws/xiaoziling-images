import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { ChoiceOption, ChoiceQuestion } from '../types';
import { StrokeWord } from './StrokeGlyph';
import { useStage } from './FitStage';
import { battleLayout } from '../lib/battleLayout';
import { assetUrl, shuffle } from '../lib/utils';
import { EMBEDDED_STROKE_IMAGES } from '../generated/embeddedAssets';

interface Props {
  question: ChoiceQuestion;
  /** 每次作答（首答 / 補答 / 重試）都換一個 key，選項重新洗牌 */
  attemptKey: string;
  disabled: boolean;
  /** 高亮正確答案（補答錯誤後） */
  revealCorrect: boolean;
  pickedId: string | null;
  onPick: (opt: ChoiceOption) => void;
  /** 題幹左上角的標籤（題型、補答提示） */
  chips?: ReactNode;
  /** 補答階段：以思考問題取代副標題 */
  think?: string | null;
}

const LETTERS = ['A', 'B', 'C'];

export default function ChoicePanel({ question, attemptKey, disabled, revealCorrect, pickedId, onPick, chips, think }: Props) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const options = useMemo(() => shuffle(question.options), [question.id, attemptKey]);
  const L = battleLayout(useStage());
  const isStroke = question.kind === 'stroke';
  const len = Array.from(question.answer).length;
  const images = useStrokeImages(question);

  // 直向畫面寬度有限：三字以上的詞語改為三行排列，字才寫得夠大
  const rows = L.portrait && len >= 3;
  const gridGap = 12;
  const gridH = L.questionH - L.promptH - L.gap;
  const cardW = rows ? L.questionW : (L.questionW - gridGap * 2) / 3;
  const cardH = rows ? (gridH - gridGap * 2) / 3 : gridH;
  // 卡片內容可用空間（扣除邊框、內距、字母標籤）
  // 三行排列時，左右各留位置給 A/B/C 標籤和「正確答案」標記
  const innerW = cardW - (rows ? 260 : 32);
  const innerH = cardH - (rows ? 24 : 56);
  const charSize = Math.floor(Math.min(innerH * 0.8, (innerW - (len - 1) * 4) / len, 220));
  const textSize = Math.floor(Math.min(innerW / (len * 1.15), innerH * 0.6, 110));

  return (
    <div className="flex h-full w-full flex-col" style={{ gap: L.gap }}>
      <div className="panel flex shrink-0 flex-col justify-center px-5 text-center" style={{ height: L.promptH }}>
        <div className="flex items-center justify-center gap-3">
          {chips}
          <p className="min-w-0 truncate text-2xl font-black">
            {isStroke ? `✏️ 哪一個「${question.answer}」的筆畫完全正確？` : '🔍 下面哪一個是正確的字詞？'}
          </p>
        </div>
        <p className={`mt-1 truncate text-lg font-bold ${think ? 'kai text-pink-600' : 'text-ink/70'}`}>
          {think
            ? `🤔 ${think}`
            : isStroke
              ? '仔細觀察每一筆：有沒有多一筆、少一筆，或者筆畫沒有貫穿？'
              : '三個詞語的讀音一樣，想一想字的意思和部首！'}
        </p>
      </div>

      <div className={`grid min-h-0 flex-1 ${rows ? 'grid-cols-1 grid-rows-3' : 'grid-cols-3'}`} style={{ gap: gridGap }}>
        {options.map((opt, i) => {
          const picked = pickedId === opt.id;
          const showCorrect = revealCorrect && opt.correct;
          const showWrong = picked && !opt.correct;
          const ring = showCorrect
            ? 'bg-lime-200 ring-8 ring-lime-400'
            : showWrong
              ? 'bg-red-100 ring-8 ring-red-300'
              : picked && opt.correct
                ? 'bg-lime-200 ring-8 ring-lime-400'
                : 'bg-white hover:bg-amber-50 active:scale-[0.98]';
          return (
            <motion.button
              key={`${attemptKey}-${opt.id}`}
              type="button"
              disabled={disabled}
              onClick={() => onPick(opt)}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={showCorrect ? { opacity: 1, y: 0, scale: [1, 1.04, 1] } : { opacity: 1, y: 0, scale: 1 }}
              transition={showCorrect ? { duration: 0.8, repeat: Infinity } : { delay: i * 0.06, duration: 0.25 }}
              className={`relative flex min-h-0 items-center justify-center overflow-hidden rounded-3xl border-4 border-ink p-3 shadow-pop transition-colors disabled:cursor-default ${ring}`}
            >
              <span className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border-2 border-ink bg-yellow-300 text-lg font-black">
                {LETTERS[i]}
              </span>
              {showCorrect && (
                <span className="absolute right-3 top-3 rounded-full border-2 border-ink bg-lime-400 px-3 text-lg font-black">✔ 正確答案</span>
              )}
              {isStroke ? (
                <StrokeOptionVisual option={opt} charSize={charSize} images={images} maxW={innerW} maxH={innerH} />
              ) : (
                <span className="kai font-bold leading-none tracking-wider" style={{ fontSize: textSize }}>
                  {opt.text}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/** 依次嘗試的手寫圖片副檔名 */
const IMAGE_EXTS = ['png', 'jpg'];

function loadImage(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => reject(new Error(src));
    img.src = src;
  });
}

async function findImage(questionId: string, optionId: string): Promise<string> {
  // 單一 HTML 版：圖片已嵌入為 data URL
  const embedded = EMBEDDED_STROKE_IMAGES[`${questionId}_${optionId}`];
  if (embedded) return embedded;
  for (const ext of IMAGE_EXTS) {
    try {
      return await loadImage(assetUrl(`images/strokes/${questionId}_${optionId}.${ext}`));
    } catch {
      /* 試下一個副檔名 */
    }
  }
  throw new Error('no image');
}

const imageSetCache = new Map<string, Promise<Record<string, string> | null>>();

/**
 * 三個選項的手寫圖片必須全部存在才使用；缺任何一張，三個選項都改用 SVG。
 * 避免一題同時出現照片和 SVG，令學生憑畫風猜出答案。
 */
function loadImageSet(q: ChoiceQuestion): Promise<Record<string, string> | null> {
  let p = imageSetCache.get(q.id);
  if (!p) {
    p = Promise.all(q.options.map((o) => findImage(q.id, o.id).then((src) => [o.id, src] as const)))
      .then((pairs) => Object.fromEntries(pairs))
      .catch(() => null);
    imageSetCache.set(q.id, p);
  }
  return p;
}

function useStrokeImages(q: ChoiceQuestion): 'loading' | Record<string, string> | null {
  const [state, setState] = useState<'loading' | Record<string, string> | null>('loading');
  useEffect(() => {
    if (q.kind !== 'stroke') return setState(null);
    let alive = true;
    setState('loading');
    loadImageSet(q).then((r) => alive && setState(r));
    return () => {
      alive = false;
    };
  }, [q]);
  return state;
}

function StrokeOptionVisual({
  option,
  charSize,
  images,
  maxW,
  maxH,
}: {
  option: ChoiceOption;
  charSize: number;
  images: 'loading' | Record<string, string> | null;
  maxW: number;
  maxH: number;
}) {
  if (images === 'loading') return <div style={{ height: charSize }} />;
  return images ? (
    <img
      src={images[option.id]}
      alt={option.text}
      draggable={false}
      className="rounded-xl"
      style={{ width: maxW, height: maxH, objectFit: 'contain' }}
    />
  ) : (
    <StrokeWord text={option.text} variant={option.variant} charSize={charSize} />
  );
}
