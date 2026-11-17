import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import LevelBackground from '../components/LevelBackground';
import { BossSprite, Shard, XiaoZiLing, ZhengziCore } from '../components/Sprites';
import { audio } from '../audio/AudioEngine';

interface Page {
  speaker: string;
  text: string;
  scene: 'planet' | 'core' | 'attack' | 'shards' | 'hero';
}

const PAGES: Page[] = [
  { speaker: '旁白', scene: 'planet', text: '在遙遠的宇宙裡，有一顆「字典星球」。星球上的每一個字都整整齊齊，閃閃發光。' },
  { speaker: '旁白', scene: 'core', text: '星球中心有一顆「正字核心」，它守護著每一個字的筆畫和意思。' },
  { speaker: '大魔王', scene: 'attack', text: '哈哈哈！我要把所有的字都變成錯別字！看我打碎正字核心！' },
  {
    speaker: '旁白',
    scene: 'shards',
    text: '正字核心碎成三塊「正字碎片」，飛到了迷霧森林、鏡像城堡和星塵太空。字典裡的字開始寫錯了！',
  },
  {
    speaker: '小字靈',
    scene: 'hero',
    text: '我是守護字典的小字靈！我要打敗三位關主，找回碎片和徽章，把字典修復好！一起出發吧！',
  },
];

export default function StoryIntro({ onDone }: { onDone: () => void }) {
  const [page, setPage] = useState(0);
  const [typed, setTyped] = useState(0);
  const p = PAGES[page];
  const full = Array.from(p.text);
  const done = typed >= full.length;

  useEffect(() => {
    setTyped(0);
    if (PAGES[page].scene === 'attack') audio.hurt();
  }, [page]);

  useEffect(() => {
    if (done) return;
    const id = window.setTimeout(() => setTyped((t) => t + 1), 45);
    return () => clearTimeout(id);
  }, [typed, done]);

  const next = () => {
    audio.click();
    if (!done) return setTyped(full.length);
    if (page + 1 < PAGES.length) setPage(page + 1);
    else onDone();
  };

  return (
    <div className="relative flex min-h-full w-full flex-col items-center justify-between overflow-hidden p-4" onClick={next}>
      <LevelBackground theme={p.scene === 'attack' || p.scene === 'shards' ? 'space' : 'menu'} />
      <button
        type="button"
        className="btn btn-white absolute right-3 top-3 z-20 px-3 py-1 text-base"
        onClick={(e) => {
          e.stopPropagation();
          onDone();
        }}
      >
        跳過 ⏭
      </button>

      <div className="relative z-10 flex flex-1 items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div key={page} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}>
            <Scene scene={p.scene} />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="panel relative z-10 mb-2 w-full max-w-3xl p-5">
        <span className="absolute -top-5 left-5 rounded-full border-4 border-ink bg-yellow-300 px-4 py-0.5 text-lg font-black">{p.speaker}</span>
        <p className="kai min-h-[5.5rem] text-2xl leading-relaxed">{full.slice(0, typed).join('')}</p>
        <div className="mt-1 flex items-center justify-between">
          <div className="flex gap-1">
            {PAGES.map((_, i) => (
              <span key={i} className={`h-3 w-3 rounded-full border-2 border-ink ${i <= page ? 'bg-sky-400' : 'bg-white'}`} />
            ))}
          </div>
          <motion.span className="font-black" animate={{ x: [0, 6, 0] }} transition={{ duration: 1, repeat: Infinity }}>
            {page + 1 < PAGES.length ? '點擊繼續 ▶' : '開始冒險 ▶'}
          </motion.span>
        </div>
      </div>
    </div>
  );
}

function Scene({ scene }: { scene: Page['scene'] }) {
  if (scene === 'planet') {
    return (
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}>
        <svg width="240" height="240" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="80" fill="#fcd34d" stroke="#3b2a1a" strokeWidth="6" />
          <ellipse cx="100" cy="100" rx="98" ry="22" fill="none" stroke="#f472b6" strokeWidth="8" />
          {['字', '典', '正', '書'].map((c, i) => (
            <text key={c} x={60 + (i % 2) * 70} y={80 + Math.floor(i / 2) * 60} fontSize="34" fontWeight="900" fill="#92400e">
              {c}
            </text>
          ))}
        </svg>
      </motion.div>
    );
  }
  if (scene === 'core') {
    return (
      <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 2, repeat: Infinity }}>
        <ZhengziCore size={240} />
      </motion.div>
    );
  }
  if (scene === 'attack') {
    return (
      <motion.div className="flex items-center gap-4" animate={{ x: [0, -10, 10, -6, 6, 0] }} transition={{ duration: 0.6, repeat: 2 }}>
        <div className="h-52 w-52">
          <BossSprite theme="space" />
        </div>
        <motion.div animate={{ rotate: [0, 20, -20, 0], opacity: [1, 1, 0.4] }} transition={{ duration: 1.5 }}>
          <ZhengziCore size={140} glow={false} />
        </motion.div>
      </motion.div>
    );
  }
  if (scene === 'shards') {
    const dirs = [
      { x: -160, y: -40, t: 'forest' as const },
      { x: 0, y: -120, t: 'castle' as const },
      { x: 160, y: -40, t: 'space' as const },
    ];
    return (
      <div className="relative h-64 w-80">
        {dirs.map((d, i) => (
          <motion.div
            key={d.t}
            className="absolute left-1/2 top-1/2 -ml-10 -mt-10"
            initial={{ x: 0, y: 0, rotate: 0 }}
            animate={{ x: d.x, y: d.y, rotate: 360 }}
            transition={{ duration: 1.4, delay: i * 0.2, ease: 'easeOut' }}
          >
            <Shard theme={d.t} size={80} />
          </motion.div>
        ))}
      </div>
    );
  }
  return (
    <motion.div animate={{ y: [0, -14, 0] }} transition={{ duration: 2, repeat: Infinity }}>
      <XiaoZiLing size={220} mood="happy" />
    </motion.div>
  );
}
