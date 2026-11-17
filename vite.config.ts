import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// base 設為 './'：build 後的 dist/ 可放在任何靜態路徑（甚至子目錄）直接運行
// --mode single：把 JS、CSS、手寫圖片、筆順數據全部內嵌成 dist-single/index.html，可直接雙擊開啟
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
