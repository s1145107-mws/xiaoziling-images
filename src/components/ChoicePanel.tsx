import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { ChoiceOption, ChoiceQuestion } from '../types';
import { StrokeWord } from './StrokeGlyph';
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
}

const LETTERS = ['A', 'B', 'C'];
const STROKE_CHAR_SIZE: Record<number, number> = { 1: 132, 2: 96, 3: 72, 4: 62 };

export default function ChoicePanel({ question, attemptKey, disabled, revealCorrect, pickedId, onPick }: Props) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const options = useMemo(() => shuffle(question.options), [question.id, attemptKey]);
  const isStroke = question.kind === 'stroke';
  const len = Array.from(question.answer).length;
  const images = useStrokeImages(question);

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="panel w-full max-w-3xl px-4 py-3 text-center">
        {isStroke ? (
          <>
            <p className="text-lg font-black sm:text-xl">✏️ 魔鏡照出了三個「{question.answer}」，只有一個筆畫是完全正確的！</p>
            <p className="mt-1 text-sm font-bold text-ink/70">仔細觀察每一筆：有沒有多一筆、少一筆，或者筆畫沒有貫穿？</p>
          </>
        ) : (
          <>
            <p className="text-lg font-black sm:text-xl">🔍 下面哪一個是正確的字詞？</p>
            <p className="mt-1 text-sm font-bold text-ink/70">三個詞語的讀音一樣，想一想字的意思和部首！</p>
          </>
        )}
      </div>

      <div className={`grid w-full max-w-3xl gap-3 ${isStroke && len >= 3 ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-3'}`}>
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
                : 'bg-white hover:-translate-y-1 hover:bg-amber-50';
          return (
            <motion.button
              key={`${attemptKey}-${opt.id}`}
              type="button"
              disabled={disabled}
              onClick={() => onPick(opt)}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={showCorrect ? { opacity: 1, y: 0, scale: [1, 1.08, 1] } : { opacity: 1, y: 0, scale: 1 }}
              transition={showCorrect ? { duration: 0.8, repeat: Infinity } : { delay: i * 0.08 }}
              className={`relative flex min-h-[120px] flex-col items-center justify-center rounded-3xl border-4 border-ink p-2 shadow-pop transition disabled:cursor-default ${ring}`}
            >
              <span className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-ink bg-yellow-300 text-sm font-black">
                {LETTERS[i]}
              </span>
              {showCorrect && (
                <span className="absolute -top-4 right-2 rounded-full border-2 border-ink bg-lime-400 px-2 text-sm font-black">
                  ✔ 正確答案
                </span>
              )}
              {isStroke ? (
                <StrokeOptionVisual option={opt} charSize={STROKE_CHAR_SIZE[len] ?? 60} images={images} />
              ) : (
                <span className="kai py-4 text-5xl font-bold tracking-widest sm:text-6xl">{opt.text}</span>
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
}: {
  option: ChoiceOption;
  charSize: number;
  images: 'loading' | Record<string, string> | null;
}) {
  const len = Array.from(option.text).length;
  if (images === 'loading') return <div style={{ height: charSize }} />;
  return (
    <div className="relative flex items-center justify-center py-2">
      {images ? (
        <img
          src={images[option.id]}
          alt={option.text}
          draggable={false}
          className="rounded-lg"
          style={{ height: charSize * 1.25, maxWidth: charSize * len + 40, objectFit: 'contain' }}
        />
      ) : (
        <StrokeWord text={option.text} variant={option.variant} charSize={charSize} />
      )}
    </div>
  );
}
