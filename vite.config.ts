import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// base 設為 './'（一般打包與單一 HTML 打包都適用）：
//   所有 JS、CSS 以相對路徑載入；程式內的圖片 / 筆順數據經 assetUrl() 變成 ./images/strokes/…、./hanzi-data/…
//   因此 dist/ 可放在 GitHub Pages 子路徑 https://s1145107-mws.github.io/xiaoziling-images/ 或任何子目錄直接運行
// npm run build             → dist/（GitHub Actions 部署到 GitHub Pages）
// npm run build:single      → dist-single/index.html：JS、CSS、手寫圖片、筆順數據全部內嵌，可直接雙擊開啟
export default defineConfig(({ mode }) => {
  const single = mode === 'single';
  return {
    base: './',
    plugins: single ? [react(), viteSingleFile()] : [react()],
    build: single
      ? {
          outDir: 'dist-single',
          // 圖片和筆順數據已由 scripts/embed-assets.mjs 嵌入程式，不需要再複製 public/
          copyPublicDir: false,
          chunkSizeWarningLimit: 20000,
        }
      : undefined,
  };
});
