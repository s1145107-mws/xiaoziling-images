import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Grade, LevelRecord, Question, SaveData, SetId, WrongBookEntry } from './types';
import {
  addToWrongBook,
  emptyProgress,
  loadCurrentStudent,
  loadSave,
  loadSettings,
  loadWrongBook,
  writeCurrentStudent,
  writeSave,
  writeSettings,
} from './lib/storage';
import { afterVictory } from './lib/flow';
import { audio } from './audio/AudioEngine';
import MainMenu from './screens/MainMenu';
import SetSelect from './screens/SetSelect';
import StoryIntro from './screens/StoryIntro';
import LevelMap from './screens/LevelMap';
import Battle from './screens/Battle';
import FinalScreen from './screens/FinalScreen';
import WrongBook from './components/WrongBook';
import { ControlsContext } from './components/SystemButtons';

type Screen = 'menu' | 'select' | 'story' | 'map' | 'battle' | 'final';

export default function App() {
  /** 當前同學的班別學號；未輸入時只會顯示標題畫面 */
  const [student, setStudent] = useState<string | null>(() => loadCurrentStudent());
  const [save, setSave] = useState<SaveData | null>(() => (student ? loadSave(student) : null));
  const [wrongBook, setWrongBook] = useState<WrongBookEntry[]>(() => (student ? loadWrongBook(student) : []));
  const [screen, setScreen] = useState<Screen>('menu');
  const [setId, setSetId] = useState<SetId>(1);
  const [showWrongBook, setShowWrongBook] = useState(false);
  /** 目前挑戰的關卡（0-2） */
  const [currentLevel, setCurrentLevel] = useState(0);
  /** 每次開始一場戰鬥 +1：令重玩同一關時亦會徹底重置 */
  const [battleRun, setBattleRun] = useState(0);
  const [quickIntro, setQuickIntro] = useState(false);
  /** 第一次遊玩：看完開場劇情後要進入的關卡 */
  const [afterStory, setAfterStory] = useState<number | null>(null);
  const [muted, setMuted] = useState(() => loadSettings().muted);

  useEffect(() => {
    audio.setMuted(muted);
    writeSettings({ muted });
  }, [muted]);

  // 主選單 / 選擇題庫 / 地圖 / 劇情的背景音樂
  useEffect(() => {
    if (screen === 'menu' || screen === 'select' || screen === 'map' || screen === 'story') audio.playBgm('menu');
  }, [screen]);

  const go = (s: Screen) => {
    audio.unlock();
    audio.click();
    setScreen(s);
  };

  /* ----------------------------- 班別學號 ----------------------------- */

  const login = (id: string) => {
    audio.unlock();
    audio.click();
    writeCurrentStudent(id);
    setStudent(id);
    setSave(loadSave(id));
    setWrongBook(loadWrongBook(id));
    setSetId(1);
    setScreen('select');
  };

  const switchStudent = () => {
    audio.click();
    writeCurrentStudent(null);
    setStudent(null);
    setSave(null);
    setWrongBook([]);
    setShowWrongBook(false);
    setScreen('menu');
  };

  const controls = useMemo(
    () => ({
      muted,
      toggleMute: () => (audio.unlock(), audio.click(), setMuted((m) => !m)),
      student,
      switchStudent,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [muted, student],
  );

  const updateSave = (s: SaveData) => {
    if (!student) return;
    setSave(s);
    writeSave(student, s);
  };

  /* ------------------------------ 開始戰鬥 ------------------------------ */

  /** 進入某一關的戰鬥：畫面固定為 battle，戰鬥組件以 key 重新掛載 */
  const startLevel = (level: number, quick: boolean) => {
    audio.unlock();
    setCurrentLevel(level);
    setQuickIntro(quick);
    setBattleRun((r) => r + 1);
    setScreen('battle');
  };

  const playSet = (id: SetId) => {
    if (!save) return;
    audio.unlock();
    audio.click();
    setSetId(id);
    const level = Math.min(save.sets[id].levelIndex, 2);
    if (!save.storySeen) {
      setAfterStory(level);
      setScreen('story');
    } else {
      startLevel(level, false);
    }
  };

  const resetSet = (id: SetId) => {
    if (!save) return;
    audio.click();
    updateSave({ ...save, sets: { ...save.sets, [id]: emptyProgress(id) } });
  };

  /* ------------------------------ 過關 ------------------------------ */

  const handleVictory = (rec: LevelRecord, goNext: boolean) => {
    if (!save) return;
    const progress = save.sets[setId];
    const level = currentLevel;
    const records = progress.records.slice();
    const prev = records[level];
    // 重玩已通關的關卡時保留較好的成績，星級不會下降
    records[level] = prev.cleared && prev.firstRoundScore > rec.firstRoundScore ? prev : rec;
    const levelIndex = Math.max(progress.levelIndex, level + 1);
    updateSave({
      ...save,
      sets: { ...save.sets, [setId]: { ...progress, records, levelIndex, updatedAt: Date.now() } },
    });

    const next = afterVictory(level, goNext, records);
    // 「進入下一關」：關卡直接設為 currentLevel + 1，畫面保持在戰鬥場景，不經過地圖
    if (next.screen === 'battle') startLevel(next.level, true);
    else setScreen(next.screen);
  };

  const handleFirstWrong = (q: Question, grade: Grade) => {
    if (student) setWrongBook(addToWrongBook(student, q, grade));
  };

  const openWrongBook = () => {
    if (!student) return;
    audio.click();
    setWrongBook(loadWrongBook(student));
    setShowWrongBook(true);
  };

  /* ------------------------------ 畫面 ------------------------------ */

  // 未輸入班別學號時，一律停留在標題畫面
  const active: Screen = student && save ? screen : 'menu';
  const progress = save?.sets[setId];

  return (
    <ControlsContext.Provider value={controls}>
      <div className="absolute inset-0 overflow-hidden font-round">
        {/*
          換畫面時舊畫面立即卸載、新畫面淡入（不使用 AnimatePresence 的 mode="wait"，
          以免因等待退場動畫而卡住）。戰鬥畫面在關卡之間保持同一個外層，
          只靠 Battle 的 key 重新掛載，所以「進入下一關」會立即開始新一關。
        */}
        <motion.div
          key={active}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
        >
          {active === 'menu' && (
            <MainMenu
              student={student}
              wrongCount={wrongBook.length}
              onLogin={login}
              onStart={() => go('select')}
              onOpenWrongBook={openWrongBook}
            />
          )}
          {active === 'select' && save && (
            <SetSelect
              save={save}
              wrongCount={wrongBook.length}
              onPlay={playSet}
              onMap={(id) => (setSetId(id), go('map'))}
              onFinal={(id) => (setSetId(id), go('final'))}
              onReset={resetSet}
              onBack={() => go('menu')}
              onOpenWrongBook={openWrongBook}
            />
          )}
          {active === 'story' && save && (
            <StoryIntro
              onDone={() => {
                updateSave({ ...save, storySeen: true });
                if (afterStory !== null) {
                  const level = afterStory;
                  setAfterStory(null);
                  startLevel(level, false);
                } else {
                  go('map');
                }
              }}
            />
          )}
          {active === 'map' && progress && (
            <LevelMap
              save={progress}
              wrongCount={wrongBook.length}
              onStart={(i) => (audio.click(), startLevel(i, false))}
              onMenu={() => go('select')}
              onOpenWrongBook={openWrongBook}
              onFinal={() => go('final')}
            />
          )}
          {active === 'battle' && (
            <Battle
              key={`${setId}-${currentLevel}-${battleRun}`}
              setId={setId}
              levelIndex={currentLevel}
              quickIntro={quickIntro}
              onVictory={handleVictory}
              onExit={() => go('map')}
              onFirstWrong={handleFirstWrong}
            />
          )}
          {active === 'final' && progress && (
            <FinalScreen
              save={progress}
              onOpenWrongBook={openWrongBook}
              onChooseSet={() => go('select')}
              onMenu={() => go('menu')}
            />
          )}
        </motion.div>

        <AnimatePresence>
          {showWrongBook && student && (
            <WrongBook
              student={student}
              entries={wrongBook}
              onClose={() => (audio.click(), setShowWrongBook(false))}
              onCleared={() => setWrongBook([])}
            />
          )}
        </AnimatePresence>
      </div>
    </ControlsContext.Provider>
  );
}
