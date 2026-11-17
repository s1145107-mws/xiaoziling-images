import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { SetProgress } from '../types';
import { QUESTION_SETS } from '../data/questionBank';
import { LEVELS, rateLevel } from '../data/levels';
import LevelBackground from '../components/LevelBackground';
import { Badge, Shard, XiaoZiLing, ZhengziCore } from '../components/Sprites';
import { audio } from '../audio/AudioEngine';

interface Props {
  save: SetProgress;
  onOpenWrongBook: () => void;
  onChooseSet: () => void;
  onMenu: () => void;
}

const START = [
  { x: -260, y: -160 },
  { x: 260, y: -160 },
  { x: 0, y: 220 },
];

export default function FinalScreen({ save, onOpenWrongBook, onChooseSet, onMenu }: Props) {
  // 0 碎片飛入 → 1 核心重組發光 → 2 顯示成績
  const [stage, setStage] = useState(0);
  const total = save.records.reduce((a, r) => a + r.finalScore, 0);
  const firstTotal = save.records.reduce((a, r) => a + r.firstRoundScore, 0);

  useEffect(() => {
    audio.playBgm('victory');
    const t1 = window.setTimeout(() => {
      setStage(1);
      audio.sparkle();
    }, 1800);
    const t2 = window.setTimeout(() => setStage(2), 3800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="relative flex min-h-full w-full flex-col items-center overflow-hidden p-4">
      <LevelBackground theme="space" />

      {/* 正字核心重組 */}
      <div className="relative z-10 mt-6 flex h-[300px] w-full items-center justify-center">
        {stage >= 1 && (
          <motion.div
            className="absolute h-[420px] w-[420px]"
            style={{
              background:
                'repeating-conic-gradient(from 0deg, rgba(253,224,71,0.55) 0deg 10deg, transparent 10deg 30deg)',
              borderRadius: '50%',
              maskImage: 'radial-gradient(circle, black 30%, transparent 70%)',
              WebkitMaskImage: 'radial-gradient(circle, black 30%, transparent 70%)',
            }}
            initial={{ opacity: 0, scale: 0.3 }}
            animate={{ opacity: 1, scale: 1, rotate: 360 }}
            transition={{ opacity: { duration: 0.6 }, scale: { duration: 0.8 }, rotate: { duration: 20, repeat: Infinity, ease: 'linear' } }}
          />
        )}
        {stage === 0 &&
          LEVELS.map((l, i) => (
            <motion.div
              key={l.theme}
              className="absolute"
              initial={{ x: START[i].x, y: START[i].y, rotate: 0, scale: 1 }}
              animate={{ x: 0, y: 0, rotate: 720, scale: 0.6 }}
              transition={{ duration: 1.6, delay: i * 0.1, ease: 'easeInOut' }}
            >
              <Shard theme={l.theme} size={100} />
            </motion.div>
          ))}
        {stage >= 1 && (
          <motion.div
            className="relative"
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: [0, 1.3, 1], rotate: 0 }}
            transition={{ duration: 1 }}
          >
            <motion.div animate={{ filter: ['drop-shadow(0 0 10px #fde047)', 'drop-shadow(0 0 40px #fde047)', 'drop-shadow(0 0 10px #fde047)'] }} transition={{ duration: 1.6, repeat: Infinity }}>
              <ZhengziCore size={230} />
            </motion.div>
          </motion.div>
        )}
        {stage >= 1 && (
          <motion.div className="absolute bottom-0 left-[8%]" initial={{ x: -120, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.6 }}>
            <XiaoZiLing size={110} mood="happy" />
          </motion.div>
        )}
      </div>

      {stage >= 1 && (
        <motion.h1
          className="relative z-10 text-center text-4xl font-black text-yellow-300 sm:text-5xl [text-shadow:_3px_3px_0_#3b2a1a]"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          正字核心修復成功！字典星球得救了！
        </motion.h1>
      )}

      {stage >= 2 && (
        <motion.div className="panel relative z-10 mt-5 w-full max-w-3xl p-5" initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <div className="mb-4 text-center">
            <p className="text-lg font-black text-ink/70">{QUESTION_SETS[save.setId].name}・總得分</p>
            <p className="text-6xl font-black text-amber-500 [text-shadow:_2px_2px_0_#3b2a1a]">{total}</p>
            <p className="font-bold text-ink/70">（三關首輪合共 {firstTotal} / 1800 分）</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {LEVELS.map((l, i) => {
              const rec = save.records[i];
              const r = rateLevel(rec.firstRoundScore);
              return (
                <div key={l.theme} className="flex flex-col items-center gap-1 rounded-2xl border-4 border-ink bg-white p-3">
                  <Badge theme={l.theme} size={60} />
                  <span className="font-black">
                    {l.name}（{l.grade}）
                  </span>
                  <span className="text-2xl text-amber-400">
                    {'★'.repeat(r.stars)}
                    <span className="text-gray-300">{'★'.repeat(3 - r.stars)}</span>
                  </span>
                  <span className="rounded-full bg-amber-100 px-2 font-black">{r.label}</span>
                  <span className="text-sm font-bold">
                    首輪 {rec.firstRoundScore} 分・最終 {rec.finalScore} 分
                  </span>
                  <span className="text-sm font-bold text-ink/60">首答答錯 {rec.wrongFirstTries} 次</span>
                </div>
              );
            })}
          </div>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button type="button" className="btn btn-blue" onClick={onOpenWrongBook}>
              📖 錯字圖鑑
            </button>
            <button type="button" className="btn btn-yellow" onClick={onChooseSet}>
              📚 選擇題庫
            </button>
            <button type="button" className="btn btn-white" onClick={onMenu}>
              🏠 主選單
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
