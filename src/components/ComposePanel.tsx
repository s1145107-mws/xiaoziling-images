import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ComposeQuestion } from '../types';
import { shuffle } from '../lib/utils';
import { battleLayout } from '../lib/battleLayout';
import { useStage } from './FitStage';
import { audio } from '../audio/AudioEngine';

interface Props {
  question: ComposeQuestion;
  attemptKey: string;
  disabled: boolean;
  revealCorrect: boolean;
  onSubmit: (component: string) => void;
  chips?: ReactNode;
  think?: string | null;
}

const SLOT = '？';
const FLY_MS = 300;

type AnyPointerEvent = MouseEvent | TouchEvent | PointerEvent;

/** 取得指標在螢幕上的座標（滑鼠、觸控筆、手指皆可） */
function clientPoint(e: AnyPointerEvent): { x: number; y: number } | null {
  if ('changedTouches' in e && e.changedTouches.length) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
  if ('clientX' in e) return { x: e.clientX, y: e.clientY };
  return null;
}

interface Flying {
  c: string;
  from: { x: number; y: number; size: number };
  to: { x: number; y: number; size: number };
}

export default function ComposePanel({ question, attemptKey, disabled, revealCorrect, onSubmit, chips, think }: Props) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const comps = useMemo(() => shuffle(question.components), [question.id, attemptKey]);
  const stage = useStage();
  const L = battleLayout(stage);
  const [placed, setPlaced] = useState<string | null>(null);
  const [over, setOver] = useState(false);
  const [flying, setFlying] = useState<Flying | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    setPlaced(null);
    setFlying(null);
  }, [question.id, attemptKey]);
  useEffect(() => {
    if (revealCorrect) setPlaced(question.answer);
  }, [revealCorrect, question.answer]);

  /* ----------------------------- 尺寸 ----------------------------- */
  const portrait = L.portrait;
  const buttonH = 64;
  const hintFont = portrait ? 76 : 68;
  const slotSize = portrait ? 104 : 96; // 配詞中的空格
  const partSize = portrait ? 112 : 100; // 結構槽
  const previewSize = portrait ? 120 : 108;
  // 補答階段多一行「思考問題」，面板相應加高
  const topH = (portrait ? 166 : 186) + (think ? 34 : 0);
  const structH = portrait ? 156 : 0;
  const piecesH = L.questionH - topH - structH - buttonH - L.gap * (portrait ? 3 : 2);
  const pieceSize = Math.floor(Math.min(150, piecesH - 16));

  /* ----------------------------- 互動 ----------------------------- */
  const overSlot = (e: AnyPointerEvent) => {
    const el = slotRef.current;
    const p = clientPoint(e);
    if (!el || !p) return false;
    const r = el.getBoundingClientRect();
    const pad = 40 * stage.scale;
    return p.x > r.left - pad && p.x < r.right + pad && p.y > r.top - pad && p.y < r.bottom + pad;
  };

  const commit = (c: string) => {
    audio.place();
    setPlaced(c);
  };

  /** 點擊模式：部件從原位飛入字槽 */
  const flyIn = (c: string, fromEl: HTMLElement) => {
    if (disabled || flying) return;
    const root = rootRef.current;
    const slot = slotRef.current;
    if (!root || !slot) return commit(c);
    const s = stage.scale;
    const rr = root.getBoundingClientRect();
    const a = fromEl.getBoundingClientRect();
    const b = slot.getBoundingClientRect();
    audio.click();
    setFlying({
      c,
      from: { x: (a.left - rr.left) / s, y: (a.top - rr.top) / s, size: a.width / s },
      to: { x: (b.left - rr.left) / s, y: (b.top - rr.top) / s, size: b.width / s },
    });
    window.setTimeout(() => {
      setFlying(null);
      commit(c);
    }, FLY_MS);
  };

  const previewChar = placed ? question.previews[placed] : undefined;
  const wordParts = question.wordHint.split(SLOT);

  /* ----------------------------- 元件 ----------------------------- */
  const title = (
    <div className="flex items-center justify-center gap-3">
      {chips}
      <p className="truncate text-2xl font-black">🧩 把正確的部件拖進字槽，或直接點擊部件！</p>
    </div>
  );

  const wordHint = (
    <div className="kai flex items-center font-bold leading-none" style={{ fontSize: hintFont }}>
      {wordParts[0]}
      <span
        className={`mx-2 inline-flex items-center justify-center rounded-2xl border-4 border-dashed ${
          placed ? 'border-sky-500 bg-sky-100 text-sky-800' : 'border-ink/40 bg-white text-ink/30'
        }`}
        style={{ width: slotSize, height: slotSize, fontSize: slotSize * 0.75 }}
      >
        {placed ? previewChar ?? <ComposedPreview question={question} placed={placed} size={slotSize * 0.7} /> : '？'}
      </span>
      {wordParts[1]}
    </div>
  );

  const structure = (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        {question.structure.map((part, i) => (
          <div key={i} className="flex items-center gap-2">
            {i > 0 && <span className="text-4xl font-black text-ink/60">+</span>}
            {part === SLOT ? (
              <motion.div
                ref={slotRef}
                onClick={() => !disabled && !flying && placed && (audio.click(), setPlaced(null))}
                animate={over ? { scale: 1.18 } : placed ? { scale: [1.2, 1] } : { scale: [1, 1.06, 1] }}
                transition={over ? { duration: 0.15 } : placed ? { duration: 0.25 } : { duration: 1.4, repeat: Infinity }}
                className={`kai flex cursor-pointer items-center justify-center rounded-2xl border-4 font-bold ${
                  over
                    ? 'border-amber-500 bg-amber-100 text-amber-400 shadow-[0_0_0_8px_rgba(251,191,36,0.4)]'
                    : placed
                      ? revealCorrect
                        ? 'border-lime-500 bg-lime-200'
                        : 'border-sky-500 bg-sky-100'
                      : 'border-dashed border-pink-400 bg-pink-50 text-pink-300'
                }`}
                style={{ width: partSize, height: partSize, fontSize: partSize * 0.62 }}
                title={placed ? '點擊取回部件' : '把部件拖到這裡'}
              >
                {placed ?? '？'}
              </motion.div>
            ) : (
              <div
                className="kai flex items-center justify-center rounded-2xl border-4 border-ink bg-white font-bold"
                style={{ width: partSize, height: partSize, fontSize: partSize * 0.62 }}
              >
                {part}
              </div>
            )}
          </div>
        ))}
      </div>

      <span className="text-5xl font-black">→</span>

      <div className="flex flex-col items-center rounded-2xl border-4 border-ink bg-white px-2 pb-1">
        <span className="text-sm font-black text-ink/60">組合預覽</span>
        <div className="kai flex items-center justify-center font-bold leading-none" style={{ width: previewSize, height: previewSize - 24, fontSize: previewSize * 0.7 }}>
          <AnimatePresence mode="wait">
            <motion.span
              key={placed ?? 'empty'}
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }}
              className={placed ? (revealCorrect ? 'text-lime-600' : 'text-sky-700') : 'text-ink/20'}
            >
              {placed ? previewChar ?? <ComposedPreview question={question} placed={placed} size={previewSize * 0.7} /> : '？'}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );

  const thinkLine = think ? <p className="kai truncate text-xl font-bold text-pink-600">🤔 {think}</p> : null;

  return (
    <div ref={rootRef} className="relative flex h-full w-full flex-col items-center" style={{ gap: L.gap }}>
      {portrait ? (
        <>
          <div className="panel flex w-full shrink-0 flex-col items-center justify-center gap-2 px-5" style={{ height: topH }}>
            {title}
            {thinkLine}
            {wordHint}
          </div>
          <div className="panel flex w-full shrink-0 items-center justify-center px-5" style={{ height: structH }}>
            {structure}
          </div>
        </>
      ) : (
        <div className="panel flex w-full shrink-0 flex-col justify-center gap-2 px-6" style={{ height: topH }}>
          {title}
          {thinkLine}
          <div className="flex items-center justify-center gap-8">
            {wordHint}
            <div className="h-24 w-1 rounded-full bg-ink/15" />
            {structure}
          </div>
        </div>
      )}

      {/* 部件卡片：手指 / 觸控筆 / 滑鼠均可拖曳，亦可直接點擊飛入字槽 */}
      <div className="flex min-h-0 w-full flex-1 items-center justify-center gap-10">
        {comps.map((c) => {
          const isPlaced = placed === c || flying?.c === c;
          return (
            <motion.div
              key={`${attemptKey}-${c}`}
              drag={!disabled && !flying}
              dragSnapToOrigin
              dragElastic={0.9}
              dragMomentum={false}
              whileDrag={{ scale: 1.2, zIndex: 50, rotate: 6 }}
              whileTap={disabled ? undefined : { scale: 0.94 }}
              onDragStart={() => (draggingRef.current = true)}
              onDrag={(e) => setOver(overSlot(e as AnyPointerEvent))}
              onDragEnd={(e) => {
                if (overSlot(e as AnyPointerEvent)) commit(c);
                setOver(false);
                window.setTimeout(() => (draggingRef.current = false), 60);
              }}
              onTap={(e) => {
                if (draggingRef.current || disabled) return;
                flyIn(c, (e.target as HTMLElement).closest('[data-piece]') as HTMLElement);
              }}
              data-piece
              className={`drag-piece kai flex cursor-grab items-center justify-center rounded-3xl border-4 border-ink font-bold shadow-pop active:cursor-grabbing ${
                isPlaced ? 'bg-sky-200 opacity-40' : 'bg-yellow-200'
              } ${revealCorrect && c === question.answer ? 'ring-8 ring-lime-400' : ''}`}
              style={{ width: pieceSize, height: pieceSize, fontSize: pieceSize * 0.6 }}
            >
              {c}
            </motion.div>
          );
        })}
      </div>

      <button
        type="button"
        className="btn btn-green shrink-0 px-10 text-2xl"
        style={{ height: buttonH }}
        disabled={disabled || !placed || !!flying}
        onClick={() => placed && onSubmit(placed)}
      >
        ✨ 確定組字
      </button>

      {/* 點擊模式：飛入字槽的部件 */}
      {flying && (
        <motion.div
          className="kai pointer-events-none absolute left-0 top-0 z-50 flex items-center justify-center rounded-3xl border-4 border-ink bg-yellow-200 font-bold shadow-pop"
          initial={{ x: flying.from.x, y: flying.from.y, width: flying.from.size, height: flying.from.size, fontSize: flying.from.size * 0.6 }}
          animate={{ x: flying.to.x, y: flying.to.y, width: flying.to.size, height: flying.to.size, fontSize: flying.to.size * 0.62 }}
          transition={{ duration: FLY_MS / 1000, ease: [0.3, 1.4, 0.6, 1] }}
        >
          {flying.c}
        </motion.div>
      )}
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
