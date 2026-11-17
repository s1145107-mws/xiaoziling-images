import { motion } from 'framer-motion';
import type { LevelMeta } from '../types';

const STARS = Array.from({ length: 40 }, (_, i) => ({
  x: (i * 37) % 100,
  y: (i * 53) % 100,
  s: 2 + (i % 3) * 2,
  d: (i % 5) * 0.4,
}));

export default function LevelBackground({ theme }: { theme: LevelMeta['theme'] | 'menu' }) {
  if (theme === 'forest') {
    return (
      <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-emerald-200 via-lime-100 to-green-300">
        <svg className="absolute bottom-0 h-2/3 w-full" viewBox="0 0 1000 400" preserveAspectRatio="none">
          <path d="M0 260 Q 150 180 300 250 T 600 240 T 1000 230 L 1000 400 L 0 400 Z" fill="#86efac" />
          <path d="M0 320 Q 200 260 420 320 T 1000 300 L 1000 400 L 0 400 Z" fill="#4ade80" />
        </svg>
        {[8, 22, 78, 92].map((x, i) => (
          <svg key={x} className="absolute bottom-[18%]" style={{ left: `${x - 6}%` }} width="120" height={180 + (i % 2) * 40} viewBox="0 0 120 200">
            <rect x="50" y="120" width="20" height="80" fill="#a16207" stroke="#3b2a1a" strokeWidth="4" />
            <path d="M60 10 L 110 130 L 10 130 Z" fill={i % 2 ? '#16a34a' : '#22c55e'} stroke="#3b2a1a" strokeWidth="4" strokeLinejoin="round" />
          </svg>
        ))}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute h-16 w-[50%] rounded-full bg-white/60 blur-xl"
            style={{ top: `${20 + i * 22}%` }}
            animate={{ x: ['-60%', '160%'] }}
            transition={{ duration: 18 + i * 6, repeat: Infinity, ease: 'linear', delay: i * 3 }}
          />
        ))}
      </div>
    );
  }
  if (theme === 'castle') {
    return (
      <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-fuchsia-200 via-purple-100 to-indigo-200">
        <svg className="absolute bottom-0 h-3/4 w-full opacity-80" viewBox="0 0 1000 500" preserveAspectRatio="xMidYMax meet">
          <g stroke="#3b2a1a" strokeWidth="5" strokeLinejoin="round">
            <rect x="320" y="180" width="360" height="320" fill="#c4b5fd" />
            <rect x="240" y="120" width="110" height="380" fill="#a78bfa" />
            <rect x="650" y="120" width="110" height="380" fill="#a78bfa" />
            <path d="M230 120 L 295 30 L 360 120 Z" fill="#f472b6" />
            <path d="M640 120 L 705 30 L 770 120 Z" fill="#f472b6" />
            <path d="M440 400 Q 500 320 560 400 L 560 500 L 440 500 Z" fill="#7c3aed" />
            <ellipse cx="295" cy="220" rx="26" ry="36" fill="#e0f2fe" />
            <ellipse cx="705" cy="220" rx="26" ry="36" fill="#e0f2fe" />
          </g>
        </svg>
        {[15, 85].map((x) => (
          <motion.div
            key={x}
            className="absolute top-[12%] h-28 w-20 rounded-[50%] border-4 border-ink bg-gradient-to-br from-white to-sky-200"
            style={{ left: `${x - 4}%` }}
            animate={{ rotate: [-4, 4, -4] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
        ))}
      </div>
    );
  }
  if (theme === 'space') {
    return (
      <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-indigo-950 via-violet-900 to-fuchsia-900">
        {STARS.map((s, i) => (
          <div
            key={i}
            className="absolute animate-twinkle rounded-full bg-yellow-100"
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, animationDelay: `${s.d}s` }}
          />
        ))}
        <div className="absolute right-[8%] top-[10%] h-28 w-28 rounded-full border-4 border-ink bg-gradient-to-br from-orange-300 to-pink-500" />
        <div className="absolute right-[4%] top-[17%] h-6 w-44 -rotate-12 rounded-full border-4 border-ink bg-yellow-200/80" />
        <div className="absolute bottom-[8%] left-[6%] h-16 w-16 rounded-full border-4 border-ink bg-gradient-to-br from-sky-300 to-blue-600" />
      </div>
    );
  }
  // 主選單 / 劇情：字典星球的天空
  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-sky-300 via-sky-100 to-amber-100">
      {STARS.slice(0, 16).map((s, i) => (
        <div
          key={i}
          className="absolute animate-twinkle text-yellow-400"
          style={{ left: `${s.x}%`, top: `${s.y * 0.5}%`, fontSize: s.s * 4, animationDelay: `${s.d}s` }}
        >
          ✦
        </div>
      ))}
      <motion.div
        className="absolute left-[6%] top-[14%] h-14 w-36 rounded-full bg-white/90"
        animate={{ x: [0, 30, 0] }}
        transition={{ duration: 10, repeat: Infinity }}
      />
      <motion.div
        className="absolute right-[8%] top-[26%] h-12 w-28 rounded-full bg-white/90"
        animate={{ x: [0, -24, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
    </div>
  );
}
