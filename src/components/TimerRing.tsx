import { motion } from 'framer-motion';
import { QUESTION_TIME, WARNING_TIME } from '../data/levels';

interface Props {
  remaining: number; // 秒（可帶小數）
  total?: number;
  /** 補答階段：不倒數，顯示「慢慢想」 */
  relaxed?: boolean;
  size?: number;
}

export default function TimerRing({ remaining, total = QUESTION_TIME, relaxed = false, size = 84 }: Props) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const ratio = relaxed ? 1 : Math.max(0, remaining / total);
  const danger = !relaxed && remaining <= WARNING_TIME;
  const color = relaxed ? '#38bdf8' : danger ? '#ef4444' : remaining <= 15 ? '#f59e0b' : '#22c55e';

  return (
    <motion.div
      className="relative"
      style={{ width: size, height: size }}
      animate={danger ? { scale: [1, 1.15, 1] } : { scale: 1 }}
      transition={danger ? { duration: 0.5, repeat: Infinity } : undefined}
    >
      {danger && (
        <motion.div
          className="absolute inset-0 rounded-full bg-red-500"
          animate={{ opacity: [0.5, 0, 0.5], scale: [1, 1.5, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
      <svg width={size} height={size} viewBox="0 0 80 80" className="relative -rotate-90">
        <circle cx="40" cy="40" r={r} fill="#fff" stroke="#3b2a1a" strokeWidth="9" />
        <circle cx="40" cy="40" r={r} fill="none" stroke="#e5e7eb" strokeWidth="5" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - ratio)}
          style={{ transition: 'stroke-dashoffset 0.12s linear, stroke 0.3s' }}
        />
      </svg>
      <div
        className={`absolute inset-0 flex items-center justify-center font-black ${danger ? 'text-red-600' : 'text-ink'}`}
        style={{ fontSize: relaxed ? size * 0.2 : size * 0.36 }}
      >
        {relaxed ? '慢慢想' : Math.ceil(remaining)}
      </div>
    </motion.div>
  );
}
