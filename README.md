# 小字靈：正字保衛戰

面向香港初小（小一至小三）學生的中文錯別字學習網頁遊戲。純前端運行，無需後端：存檔用 `localStorage`，Excel 由瀏覽器直接生成下載。

## 運行

```bash
npm install
npm run dev        # 開發模式，打開 http://localhost:5173
npm run build      # 輸出到 dist/，可放到任何靜態網頁空間，或用 npm run preview 預覽
```

### 打包成單一 HTML（可直接雙擊開啟）

```bash
npm install
npm run build:single   # 輸出 dist-single/index.html
```

這個檔案內嵌了全部 JS、CSS、36 張手寫圖片和筆順數據，音效由 Web Audio 即時合成，所以無需網絡、無需伺服器，複製給學生雙擊即可在 Chrome / Edge / Safari 開啟。楷書網上字體在離線時會改用系統楷體。進度和錯字圖鑑存在瀏覽器的 localStorage，換電腦或換瀏覽器不會帶過去。

`npm run dev` / `npm run build` 會先執行 `scripts/copy-hanzi-data.mjs`，把題庫用到的漢字筆順數據由 `hanzi-writer-data` 複製到 `public/hanzi-data/`，令筆順動畫和 SVG 筆畫對比可離線使用。若本地沒有某個字的數據，會改由 jsDelivr CDN 載入。

## 目錄結構

```
xiaoziling/
├─ index.html
├─ package.json / vite.config.ts / tailwind.config.js / tsconfig.json
├─ scripts/copy-hanzi-data.mjs      # 複製筆順數據到 public/hanzi-data
├─ scripts/embed-assets.mjs         # 單一 HTML 版：把圖片和筆順數據嵌入 src/generated/
├─ public/
│  ├─ hanzi-data/                   # 筆順 JSON（自動生成，可手動補充繁體字形）
│  └─ images/strokes/               # 筆畫題手寫圖片（可選）：{題號}_{a|b|c}.png / .jpg
└─ src/
   ├─ main.tsx                      # 入口；網址加 ?inspect 開啟筆畫編號檢視器
   ├─ App.tsx                       # 畫面切換：主選單 → 選擇題庫 → 劇情（首次）→ 戰鬥 → 下一關 → 總結算
   ├─ types.ts
   ├─ data/
   │  ├─ questionBank.ts            # 兩套題目（各 3 關 × 6 題）＋筆畫誤寫變體定義
   │  └─ levels.ts                  # 關卡設定、HP / 傷害 / 計時常數、評價
   ├─ audio/AudioEngine.ts          # Web Audio 合成 BGM 與全部音效
   ├─ hooks/useCountdown.ts         # 30 秒倒數
   ├─ lib/
   │  ├─ storage.ts                 # 存檔、錯字圖鑑（去重＋錯誤次數）、設定
   │  ├─ exportExcel.ts             # SheetJS 匯出 小字靈_錯字圖鑑_YYYYMMDD.xlsx
   │  ├─ hanziData.ts               # 筆順數據載入（本地優先，CDN 後備）
   │  └─ utils.ts
   ├─ components/
   │  ├─ StrokeGlyph.tsx            # SVG 筆畫對比渲染器（刪筆 / 加筆 / 縮短筆畫）
   │  ├─ StrokeAnimator.tsx         # hanzi-writer 標準筆順動畫
   │  ├─ ChoicePanel.tsx            # 辨認題（同音 / 筆畫）三選一
   │  ├─ ComposePanel.tsx           # 組字題（拖拽或點擊填入，即時預覽）
   │  ├─ HintModal.tsx              # 錯後提示、筆順動畫、思考問題、補答
   │  ├─ TimerRing.tsx / HpBar.tsx / Sprites.tsx / LevelBackground.tsx
   │  ├─ WrongBook.tsx              # 錯字圖鑑列表＋匯出
   │  └─ StrokeInspector.tsx        # 老師工具：檢視筆畫序號與誘錯渲染
   └─ screens/
      ├─ MainMenu.tsx / SetSelect.tsx / StoryIntro.tsx / LevelMap.tsx
      ├─ Battle.tsx                 # 單關戰鬥狀態機
      └─ FinalScreen.tsx            # 正字核心重組動畫與總結算
```

## 規則實現摘要

| 規則 | 實現位置 |
| --- | --- |
| 學生自選第一套 / 第二套題目，兩套進度與星級分開記錄 | `SetSelect.tsx`；`localStorage` 鍵 `xiaoziling.save.v2`（舊版 v1 存檔自動轉移） |
| 過關後主按鈕「進入下一關：〔名稱〕」，下一關開場約 2.5 秒自動開始（點擊可跳過）；「返回地圖」為角落小按鈕 | `Battle.tsx` 勝利畫面、`quickIntro` |
| 作答節奏：答對 → 下一題 1.1 秒；答錯 → 提示框 0.45 秒；補答錯誤 → 顯示答案 0.65 秒 | `Battle.tsx` 的 `TIMING` 常數 |
| 關主 600 HP，每關 6 題（2 同音＋2 筆畫＋2 組字） | `levels.ts`、`questionBank.ts` |
| 30 秒倒數；≤5 秒紅色脈衝、每秒滴答、BGM 加速 | `TimerRing`、`useCountdown`、`audio.tick()` / `audio.setUrgent()` |
| 首答正確 −100 HP / +100 分 | `Battle.tsx › dealDamage` |
| 首答錯 / 超時 → 錄入圖鑑、提示框、補答（無倒數） | `handleFirstWrong`、`HintModal` |
| 補答正確 −50 HP / +50 分；補答錯誤 → 被重擊動畫並高亮正確答案 | `handleAnswer` |
| HP 未歸零 → 重試錯題（只抽未拿滿 100 分的題目） | `startWrongQuestionRound` |

重試錯題時，每題分數取「歷來最高」，傷害等於分數增加的部分。例如某題原本補答得 50 分，重試時首答正確，就再扣關主 50 HP。這樣每關總分最多 600 分，與關主 HP 一致，HP 歸零即表示所有題目都拿滿分。

## 筆畫誤寫題的顯示方式

1. 如果 `public/images/strokes/{題號}_{a|b|c}.png`（或 `.jpg`）三張都存在，優先顯示手寫圖片；缺任何一張，該題三個選項都用 SVG，避免照片和 SVG 混在一起洩露答案。
2. 否則使用 SVG 渲染器：按 hanzi-writer 的筆畫輪廓逐筆繪製，再套用 `questionBank.ts` 中的 `variant`（`remove` 少一筆、`copy` / `copyMid` 多一筆、`scale` 筆畫縮短 / 未貫穿）。
3. 如果筆順數據完全載入失敗，退回顯示楷體字形。

**請老師核對：** 誘錯變體以筆畫序號定義，這些序號是根據標準筆順推算的，尚未逐字對照實際數據。請打開 `http://localhost:5173/?inspect`，檢視每個字的筆畫編號和三個選項的渲染效果；如果有偏差，修改 `questionBank.ts` 中對應的序號，或改用手寫圖片。另外，`hanzi-writer-data` 以 Make Me a Hanzi 為基礎，部分繁體字形可能與香港標準字形略有出入；可以把同格式 JSON 放進 `public/hanzi-data/<字>.json` 覆蓋。
