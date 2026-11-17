import type { StageInfo } from './stage';

/**
 * 戰鬥畫面的版面尺寸（全部以 FitStage 設計畫布的 px 計算）
 *   ┌ padding 16 ┐
 *   │ 頂部欄 56   │
 *   │ 戰鬥場地    │ 橫向 220 / 直向 300：關主血條、30 秒倒數環、角色
 *   │ 作答區      │ 其餘高度：題幹 + 三個選項卡片 / 組字槽
 *   └────────────┘
 * 作答區的元素按剩餘高度計算大小，保證所有內容在一屏內。
 */
export interface BattleLayout {
  portrait: boolean;
  padding: number;
  gap: number;
  headerH: number;
  arenaH: number;
  /** 作答區可用高度 */
  questionH: number;
  /** 作答區可用寬度 */
  questionW: number;
  /** 題幹面板高度 */
  promptH: number;
  heroSize: number;
  bossSize: number;
  timerSize: number;
}

export function battleLayout(stage: StageInfo): BattleLayout {
  const portrait = stage.orientation === 'portrait';
  const padding = 16;
  const gap = 12;
  const headerH = 56;
  const arenaH = portrait ? 300 : 220;
  const questionH = stage.height - padding * 2 - headerH - arenaH - gap * 2;
  return {
    portrait,
    padding,
    gap,
    headerH,
    arenaH,
    questionH,
    questionW: stage.width - padding * 2,
    promptH: 84,
    heroSize: portrait ? 180 : 150,
    bossSize: portrait ? 210 : 158,
    timerSize: portrait ? 112 : 100,
  };
}
