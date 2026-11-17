import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import LevelBackground from '../components/LevelBackground';
import FitStage, { useStage } from '../components/FitStage';
import SystemButtons from '../components/SystemButtons';
import StudentChip from '../components/StudentChip';
import { XiaoZiLing } from '../components/Sprites';
import { STUDENT_ID_MAX_LENGTH, normalizeStudentId } from '../lib/storage';

interface Props {
  /** 已輸入的班別學號；null 表示尚未輸入 */
  student: string | null;
  wrongCount: number;
  /** 輸入班別學號並開始冒險 */
  onLogin: (student: string) => void;
  /** 已登入時直接開始冒險 */
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

function MenuContent({ student, wrongCount, onLogin, onStart, onOpenWrongBook }: Props) {
  const { orientation } = useStage();
  const portrait = orientation === 'portrait';
  const [input, setInput] = useState('');
  const [focused, setFocused] = useState(false);
  const normalized = normalizeStudentId(input);
  const canLogin = normalized.length > 0;
  // iPad 橫放時鍵盤會遮住畫面下半部：輸入期間收起吉祥物，讓輸入框上移
  const compact = focused && !portrait;

  const submit = () => {
    if (!canLogin) return;
    (document.activeElement as HTMLElement | null)?.blur();
    onLogin(normalized);
  };

  return (
    <div
      className={`relative flex h-full w-full flex-col items-center gap-5 p-6 ${compact ? 'justify-start pt-16' : 'justify-center'}`}
    >
      <SystemButtons className="absolute right-5 top-5" />

      <AnimatePresence initial={false}>
        {!compact && (
          <motion.div
            key="mascot"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 3, repeat: Infinity }}>
              <XiaoZiLing size={portrait ? 230 : student ? 190 : 160} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.h1
        className="text-center text-8xl font-black tracking-wider text-yellow-300 [text-shadow:_5px_5px_0_#3b2a1a,_-3px_-3px_0_#3b2a1a,_3px_-3px_0_#3b2a1a,_-3px_3px_0_#3b2a1a]"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        小字靈
      </motion.h1>
      <h2 className="-mt-2 rounded-full border-4 border-ink bg-white px-8 py-2 text-4xl font-black">正字保衛戰</h2>
      {!compact && <p className="text-center text-xl font-bold text-ink/70">香港初小（小一至小三）中文錯別字冒險</p>}

      {student ? (
        /* 已輸入班別學號 */
        <div className="mt-2 flex w-full max-w-md flex-col items-center gap-4">
          <StudentChip className="text-xl" />
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
            📖 我的錯字圖鑑{' '}
            {wrongCount > 0 && <span className="rounded-full bg-red-500 px-2 text-lg text-white">{wrongCount}</span>}
          </button>
        </div>
      ) : (
        /* 第一步：輸入班別學號 */
        <form
          className="mt-2 flex w-full max-w-md flex-col items-center gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <label htmlFor="student-id" className="text-2xl font-black">
            ✏️ 先輸入你的班別學號
          </label>
          <input
            id="student-id"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false);
              // iPad 收起鍵盤後，把被推高的畫面拉回原位
              window.scrollTo(0, 0);
            }}
            placeholder="請輸入班別學號，例如：3F01"
            maxLength={STUDENT_ID_MAX_LENGTH + 4}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
            spellCheck={false}
            enterKeyHint="go"
            className="h-20 w-full rounded-2xl border-4 border-ink bg-white px-5 text-center text-4xl font-black uppercase tracking-widest text-sky-800 shadow-pop outline-none placeholder:text-xl placeholder:font-bold placeholder:normal-case placeholder:tracking-normal placeholder:text-ink/40 focus:ring-8 focus:ring-yellow-300"
          />
          <p className={`h-7 text-xl font-bold ${canLogin ? 'text-sky-700' : 'text-red-500'}`}>
            {canLogin ? `同學：${normalized}` : '請先輸入班別學號'}
          </p>
          <motion.button
            type="submit"
            className="btn btn-yellow h-20 w-full text-3xl"
            disabled={!canLogin}
            animate={canLogin ? { scale: [1, 1.05, 1] } : { scale: 1 }}
            transition={canLogin ? { duration: 1.6, repeat: Infinity } : undefined}
          >
            ⚔️ 開始冒險
          </motion.button>
        </form>
      )}
    </div>
  );
}
