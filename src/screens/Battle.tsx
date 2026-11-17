import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import type { ChoiceOption, ChoiceQuestion, ComposeQuestion, LevelRecord, Question } from '../types';
import {
  BOSS_MAX_HP,
  DAMAGE_FIRST,
  DAMAGE_RETRY,
  KIND_LABEL,
  LEVELS,
  QUESTION_TIME,
  WARNING_TIME,
} from '../data/levels';
import { QUESTION_SETS } from '../data/questionBank';
import { audio } from '../audio/AudioEngine';
import { addToWrongBook } from '../lib/storage';
import { useCountdown } from '../hooks/useCountdown';
import LevelBackground from '../components/LevelBackground';
import HpBar from '../components/HpBar';
import TimerRing from '../components/TimerRing';
import ChoicePanel from '../components/ChoicePanel';
import ComposePanel from '../components/ComposePanel';
import HintModal from '../components/HintModal';
import { Badge, BossSprite, Shard, XiaoZiLing } from '../components/Sprites';

/**
 * 階段：
 * intro      關主登場對白
 * answering  作答中（首答有 30 秒倒數；補答沒有倒數）
 * animating  播放攻擊 / 受擊動畫中
 * hint       首答錯誤或超時，顯示引導提示框
 * reveal     補答錯誤，高亮正確答案
 * fail       6 題完成但關主仍有 HP → 重試錯題
 * victory    關主 HP 歸零
 */
type Phase = 'intro' | 'answering' | 'animating' | 'hint' | 'reveal' | 'fail' | 'victory';
type Attempt = 'first' | 'retry';
type Fx = { kind: 'attack' | 'hurt'; id: number; damage: number } | null;

interface Props {
  setId: 1 | 2;
  levelIndex: number;
  onVictory: (record: LevelRecord) => void;
  onExit: () => void;
  onWrongBookChange: () => void;
  muted: boolean;
  onToggleMute: () => void;
}

export default function Battle({ setId, levelIndex, onVictory, onExit, onWrongBookChange, muted, onToggleMute }: Props) {
  const meta = LEVELS[levelIndex];
  const allQuestions = QUESTION_SETS[setId].levels[levelIndex].questions;

  const [phase, setPhase] = useState<Phase>('intro');
  const [queue, setQueue] = useState<Question[]>(allQuestions);
  const [pos, setPos] = useState(0);
  const [round, setRound] = useState(0);
  const [attempt, setAttempt] = useState<Attempt>('first');
  const [attemptSeq, setAttemptSeq] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const scoresRef = useRef<Record<string, number>>({});
  const [firstRoundScore, setFirstRoundScore] = useState<number | null>(null);
  const [wrongFirstTries, setWrongFirstTries] = useState(0);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [hintReason, setHintReason] = useState<'wrong' | 'timeout'>('wrong');
  const [fx, setFx] = useState<Fx>(null);
  const [toast, setToast] = useState<{ text: string; good: boolean; id: number } | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);

  const shake = useAnimationControls();
  const timers = useRef<number[]>([]);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const question = queue[pos];
  const totalScore = useMemo(() => Object.values(scores).reduce((a, b) => a + b, 0), [scores]);
  const hp = Math.max(0, BOSS_MAX_HP - totalScore);
  const attemptKey = `${round}-${pos}-${attemptSeq}`;

  /* --------------------------- 背景音樂 --------------------------- */
  useEffect(() => {
    audio.playBgm(meta.theme);
    return () => audio.setUrgent(false);
  }, [meta.theme]);

  /* ----------------------------- 計時 ----------------------------- */
  const timerRunning = phase === 'answering' && attempt === 'first';

  const remaining = useCountdown({
    running: timerRunning,
    resetKey: attemptKey,
    duration: QUESTION_TIME,
    onSecond: (sec) => {
      if (sec > 0 && sec <= WARNING_TIME) audio.tick(sec <= 2);
    },
    onExpire: () => handleFirstWrong('timeout'),
  });

  useEffect(() => {
    audio.setUrgent(timerRunning && remaining <= WARNING_TIME);
  }, [timerRunning, remaining]);

  /* --------------------------- 作答流程 --------------------------- */

  const showToast = (text: string, good: boolean) => setToast({ text, good, id: Date.now() });

  const goNext = useCallback(() => {
    const total = Object.values(scoresRef.current).reduce((a, b) => a + b, 0);
    setPickedId(null);
    setFx(null);
    if (pos + 1 < queue.length) {
      setPos(pos + 1);
      setAttempt('first');
      setAttemptSeq((s) => s + 1);
      setPhase('answering');
      return;
    }
    // 一輪完成
    if (round === 0) setFirstRoundScore(total);
    if (total >= BOSS_MAX_HP) {
      audio.victory();
      setPhase('victory');
    } else {
      setPhase('fail');
    }
  }, [pos, queue.length, round]);

  const dealDamage = (newScore: number, label: string) => {
    const prev = scoresRef.current[question.id] ?? 0;
    const best = Math.max(prev, newScore);
    const dmg = best - prev;
    scoresRef.current = { ...scoresRef.current, [question.id]: best };
    setScores(scoresRef.current);
    setPhase('animating');
    audio.correct();
    later(() => audio.attack(), 150);
    setFx({ kind: 'attack', id: Date.now(), damage: dmg });
    showToast(dmg > 0 ? `${label}！+${dmg} 分` : `${label}！（此題已得過分）`, true);
    later(goNext, 1700);
  };

  function handleFirstWrong(reason: 'wrong' | 'timeout') {
    if (phase !== 'answering' || attempt !== 'first') return;
    setHintReason(reason);
    setWrongFirstTries((n) => n + 1);
    addToWrongBook(question, meta.grade);
    onWrongBookChange();
    if (reason === 'timeout') audio.timeUp();
    else audio.wrong();
    showToast(reason === 'timeout' ? '時間到！' : '答錯了……', false);
    setPhase('animating');
    later(() => setPhase('hint'), 700);
  }

  const handleAnswer = (correct: boolean) => {
    if (phase !== 'answering') return;
    if (attempt === 'first') {
      if (correct) dealDamage(DAMAGE_FIRST, '答對了');
      else handleFirstWrong('wrong');
      return;
    }
    // 補答
    if (correct) {
      dealDamage(DAMAGE_RETRY, '補答正確');
    } else {
      setPhase('animating');
      setFx({ kind: 'hurt', id: Date.now(), damage: 0 });
      audio.hurt();
      void shake.start({ x: [0, -22, 20, -16, 12, -6, 0], transition: { duration: 0.55 } });
      showToast('哎喲！被關主重擊了！', false);
      later(() => setPhase('reveal'), 900);
    }
  };

  const onPickChoice = (opt: ChoiceOption) => {
    if (phase !== 'answering') return;
    setPickedId(opt.id);
    handleAnswer(opt.correct);
  };

  const onSubmitCompose = (comp: string) => {
    if (phase !== 'answering') return;
    handleAnswer(comp === (question as ComposeQuestion).answer);
  };

  const startRetryAnswer = () => {
    audio.click();
    setPickedId(null);
    setAttempt('retry');
    setAttemptSeq((s) => s + 1);
    setPhase('answering');
  };

  const startWrongQuestionRound = () => {
    audio.click();
    const wrongs = allQuestions.filter((q) => (scores[q.id] ?? 0) < DAMAGE_FIRST);
    setQueue(wrongs);
    setPos(0);
    setRound((r) => r + 1);
    setAttempt('first');
    setAttemptSeq((s) => s + 1);
    setPickedId(null);
    setPhase('answering');
  };

  const finishLevel = () => {
    audio.click();
    onVictory({
      cleared: true,
      firstRoundScore: firstRoundScore ?? totalScore,
      finalScore: totalScore,
      wrongFirstTries,
    });
  };

  /* ----------------------------- 畫面 ----------------------------- */

  const panelDisabled = phase !== 'answering';
  const revealCorrect = phase === 'reveal';
  const correctText = question.kind === 'compose' ? (question as ComposeQuestion).word : (question as ChoiceQuestion).answer;
  const danger = timerRunning && remaining <= WARNING_TIME;

  return (
    <motion.div animate={shake} className="relative min-h-full w-full overflow-x-hidden">
      <LevelBackground theme={meta.theme} />

      {/* 最後 5 秒的紅色邊框警示 */}
      {danger && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-30 border-[10px] border-red-500"
          animate={{ opacity: [0.8, 0.1, 0.8] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}

      {/* 受擊紅光 */}
      <AnimatePresence>
        {fx?.kind === 'hurt' && (
          <motion.div
            key={fx.id}
            className="pointer-events-none fixed inset-0 z-30 bg-red-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.55, 0, 0.35, 0] }}
            transition={{ duration: 0.8 }}
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 mx-auto flex min-h-full max-w-5xl flex-col gap-3 p-3 pb-8">
        {/* 頂部資訊列 */}
        <header className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button type="button" className="btn btn-white px-3 py-1 text-base" onClick={() => setConfirmExit(true)}>
              ⬅ 地圖
            </button>
            <div className="rounded-2xl border-4 border-ink bg-white px-3 py-1 font-black">
              第{['一', '二', '三'][levelIndex]}關・{meta.name}
              <span className="ml-2 rounded-full bg-amber-200 px-2 text-sm">{meta.grade}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {round > 0 && <span className="rounded-2xl border-4 border-ink bg-pink-300 px-3 py-1 font-black">重試錯題・第 {round} 輪</span>}
            <span className="rounded-2xl border-4 border-ink bg-white px-3 py-1 font-black">
              第 {pos + 1} / {queue.length} 題
            </span>
            <span className="rounded-2xl border-4 border-ink bg-yellow-300 px-3 py-1 font-black tabular-nums">⭐ {totalScore} 分</span>
            <button type="button" className="btn btn-white px-3 py-1 text-base" onClick={onToggleMute} aria-label="音效開關">
              {muted ? '🔇' : '🔊'}
            </button>
          </div>
        </header>

        {/* 戰鬥場地 */}
        <section className="relative flex h-[230px] items-end justify-between px-2 sm:h-[270px] sm:px-10">
          {/* 小字靈 */}
          <motion.div
            className="relative z-10"
            animate={
              fx?.kind === 'hurt'
                ? { x: [0, -60, -40, 0], rotate: [0, -18, -10, 0] }
                : fx?.kind === 'attack'
                  ? { x: [0, 30, 0], y: [0, -20, 0] }
                  : { y: [0, -8, 0] }
            }
            transition={fx ? { duration: 0.8 } : { duration: 2.4, repeat: Infinity }}
          >
            <XiaoZiLing size={130} mood={fx?.kind === 'hurt' ? 'hurt' : fx?.kind === 'attack' ? 'happy' : 'idle'} />
            <div className="mx-auto -mt-2 w-max rounded-full border-2 border-ink bg-white px-2 text-sm font-black">小字靈</div>
          </motion.div>

          {/* 倒數環 */}
          <div className="absolute left-1/2 top-0 -translate-x-1/2">
            {(phase === 'answering' || phase === 'animating' || phase === 'hint' || phase === 'reveal') && (
              <TimerRing remaining={remaining} relaxed={attempt === 'retry'} />
            )}
          </div>

          {/* 攻擊特效：星星魔法彈 */}
          <AnimatePresence>
            {fx?.kind === 'attack' && (
              <motion.div
                key={fx.id}
                className="pointer-events-none absolute bottom-24 left-[18%] z-20 text-6xl"
                initial={{ x: 0, scale: 0.4, opacity: 1, rotate: 0 }}
                animate={{ x: '230%', scale: [0.4, 1.4, 1], rotate: 720, opacity: [1, 1, 0] }}
                transition={{ duration: 0.5, ease: 'easeIn' }}
              >
                🌟
              </motion.div>
            )}
          </AnimatePresence>

          {/* 關主 */}
          <div className="relative z-10 flex w-[48%] max-w-[300px] flex-col items-center gap-1">
            <HpBar hp={hp} name={meta.boss} title={meta.bossTitle} />
            <motion.div
              className="relative h-[150px] w-[150px] sm:h-[180px] sm:w-[180px]"
              animate={
                phase === 'victory'
                  ? { rotate: 360, scale: 0.2, opacity: 0, y: -40 }
                  : fx?.kind === 'attack'
                    ? { x: [0, 0, 24, -18, 12, 0], filter: ['brightness(1)', 'brightness(1)', 'brightness(3)', 'brightness(1.5)', 'brightness(1)', 'brightness(1)'] }
                    : fx?.kind === 'hurt'
                      ? { x: [0, -140, -120, 0], scale: [1, 1.2, 1.2, 1] }
                      : { y: [0, -6, 0] }
              }
              transition={
                phase === 'victory' ? { duration: 1.4 } : fx ? { duration: 0.9, times: fx.kind === 'attack' ? [0, 0.45, 0.55, 0.7, 0.85, 1] : undefined } : { duration: 3, repeat: Infinity }
              }
            >
              <BossSprite theme={meta.theme} hurt={fx?.kind === 'attack' || phase === 'victory'} />
              {/* 傷害數字 */}
              <AnimatePresence>
                {fx?.kind === 'attack' && (
                  <motion.div
                    key={`d${fx.id}`}
                    className="absolute -top-2 left-1/2 text-4xl font-black text-red-600 [text-shadow:_2px_2px_0_#fff,-2px_-2px_0_#fff,2px_-2px_0_#fff,-2px_2px_0_#fff]"
                    initial={{ opacity: 0, y: 0, x: '-50%', scale: 0.5 }}
                    animate={{ opacity: [0, 1, 1, 0], y: -60, scale: [0.5, 1.5, 1.2, 1] }}
                    transition={{ duration: 1.2, delay: 0.45 }}
                  >
                    -{fx.damage}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* 浮動提示 */}
          <AnimatePresence>
            {toast && (
              <motion.div
                key={toast.id}
                className={`absolute left-1/2 top-24 z-20 -translate-x-1/2 whitespace-nowrap rounded-2xl border-4 border-ink px-4 py-1 text-xl font-black shadow-pop ${
                  toast.good ? 'bg-lime-300' : 'bg-orange-300'
                }`}
                initial={{ opacity: 0, y: 20, scale: 0.6 }}
                animate={{ opacity: [0, 1, 1, 0], y: [20, 0, 0, -20], scale: 1 }}
                transition={{ duration: 1.6 }}
                onAnimationComplete={() => setToast(null)}
              >
                {toast.text}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* 題目區 */}
        {phase !== 'intro' && phase !== 'victory' && phase !== 'fail' && (
          <section className="flex flex-col items-center gap-2">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="rounded-full border-4 border-ink bg-sky-300 px-3 py-0.5 font-black">{KIND_LABEL[question.kind]}</span>
              {attempt === 'retry' && phase !== 'reveal' && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="rounded-full border-4 border-ink bg-yellow-300 px-3 py-0.5 font-black"
                >
                  ✍️ 補答時間：不用急，慢慢想！
                </motion.span>
              )}
            </div>
            {attempt === 'retry' && phase === 'answering' && (
              <p className="kai rounded-2xl border-4 border-pink-300 bg-pink-50 px-4 py-1 text-lg font-bold">🤔 {question.think}</p>
            )}

            {question.kind === 'compose' ? (
              <ComposePanel
                question={question as ComposeQuestion}
                attemptKey={attemptKey}
                disabled={panelDisabled}
                revealCorrect={revealCorrect}
                onSubmit={onSubmitCompose}
              />
            ) : (
              <ChoicePanel
                question={question as ChoiceQuestion}
                attemptKey={attemptKey}
                disabled={panelDisabled}
                revealCorrect={revealCorrect}
                pickedId={pickedId}
                onPick={onPickChoice}
              />
            )}

            {phase === 'reveal' && (
              <motion.div
                className="panel mt-2 flex flex-col items-center gap-2 bg-lime-100 px-6 py-3"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <p className="text-lg font-black">正確答案是：</p>
                <motion.p
                  className="kai text-5xl font-bold text-lime-700"
                  animate={{ scale: [1, 1.12, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  {correctText}
                </motion.p>
                <p className="kai text-base font-bold text-ink/70">關鍵筆畫：{question.keyStroke}</p>
                <button type="button" className="btn btn-green" onClick={() => (audio.click(), goNext())}>
                  記住了！下一題 ➜
                </button>
              </motion.div>
            )}
          </section>
        )}
      </div>

      {/* 關主登場 */}
      <AnimatePresence>
        {phase === 'intro' && (
          <Overlay>
            <div className="mx-auto mb-2 h-36 w-36">
              <BossSprite theme={meta.theme} />
            </div>
            <h2 className="text-center text-3xl font-black">{meta.boss} 出現了！</h2>
            <p className="kai mt-2 text-center text-xl">「{meta.bossLine}」</p>
            <div className="mt-3 rounded-2xl border-4 border-sky-300 bg-sky-50 p-3 text-base font-bold leading-relaxed">
              <p>⚔️ 關主有 {BOSS_MAX_HP} 點生命值，共 6 題。每題有 30 秒！</p>
              <p>✅ 首次答對：攻擊 {DAMAGE_FIRST} 點，得 {DAMAGE_FIRST} 分</p>
              <p>✍️ 答錯可看提示後補答：補答正確攻擊 {DAMAGE_RETRY} 點，得 {DAMAGE_RETRY} 分</p>
            </div>
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                className="btn btn-yellow text-2xl"
                onClick={() => {
                  audio.click();
                  setPhase('answering');
                }}
              >
                ⚔️ 開始戰鬥
              </button>
            </div>
          </Overlay>
        )}
      </AnimatePresence>

      {/* 引導提示框 */}
      <AnimatePresence>{phase === 'hint' && <HintModal question={question} reason={hintReason} onRetry={startRetryAnswer} />}</AnimatePresence>

      {/* 關主未被擊敗 */}
      <AnimatePresence>
        {phase === 'fail' && (
          <Overlay>
            <div className="mx-auto mb-2 h-32 w-32">
              <BossSprite theme={meta.theme} />
            </div>
            <h2 className="text-center text-3xl font-black text-orange-600">關主還剩 {hp} 點生命值！</h2>
            <div className="mx-auto my-3 max-w-sm">
              <HpBar hp={hp} name={meta.boss} title={meta.bossTitle} />
            </div>
            <p className="kai text-center text-xl">
              別灰心！你已經很努力了。把未拿滿分的 {allQuestions.filter((q) => (scores[q.id] ?? 0) < DAMAGE_FIRST).length} 道錯題再挑戰一次，就能打敗{meta.boss}！
            </p>
            <div className="mt-4 flex justify-center">
              <button type="button" className="btn btn-pink text-2xl" onClick={startWrongQuestionRound}>
                🔁 重試錯題
              </button>
            </div>
          </Overlay>
        )}
      </AnimatePresence>

      {/* 勝利 */}
      <AnimatePresence>
        {phase === 'victory' && (
          <Overlay delay={1.2}>
            <motion.h2
              className="text-center text-4xl font-black text-amber-500 [text-shadow:_3px_3px_0_#3b2a1a]"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              🎉 關主被擊敗！
            </motion.h2>
            <p className="kai mt-2 text-center text-xl">{meta.boss}：「{meta.defeatLine}」</p>
            <div className="my-4 flex items-center justify-center gap-8">
              <motion.div
                className="flex flex-col items-center"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 1.6, type: 'spring' }}
              >
                <Shard theme={meta.theme} size={96} />
                <span className="font-black">{meta.shard}</span>
              </motion.div>
              <motion.div
                className="flex flex-col items-center"
                initial={{ scale: 0, y: 40 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ delay: 2, type: 'spring' }}
              >
                <Badge theme={meta.theme} size={90} />
                <span className="mt-1 font-black">{meta.badge}</span>
              </motion.div>
            </div>
            <p className="text-center text-lg font-black">
              本關得分：{totalScore} 分（首輪 {firstRoundScore ?? totalScore} 分）
            </p>
            <div className="mt-4 flex justify-center">
              <button type="button" className="btn btn-green text-2xl" onClick={finishLevel}>
                {levelIndex < 2 ? '收下碎片，繼續冒險 ➜' : '收下碎片，修復字典！✨'}
              </button>
            </div>
          </Overlay>
        )}
      </AnimatePresence>

      {/* 離開確認 */}
      <AnimatePresence>
        {confirmExit && (
          <Overlay>
            <h2 className="text-center text-2xl font-black">要離開戰鬥嗎？</h2>
            <p className="mt-2 text-center font-bold">離開後，這一關需要重新開始（已通過的關卡會保留）。</p>
            <div className="mt-4 flex justify-center gap-3">
              <button type="button" className="btn btn-white" onClick={() => setConfirmExit(false)}>
                繼續戰鬥
              </button>
              <button
                type="button"
                className="btn btn-pink"
                onClick={() => {
                  audio.setUrgent(false);
                  onExit();
                }}
              >
                回到地圖
              </button>
            </div>
          </Overlay>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Overlay({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-center justify-center bg-ink/50 p-3"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ delay }}
    >
      <motion.div
        className="panel max-h-[94vh] w-full max-w-xl overflow-y-auto p-5"
        initial={{ scale: 0.6, y: 60 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18, delay }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
