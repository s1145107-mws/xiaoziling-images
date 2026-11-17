import { motion } from 'framer-motion';
import type { SaveData } from '../types';
import { LEVELS, rateLevel } from '../data/levels';
import { QUESTION_SETS } from '../data/questionBank';
import LevelBackground from '../components/LevelBackground';
import { Badge, Shard } from '../components/Sprites';

interface Props {
  save: SaveData;
  wrongCount: number;
  onStart: (levelIndex: number) => void;
  onMenu: () => void;
  onOpenWrongBook: () => void;
  onFinal: () => void;
}

const NODE_BG = ['from-lime-300 to-green-500', 'from-fuchsia-300 to-purple-500', 'from-indigo-400 to-violet-800'];
const NODE_ICON = ['🌲', '🏰', '🪐'];

export default function LevelMap({ save, wrongCount, onStart, onMenu, onOpenWrongBook, onFinal }: Props) {
  const allCleared = save.records.every((r) => r.cleared);

  return (
    <div className="relative flex min-h-full w-full flex-col items-center overflow-hidden p-4">
      <LevelBackground theme="menu" />
      <header className="relative z-10 flex w-full max-w-4xl flex-wrap items-center justify-between gap-2">
        <button type="button" className="btn btn-white px-3 py-1 text-base" onClick={onMenu}>
          🏠 主選單
        </button>
        <span className="rounded-2xl border-4 border-ink bg-white px-3 py-1 font-black">冒險地圖・{QUESTION_SETS[save.setId].name}</span>
        <button type="button" className="btn btn-blue px-3 py-1 text-base" onClick={onOpenWrongBook}>
          📖 錯字圖鑑（{wrongCount}）
        </button>
      </header>

      {/* 碎片收集欄 */}
      <div className="panel relative z-10 mt-4 flex items-center gap-3 px-4 py-2">
        <span className="font-black">正字碎片：</span>
        {LEVELS.map((l, i) => (
          <Shard key={l.theme} theme={l.theme} size={48} dim={!save.records[i].cleared} />
        ))}
      </div>

      <div className="relative z-10 mt-6 grid w-full max-w-4xl grid-cols-1 gap-5 sm:grid-cols-3">
        {LEVELS.map((l, i) => {
          const rec = save.records[i];
          const unlocked = i <= save.levelIndex;
          const rating = rec.cleared ? rateLevel(rec.firstRoundScore) : null;
          return (
            <motion.button
              key={l.theme}
              type="button"
              disabled={!unlocked}
              onClick={() => onStart(i)}
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.12 }}
              whileHover={unlocked ? { y: -8, rotate: i % 2 ? 1.5 : -1.5 } : undefined}
              className={`relative flex flex-col items-center gap-2 rounded-3xl border-4 border-ink bg-gradient-to-b p-4 text-white shadow-pop ${NODE_BG[i]} ${
                unlocked ? '' : 'cursor-not-allowed grayscale'
              }`}
            >
              {i === save.levelIndex && !rec.cleared && (
                <motion.span
                  className="absolute -top-5 rounded-full border-4 border-ink bg-yellow-300 px-3 text-base font-black text-ink"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                >
                  ▼ 挑戰中
                </motion.span>
              )}
              <span className="text-6xl">{unlocked ? NODE_ICON[i] : '🔒'}</span>
              <span className="text-2xl font-black [text-shadow:_2px_2px_0_#3b2a1a]">
                第{['一', '二', '三'][i]}關：{l.name}
              </span>
              <span className="rounded-full border-2 border-ink bg-white px-3 text-sm font-black text-ink">
                {l.grade}字詞・關主：{l.boss}
              </span>
              <p className="kai min-h-[3.5rem] rounded-xl bg-white/85 p-2 text-base text-ink">{l.intro}</p>
              <div className="flex items-center gap-2">
                <Badge theme={l.theme} size={46} locked={!rec.cleared} />
                {rating ? (
                  <span className="rounded-xl bg-white/90 px-2 py-1 text-sm font-black text-ink">
                    {'★'.repeat(rating.stars)}
                    {'☆'.repeat(3 - rating.stars)} {rating.label}
                    <br />
                    首輪 {rec.firstRoundScore} 分
                  </span>
                ) : (
                  <span className="text-sm font-black">{unlocked ? '點擊出發！' : '未解鎖'}</span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {allCleared && (
        <motion.button
          type="button"
          className="btn btn-yellow relative z-10 mt-6 text-2xl"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          onClick={onFinal}
        >
          ✨ 集齊碎片！修復字典
        </motion.button>
      )}
    </div>
  );
}
