import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { LevelRecord, SaveData, SetId, WrongBookEntry } from './types';
import { emptyProgress, loadSave, loadSettings, loadWrongBook, writeSave, writeSettings } from './lib/storage';
import { audio } from './audio/AudioEngine';
import MainMenu from './screens/MainMenu';
import SetSelect from './screens/SetSelect';
import StoryIntro from './screens/StoryIntro';
import LevelMap from './screens/LevelMap';
import Battle from './screens/Battle';
import FinalScreen from './screens/FinalScreen';
import WrongBook from './components/WrongBook';

type Screen = 'menu' | 'select' | 'story' | 'map' | 'battle' | 'final';

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [save, setSave] = useState<SaveData>(() => loadSave());
  const [setId, setSetId] = useState<SetId>(1);
  const [wrongBook, setWrongBook] = useState<WrongBookEntry[]>(() => loadWrongBook());
  const [showWrongBook, setShowWrongBook] = useState(false);
  const [battleLevel, setBattleLevel] = useState(0);
  const [battleKey, setBattleKey] = useState(0);
  const [quickIntro, setQuickIntro] = useState(false);
  /** 第一次遊玩：看完開場劇情後要進入的關卡 */
  const [afterStory, setAfterStory] = useState<number | null>(null);
  const [muted, setMuted] = useState(() => loadSettings().muted);

  const progress = save.sets[setId];

  useEffect(() => {
    audio.setMuted(muted);
    writeSettings({ muted });
  }, [muted]);

  // 主選單 / 選擇題庫 / 地圖 / 劇情的背景音樂
  useEffect(() => {
    if (screen === 'menu' || screen === 'select' || screen === 'map' || screen === 'story') audio.playBgm('menu');
  }, [screen]);

  const updateSave = (s: SaveData) => {
    setSave(s);
    writeSave(s);
  };

  const go = (s: Screen) => {
    audio.unlock();
    audio.click();
    setScreen(s);
  };

  const startLevel = (level: number, quick: boolean) => {
    audio.unlock();
    setBattleLevel(level);
    setQuickIntro(quick);
    setBattleKey((k) => k + 1);
    setScreen('battle');
  };

  /* ----------------------------- 選擇題庫 ----------------------------- */

  const playSet = (id: SetId) => {
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
    audio.click();
    updateSave({ ...save, sets: { ...save.sets, [id]: emptyProgress(id) } });
  };

  /* ------------------------------ 過關 ------------------------------ */

  const handleVictory = (rec: LevelRecord, goNext: boolean) => {
    const records = progress.records.slice();
    const prev = records[battleLevel];
    // 重玩已通關的關卡時保留較好的成績，星級不會下降
    records[battleLevel] = prev.cleared && prev.firstRoundScore > rec.firstRoundScore ? prev : rec;
    const levelIndex = Math.max(progress.levelIndex, battleLevel + 1);
    updateSave({
      ...save,
      sets: { ...save.sets, [setId]: { ...progress, records, levelIndex, updatedAt: Date.now() } },
    });

    const isLast = battleLevel >= 2;
    if (goNext && !isLast) startLevel(battleLevel + 1, true);
    else if (goNext && records.every((r) => r.cleared)) setScreen('final');
    else setScreen('map');
  };

  const openWrongBook = () => {
    audio.click();
    setWrongBook(loadWrongBook());
    setShowWrongBook(true);
  };

  return (
    <div className="h-full w-full overflow-y-auto font-round">
      <AnimatePresence mode="wait">
        <motion.div
          key={screen === 'battle' ? `battle-${battleKey}` : screen}
          className="min-h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {screen === 'menu' && (
            <MainMenu
              wrongCount={wrongBook.length}
              muted={muted}
              onStart={() => go('select')}
              onOpenWrongBook={openWrongBook}
              onToggleMute={() => (audio.unlock(), setMuted((m) => !m))}
            />
          )}
          {screen === 'select' && (
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
          {screen === 'story' && (
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
          {screen === 'map' && (
            <LevelMap
              save={progress}
              wrongCount={wrongBook.length}
              onStart={(i) => (audio.click(), startLevel(i, false))}
              onMenu={() => go('select')}
              onOpenWrongBook={openWrongBook}
              onFinal={() => go('final')}
            />
          )}
          {screen === 'battle' && (
            <Battle
              key={battleKey}
              setId={setId}
              levelIndex={battleLevel}
              quickIntro={quickIntro}
              onVictory={handleVictory}
              onExit={() => go('map')}
              onWrongBookChange={() => setWrongBook(loadWrongBook())}
              muted={muted}
              onToggleMute={() => setMuted((m) => !m)}
            />
          )}
          {screen === 'final' && (
            <FinalScreen save={progress} onOpenWrongBook={openWrongBook} onChooseSet={() => go('select')} onMenu={() => go('menu')} />
          )}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {showWrongBook && (
          <WrongBook
            entries={wrongBook}
            onClose={() => (audio.click(), setShowWrongBook(false))}
            onCleared={() => setWrongBook([])}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
