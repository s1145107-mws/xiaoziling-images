import { useEffect, useRef, useState } from 'react';
import HanziWriter from 'hanzi-writer';
import { hanziWriterLoader } from '../lib/hanziData';

interface Props {
  text: string;
  size?: number;
}

/**
 * 以 hanzi-writer 逐字播放標準筆順動畫（一字寫完再寫下一字，全詞寫完後自動重播）。
 * 筆順數據優先讀取本地 ./hanzi-data/，其次 CDN。
 */
export default function StrokeAnimator({ text, size = 120 }: Props) {
  const boxRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [failed, setFailed] = useState<Set<number>>(new Set());
  const [round, setRound] = useState(0);
  const chars = Array.from(text);

  useEffect(() => {
    let cancelled = false;
    const writers: (HanziWriter | null)[] = [];
    const failedNow = new Set<number>();

    chars.forEach((c, i) => {
      const el = boxRefs.current[i];
      if (!el) return;
      el.innerHTML = '';
      try {
        writers[i] = HanziWriter.create(el, c, {
          width: size,
          height: size,
          padding: 6,
          showCharacter: false,
          showOutline: true,
          strokeColor: '#1d4ed8',
          radicalColor: '#e11d48',
          outlineColor: '#e7dcc4',
          strokeAnimationSpeed: 1.1,
          delayBetweenStrokes: 180,
          charDataLoader: hanziWriterLoader,
          onLoadCharDataError: () => {
            failedNow.add(i);
            setFailed(new Set(failedNow));
          },
        });
      } catch {
        writers[i] = null;
        failedNow.add(i);
      }
    });

    const run = async () => {
      while (!cancelled) {
        for (const w of writers) w?.hideCharacter();
        for (let i = 0; i < writers.length && !cancelled; i++) {
          const w = writers[i];
          if (!w || failedNow.has(i)) continue;
          await new Promise<void>((resolve) => {
            // 數據載入失敗時 animateCharacter 可能永不完成，加上逾時保護
            const guard = window.setTimeout(resolve, 15000);
            const done = () => {
              clearTimeout(guard);
              resolve();
            };
            w.animateCharacter({ onComplete: done }).catch(done);
          });
          await new Promise((r) => setTimeout(r, 250));
        }
        await new Promise((r) => setTimeout(r, 1600));
      }
    };
    void run();

    return () => {
      cancelled = true;
      boxRefs.current.forEach((el) => el && (el.innerHTML = ''));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, size, round]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-wrap items-center justify-center gap-2">
        {chars.map((c, i) => (
          <div
            key={`${c}-${i}`}
            className="relative rounded-xl border-4 border-red-300 bg-white"
            style={{ width: size + 8, height: size + 8 }}
          >
            {/* 田字格 */}
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/2 top-0 h-full border-l-2 border-dashed border-red-200" />
              <div className="absolute left-0 top-1/2 w-full border-t-2 border-dashed border-red-200" />
            </div>
            <div ref={(el) => {
                boxRefs.current[i] = el;
              }} className="hw-box relative" />
            {failed.has(i) && (
              <div className="kai absolute inset-0 flex items-center justify-center text-blue-700" style={{ fontSize: size * 0.8 }}>
                {c}
              </div>
            )}
          </div>
        ))}
      </div>
      <button type="button" className="text-sm font-bold text-sky-700 underline" onClick={() => setRound((r) => r + 1)}>
        ⟳ 再看一次筆順
      </button>
    </div>
  );
}
