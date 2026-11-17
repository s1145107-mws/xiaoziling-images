import { useEffect, useRef, useState } from 'react';

interface Options {
  /** 是否計時中 */
  running: boolean;
  /** 改變 resetKey 會重新由 duration 開始倒數 */
  resetKey: string | number;
  duration: number;
  /** 每跨過一個整數秒時觸發（傳入剩餘整數秒） */
  onSecond?: (secLeft: number) => void;
  onExpire: () => void;
}

export function useCountdown({ running, resetKey, duration, onSecond, onExpire }: Options) {
  const [remaining, setRemaining] = useState(duration);
  const remainingRef = useRef(duration);
  const cbs = useRef({ onSecond, onExpire });
  cbs.current = { onSecond, onExpire };

  // 重設
  useEffect(() => {
    remainingRef.current = duration;
    setRemaining(duration);
  }, [resetKey, duration]);

  useEffect(() => {
    if (!running) return;
    let last = performance.now();
    let lastSec = Math.ceil(remainingRef.current);
    const id = window.setInterval(() => {
      const now = performance.now();
      const next = Math.max(0, remainingRef.current - (now - last) / 1000);
      last = now;
      remainingRef.current = next;
      setRemaining(next);
      const sec = Math.ceil(next);
      if (sec < lastSec) {
        lastSec = sec;
        cbs.current.onSecond?.(sec);
      }
      if (next <= 0) {
        window.clearInterval(id);
        cbs.current.onExpire();
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [running, resetKey]);

  return remaining;
}
