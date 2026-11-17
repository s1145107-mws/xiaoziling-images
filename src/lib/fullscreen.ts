/** Fullscreen API：標準版本 + Safari（iPadOS / 舊版 macOS Safari）webkit 前綴 */

type WebkitDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitFullscreenEnabled?: boolean;
  webkitExitFullscreen?: () => Promise<void> | void;
};
type WebkitElement = HTMLElement & {
  webkitRequestFullscreen?: (options?: unknown) => Promise<void> | void;
};

const doc = () => document as WebkitDocument;

export function isFullscreenSupported(): boolean {
  const el = document.documentElement as WebkitElement;
  return !!(
    (document.fullscreenEnabled && el.requestFullscreen) ||
    (doc().webkitFullscreenEnabled !== false && el.webkitRequestFullscreen)
  );
}

export function isFullscreen(): boolean {
  return !!(document.fullscreenElement || doc().webkitFullscreenElement);
}

export async function toggleFullscreen(): Promise<void> {
  try {
    if (isFullscreen()) {
      if (document.exitFullscreen) await document.exitFullscreen();
      else await doc().webkitExitFullscreen?.();
    } else {
      const el = document.documentElement as WebkitElement;
      if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: 'hide' });
      else await el.webkitRequestFullscreen?.();
    }
  } catch {
    /* 使用者拒絕或瀏覽器不允許時忽略 */
  }
}

export function onFullscreenChange(cb: () => void): () => void {
  document.addEventListener('fullscreenchange', cb);
  document.addEventListener('webkitfullscreenchange', cb);
  return () => {
    document.removeEventListener('fullscreenchange', cb);
    document.removeEventListener('webkitfullscreenchange', cb);
  };
}
