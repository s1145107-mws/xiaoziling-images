import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { SaveData } from '../types';
import LevelBackground from '../components/LevelBackground';
import { Badge, XiaoZiLing } from '../components/Sprites';
import { LEVELS } from '../data/levels';

interface Props {
  save: SaveData | null;
  wrongCount: number;
  muted: boolean;
  onNewGame: () => void;
  onContinue: () => void;
  onOpenWrongBook: () => void;
  onToggleMute: () => void;
}

export default function MainMenu({ save, wrongCount, muted, onNewGame, onContinue, onOpenWrongBook, onToggleMute }: Props) {
  const [confirmNew, setConfirmNew] = useState(false);
  const canContinue = !!save;

  return (
    <div className="relative flex min-h-full w-full items-center justify-center overflow-hidden p-4">
      <LevelBackground theme="menu" />
      <button type="button" className="btn btn-white absolute right-3 top-3 z-20 px-3 py-1 text-base" onClick={onToggleMute}>
        {muted ? '🔇 靜音' : '🔊 音效'}
      </button>

      <div className="relative z-10 flex w-full max-w-xl flex-col items-center gap-4">
        <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 3, repeat: Infinity }}>
          <XiaoZiLing size={170} />
        </motion.div>
        <motion.h1
          className="text-center text-5xl font-black tracking-wider text-yellow-300 sm:text-6xl [text-shadow:_4px_4px_0_#3b2a1a,_-2px_-2px_0_#3b2a1a,_2px_-2px_0_#3b2a1a,_-2px_2px_0_#3b2a1a]"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          小字靈
        </motion.h1>
        <h2 className="-mt-2 rounded-full border-4 border-ink bg-white px-5 py-1 text-2xl font-black sm:text-3xl">正字保衛戰</h2>
        <p className="text-center font-bold text-ink/70">香港初小（小一至小三）中文錯別字冒險</p>

        <div className="mt-2 flex w-full max-w-xs flex-col gap-3">
          {canContinue && (
            <button type="button" className="btn btn-green w-full" onClick={onContinue}>
              {save!.levelIndex >= 3 ? '🏆 查看修復字典結算' : `▶ 繼續冒險（第${['一', '二', '三'][save!.levelIndex]}關）`}
            </button>
          )}
          <button type="button" className="btn btn-yellow w-full" onClick={() => (save ? setConfirmNew(true) : onNewGame())}>
            ✨ 開始新遊戲
          </button>
          <button type="button" className="btn btn-blue w-full" onClick={onOpenWrongBook}>
            📖 錯字圖鑑 {wrongCount > 0 && <span className="rounded-full bg-red-500 px-2 text-base text-white">{wrongCount}</span>}
          </button>
        </div>

        {save && (
          <div className="mt-2 flex items-center gap-3 rounded-2xl border-4 border-ink bg-white/80 px-4 py-2">
            <span className="font-black">已獲徽章：</span>
            {LEVELS.map((l, i) => (
              <Badge key={l.theme} theme={l.theme} size={44} locked={!save.records[i]?.cleared} />
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {confirmNew && (
          <motion.div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/50 p-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="panel w-full max-w-md p-5 text-center" initial={{ scale: 0.7 }} animate={{ scale: 1 }}>
              <h3 className="text-2xl font-black">要開始新遊戲嗎？</h3>
              <p className="mt-2 font-bold">目前的冒險進度會被覆蓋，並重新隨機抽取一套題目。（錯字圖鑑會保留）</p>
              <div className="mt-4 flex justify-center gap-3">
                <button type="button" className="btn btn-white" onClick={() => setConfirmNew(false)}>
                  取消
                </button>
                <button
                  type="button"
                  className="btn btn-yellow"
                  onClick={() => {
                    setConfirmNew(false);
                    onNewGame();
                  }}
                >
                  開始！
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
