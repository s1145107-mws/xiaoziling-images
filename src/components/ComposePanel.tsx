import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import type { ComposeQuestion } from '../types';
import { shuffle } from '../lib/utils';
import { audio } from '../audio/AudioEngine';

interface Props {
  question: ComposeQuestion;
  attemptKey: string;
  disabled: boolean;
  revealCorrect: boolean;
  onSubmit: (component: string) => void;
}

const SLOT = '？';

export default function ComposePanel({ question, attemptKey, disabled, revealCorrect, onSubmit }: Props) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const comps = useMemo(() => shuffle(question.components), [question.id, attemptKey]);
  const [placed, setPlaced] = useState<string | null>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  useEffect(() => setPlaced(null), [question.id, attemptKey]);
  useEffect(() => {
    if (revealCorrect) setPlaced(question.answer);
  }, [revealCorrect, question.answer]);

  const place = (c: string) => {
    if (disabled) return;
    audio.place();
    setPlaced(c);
  };

  const handleDragEnd = (c: string, info: PanInfo) => {
    const el = slotRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = info.point.x - window.scrollX;
    const y = info.point.y - window.scrollY;
    const pad = 30;
    if (x > r.left - pad && x < r.right + pad && y > r.top - pad && y < r.bottom + pad) place(c);
  };

  const previewChar = placed ? question.previews[placed] : undefined;
  const wordParts = question.wordHint.split(SLOT);

  return (
    <div className="flex w-full flex-col items-center gap-3">
      {/* 配詞提示 */}
      <div className="panel flex w-full max-w-3xl flex-col items-center gap-2 px-4 py-3">
        <p className="text-lg font-black sm:text-xl">🧩 把正確的部件拖進字槽，組成正字！</p>
        <div className="kai flex items-center text-5xl font-bold sm:text-6xl">
          {wordParts[0]}
          <span
            className={`mx-1 inline-flex h-16 w-16 items-center justify-center rounded-xl border-4 border-dashed sm:h-20 sm:w-20 ${
              placed ? 'border-sky-500 bg-sky-100' : 'border-ink/40 bg-white'
            }`}
          >
            {placed ? previewChar ?? <ComposedPreview question={question} placed={placed} size={56} /> : '？'}
          </span>
          {wordParts[1]}
        </div>
      </div>

      {/* 字形結構槽 + 即時預覽 */}
      <div className="flex w-full max-w-3xl flex-wrap items-center justify-center gap-3 sm:gap-5">
        <div className="panel flex items-center gap-2 px-4 py-3">
          {question.structure.map((part, i) => (
            <div key={i} className="flex items-center gap-2">
              {i > 0 && <span className="text-3xl font-black text-ink/60">+</span>}
              {part === SLOT ? (
                <motion.div
                  ref={slotRef}
                  onClick={() => !disabled && setPlaced(null)}
                  animate={placed ? { scale: [1.2, 1] } : { scale: [1, 1.06, 1] }}
                  transition={placed ? { duration: 0.25 } : { duration: 1.4, repeat: Infinity }}
                  className={`kai flex h-20 w-20 cursor-pointer items-center justify-center rounded-2xl border-4 text-5xl font-bold sm:h-24 sm:w-24 ${
                    placed
                      ? revealCorrect
                        ? 'border-lime-500 bg-lime-200'
                        : 'border-sky-500 bg-sky-100'
                      : 'border-dashed border-pink-400 bg-pink-50 text-pink-300'
                  }`}
                  title={placed ? '點擊取回部件' : '把部件拖到這裡'}
                >
                  {placed ?? '？'}
                </motion.div>
              ) : (
                <div className="kai flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-ink bg-white text-5xl font-bold sm:h-24 sm:w-24">
                  {part}
                </div>
              )}
            </div>
          ))}
        </div>

        <span className="text-4xl font-black">→</span>

        <div className="panel flex flex-col items-center px-4 py-2">
          <span className="text-xs font-black text-ink/60">組合預覽</span>
          <div className="kai flex h-24 w-24 items-center justify-center text-7xl font-bold">
            <AnimatePresence mode="wait">
              <motion.span
                key={placed ?? 'empty'}
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0 }}
                className={placed ? (revealCorrect ? 'text-lime-600' : 'text-sky-700') : 'text-ink/20'}
              >
                {placed ? previewChar ?? <ComposedPreview question={question} placed={placed} size={88} /> : '？'}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* 部件卡片（可拖拽 / 可點擊） */}
      <div className="flex w-full max-w-3xl items-center justify-center gap-4 sm:gap-8">
        {comps.map((c) => {
          const isPlaced = placed === c;
          return (
            <motion.div
              key={`${attemptKey}-${c}`}
              drag={!disabled}
              dragSnapToOrigin
              dragElastic={0.9}
              whileDrag={{ scale: 1.2, zIndex: 50, rotate: 6 }}
              whileHover={disabled ? undefined : { y: -6 }}
              onDragStart={() => (draggingRef.current = true)}
              onDragEnd={(_, info) => {
                handleDragEnd(c, info);
                window.setTimeout(() => (draggingRef.current = false), 50);
              }}
              onTap={() => !draggingRef.current && place(c)}
              className={`kai flex h-24 w-24 cursor-grab touch-none items-center justify-center rounded-3xl border-4 border-ink text-6xl font-bold shadow-pop active:cursor-grabbing sm:h-28 sm:w-28 ${
                isPlaced ? 'bg-sky-200 opacity-50' : 'bg-yellow-200'
              } ${revealCorrect && c === question.answer ? 'ring-8 ring-lime-400' : ''}`}
            >
              {c}
            </motion.div>
          );
        })}
      </div>

      <button type="button" className="btn btn-green mt-1" disabled={disabled || !placed} onClick={() => placed && onSubmit(placed)}>
        ✨ 確定組字
      </button>
    </div>
  );
}

/** 若組合不是真實存在的字，以壓縮排列的方式模擬組合後的字形 */
function ComposedPreview({ question, placed, size }: { question: ComposeQuestion; placed: string; size: number }) {
  const parts = question.structure.map((p) => (p === SLOT ? placed : p));
  return (
    <span className="inline-flex items-center justify-center" style={{ width: size, height: size }}>
      {parts.map((p, i) => (
        <span
          key={i}
          className="inline-block"
          style={{
            fontSize: size,
            lineHeight: 1,
            width: size / parts.length,
            transform: `scaleX(${1 / parts.length + 0.12})`,
            transformOrigin: 'center',
          }}
        >
          {p}
        </span>
      ))}
    </span>
  );
}
