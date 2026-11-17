import type { LevelRecord } from '../types';

export type AfterVictory = { screen: 'battle'; level: number } | { screen: 'final' } | { screen: 'map' };

/**
 * 過關後的去向
 * - 第 1、2 關按「進入下一關」：直接進入 currentLevel + 1 的戰鬥（不經過地圖）
 * - 第 3 關按主按鈕且三關全部通過：修復字典總結算
 * - 按「返回地圖」：關卡地圖
 */
export function afterVictory(currentLevel: number, goNext: boolean, records: LevelRecord[]): AfterVictory {
  if (goNext && currentLevel < 2) return { screen: 'battle', level: currentLevel + 1 };
  if (goNext && records.every((r) => r.cleared)) return { screen: 'final' };
  return { screen: 'map' };
}
