import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import StrokeInspector from './components/StrokeInspector';
import { audio } from './audio/AudioEngine';
import './index.css';

// 在網址加上 ?inspect 可開啟「筆畫編號檢視器」，方便老師調校筆畫誤寫變體
const inspect = new URLSearchParams(window.location.search).has('inspect');

// iPad：首次觸控任何按鈕即自動解鎖 Web Audio（背景音樂、滴答聲、打擊音效）
audio.installAutoUnlock();

// iPad Safari 會忽略 user-scalable=no：以程式阻止雙指縮放和長按選單
const block = (e: Event) => e.preventDefault();
document.addEventListener('gesturestart', block, { passive: false });
document.addEventListener('gesturechange', block, { passive: false });
document.addEventListener('contextmenu', (e) => {
  // 輸入框保留長按選單（貼上等）
  if (!(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) e.preventDefault();
});
document.addEventListener(
  'touchmove',
  (e) => {
    if ((e as TouchEvent & { scale?: number }).scale !== undefined && (e as TouchEvent & { scale: number }).scale !== 1) e.preventDefault();
  },
  { passive: false },
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>{inspect ? <StrokeInspector /> : <App />}</React.StrictMode>,
);
