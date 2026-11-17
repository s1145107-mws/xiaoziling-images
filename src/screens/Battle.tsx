import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion';
import type { ChoiceOption, ChoiceQuestion, ComposeQuestion, Grade, LevelRecord, Question } from '../types';
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
import { useCountdown } from '../hooks/useCountdown';
import LevelBackground from '../components/LevelBackground';
import HpBar from '../components/HpBar';
import TimerRing from '../components/TimerRing';
import ChoicePanel from '../components/ChoicePanel';
import ComposePanel from '../components/ComposePanel';
import HintModal from '../components/HintModal';
import { Badge, BossSprite, Shard, XiaoZiLing } from '../components/Sprites';
import FitStage, { useStage } from '../components/FitStage';
import SystemButtons from '../components/SystemButtons';
import StudentChip from '../components/StudentChip';
import { battleLayout } from '../lib/battleLayout';

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
/** 作答節奏（毫秒）：盡量短，但保留足夠時間看到攻擊 / 受擊動畫 */
const TIMING = {
  afterCorrect: 1100, // 答對 / 補答正確 → 下一題（原 1700）
  beforeHint: 450, // 首答錯誤 / 超時 → 提示框（原 700）
  beforeReveal: 650, // 補答錯誤被重擊 → 顯示正確答案（原 900）
  quickIntro: 2500, // 連續闖關時，下一關開場自動開始
};

type Phase = 'intro' | 'answering' | 'animating' | 'hint' | 'reveal' | 'fail' | 'victory';
type Attempt = 'first' | 'retry';
type Fx = { kind: 'attack' | 'hurt'; id: number; damage: number } | null;

interface Props {
  setId: 1 | 2;
  levelIndex: number;
  /** goNext = true：直接進入下一關；false：返回地圖 */
  onVictory: (record: LevelRecord, goNext: boolean) => void;
  /** 由上一關「進入下一關」而來：開場改為簡短自動播放 */
  quickIntro?: boolean;
  onExit: () => void;
  /** 首答答錯或超時：由 App 錄入當前同學的錯字圖鑑 */
  onFirstWrong: (question: Question, grade: Grade) => void;
}

/** 戰鬥畫面：整個介面放在 FitStage 內，任何螢幕都一屏完整顯示、不需捲動 */
export default function Battle(props: Props) {
  return (
    <FitStage background={<LevelBackground theme={LEVELS[props.levelIndex].theme} />}>
      <BattleInner {...props} />
    </FitStage>
  );
}

function BattleInner({ setId, levelIndex, onVictory, quickIntro = false, onExit, onFirstWrong }: Props) {
  const meta = LEVELS[levelIndex];
  const stage = useStage();
  const L = battleLayout(stage);
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

  // 連續闖關：開場過場自動播放，時間到自動開始（點擊任意處可提早開始）
  useEffect(() => {
    if (phase !== 'intro' || !quickIntro) return;
    const id = window.setTimeout(() => setPhase('answering'), TIMING.quickIntro);
    return () => clearTimeout(id);
  }, [phase, quickIntro]);

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
    later(goNext, TIMING.afterCorrect);
  };

  function handleFirstWrong(reason: 'wrong' | 'timeout') {
    if (phase !== 'answering' || attempt !== 'first') return;
    setHintReason(reason);
    setWrongFirstTries((n) => n + 1);
    onFirstWrong(question, meta.grade);
    if (reason === 'timeout') audio.timeUp();
    else audio.wrong();
    showToast(reason === 'timeout' ? '時間到！' : '答錯了……', false);
    setPhase('animating');
    later(() => setPhase('hint'), TIMING.beforeHint);
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
      later(() => setPhase('reveal'), TIMING.beforeReveal);
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

  const finishLevel = (goNext: boolean) => {
    audio.click();
    onVictory(
      {
        cleared: true,
        firstRoundScore: firstRoundScore ?? totalScore,
        finalScore: totalScore,
        wrongFirstTries,
      },
      goNext,
    );
  };
  const nextMeta = LEVELS[levelIndex + 1];

  /* ----------------------------- 畫面 ----------------------------- */

  const panelDisabled = phase !== 'answering';
  const revealCorrect = phase === 'reveal';
  const correctText = question.kind === 'compose' ? (question as ComposeQuestion).word : (question as ChoiceQuestion).answer;
  const danger = timerRunning && remaining <= WARNING_TIME;

  const chips = (
    <>
      <span className="shrink-0 rounded-full border-4 border-ink bg-sky-300 px-3 py-0.5 text-lg font-black">{KIND_LABEL[question.kind]}</span>
      {attempt === 'retry' && phase !== 'reveal' && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="shrink-0 rounded-full border-4 border-ink bg-yellow-300 px-3 py-0.5 text-lg font-black"
        >
          ✍️ 補答・慢慢想
        </motion.span>
      )}
    </>
  );
  const think = attempt === 'retry' && phase === 'answering' ? question.think : null;
  const showQuestion = phase !== 'intro' && phase !== 'victory' && phase !== 'fail';

  return (
    <motion.div
      animate={shake}
      className="relative flex h-full w-full flex-col"
      style={{ padding: L.padding, gap: L.gap }}
    >
      {/* 最後 5 秒的紅色邊框警示 */}
      {danger && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-30 border-[12px] border-red-500"
          animate={{ opacity: [0.8, 0.1, 0.8] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}

      {/* 受擊紅光 */}
      <AnimatePresence>
        {fx?.kind === 'hurt' && (
          <motion.div
            key={fx.id}
            className="pointer-events-none absolute inset-0 z-30 bg-red-600"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.55, 0, 0.35, 0] }}
            transition={{ duration: 0.8 }}
          />
        )}
      </AnimatePresence>

      {/* 頂部資訊列 */}
      <header className="relative z-10 flex shrink-0 items-center justify-between gap-2" style={{ height: L.headerH }}>
        <div className="flex min-w-0 items-center gap-2">
          <button type="button" className="btn btn-white h-12 shrink-0 px-4 py-0 text-lg" onClick={() => setConfirmExit(true)}>
            ⬅ 地圖
          </button>
          <div className="min-w-0 truncate rounded-2xl border-4 border-ink bg-white px-4 py-1.5 text-xl font-black">
            第{['一', '二', '三'][levelIndex]}關{!L.portrait && `・${meta.name}`}
            {!L.portrait && <span className="ml-2 rounded-full bg-amber-200 px-2 text-base">{meta.grade}</span>}
          </div>
          <StudentChip allowSwitch={false} short={L.portrait} />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`rounded-2xl border-4 border-ink px-4 py-1.5 text-xl font-black ${round > 0 ? 'bg-pink-300' : 'bg-white'}`}
          >
            {round > 0
              ? L.portrait
                ? `🔁 ${pos + 1}/${queue.length}`
                : `🔁 重試第 ${round} 輪・${pos + 1}/${queue.length}`
              : L.portrait
                ? `${pos + 1} / ${queue.length} 題`
                : `第 ${pos + 1} / ${queue.length} 題`}
          </span>
          <span className="rounded-2xl border-4 border-ink bg-yellow-300 px-4 py-1.5 text-xl font-black tabular-nums">⭐ {totalScore}</span>
          <SystemButtons compact />
        </div>
      </header>

      {/* 戰鬥場地 */}
      <section className="relative shrink-0" style={{ height: L.arenaH }}>
        {/* 小字靈 */}
        <motion.div
          className="absolute bottom-0 left-8 z-10"
          animate={
            fx?.kind === 'hurt'
              ? { x: [0, -60, -40, 0], rotate: [0, -18, -10, 0] }
              : fx?.kind === 'attack'
                ? { x: [0, 30, 0], y: [0, -20, 0] }
                : { y: [0, -8, 0] }
          }
          transition={fx ? { duration: 0.7 } : { duration: 2.4, repeat: Infinity }}
        >
          <XiaoZiLing size={L.heroSize} mood={fx?.kind === 'hurt' ? 'hurt' : fx?.kind === 'attack' ? 'happy' : 'idle'} />
          <div className="mx-auto -mt-3 w-max rounded-full border-2 border-ink bg-white px-3 text-base font-black">小字靈</div>
        </motion.div>

        {/* 30 秒倒數環 */}
        <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2">
          {(phase === 'answering' || phase === 'animating' || phase === 'hint' || phase === 'reveal') && (
            <TimerRing remaining={remaining} relaxed={attempt === 'retry'} size={L.timerSize} />
          )}
        </div>

        {/* 攻擊特效：星星魔法彈（由小字靈飛向關主） */}
        <AnimatePresence>
          {fx?.kind === 'attack' && (
            <motion.div
              key={fx.id}
              className="pointer-events-none absolute z-20 text-7xl"
              style={{ left: 40 + L.heroSize, bottom: L.arenaH * 0.35 }}
              initial={{ x: 0, scale: 0.4, opacity: 1, rotate: 0 }}
              animate={{ x: L.questionW - L.heroSize - 360, scale: [0.4, 1.4, 1], rotate: 720, opacity: [1, 1, 0] }}
              transition={{ duration: 0.45, ease: 'easeIn' }}
            >
              🌟
            </motion.div>
          )}
        </AnimatePresence>

        {/* 關主 */}
        <div className="absolute bottom-0 right-8 z-10 flex w-[380px] flex-col items-center gap-1">
          <HpBar hp={hp} name={meta.boss} title={meta.bossTitle} />
          <motion.div
            className="relative"
            style={{ width: L.bossSize, height: L.bossSize }}
            animate={
              phase === 'victory'
                ? { rotate: 360, scale: 0.2, opacity: 0, y: -40 }
                : fx?.kind === 'attack'
                  ? { x: [0, 0, 24, -18, 12, 0], filter: ['brightness(1)', 'brightness(1)', 'brightness(3)', 'brightness(1.5)', 'brightness(1)', 'brightness(1)'] }
                  : fx?.kind === 'hurt'
                    ? { x: [0, -160, -140, 0], scale: [1, 1.2, 1.2, 1] }
                    : { y: [0, -6, 0] }
            }
            transition={
              phase === 'victory'
                ? { duration: 0.9 }
                : fx
                  ? { duration: 0.75, times: fx.kind === 'attack' ? [0, 0.45, 0.55, 0.7, 0.85, 1] : undefined }
                  : { duration: 3, repeat: Infinity }
            }
          >
            <BossSprite theme={meta.theme} hurt={fx?.kind === 'attack' || phase === 'victory'} />
            {/* 傷害數字 */}
            <AnimatePresence>
              {fx?.kind === 'attack' && (
                <motion.div
                  key={`d${fx.id}`}
                  className="absolute -top-2 left-1/2 text-5xl font-black text-red-600 [text-shadow:_2px_2px_0_#fff,-2px_-2px_0_#fff,2px_-2px_0_#fff,-2px_2px_0_#fff]"
                  initial={{ opacity: 0, y: 0, x: '-50%', scale: 0.5 }}
                  animate={{ opacity: [0, 1, 1, 0], y: -60, scale: [0.5, 1.5, 1.2, 1] }}
                  transition={{ duration: 0.8, delay: 0.35 }}
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
              className={`absolute left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-2xl border-4 border-ink px-5 py-1.5 text-2xl font-black shadow-pop ${
                toast.good ? 'bg-lime-300' : 'bg-orange-300'
              }`}
              style={{ top: L.timerSize + 8 }}
              initial={{ opacity: 0, y: 20, scale: 0.6 }}
              animate={{ opacity: [0, 1, 1, 0], y: [20, 0, 0, -20], scale: 1 }}
              transition={{ duration: 1.1 }}
              onAnimationComplete={() => setToast(null)}
            >
              {toast.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 補答錯誤：正確答案浮在戰鬥場地上，作答區保持不變 */}
        <AnimatePresence>
          {phase === 'reveal' && (
            <motion.div
              className="panel absolute left-1/2 top-0 z-30 flex -translate-x-1/2 flex-col items-center gap-2 bg-lime-100 px-8 py-3"
              style={{ maxHeight: L.arenaH }}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
            >
              <div className="flex items-center gap-3">
                <p className="text-2xl font-black">正確答案是：</p>
                <motion.p
                  className="kai text-6xl font-bold leading-none text-lime-700"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  {correctText}
                </motion.p>
              </div>
              <p className="kai whitespace-nowrap text-xl font-bold text-ink/70">關鍵筆畫：{question.keyStroke}</p>
              <button type="button" className="btn btn-green h-14 py-0 text-2xl" onClick={() => (audio.click(), goNext())}>
                記住了！下一題 ➜
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* 作答區：高度固定為剩餘空間，題幹與選項 / 組字槽一屏顯示 */}
      <section className="relative min-h-0 flex-1">
        {showQuestion &&
          (question.kind === 'compose' ? (
            <ComposePanel
              question={question as ComposeQuestion}
              attemptKey={attemptKey}
              disabled={panelDisabled}
              revealCorrect={revealCorrect}
              onSubmit={onSubmitCompose}
              chips={chips}
              think={think}
            />
          ) : (
            <ChoicePanel
              question={question as ChoiceQuestion}
              attemptKey={attemptKey}
              disabled={panelDisabled}
              revealCorrect={revealCorrect}
              pickedId={pickedId}
              onPick={onPickChoice}
              chips={chips}
              think={think}
            />
          ))}
      </section>

      {/* 關主登場 */}
      <AnimatePresence>
        {phase === 'intro' && quickIntro && (
          <Overlay
            onClick={() => {
              audio.click();
              setPhase('answering');
            }}
          >
            <p className="text-center text-lg font-black text-sky-600">
              第{['一', '二', '三'][levelIndex]}關・{meta.grade}字詞
            </p>
            <h2 className="text-center text-4xl font-black">{meta.name}</h2>
            <p className="kai mt-2 text-center text-lg">{meta.intro}</p>
            <div className="mx-auto my-2 h-28 w-28">
              <BossSprite theme={meta.theme} />
            </div>
            <p className="kai text-center text-xl">
              {meta.boss}：「{meta.bossLine}」
            </p>
            <div className="mx-auto mt-4 h-3 w-full max-w-xs overflow-hidden rounded-full border-2 border-ink bg-white">
              <motion.div
                className="h-full bg-yellow-300"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: TIMING.quickIntro / 1000, ease: 'linear' }}
              />
            </div>
            <p className="mt-2 text-center font-black text-ink/60">點擊任意處立即開始 ▶</p>
          </Overlay>
        )}
        {phase === 'intro' && !quickIntro && (
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
          <Overlay delay={0.8}>
            {nextMeta && (
              <button
                type="button"
                className="absolute right-3 top-3 rounded-xl border-2 border-ink/40 bg-white px-2 py-0.5 text-sm font-bold text-ink/70 hover:bg-amber-50"
                onClick={() => finishLevel(false)}
              >
                🗺️ 返回地圖
              </button>
            )}
            <motion.h2
              className="mt-5 text-center text-4xl font-black text-amber-500 [text-shadow:_3px_3px_0_#3b2a1a]"
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
                transition={{ delay: 1.1, type: 'spring' }}
              >
                <Shard theme={meta.theme} size={96} />
                <span className="font-black">{meta.shard}</span>
              </motion.div>
              <motion.div
                className="flex flex-col items-center"
                initial={{ scale: 0, y: 40 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ delay: 1.35, type: 'spring' }}
              >
                <Badge theme={meta.theme} size={90} />
                <span className="mt-1 font-black">{meta.badge}</span>
              </motion.div>
            </div>
            <p className="text-center text-lg font-black">
              本關得分：{totalScore} 分（首輪 {firstRoundScore ?? totalScore} 分）
            </p>
            <div className="mt-4 flex justify-center">
              <motion.button
                type="button"
                className="btn btn-green text-2xl"
                onClick={() => finishLevel(true)}
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                {nextMeta ? `進入下一關：${nextMeta.name} ➜` : '收下碎片，修復字典！✨'}
              </motion.button>
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

function Overlay({ children, delay = 0, onClick }: { children: ReactNode; delay?: number; onClick?: () => void }) {
  return (
    <motion.div
      onClick={onClick}
      className={`absolute inset-0 z-40 flex items-center justify-center bg-ink/50 p-6 ${onClick ? 'cursor-pointer' : ''}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ delay }}
    >
      <motion.div
        className="panel relative max-h-full w-full max-w-2xl overflow-y-auto p-6"
        initial={{ scale: 0.6, y: 60 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18, delay }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
