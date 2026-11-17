import { motion } from 'framer-motion';
import LevelBackground from '../components/LevelBackground';
import FitStage, { useStage } from '../components/FitStage';
import SystemButtons from '../components/SystemButtons';
import { XiaoZiLing } from '../components/Sprites';

interface Props {
  wrongCount: number;
  onStart: () => void;
  onOpenWrongBook: () => void;
}

export default function MainMenu(props: Props) {
  return (
    <FitStage background={<LevelBackground theme="menu" />}>
      <MenuContent {...props} />
    </FitStage>
  );
}

function MenuContent({ wrongCount, onStart, onOpenWrongBook }: Props) {
  const { orientation } = useStage();
  const portrait = orientation === 'portrait';

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center gap-5 p-6">
      <SystemButtons className="absolute right-5 top-5" />

      <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 3, repeat: Infinity }}>
        <XiaoZiLing size={portrait ? 240 : 200} />
      </motion.div>
      <motion.h1
        className="text-center text-8xl font-black tracking-wider text-yellow-300 [text-shadow:_5px_5px_0_#3b2a1a,_-3px_-3px_0_#3b2a1a,_3px_-3px_0_#3b2a1a,_-3px_3px_0_#3b2a1a]"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        小字靈
      </motion.h1>
      <h2 className="-mt-2 rounded-full border-4 border-ink bg-white px-8 py-2 text-4xl font-black">正字保衛戰</h2>
      <p className="text-center text-xl font-bold text-ink/70">香港初小（小一至小三）中文錯別字冒險</p>

      <div className="mt-2 flex w-full max-w-sm flex-col gap-4">
        <motion.button
          type="button"
          className="btn btn-yellow h-20 w-full text-3xl"
          onClick={onStart}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.6, repeat: Infinity }}
        >
          ⚔️ 開始冒險
        </motion.button>
        <button type="button" className="btn btn-blue h-16 w-full text-2xl" onClick={onOpenWrongBook}>
          📖 錯字圖鑑 {wrongCount > 0 && <span className="rounded-full bg-red-500 px-2 text-lg text-white">{wrongCount}</span>}
        </button>
      </div>
    </div>
  );
}
