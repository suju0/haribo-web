import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages처럼 하위 경로(/저장소이름/)에 올릴 때는 BASE_PATH 환경 변수로 경로를 알려줘요. 로컬에서는 기본값(/)이에요.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react({ jsxImportSource: '@emotion/react' })],
});
