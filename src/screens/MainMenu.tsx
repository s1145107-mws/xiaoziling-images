import { motion } from 'framer-motion';
import LevelBackground from '../components/LevelBackground';
import { XiaoZiLing } from '../components/Sprites';

interface Props {
  wrongCount: number;
  muted: boolean;
  onStart: () => void;
  onOpenWrongBook: () => void;
  onToggleMute: () => void;
}

export default function MainMenu({ wrongCount, muted, onStart, onOpenWrongBook, onToggleMute }: Props) {
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
          <motion.button
            type="button"
            className="btn btn-yellow w-full text-2xl"
            onClick={onStart}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1.6, repeat: Infinity }}
          >
            ⚔️ 開始冒險
          </motion.button>
          <button type="button" className="btn btn-blue w-full" onClick={onOpenWrongBook}>
            📖 錯字圖鑑 {wrongCount > 0 && <span className="rounded-full bg-red-500 px-2 text-base text-white">{wrongCount}</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
