import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/** 아티팩트용 빌드: 모든 JS/CSS를 하나로 묶어서 단일 HTML로 만들 수 있게 해요. */
export default defineConfig({
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
