import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { LevelRecord, SaveData, WrongBookEntry } from './types';
import { pickRandomSetId } from './data/questionBank';
import { clearSave, loadSave, loadSettings, loadWrongBook, writeSave, writeSettings } from './lib/storage';
import { audio } from './audio/AudioEngine';
import MainMenu from './screens/MainMenu';
import StoryIntro from './screens/StoryIntro';
import LevelMap from './screens/LevelMap';
import Battle from './screens/Battle';
import FinalScreen from './screens/FinalScreen';
import WrongBook from './components/WrongBook';

type Screen = 'menu' | 'story' | 'map' | 'battle' | 'final';

const emptyRecord = (): LevelRecord => ({ cleared: false, firstRoundScore: 0, finalScore: 0, wrongFirstTries: 0 });

function newSave(): SaveData {
  return {
    version: 1,
    setId: pickRandomSetId(),
    levelIndex: 0,
    records: [emptyRecord(), emptyRecord(), emptyRecord()],
    storySeen: false,
    updatedAt: Date.now(),
  };
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [save, setSave] = useState<SaveData | null>(() => loadSave());
  const [wrongBook, setWrongBook] = useState<WrongBookEntry[]>(() => loadWrongBook());
  const [showWrongBook, setShowWrongBook] = useState(false);
  const [battleLevel, setBattleLevel] = useState(0);
  const [battleKey, setBattleKey] = useState(0);
  const [muted, setMuted] = useState(() => loadSettings().muted);

  useEffect(() => {
    audio.setMuted(muted);
    writeSettings({ muted });
  }, [muted]);

  // 主選單 / 地圖的背景音樂
  useEffect(() => {
    if (screen === 'menu' || screen === 'map' || screen === 'story') audio.playBgm('menu');
  }, [screen]);

  const updateSave = useCallback((s: SaveData) => {
    setSave(s);
    writeSave(s);
  }, []);

  const go = (s: Screen) => {
    audio.unlock();
    audio.click();
    setScreen(s);
  };

  const startNewGame = () => {
    clearSave();
    const s = newSave();
    updateSave(s);
    go('story');
  };

  const startLevel = (i: number) => {
    setBattleLevel(i);
    setBattleKey((k) => k + 1);
    go('battle');
  };

  const handleVictory = (rec: LevelRecord) => {
    if (!save) return;
    const records = save.records.slice();
    records[battleLevel] = rec;
    const levelIndex = Math.max(save.levelIndex, battleLevel + 1);
    updateSave({ ...save, records, levelIndex });
    if (records.every((r) => r.cleared)) setScreen('final');
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
          transition={{ duration: 0.3 }}
        >
          {screen === 'menu' && (
            <MainMenu
              save={save}
              wrongCount={wrongBook.length}
              muted={muted}
              onNewGame={startNewGame}
              onContinue={() => go(!save?.storySeen ? 'story' : save.levelIndex >= 3 ? 'final' : 'map')}
              onOpenWrongBook={openWrongBook}
              onToggleMute={() => (audio.unlock(), setMuted((m) => !m))}
            />
          )}
          {screen === 'story' && (
            <StoryIntro
              onDone={() => {
                if (save) updateSave({ ...save, storySeen: true });
                go('map');
              }}
            />
          )}
          {screen === 'map' && save && (
            <LevelMap
              save={save}
              wrongCount={wrongBook.length}
              onStart={startLevel}
              onMenu={() => go('menu')}
              onOpenWrongBook={openWrongBook}
              onFinal={() => go('final')}
            />
          )}
          {screen === 'battle' && save && (
            <Battle
              key={battleKey}
              setId={save.setId}
              levelIndex={battleLevel}
              onVictory={handleVictory}
              onExit={() => go('map')}
              onWrongBookChange={() => setWrongBook(loadWrongBook())}
              muted={muted}
              onToggleMute={() => setMuted((m) => !m)}
            />
          )}
          {screen === 'final' && save && (
            <FinalScreen save={save} onOpenWrongBook={openWrongBook} onNewGame={startNewGame} onMenu={() => go('menu')} />
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
