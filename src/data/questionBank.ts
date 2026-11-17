import type {
  ChoiceQuestion,
  ComposeQuestion,
  QuestionSet,
  StrokeVariant,
} from '../types';

/* ------------------------------------------------------------------ */
/*  題目建構小工具                                                      */
/* ------------------------------------------------------------------ */

function homophone(
  id: string,
  answer: string,
  wrongs: [string, string],
  hint: string,
  think: string,
  keyStroke: string,
): ChoiceQuestion {
  return {
    id,
    kind: 'homophone',
    answer,
    options: [
      { id: 'a', text: answer, correct: true },
      { id: 'b', text: wrongs[0], correct: false },
      { id: 'c', text: wrongs[1], correct: false },
    ],
    hint,
    think,
    keyStroke,
  };
}

interface WrongStroke {
  note: string;
  variant: StrokeVariant;
}

/**
 * 筆畫題：三個選項文字相同，差異由 SVG 筆畫渲染器（或 public/images/strokes/ 手寫圖片）呈現。
 * 選項圖片以相對路徑載入：./images/strokes/{題號}_{a|b|c}.png 或 .jpg，a 為正確，b / c 為誘錯 1 / 2。
 */
function stroke(
  id: string,
  answer: string,
  correctNote: string,
  wrong1: WrongStroke,
  wrong2: WrongStroke,
  hint: string,
  think: string,
  keyStroke: string,
): ChoiceQuestion {
  return {
    id,
    kind: 'stroke',
    answer,
    options: [
      { id: 'a', text: answer, correct: true, note: correctNote },
      { id: 'b', text: answer, correct: false, note: wrong1.note, variant: wrong1.variant },
      { id: 'c', text: answer, correct: false, note: wrong2.note, variant: wrong2.variant },
    ],
    hint,
    think,
    keyStroke,
  };
}

const DEFAULT_COMPOSE_THINK = '想一想：正字的意思和哪一個部件有關？把它放進字槽吧！';

function compose(
  id: string,
  q: Omit<ComposeQuestion, 'id' | 'kind' | 'think'> & { think?: string },
): ComposeQuestion {
  return { id, kind: 'compose', think: q.think ?? DEFAULT_COMPOSE_THINK, ...q };
}

/* ------------------------------------------------------------------ */
/*  第一套題目                                                          */
/* ------------------------------------------------------------------ */

const SET_1: QuestionSet = {
  id: 1,
  name: '第一套題目',
  levels: [
    // 第一關：迷霧森林（小一）
    {
      questions: [
        homophone(
          's1-l1-q1',
          '公園',
          ['公員', '公原'],
          '正字的意思和「地方」有關，要用「囗」字部，和「袁」的讀音一樣。',
          '哪個字詞有「囗」字部和「袁」的部件？',
          '「園」外圍為「囗」部，內為「袁」',
        ),
        homophone(
          's1-l1-q2',
          '鼓勵',
          ['鼓麗', '鼓例'],
          '正字的意思和「努力」有關，和「厲」的讀音一樣。',
          '哪個字詞有「力」字部和「厲」的部件？',
          '「勵」左邊為「厲」，右邊為「力」',
        ),
        stroke(
          's1-l1-q3',
          '遊戲',
          '筆畫完整',
          { note: '「戲」字右邊「戈」少了一點', variant: { charIndex: 1, ops: [{ op: 'remove', strokes: [-1] }] } },
          { note: '「戲」字「戈」少了一撇', variant: { charIndex: 1, ops: [{ op: 'remove', strokes: [-2] }] } },
          '（自動播放「遊戲」標準筆順動畫）注意「戲」字右邊「戈」的撇和右上角的點不能漏寫！',
          '哪個字詞和動畫正字的筆劃一樣？',
          '「戲」右邊「戈」的一撇與右上點',
        ),
        stroke(
          's1-l1-q4',
          '霧',
          '筆畫完整',
          { note: '下方「務」右邊少了一撇', variant: { charIndex: 0, ops: [{ op: 'remove', strokes: [13] }] } },
          { note: '下方「務」左邊「矛」少了一撇', variant: { charIndex: 0, ops: [{ op: 'remove', strokes: [12] }] } },
          '（自動播放「霧」標準筆順動畫）注意「霧」字下方「務」的撇畫要寫齊全！',
          '哪個字和動畫正字的筆劃一樣？',
          '「霧」下方「務」的各撇畫',
        ),
        compose('s1-l1-q5', {
          wordHint: '？璃',
          word: '玻璃',
          target: '玻',
          structure: ['？', '皮'],
          layout: 'lr',
          answer: '⺩',
          components: ['⺩', '氵', '土'],
          previews: { '⺩': '玻', '氵': '波', '土': '坡' },
          hint: '正字本來的意思是指透明的玉石。要用「⺩」字部。',
          keyStroke: '「玻」左邊為「⺩」部（玉字旁）',
        }),
        compose('s1-l1-q6', {
          wordHint: '？帽子',
          word: '戴帽子',
          target: '戴',
          structure: ['？', '𢦏'],
          layout: 'wrap',
          answer: '異',
          components: ['異', '車', '衣'],
          previews: { '異': '戴', '車': '載', '衣': '裁' },
          hint: '「異」的古字是畫一個人舉起雙手，把東西放在頭上，和正字意思相符。',
          keyStroke: '「戴」左下部件為「異」',
        }),
      ],
    },
    // 第二關：鏡像城堡（小二）
    {
      questions: [
        homophone(
          's1-l2-q1',
          '宣佈',
          ['宣報', '宣保'],
          '正字有「散開、宣告」的意思。而宣告是由人做的，需要加上「人」字旁。',
          '哪個字詞有「人」字部？「布」能鋪開嗎？',
          '「佈」左邊為「亻」部，右為「布」',
        ),
        homophone(
          's1-l2-q2',
          '幽靜',
          ['優靜', '悠靜'],
          '正字本義表示「山中細微的地方」，要用「山」字部，加上表示細微的「絲」字。',
          '哪個字詞有「山」字部和「絲」的部件？',
          '「幽」外圍為「山」部，內含兩個「幺」',
        ),
        stroke(
          's1-l2-q3',
          '認真',
          '筆畫完整，「真」中間三橫',
          { note: '「真」字中間少了一橫，只寫兩橫', variant: { charIndex: 1, ops: [{ op: 'remove', strokes: [5] }] } },
          { note: '「認」字右邊「忍」少了一點', variant: { charIndex: 0, ops: [{ op: 'remove', strokes: [9] }] } },
          '（自動播放「認真」標準筆順動畫）注意「真」字中間共有三橫，千萬不要漏寫！',
          '哪個字詞和動畫正字的筆劃一樣？',
          '「真」字中間為三橫',
        ),
        stroke(
          's1-l2-q4',
          '嚴肅',
          '筆畫完整',
          {
            note: '「肅」字中間豎筆未貫穿且少一橫',
            variant: {
              charIndex: 1,
              ops: [
                { op: 'scale', stroke: 'longestVertical', sy: 0.5, anchor: 'top' },
                { op: 'remove', strokes: [2] },
              ],
            },
          },
          { note: '「嚴」字右下「敢」少了一橫', variant: { charIndex: 0, ops: [{ op: 'remove', strokes: [9] }] } },
          '（自動播放「嚴肅」標準筆順動畫）注意「嚴」和「肅」的內部橫畫與豎筆結構！',
          '哪個字詞和動畫正字的筆劃一樣？',
          '「肅」中間一豎貫穿到底',
        ),
        compose('s1-l2-q5', {
          wordHint: '？法',
          word: '辦法',
          target: '辦',
          structure: ['辛', '？', '辛'],
          layout: 'lmr',
          answer: '力',
          components: ['力', '瓜', '言'],
          previews: { '力': '辦', '瓜': '辧', '言': '辯' },
          hint: '正字的本義是「致力」，即「全力以赴去做事」。',
          keyStroke: '「辦」字中間為「力」',
        }),
        compose('s1-l2-q6', {
          wordHint: '無影無？',
          word: '無影無蹤',
          target: '蹤',
          structure: ['？', '從'],
          layout: 'lr',
          answer: '⻊',
          components: ['⻊', '糸', '木'],
          previews: { '⻊': '蹤', '糸': '縱', '木': '樅' },
          hint: '正字的本義是「行走留下的痕跡」。',
          keyStroke: '「蹤」左邊為「⻊」部（足字旁）',
        }),
      ],
    },
    // 第三關：星塵太空（小三）
    {
      questions: [
        homophone(
          's1-l3-q1',
          '半途而廢',
          ['半途而費', '半途而吠'],
          '「廢」是停止、放棄的意思，「費」是花錢的意思。',
          '你認為詞語是指走到一半放棄還是走到一半花錢？',
          '「廢」為「广」字頭，內為「發」',
        ),
        homophone(
          's1-l3-q2',
          '值得',
          ['職得', '質得'],
          '「值」是指人覺得有價值，「職」是耳朵聽命令去上班。',
          '你認為詞語是指事情有價值還是和上班有關？',
          '「值」左邊為「亻」部，右為「直」',
        ),
        stroke(
          's1-l3-q3',
          '靈機一動',
          '筆畫完整',
          {
            note: '「靈」字下方「巫」誤寫成「王」',
            variant: {
              charIndex: 0,
              ops: [
                { op: 'remove', strokes: [19, 20, 21, 22] },
                { op: 'copyMid', from: 17, to: 23 },
              ],
            },
          },
          { note: '「靈」字中間少寫一個「口」', variant: { charIndex: 0, ops: [{ op: 'remove', strokes: [11, 12, 13] }] } },
          '（自動播放「靈機一動」標準筆順動畫）注意「靈」字中間有三個「口」，最下方是「巫」字（兩邊各有一「人」）！',
          '哪個字詞和動畫正字的筆劃一樣？',
          '「靈」中間三「口」及下方「巫」字',
        ),
        stroke(
          's1-l3-q4',
          '全神貫注',
          '筆畫完整',
          {
            note: '「貫」字上方誤寫成「田」，中間一豎未貫穿',
            variant: { charIndex: 2, ops: [{ op: 'scale', stroke: 3, sy: 0.55, anchor: 'center' }] },
          },
          { note: '「貫」字上方「毌」少了一豎', variant: { charIndex: 2, ops: [{ op: 'remove', strokes: [3] }] } },
          '（自動播放「全神貫注」標準筆順動畫）注意「貫」字上方是「毌」，中間有一豎貫穿上下！',
          '哪個字詞和動畫正字的筆劃一樣？',
          '「貫」上方「毌」一豎貫穿',
        ),
        compose('s1-l3-q5', {
          wordHint: '？開',
          word: '拆開',
          target: '拆',
          structure: ['扌', '？'],
          layout: 'lr',
          answer: '斥',
          components: ['斥', '斤', '丘'],
          previews: { '斥': '拆', '斤': '折' },
          hint: '「斥」是指推開、分開，「斤」是斧頭，「丘」是指土堆。你覺得正字的意思是指分開、斧頭還是土堆？',
          keyStroke: '「拆」右邊為「斥」（多一點）',
        }),
        compose('s1-l3-q6', {
          wordHint: '？音',
          word: '噪音',
          target: '噪',
          structure: ['？', '喿'],
          layout: 'lr',
          answer: '口',
          components: ['口', '火', '⻊'],
          previews: { '口': '噪', '火': '燥', '⻊': '躁' },
          hint: '正字的本義是「用嘴巴發出吵雜的聲音」。哪個部首和嘴巴有關？',
          keyStroke: '「噪」左邊為「口」部',
        }),
      ],
    },
  ],
};

/* ------------------------------------------------------------------ */
/*  第二套題目                                                          */
/* ------------------------------------------------------------------ */

const SET_2: QuestionSet = {
  id: 2,
  name: '第二套題目',
  levels: [
    // 第一關：迷霧森林（小一）
    {
      questions: [
        homophone(
          's2-l1-q1',
          '消息',
          ['消識', '消式'],
          '「息」的意思是「音信、資訊」。「識」是「知識」。而「式」跟「規矩、方法、樣子」有關。',
          '正字的意思與「息」、「識」還是「式」相符？',
          '「息」上為「自」，下為「心」',
        ),
        homophone(
          's2-l1-q2',
          '樹枝',
          ['樹知', '樹之'],
          '「枝」的意思是「樹木從樹幹分岔出來的部分」。「知」的意思是「知道」。「之」的意思是「去」',
          '正字的意思與「枝」、「知」還是「之」相符？',
          '「枝」左邊為「木」部，右為「支」',
        ),
        stroke(
          's2-l1-q3',
          '知道',
          '筆畫完整，「道」之「首」中間兩橫成「目」',
          { note: '「道」字「首」部中間少了一橫，寫成「日」', variant: { charIndex: 1, ops: [{ op: 'remove', strokes: [7] }] } },
          { note: '「道」字「首」部中間多了一橫，寫成三橫', variant: { charIndex: 1, ops: [{ op: 'copyMid', from: 7, to: 8 }] } },
          '（自動播放「知道」標準筆順動畫）注意「道」字裡面的「首」中間是「目」（兩橫），不要多寫或少寫橫畫！',
          '哪個字詞和動畫正字的筆劃一樣？',
          '「道」字「首」部中間為兩橫',
        ),
        stroke(
          's2-l1-q4',
          '感冒',
          '筆畫完整',
          { note: '「感」字上方「咸」少了一橫', variant: { charIndex: 0, ops: [{ op: 'remove', strokes: [2] }] } },
          { note: '「冒」字上方誤寫成「日」，少了一橫', variant: { charIndex: 1, ops: [{ op: 'remove', strokes: [2] }] } },
          '（自動播放「感冒」標準筆順動畫）注意「感」字「咸」部「口」上方的一橫，以及「冒」字上方的兩橫！',
          '哪個字詞和動畫正字的筆劃一樣？',
          '「感」字「咸」部橫畫與「冒」字上方「冃」',
        ),
        compose('s2-l1-q5', {
          wordHint: '？聲',
          word: '鈴聲',
          target: '鈴',
          structure: ['？', '令'],
          layout: 'lr',
          answer: '金',
          components: ['金', '耳', '⺩'],
          previews: { '金': '鈴', '耳': '聆', '⺩': '玲' },
          hint: '「金」字旁表示用金屬做的。「耳」字旁表示用耳朵聽。「⺩」字旁表示和玉石有關。',
          keyStroke: '「鈴」左邊為「金」部',
        }),
        compose('s2-l1-q6', {
          wordHint: '蜜？',
          word: '蜜蜂',
          target: '蜂',
          structure: ['？', '夆'],
          layout: 'lr',
          answer: '虫',
          components: ['虫', '金', '山'],
          previews: { '虫': '蜂', '金': '鋒', '山': '峰' },
          hint: '「虫」字旁和昆蟲有關。「金」字旁表示用金屬做的。「山」字旁和山峰有關。',
          keyStroke: '「蜂」左邊為「虫」部',
        }),
      ],
    },
    // 第二關：鏡像城堡（小二）
    {
      questions: [
        homophone(
          's2-l2-q1',
          '伸出',
          ['深出', '身出'],
          '「伸」的本義就是人把手腳展開、拉直。「深」和水有關。「身」是身體。',
          '正字的意思與「伸」、「深」還是「身」相符？',
          '「伸」左邊為「亻」部，右為「申」',
        ),
        homophone(
          's2-l2-q2',
          '自私',
          ['自思', '自詩'],
          '「私」指一個人把田裡的收（禾）藏進自己的口袋裡（厶）。「思」指思考。「詩」指詩歌。',
          '正字的意思與「私」、「思」還是「詩」相符？',
          '「私」左邊為「禾」部，右為「厶」',
        ),
        stroke(
          's2-l2-q3',
          '預祝',
          '筆畫完整',
          { note: '「預」字右邊「頁」中間少了一橫，寫成「日」', variant: { charIndex: 0, ops: [{ op: 'remove', strokes: [9] }] } },
          {
            note: '「祝」字左邊「礻」多了一點，寫成「衤」',
            variant: { charIndex: 1, ops: [{ op: 'copy', stroke: 3, dx: 60, dy: -90 }] },
          },
          '（自動播放「預祝」標準筆順動畫）注意「頁」字中間是「目」（兩橫），「祝」字左邊是示字旁「礻」（只有一點）！',
          '哪個字詞和動畫正字的筆劃一樣？',
          '「頁」中間兩橫；「祝」左邊為「礻」部',
        ),
        stroke(
          's2-l2-q4',
          '歡迎',
          '筆畫完整',
          {
            note: '「迎」字中間「卬」左半部封口誤寫',
            variant: { charIndex: 1, ops: [{ op: 'copy', stroke: 1, dx: 90, dy: 0, sy: 0.8 }] },
          },
          { note: '「迎」字「辶」少了一點', variant: { charIndex: 1, ops: [{ op: 'remove', strokes: [4] }] } },
          '（自動播放「歡迎」標準筆順動畫）注意「迎」字中間「卬」的寫法及「辶」的點畫！',
          '哪個字詞和動畫正字的筆劃一樣？',
          '「迎」字中間「卬」及「辶」部',
        ),
        compose('s2-l2-q5', {
          wordHint: '後？',
          word: '後悔',
          target: '悔',
          structure: ['？', '每'],
          layout: 'lr',
          answer: '忄',
          components: ['忄', '亻', '言'],
          previews: { '忄': '悔', '亻': '侮', '言': '誨' },
          hint: '正字意思是做錯事感到難過。部首「忄」和感受有關。',
          keyStroke: '「悔」左邊為「忄」部（豎心旁）',
        }),
        compose('s2-l2-q6', {
          wordHint: '期？',
          word: '期待',
          target: '待',
          structure: ['？', '寺'],
          layout: 'lr',
          answer: '彳',
          components: ['彳', '亻', '扌'],
          previews: { '彳': '待', '亻': '侍', '扌': '持' },
          hint: '部首「彳」表示路上，正字指在路上等待。',
          keyStroke: '「待」左邊為「彳」部（雙人旁）',
        }),
      ],
    },
    // 第三關：星塵太空（小三）
    {
      questions: [
        homophone(
          's2-l3-q1',
          '出發',
          ['出法', '出伐'],
          '「發」指開始行動。「法」指法律。「伐」指一個人拿著武器攻擊。',
          '正字的意思與「發」、「法」還是「伐」相符？',
          '「發」字上部為「癶」，下為「弓」與「殳」',
        ),
        homophone(
          's2-l3-q2',
          '自由自在',
          ['自游自在', '自郵自在'],
          '「由」就是「聽任、順隨自己的心意」。「游」是「在水裡浮行」。「郵」是「郵寄」。',
          '正字的意思與「由」、「遊」還是「郵」相符？',
          '「由」字中間一豎出頭',
        ),
        stroke(
          's2-l3-q3',
          '悲哀',
          '筆畫完整',
          { note: '「哀」字「口」下方多寫了一橫', variant: { charIndex: 1, ops: [{ op: 'copy', stroke: 4, dy: -70 }] } },
          { note: '「悲」字上方「非」左邊少了一橫', variant: { charIndex: 0, ops: [{ op: 'remove', strokes: [2] }] } },
          '（自動播放「悲哀」標準筆順動畫）注意「哀」字是「衣」字中間夾一個「口」，不要多加橫畫！',
          '哪個字詞和動畫正字的筆劃一樣？',
          '「哀」字「口」下無多餘橫畫',
        ),
        stroke(
          's2-l3-q4',
          '酷熱',
          '筆畫完整',
          // 按老師手寫圖片：錯字1 為「熱」多一點（五點），錯字2 為「酉」寫成「西」
          { note: '「熱」字下方「灬」多了一點，寫成五點', variant: { charIndex: 1, ops: [{ op: 'copyMid', from: -2, to: -1 }] } },
          { note: '「酷」字左邊「酉」裡面少了一橫，寫成「西」', variant: { charIndex: 0, ops: [{ op: 'remove', strokes: [5] }] } },
          '（自動播放「酷熱」標準筆順動畫）注意「酷」左邊是「酉」（裡面有一橫），「熱」下方是四點水「灬」！',
          '哪個字詞和動畫正字的筆劃一樣？',
          '「酷」左「酉」內有一橫；「熱」下為四點',
        ),
        compose('s2-l3-q5', {
          wordHint: '探？',
          word: '探訪',
          target: '訪',
          structure: ['？', '方'],
          layout: 'lr',
          answer: '言',
          components: ['言', '亻', '阝'],
          previews: { '言': '訪', '亻': '仿', '阝': '防' },
          hint: '正字本來的意思是「問他人的意見」，後來才指「探望」。而問人需要透過說話。',
          keyStroke: '「訪」左邊為「言」部',
        }),
        compose('s2-l3-q6', {
          wordHint: '清？',
          word: '清澈',
          target: '澈',
          structure: ['？', '育', '攵'],
          layout: 'lmr',
          answer: '氵',
          components: ['氵', '扌', '車'],
          previews: { '氵': '澈', '扌': '撤', '車': '轍' },
          hint: '正字指水非常清，能一眼看到底。要用部首「氵」',
          keyStroke: '「澈」左邊為「氵」部',
        }),
      ],
    },
  ],
};

/** 兩套題目由學生在「選擇題庫」畫面自選 */
export const QUESTION_SETS: Record<1 | 2, QuestionSet> = { 1: SET_1, 2: SET_2 };
