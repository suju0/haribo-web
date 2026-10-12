import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * 아티팩트용 빌드: 모든 JS/CSS를 하나로 묶어서 단일 HTML로 만들 수 있게 해요.
 * 아티팩트 도메인에서는 진짜 TDS가 화면을 그리지 못해서, 직접 만든 대체 구현(src/tds-shim)으로 바꿔 끼워요.
 */
export default defineConfig({
  resolve: {
    alias: [
      { find: /^@toss\/tds-mobile-ait$/, replacement: path.resolve(import.meta.dirname, 'src/tds-shim/ait.tsx') },
      { find: /^@toss\/tds-mobile$/, replacement: path.resolve(import.meta.dirname, 'src/tds-shim/index.tsx') },
    ],
  },
  define: { __STANDALONE__: 'true' },
  plugins: [react({ jsxImportSource: '@emotion/react' })],
  build: {
    outDir: 'dist-artifact',
    emptyOutDir: true,
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
    chunkSizeWarningLimit: 5000,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
});
