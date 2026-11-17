import { motion } from 'framer-motion';
import { BOSS_MAX_HP } from '../data/levels';

export default function HpBar({ hp, name, title }: { hp: number; name: string; title: string }) {
  const ratio = Math.max(0, hp) / BOSS_MAX_HP;
  const color = ratio > 0.5 ? 'from-lime-400 to-green-500' : ratio > 0.2 ? 'from-yellow-300 to-orange-400' : 'from-orange-400 to-red-500';
  return (
    <div className="w-full max-w-sm">
      <div className="mb-1 flex items-end justify-between px-1">
        <span className="rounded-full border-2 border-ink bg-white px-2 text-xs font-black">{title}</span>
        <span className="text-base font-black drop-shadow">{name}</span>
        <span className="text-sm font-black tabular-nums">
          {Math.max(0, hp)} / {BOSS_MAX_HP}
        </span>
      </div>
      <div className="relative h-6 overflow-hidden rounded-full border-4 border-ink bg-gray-200">
        {/* 延遲的白色殘影，讓扣血更有打擊感 */}
        <motion.div
          className="absolute inset-y-0 left-0 bg-white"
          animate={{ width: `${ratio * 100}%` }}
          transition={{ duration: 0.9, delay: 0.35, ease: 'easeOut' }}
        />
        <motion.div
          className={`absolute inset-y-0 left-0 bg-gradient-to-r ${color}`}
          animate={{ width: `${ratio * 100}%` }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
        <div className="absolute inset-x-0 top-0 h-1/3 bg-white/40" />
      </div>
    </div>
  );
}
