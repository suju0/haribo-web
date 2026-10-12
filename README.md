# Change Context Dashboard

AI Agent · CLI에서 정해진 프로젝트 변경을 담당자에게 알리고, 상세 변경 내용을 확인하고 답하는 대시보드 (React + Vite + TypeScript + TDS).

## 실행

```bash
npm install
npm run dev -- --port 50548   # http://localhost:50548
npm run build                 # dist/ 에 정적 파일 생성
```

## GitHub Pages로 링크 만들기

1. 이 폴더를 GitHub 저장소에 올려요 (`main` 브랜치).
2. 저장소 **Settings → Pages → Source** 를 **GitHub Actions** 로 바꿔요.
3. `main`에 푸시하면 `.github/workflows/pages.yml` 이 빌드해서 `https://<사용자>.github.io/<저장소>/` 로 배포해요.

> 주의: `@toss/tds-mobile`은 허용된 환경에서만 동작해요(앱인토스 개발용). 허용되지 않은 도메인에서는 화면이 하얗게 나올 수 있어요.
> 실제 배포 도메인에서 열리는지 먼저 확인해 보세요.

## 구성

- `src/App.tsx` 화면 틀 · 사이드바 / `src/Inbox.tsx` 나에게 온 변경 / `src/Detail.tsx` 변경 상세
- `src/design.tsx` 칩 · 토글 등 공통 요소 / `src/data.ts`, `src/cliData.ts` 데이터
- 숨겨 둔 기능은 파일 위쪽의 `SHOW_*` 플래그로 켜고 꺼요 (예: `SHOW_LEGACY_TABS`).
