import { createContext, useContext, useEffect, useState } from 'react';
import { isFullscreen, isFullscreenSupported, onFullscreenChange, toggleFullscreen } from '../lib/fullscreen';
import { audio } from '../audio/AudioEngine';

/** 全域控制（音效開關），由 App 提供，各畫面的右上角按鈕共用 */
export interface Controls {
  muted: boolean;
  toggleMute: () => void;
}

export const ControlsContext = createContext<Controls>({ muted: false, toggleMute: () => {} });

/** 右上角系統按鈕：全螢幕切換 + 音效開關 */
export default function SystemButtons({ className = '', compact = false }: { className?: string; compact?: boolean }) {
  const { muted, toggleMute } = useContext(ControlsContext);
  const [supported] = useState(isFullscreenSupported);
  const [fs, setFs] = useState(isFullscreen);

  useEffect(() => onFullscreenChange(() => setFs(isFullscreen())), []);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {supported && (
        <button
          type="button"
          className={`btn btn-white h-12 py-0 text-lg ${compact ? 'w-14 px-0 text-2xl' : 'px-3'}`}
          onClick={() => {
            audio.click();
            void toggleFullscreen();
          }}
          aria-label={fs ? '離開全螢幕' : '全螢幕'}
          title={fs ? '離開全螢幕' : '全螢幕'}
        >
          {compact ? (fs ? '🗗' : '⛶') : fs ? '🗗 離開全螢幕' : '⛶ 全螢幕'}
        </button>
      )}
      <button
        type="button"
        className="btn btn-white h-12 w-14 px-0 py-0 text-xl"
        onClick={toggleMute}
        aria-label={muted ? '開啟音效' : '關閉音效'}
      >
        {muted ? '🔇' : '🔊'}
      </button>
    </div>
  );
}
