import { QUESTION_SETS } from '../data/questionBank';
import type { ChoiceQuestion } from '../types';
import { StrokeGlyph, StrokeWord } from './StrokeGlyph';

/**
 * 筆畫編號檢視器（網址加 ?inspect 開啟）
 * 顯示每道「筆畫誤寫」題正字的筆畫序號，以及三個選項的 SVG 渲染結果，
 * 方便老師核對 / 調整 src/data/questionBank.ts 中的 variant 設定。
 */
export default function StrokeInspector() {
  const questions = ([1, 2] as const).flatMap((sid) =>
    QUESTION_SETS[sid].levels.flatMap((l) => l.questions.filter((q): q is ChoiceQuestion => q.kind === 'stroke')),
  );

  return (
    <div className="min-h-full bg-cream p-6 font-round">
      <h1 className="mb-1 text-3xl font-black">筆畫編號檢視器</h1>
      <p className="mb-6 font-bold text-ink/70">
        紅色數字為 hanzi-writer 筆畫序號（0 起計）。誘錯選項的變化定義在 src/data/questionBank.ts；如需改用手寫圖片，
        把圖片放到 public/images/strokes/題號_a|b|c.png 即可自動優先顯示。
      </p>
      <div className="flex flex-col gap-6">
        {questions.map((q) => (
          <section key={q.id} className="panel p-4">
            <h2 className="mb-2 text-xl font-black">
              {q.id}：{q.answer}
            </h2>
            <div className="mb-3 flex flex-wrap gap-2">
              {Array.from(q.answer).map((c, i) => (
                <div key={i} className="rounded-xl border-2 border-ink bg-white p-1">
                  <StrokeGlyph char={c} size={220} showIndex color="#94a3b8" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {q.options.map((o) => (
                <div key={o.id} className="rounded-xl border-2 border-ink bg-white p-2">
                  <p className="mb-1 font-black">
                    {o.id.toUpperCase()}｜{o.correct ? '✔ 正確' : '✘ 誘錯'}：{o.note}
                  </p>
                  <StrokeWord text={o.text} variant={o.variant} charSize={Array.from(o.text).length > 2 ? 80 : 120} />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
