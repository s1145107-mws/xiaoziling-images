import type { ErrorType, LevelMeta, QuestionKind } from '../types';

export const BOSS_MAX_HP = 600;
export const QUESTION_TIME = 30; // 秒
export const WARNING_TIME = 5; // 最後 5 秒警報
export const DAMAGE_FIRST = 100;
export const DAMAGE_RETRY = 50;

export const LEVELS: LevelMeta[] = [
  {
    index: 0,
    name: '迷霧森林',
    grade: '小一',
    boss: '迷霧樹妖',
    bossTitle: '森林關主',
    shard: '森林正字碎片',
    badge: '森林徽章',
    theme: 'forest',
    intro: '濃濃的迷霧把森林裡的字都遮住了，字的部件都看不清楚！',
    bossLine: '嘻嘻！迷霧會令你分不清字形，你一定會寫錯字！',
    defeatLine: '嗚嗚……迷霧散開了，森林的字回來了！',
  },
  {
    index: 1,
    name: '鏡像城堡',
    grade: '小二',
    boss: '鏡影魔王',
    bossTitle: '城堡關主',
    shard: '城堡正字碎片',
    badge: '城堡徽章',
    theme: 'castle',
    intro: '城堡裡全是魔鏡，鏡子照出來的字，有的多了一筆，有的少了一畫……',
    bossLine: '哈哈！鏡子裡的字和真的字一模一樣，你分得出來嗎？',
    defeatLine: '不可能！我的魔鏡全部碎掉了……',
  },
  {
    index: 2,
    name: '星塵太空',
    grade: '小三',
    boss: '星塵大魔王',
    bossTitle: '太空關主',
    shard: '太空正字碎片',
    badge: '太空徽章',
    theme: 'space',
    intro: '最後一塊碎片在遙遠的太空！大魔王正在用星塵把成語變成錯字！',
    bossLine: '我就是打碎正字核心的大魔王！來吧，小字靈！',
    defeatLine: '你……你竟然把所有錯字都改正了！我投降了！',
  },
];

export const ERROR_TYPE_BY_KIND: Record<QuestionKind, ErrorType> = {
  homophone: '誤寫成同音字',
  stroke: '筆劃誤寫',
  compose: '誤寫成形近字',
};

export const KIND_LABEL: Record<QuestionKind, string> = {
  homophone: '同音辨認',
  stroke: '筆畫辨認',
  compose: '拖拽組字',
};

/** 按首輪得分給予評價 */
export function rateLevel(firstRoundScore: number): { stars: number; label: string } {
  if (firstRoundScore >= 600) return { stars: 3, label: '正字大師' };
  if (firstRoundScore >= 400) return { stars: 2, label: '正字勇士' };
  return { stars: 1, label: '正字見習生' };
}
