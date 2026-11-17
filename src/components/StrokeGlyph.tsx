import { useEffect, useState } from 'react';
import type { StrokeOp, StrokeSelector, StrokeVariant } from '../types';
import { loadCharData, type HanziCharData } from '../lib/hanziData';

/* ------------------------------------------------------------------ */
/*  高清 SVG 筆畫對比渲染器                                             */
/*  以 hanzi-writer 筆畫輪廓數據逐筆繪製，再按變體刪筆 / 加筆 / 變形，    */
/*  精準呈現「多一筆、少一筆、未貫穿」等細節。                            */
/* ------------------------------------------------------------------ */

interface RenderStroke {
  key: string;
  d: string;
  transform?: string;
}

type Status = 'loading' | 'ready' | 'error';

export function useCharData(char: string) {
  const [state, setState] = useState<{ status: Status; data?: HanziCharData }>({ status: 'loading' });
  useEffect(() => {
    let alive = true;
    setState({ status: 'loading' });
    loadCharData(char).then(
      (data) => alive && setState({ status: 'ready', data }),
      () => alive && setState({ status: 'error' }),
    );
    return () => {
      alive = false;
    };
  }, [char]);
  return state;
}

function centroid(median: number[][]): [number, number] {
  let x = 0;
  let y = 0;
  for (const [px, py] of median) {
    x += px;
    y += py;
  }
  return [x / median.length, y / median.length];
}

function bbox(median: number[][]) {
  const xs = median.map((p) => p[0]);
  const ys = median.map((p) => p[1]);
  return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
}

export function resolveStroke(data: HanziCharData, sel: StrokeSelector): number {
  const n = data.strokes.length;
  if (typeof sel === 'number') {
    const i = sel < 0 ? n + sel : sel;
    return Math.max(0, Math.min(n - 1, i));
  }
  let best = 0;
  let bestLen = -1;
  data.medians.forEach((m, i) => {
    const b = bbox(m);
    const w = b.maxX - b.minX;
    const h = b.maxY - b.minY;
    const len = sel === 'longestVertical' ? (h > w * 2 ? h : -1) : w > h * 2 ? w : -1;
    if (len > bestLen) {
      bestLen = len;
      best = i;
    }
  });
  return best;
}

const scaleAbout = (cx: number, cy: number, sx: number, sy: number) =>
  `translate(${cx} ${cy}) scale(${sx} ${sy}) translate(${-cx} ${-cy})`;

export function applyVariant(data: HanziCharData, ops: StrokeOp[] = []): RenderStroke[] {
  const strokes: (RenderStroke | null)[] = data.strokes.map((d, i) => ({ key: `s${i}`, d }));
  const extra: RenderStroke[] = [];

  ops.forEach((op, k) => {
    if (op.op === 'remove') {
      op.strokes.forEach((s) => {
        strokes[resolveStroke(data, s)] = null;
      });
    } else if (op.op === 'copy') {
      const i = resolveStroke(data, op.stroke);
      const [cx, cy] = centroid(data.medians[i]);
      extra.push({
        key: `c${k}`,
        d: data.strokes[i],
        transform: `translate(${op.dx ?? 0} ${op.dy ?? 0}) ${scaleAbout(cx, cy, op.sx ?? 1, op.sy ?? 1)}`,
      });
    } else if (op.op === 'copyMid') {
      const a = resolveStroke(data, op.from);
      const b = resolveStroke(data, op.to);
      const [ax, ay] = centroid(data.medians[a]);
      const [bx, by] = centroid(data.medians[b]);
      extra.push({
        key: `m${k}`,
        d: data.strokes[a],
        transform: `translate(${(bx - ax) / 2} ${(by - ay) / 2})`,
      });
    } else if (op.op === 'scale') {
      const i = resolveStroke(data, op.stroke);
      const s = strokes[i];
      if (!s) return;
      const b = bbox(data.medians[i]);
      const cx = (b.minX + b.maxX) / 2;
      const anchorY = op.anchor === 'top' ? b.maxY : op.anchor === 'bottom' ? b.minY : (b.minY + b.maxY) / 2;
      strokes[i] = { ...s, transform: scaleAbout(cx, anchorY, op.sx ?? 1, op.sy ?? 1) };
    }
  });

  return [...strokes.filter((s): s is RenderStroke => !!s), ...extra];
}

/* ----------------------------- 單字 ----------------------------- */

interface GlyphProps {
  char: string;
  ops?: StrokeOp[];
  size: number;
  color?: string;
  grid?: boolean;
  /** 顯示筆畫序號（檢視器用） */
  showIndex?: boolean;
}

export function StrokeGlyph({ char, ops, size, color = '#2b1d10', grid = true, showIndex = false }: GlyphProps) {
  const { status, data } = useCharData(char);

  return (
    <svg width={size} height={size} viewBox="0 0 1024 1024" role="img" aria-label={char}>
      {grid && <TianGrid />}
      {status === 'ready' && data ? (
        <g transform="translate(0, 900) scale(1, -1)">
          {applyVariant(data, ops).map((s) => (
            <path key={s.key} d={s.d} transform={s.transform} fill={color} />
          ))}
          {showIndex &&
            data.medians.map((m, i) => (
              <text
                key={`n${i}`}
                x={m[0][0]}
                y={-m[0][1]}
                transform="scale(1,-1)"
                fontSize={64}
                fontWeight={700}
                fill="#e11d48"
                stroke="#fff"
                strokeWidth={10}
                paintOrder="stroke"
              >
                {i}
              </text>
            ))}
        </g>
      ) : (
        // 數據未載入（離線且未複製數據）時，退回楷體字形
        <text
          x="512"
          y="540"
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="820"
          fill={status === 'loading' ? '#d6c7a8' : color}
          className="kai"
        >
          {char}
        </text>
      )}
    </svg>
  );
}

/** 田字格（紅色虛線格，像小學生的寫字簿） */
export function TianGrid() {
  return (
    <g stroke="#f87171" strokeWidth="8" fill="none" opacity="0.55">
      <rect x="8" y="8" width="1008" height="1008" rx="40" strokeWidth="14" />
      <line x1="512" y1="16" x2="512" y2="1008" strokeDasharray="36 28" />
      <line x1="16" y1="512" x2="1008" y2="512" strokeDasharray="36 28" />
    </g>
  );
}

/* ----------------------------- 詞語 ----------------------------- */

interface WordProps {
  text: string;
  variant?: StrokeVariant;
  charSize: number;
  color?: string;
}

/** 把整個詞語逐字渲染，只在 variant.charIndex 那個字套用誤寫變化 */
export function StrokeWord({ text, variant, charSize, color }: WordProps) {
  const chars = Array.from(text);
  return (
    <div className="flex items-center justify-center gap-1">
      {chars.map((c, i) => (
        <StrokeGlyph
          key={`${c}-${i}`}
          char={c}
          size={charSize}
          color={color}
          ops={variant && variant.charIndex === i ? variant.ops : undefined}
        />
      ))}
    </div>
  );
}
