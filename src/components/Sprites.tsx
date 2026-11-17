import type { LevelMeta } from '../types';

/* 全部角色均為內嵌 SVG，卡通繪本風，無需圖片檔案 */

type Mood = 'idle' | 'happy' | 'hurt';

export function XiaoZiLing({ size = 140, mood = 'idle' }: { size?: number; mood?: Mood }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" aria-label="小字靈">
      <defs>
        <radialGradient id="zl-body" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#e0f7ff" />
          <stop offset="60%" stopColor="#7dd3fc" />
          <stop offset="100%" stopColor="#38bdf8" />
        </radialGradient>
        <radialGradient id="zl-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="110" r="90" fill="url(#zl-glow)" />
      {/* 毛筆尖造型的頭髮 */}
      <path d="M100 18 C 118 40, 122 52, 112 66 L 88 66 C 78 52, 82 40, 100 18 Z" fill="#1e293b" stroke="#3b2a1a" strokeWidth="4" />
      {/* 身體 */}
      <path
        d="M100 58 C 150 58, 168 100, 160 138 C 152 172, 128 182, 100 182 C 72 182, 48 172, 40 138 C 32 100, 50 58, 100 58 Z"
        fill="url(#zl-body)"
        stroke="#3b2a1a"
        strokeWidth="5"
      />
      {/* 披風 */}
      <path d="M52 150 Q 30 176 46 190 Q 70 180 74 170 Z" fill="#f43f5e" stroke="#3b2a1a" strokeWidth="4" />
      <path d="M148 150 Q 170 176 154 190 Q 130 180 126 170 Z" fill="#f43f5e" stroke="#3b2a1a" strokeWidth="4" />
      {/* 眼睛 */}
      {mood === 'hurt' ? (
        <g stroke="#3b2a1a" strokeWidth="6" strokeLinecap="round">
          <path d="M66 106 l16 10 M66 116 l16 -10" />
          <path d="M118 106 l16 10 M118 116 l16 -10" />
        </g>
      ) : mood === 'happy' ? (
        <g stroke="#3b2a1a" strokeWidth="6" strokeLinecap="round" fill="none">
          <path d="M64 114 q 10 -14 20 0" />
          <path d="M116 114 q 10 -14 20 0" />
        </g>
      ) : (
        <g>
          <ellipse cx="76" cy="110" rx="11" ry="14" fill="#3b2a1a" />
          <ellipse cx="124" cy="110" rx="11" ry="14" fill="#3b2a1a" />
          <circle cx="80" cy="104" r="4" fill="#fff" />
          <circle cx="128" cy="104" r="4" fill="#fff" />
        </g>
      )}
      {/* 腮紅 */}
      <ellipse cx="60" cy="132" rx="10" ry="6" fill="#fda4af" opacity="0.8" />
      <ellipse cx="140" cy="132" rx="10" ry="6" fill="#fda4af" opacity="0.8" />
      {/* 嘴巴 */}
      {mood === 'hurt' ? (
        <ellipse cx="100" cy="140" rx="9" ry="7" fill="#3b2a1a" />
      ) : (
        <path d="M88 134 q 12 14 24 0" stroke="#3b2a1a" strokeWidth="5" fill="#fb7185" strokeLinecap="round" />
      )}
      {/* 胸前的「正」字徽 */}
      <circle cx="100" cy="164" r="13" fill="#fde047" stroke="#3b2a1a" strokeWidth="3" />
      <text x="100" y="170" textAnchor="middle" fontSize="16" fontWeight="900" fill="#3b2a1a">
        正
      </text>
    </svg>
  );
}

function ForestBoss({ hurt }: { hurt: boolean }) {
  return (
    <svg viewBox="0 0 220 220" width="100%" height="100%">
      <ellipse cx="110" cy="205" rx="80" ry="12" fill="#000" opacity="0.15" />
      {/* 樹冠 */}
      <g stroke="#3b2a1a" strokeWidth="5">
        <circle cx="70" cy="60" r="42" fill="#4ade80" />
        <circle cx="150" cy="60" r="42" fill="#22c55e" />
        <circle cx="110" cy="38" r="44" fill="#86efac" />
      </g>
      {/* 樹幹身體 */}
      <path d="M58 82 Q 50 150 64 200 L 156 200 Q 170 150 162 82 Z" fill="#a16207" stroke="#3b2a1a" strokeWidth="5" />
      <path d="M80 170 q 10 -10 0 -24 M140 160 q -10 -14 4 -26" stroke="#713f12" strokeWidth="4" fill="none" />
      {/* 手臂樹枝 */}
      <path d="M60 120 Q 24 110 14 84 M22 96 l -14 -4" stroke="#713f12" strokeWidth="10" strokeLinecap="round" fill="none" />
      <path d="M160 120 Q 196 110 206 84 M198 96 l 14 -4" stroke="#713f12" strokeWidth="10" strokeLinecap="round" fill="none" />
      <Face hurt={hurt} cy={128} color="#fef3c7" />
      {/* 霧氣 */}
      <g fill="#fff" opacity="0.75">
        <ellipse cx="40" cy="190" rx="34" ry="12" />
        <ellipse cx="180" cy="186" rx="30" ry="10" />
      </g>
    </svg>
  );
}

function CastleBoss({ hurt }: { hurt: boolean }) {
  return (
    <svg viewBox="0 0 220 220" width="100%" height="100%">
      <ellipse cx="110" cy="208" rx="70" ry="10" fill="#000" opacity="0.15" />
      {/* 皇冠 */}
      <path d="M70 34 L 82 6 L 98 28 L 110 2 L 122 28 L 138 6 L 150 34 Z" fill="#facc15" stroke="#3b2a1a" strokeWidth="5" />
      {/* 鏡框身體 */}
      <ellipse cx="110" cy="112" rx="72" ry="84" fill="#a855f7" stroke="#3b2a1a" strokeWidth="6" />
      <ellipse cx="110" cy="112" rx="56" ry="68" fill="#e9d5ff" stroke="#3b2a1a" strokeWidth="4" />
      <path d="M78 70 q 14 -12 30 -8" stroke="#fff" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.9" />
      {/* 反轉的「字」 */}
      <text x="110" y="180" textAnchor="middle" fontSize="28" fontWeight="900" fill="#7e22ce" transform="translate(220 0) scale(-1 1)">
        字
      </text>
      <Face hurt={hurt} cy={116} color="#e9d5ff" />
      {/* 小手 */}
      <circle cx="30" cy="130" r="14" fill="#a855f7" stroke="#3b2a1a" strokeWidth="5" />
      <circle cx="190" cy="130" r="14" fill="#a855f7" stroke="#3b2a1a" strokeWidth="5" />
    </svg>
  );
}

function SpaceBoss({ hurt }: { hurt: boolean }) {
  return (
    <svg viewBox="0 0 220 220" width="100%" height="100%">
      <defs>
        <linearGradient id="sb-cape" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#4c1d95" />
          <stop offset="100%" stopColor="#1e1b4b" />
        </linearGradient>
      </defs>
      {/* 斗篷 */}
      <path d="M30 80 Q 10 170 20 210 L 200 210 Q 210 170 190 80 Z" fill="url(#sb-cape)" stroke="#3b2a1a" strokeWidth="5" />
      <g fill="#fde047">
        <circle cx="50" cy="180" r="4" />
        <circle cx="170" cy="160" r="3" />
        <circle cx="150" cy="196" r="4" />
        <circle cx="70" cy="140" r="3" />
      </g>
      {/* 頭 */}
      <path d="M62 50 L 44 6 L 86 34 Z" fill="#f97316" stroke="#3b2a1a" strokeWidth="5" />
      <path d="M158 50 L 176 6 L 134 34 Z" fill="#f97316" stroke="#3b2a1a" strokeWidth="5" />
      <circle cx="110" cy="96" r="66" fill="#7c3aed" stroke="#3b2a1a" strokeWidth="6" />
      <Face hurt={hurt} cy={96} color="#fde68a" evil />
      {/* 胸前碎裂的核心 */}
      <path d="M96 170 l 14 -18 l 14 18 l -14 18 Z" fill="#38bdf8" stroke="#3b2a1a" strokeWidth="4" />
      <path d="M104 166 l 8 6 l -4 8" stroke="#3b2a1a" strokeWidth="2" fill="none" />
    </svg>
  );
}

function Face({ hurt, cy, color, evil = false }: { hurt: boolean; cy: number; color: string; evil?: boolean }) {
  return hurt ? (
    <g stroke="#3b2a1a" strokeWidth="6" strokeLinecap="round" fill="none">
      <path d={`M78 ${cy - 16} l 16 14 M78 ${cy - 2} l 16 -14`} />
      <path d={`M126 ${cy - 16} l 16 14 M126 ${cy - 2} l 16 -14`} />
      <path d={`M92 ${cy + 26} q 18 -14 36 0`} />
    </g>
  ) : (
    <g>
      <path d={`M72 ${cy - 22} l 26 10`} stroke="#3b2a1a" strokeWidth="6" strokeLinecap="round" />
      <path d={`M148 ${cy - 22} l -26 10`} stroke="#3b2a1a" strokeWidth="6" strokeLinecap="round" />
      <circle cx="88" cy={cy} r="12" fill={color} stroke="#3b2a1a" strokeWidth="4" />
      <circle cx="132" cy={cy} r="12" fill={color} stroke="#3b2a1a" strokeWidth="4" />
      <circle cx="90" cy={cy + 2} r="5" fill={evil ? '#dc2626' : '#3b2a1a'} />
      <circle cx="130" cy={cy + 2} r="5" fill={evil ? '#dc2626' : '#3b2a1a'} />
      <path d={`M90 ${cy + 24} q 20 14 40 0`} stroke="#3b2a1a" strokeWidth="5" fill="#fff" />
      <path d={`M98 ${cy + 26} l 4 8 l 4 -6 M114 ${cy + 26} l 4 8 l 4 -6`} stroke="#3b2a1a" strokeWidth="2" fill="#fff" />
    </g>
  );
}

export function BossSprite({ theme, hurt = false }: { theme: LevelMeta['theme']; hurt?: boolean }) {
  if (theme === 'forest') return <ForestBoss hurt={hurt} />;
  if (theme === 'castle') return <CastleBoss hurt={hurt} />;
  return <SpaceBoss hurt={hurt} />;
}

const SHARD_COLORS: Record<LevelMeta['theme'], [string, string]> = {
  forest: ['#bbf7d0', '#16a34a'],
  castle: ['#e9d5ff', '#9333ea'],
  space: ['#bae6fd', '#0284c7'],
};

/** 正字碎片：三塊可以拼回正字核心（三角形排列） */
export function Shard({ theme, size = 80, dim = false }: { theme: LevelMeta['theme']; size?: number; dim?: boolean }) {
  const [light, dark] = SHARD_COLORS[theme];
  const path =
    theme === 'forest'
      ? 'M50 6 L 90 40 L 60 94 L 18 70 Z'
      : theme === 'castle'
        ? 'M20 10 L 86 22 L 76 86 L 12 64 Z'
        : 'M46 4 L 94 52 L 48 96 L 6 48 Z';
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" opacity={dim ? 0.25 : 1}>
      <defs>
        <linearGradient id={`sh-${theme}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="40%" stopColor={light} />
          <stop offset="100%" stopColor={dark} />
        </linearGradient>
      </defs>
      <path d={path} fill={dim ? '#9ca3af' : `url(#sh-${theme})`} stroke="#3b2a1a" strokeWidth="4" strokeLinejoin="round" />
      <path d="M40 30 L 52 22" stroke="#fff" strokeWidth="5" strokeLinecap="round" opacity="0.8" />
    </svg>
  );
}

const BADGE_ICON: Record<LevelMeta['theme'], string> = { forest: '🌳', castle: '🏰', space: '🚀' };

export function Badge({ theme, size = 72, locked = false }: { theme: LevelMeta['theme']; size?: number; locked?: boolean }) {
  const [light, dark] = SHARD_COLORS[theme];
  return (
    <div
      className="relative flex items-center justify-center rounded-full border-4 border-ink shadow-pop-sm"
      style={{
        width: size,
        height: size,
        background: locked ? '#d1d5db' : `radial-gradient(circle at 35% 30%, #fff, ${light} 45%, ${dark})`,
        fontSize: size * 0.45,
        filter: locked ? 'grayscale(1)' : undefined,
      }}
    >
      {locked ? '🔒' : BADGE_ICON[theme]}
    </div>
  );
}

/** 正字核心（總結算用） */
export function ZhengziCore({ size = 220, glow = true }: { size?: number; glow?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200">
      <defs>
        <radialGradient id="core-g" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="45%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#f59e0b" />
        </radialGradient>
        <filter id="core-blur">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>
      {glow && <circle cx="100" cy="100" r="86" fill="#fde047" filter="url(#core-blur)" opacity="0.8" />}
      <path d="M100 14 L 176 100 L 100 186 L 24 100 Z" fill="url(#core-g)" stroke="#3b2a1a" strokeWidth="6" strokeLinejoin="round" />
      <text x="100" y="124" textAnchor="middle" fontSize="70" fontWeight="900" fill="#b45309" className="kai">
        正
      </text>
    </svg>
  );
}
