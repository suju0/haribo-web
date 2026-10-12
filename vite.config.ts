import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * `--mode shim` 이면 @toss/tds-mobile 을 직접 만든 대체 구현(src/tds-shim)으로 바꿔 끼워요.
 * TDS는 앱인토스가 아닌 도메인(GitHub Pages, 아티팩트)에서는 화면이 하얗게 나오기 때문이에요.
 *  - npm run dev        : 진짜 TDS (로컬 개발)
 *  - npm run dev:shim   : 대체 구현으로 미리보기 (배포 모양 확인용)
 *  - npm run build:pages: 대체 구현으로 배포용 빌드 (GitHub Pages)
 */
const shimAlias = [
  { find: /^@toss\/tds-mobile-ait$/, replacement: path.resolve(import.meta.dirname, 'src/tds-shim/ait.tsx') },
  { find: /^@toss\/tds-mobile$/, replacement: path.resolve(import.meta.dirname, 'src/tds-shim/index.tsx') },
];

// GitHub Pages처럼 하위 경로(/저장소이름/)에 올릴 때는 BASE_PATH 환경 변수로 경로를 알려줘요. 로컬에서는 기본값(/)이에요.
export default defineConfig(({ mode }) => ({
  base: process.env.BASE_PATH ?? '/',
  resolve: { alias: mode === 'shim' ? shimAlias : [] },
  plugins: [react({ jsxImportSource: '@emotion/react' })],
}));
