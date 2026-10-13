/**
 * @toss/tds-mobile-ait 대체 구현 (배포용). 자세한 이유는 ./index.tsx 위쪽 설명을 보세요.
 * TDS 색 변수(--adaptiveGrey900 등)와 기본 글꼴, 목록 행을 눌렀을 때의 회색 효과를 넣어줘요.
 */
import type { ReactNode } from 'react';
import '@toss/tds-colors/colors.light.css';

const CSS = `
html, body {
  background: #ffffff;
  font-family: "Toss Product Sans", Tossface, "SF Pro KR", "SF Pro Display", "SF Pro Icons", -apple-system, BlinkMacSystemFont, "Basier Square", "Apple SD Gothic Neo", Roboto, "Noto Sans KR", "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
  color: #212529;
  line-height: 24px;
  -webkit-font-smoothing: antialiased;
}
button { font-family: inherit; }
/* 스크롤바가 생겼다 사라져도 내용 폭이 변하지 않게 자리를 미리 잡아둬요. (안내 창이 펼쳐질 때 폭이 달라지던 문제)
   주의: 모든 요소(*)에 걸면 overflow가 hidden인 svg 아이콘(×)까지 폭이 0이 돼서, 스크롤되는 패널에만 걸어요. */
.app-scroll { scrollbar-gutter: stable; }
.tds-shim-touch {
  position: absolute;
  inset: 0;
  border-radius: 12px;
  background: rgba(2, 32, 71, 0.05);
  opacity: 0;
  transition: opacity 0.12s ease-out;
  pointer-events: none;
}
.tds-shim-textarea::placeholder { color: #8b95a1; }
.tds-shim-row > div:active > .tds-shim-touch { opacity: 1; }
`;

export function TDSMobileAITProvider({ children }: { children?: ReactNode }) {
  return (
    <>
      <style>{CSS}</style>
      {children}
    </>
  );
}
