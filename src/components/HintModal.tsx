import { motion } from 'framer-motion';
import type { ChoiceQuestion, Question } from '../types';
import StrokeAnimator from './StrokeAnimator';
import { cleanHint } from '../lib/utils';

interface Props {
  question: Question;
  reason: 'wrong' | 'timeout';
  onRetry: () => void;
}

export default function HintModal({ question, reason, onRetry }: Props) {
  const isStroke = question.kind === 'stroke';
  const word = (question as ChoiceQuestion).answer;
  const animSize = isStroke ? (Array.from(word).length >= 4 ? 84 : Array.from(word).length === 1 ? 150 : 116) : 0;

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center bg-ink/50 p-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="panel max-h-[94vh] w-full max-w-2xl overflow-y-auto p-5"
        initial={{ scale: 0.6, y: 60 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      >
        <div className="mb-3 flex items-center gap-3">
          <span className="text-5xl">{reason === 'timeout' ? '⏰' : '🦉'}</span>
          <div>
            <h2 className="text-2xl font-black text-orange-600">{reason === 'timeout' ? '時間到了！' : '哎呀，差一點點！'}</h2>
            <p className="font-bold text-ink/70">智慧貓頭鷹來幫你：看看提示，再試一次吧！</p>
          </div>
        </div>

        <section className="mb-3 rounded-2xl border-4 border-amber-300 bg-amber-50 p-4">
          <h3 className="mb-1 text-lg font-black text-amber-700">💡 錯後提示</h3>
          <p className="kai text-xl leading-relaxed">{cleanHint(question.hint)}</p>
        </section>

        {isStroke && (
          <section className="mb-3 rounded-2xl border-4 border-sky-300 bg-sky-50 p-4">
            <h3 className="mb-2 text-lg font-black text-sky-700">🖌️ 標準筆順動畫：「{word}」</h3>
            <StrokeAnimator text={word} size={animSize} />
          </section>
        )}

        <section className="mb-4 rounded-2xl border-4 border-pink-300 bg-pink-50 p-4">
          <h3 className="mb-1 text-lg font-black text-pink-600">🤔 思考問題</h3>
          <p className="kai text-xl leading-relaxed">{question.think}</p>
        </section>

        <div className="flex justify-center">
          <button type="button" className="btn btn-yellow text-2xl" onClick={onRetry}>
            ✍️ 補答
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
