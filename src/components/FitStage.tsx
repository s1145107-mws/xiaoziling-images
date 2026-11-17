import { createContext, useContext, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { MotionConfig } from 'framer-motion';
import { computeStage, type StageInfo } from '../lib/stage';

/**
 * 全螢幕自適應舞台
 * ------------------------------------------------------------
 * 每個畫面都在固定「設計尺寸」的畫布上排版，再按視窗大小整體縮放：
 *   橫向（電腦、iPad 橫放）：設計高度 800，寬度隨螢幕比例在 1060–1600 之間伸縮
 *   直向（iPad 直放）      ：設計寬度 820，高度隨螢幕比例在 1000–1400 之間伸縮
 * 因此畫面會鋪滿視窗，而且所有元素一定在一屏之內，永遠不需要上下捲動。
 * 背景另外以全螢幕鋪滿，不受縮放影響；iPad 安全區域（Home 指示條等）會自動避開。
 */

export type { Orientation, StageInfo } from '../lib/stage';

const StageContext = createContext<StageInfo>(computeStage(1280, 800));

export function useStage(): StageInfo {
  return useContext(StageContext);
}

interface Props {
  children: ReactNode;
  /** 全螢幕鋪滿的背景（不縮放） */
  background?: ReactNode;
  className?: string;
}

export default function FitStage({ children, background, className = '' }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });

  // 量度扣除安全區域後的可用空間；旋轉 iPad、進出全螢幕、調整視窗大小都會即時更新
  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('orientationchange', measure);
    window.visualViewport?.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('orientationchange', measure);
      window.visualViewport?.removeEventListener('resize', measure);
    };
  }, []);

  const stage = computeStage(box.w, box.h);
  const left = (box.w - stage.width * stage.scale) / 2;
  const top = (box.h - stage.height * stage.scale) / 2;

  return (
    <div className="absolute inset-0 overflow-hidden">
      {background && <div className="absolute inset-0">{background}</div>}
      <div ref={boxRef} className="safe-area-box absolute">
        {box.w > 0 && (
          <StageContext.Provider value={stage}>
            {/* 畫布被縮放：拖曳手勢的座標也要換算，手指與部件卡片才會 1:1 同步移動 */}
            <MotionConfig transformPagePoint={(p) => ({ x: p.x / stage.scale, y: p.y / stage.scale })}>
              <div
                className={`absolute origin-top-left ${className}`}
                style={{
                  width: stage.width,
                  height: stage.height,
                  left,
                  top,
                  transform: `scale(${stage.scale})`,
                }}
              >
                {children}
              </div>
            </MotionConfig>
          </StageContext.Provider>
        )}
      </div>
    </div>
  );
}
