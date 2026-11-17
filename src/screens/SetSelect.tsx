import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { SaveData, SetId } from '../types';
import { LEVELS, rateLevel } from '../data/levels';
import { QUESTION_SETS } from '../data/questionBank';
import { clearedCount, starCount } from '../lib/storage';
import LevelBackground from '../components/LevelBackground';
import { Badge } from '../components/Sprites';
import FitStage from '../components/FitStage';
import SystemButtons from '../components/SystemButtons';

interface Props {
  save: SaveData;
  wrongCount: number;
  onPlay: (setId: SetId) => void;
  onMap: (setId: SetId) => void;
  onFinal: (setId: SetId) => void;
  onReset: (setId: SetId) => void;
  onBack: () => void;
  onOpenWrongBook: () => void;
}

const CARD_STYLE: Record<SetId, { bg: string; icon: string }> = {
  1: { bg: 'from-amber-200 via-yellow-100 to-orange-200', icon: '📘' },
  2: { bg: 'from-sky-200 via-cyan-100 to-teal-200', icon: '📗' },
};

const CN_NUM = ['一', '二', '三'];

export default function SetSelect({ save, wrongCount, onPlay, onMap, onFinal, onReset, onBack, onOpenWrongBook }: Props) {
  const [confirmReset, setConfirmReset] = useState<SetId | null>(null);

  return (
    <FitStage background={<LevelBackground theme="menu" />}>
      <div className="relative flex h-full w-full flex-col items-center p-5">
        <header className="relative z-10 flex w-full items-center justify-between gap-2">
          <button type="button" className="btn btn-white h-12 px-4 py-0 text-lg" onClick={onBack}>
            🏠 主選單
          </button>
          <div className="flex items-center gap-2">
            <button type="button" className="btn btn-blue h-12 px-4 py-0 text-lg" onClick={onOpenWrongBook}>
              📖 錯字圖鑑（{wrongCount}）
            </button>
            <SystemButtons compact />
          </div>
        </header>

        <motion.h1
          className="relative z-10 mt-2 text-center text-5xl font-black text-yellow-300 [text-shadow:_3px_3px_0_#3b2a1a,_-2px_-2px_0_#3b2a1a,_2px_-2px_0_#3b2a1a,_-2px_2px_0_#3b2a1a]"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          選擇題庫
        </motion.h1>
        <p className="relative z-10 mt-2 text-center text-xl font-bold">你想挑戰哪一套題目？兩套題目的進度會分開記錄。</p>

        <div className="relative z-10 mt-5 grid w-full max-w-5xl flex-1 grid-cols-2 content-center gap-5">
          {([1, 2] as const).map((id, k) => {
            const p = save.sets[id];
            const cleared = clearedCount(p);
            const stars = starCount(p);
            const done = p.levelIndex >= 3;
            const nextLevel = LEVELS[Math.min(p.levelIndex, 2)];
            const primary = done
              ? '🏆 查看修復字典結算'
              : cleared === 0 && p.updatedAt === 0
                ? '⚔️ 開始挑戰'
                : `▶ 繼續：第${CN_NUM[p.levelIndex]}關・${nextLevel.name}`;
            return (
              <motion.div
                key={id}
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: k * 0.12 }}
                className={`flex flex-col gap-3 rounded-3xl border-4 border-ink bg-gradient-to-br p-5 shadow-pop ${CARD_STYLE[id].bg}`}
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-3xl font-black">
                    {CARD_STYLE[id].icon} {QUESTION_SETS[id].name}
                  </h2>
                  {done && <span className="rounded-full border-4 border-ink bg-lime-300 px-3 font-black">全部通關！</span>}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-2xl border-4 border-ink bg-white px-3 py-1 text-xl font-black">
                    已通關 {cleared}/3 關
                  </span>
                  <span className="rounded-2xl border-4 border-ink bg-white px-3 py-1 text-xl font-black text-amber-500">
                    ⭐ {stars}/9
                  </span>
                </div>

                <ul className="flex flex-col gap-2">
                  {LEVELS.map((l, i) => {
                    const rec = p.records[i];
                    const rating = rec.cleared ? rateLevel(rec.firstRoundScore) : null;
                    return (
                      <li
                        key={l.theme}
                        className="flex items-center gap-3 rounded-2xl border-2 border-ink/30 bg-white/80 px-3 py-1.5"
                      >
                        <Badge theme={l.theme} size={36} locked={!rec.cleared} />
                        <span className="flex-1 font-black">
                          第{CN_NUM[i]}關・{l.name}
                          <span className="ml-1 text-sm font-bold text-ink/60">（{l.grade}）</span>
                        </span>
                        <span className="text-lg text-amber-400">
                          {rating ? (
                            <>
                              {'★'.repeat(rating.stars)}
                              <span className="text-gray-300">{'★'.repeat(3 - rating.stars)}</span>
                            </>
                          ) : (
                            <span className="text-sm font-bold text-ink/50">{i === p.levelIndex ? '挑戰中' : '未通關'}</span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                <button
                  type="button"
                  className="btn btn-yellow w-full text-2xl"
                  onClick={() => (done ? onFinal(id) : onPlay(id))}
                >
                  {primary}
                </button>
                <div className="flex flex-wrap justify-center gap-2">
                  <button type="button" className="btn btn-white px-3 py-1 text-base" onClick={() => onMap(id)}>
                    🗺️ 關卡地圖
                  </button>
                  {p.updatedAt > 0 && (
                    <button type="button" className="btn btn-white px-3 py-1 text-base" onClick={() => setConfirmReset(id)}>
                      🔄 重新開始這一套
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        <AnimatePresence>
          {confirmReset && (
            <motion.div
              className="absolute inset-0 z-40 flex items-center justify-center bg-ink/50 p-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div className="panel w-full max-w-md p-5 text-center" initial={{ scale: 0.7 }} animate={{ scale: 1 }}>
                <h3 className="text-2xl font-black">要重新開始「{QUESTION_SETS[confirmReset].name}」嗎？</h3>
                <p className="mt-2 font-bold">這一套的通關進度和星星會清除。另一套題目的進度和錯字圖鑑會保留。</p>
                <div className="mt-4 flex justify-center gap-3">
                  <button type="button" className="btn btn-white" onClick={() => setConfirmReset(null)}>
                    取消
                  </button>
                  <button
                    type="button"
                    className="btn btn-pink"
                    onClick={() => {
                      onReset(confirmReset);
                      setConfirmReset(null);
                    }}
                  >
                    確定重新開始
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </FitStage>
  );
}
