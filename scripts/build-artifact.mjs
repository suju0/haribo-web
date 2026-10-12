/**
 * 아티팩트용 단일 HTML 만들기
 *   npm run build:artifact  →  artifact/index.html
 *
 * 로컬 서버(vite dev)와 같은 소스(src/)로 만들기 때문에, 화면을 고친 뒤 이 명령을 다시 돌리고
 * 같은 주소로 다시 게시하면 로컬과 아티팩트가 항상 같은 모습이 돼요.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
execSync('npx vite build -c vite.artifact.config.ts', { cwd: root, stdio: 'inherit' });

const dist = path.join(root, 'dist-artifact');
const assets = path.join(dist, 'assets');
const files = fs.readdirSync(assets);
const js = fs.readFileSync(path.join(assets, files.find((f) => f.endsWith('.js'))), 'utf8');
const cssFile = files.find((f) => f.endsWith('.css'));
const css = cssFile ? fs.readFileSync(path.join(assets, cssFile), 'utf8') : '';

// 번들 안(TDS의 문자열 해독 코드)에는 눈에 안 보이는 제어 문자가 그대로 들어 있어요.
// 아티팩트 서버가 이런 문자가 든 페이지를 정리하면서 문자열을 망가뜨려 화면이 하얗게 나올 수 있어서,
// 같은 뜻의 유니코드 이스케이프(백슬래시 u 네 자리)로 바꿔 적어요. 문자열 · 템플릿 안에서는 뜻이 같아요.
const escapeControlChars = (code) =>
  code.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/g, (c) => '\\u' + c.charCodeAt(0).toString(16).padStart(4, '0'));

// </script 가 코드 안에 있으면 HTML이 거기서 끝나버려서 이스케이프해요.
const safeJs = escapeControlChars(js).replace(/<\/script/gi, '<\/script');

const html = `<title>Change Context Dashboard</title>
<style>
/* 배경·글자 색은 토큰으로 두고 라이트/다크 모두 정의해요. 화면 안의 색은 TDS 토큰이 맡아요. */
:root { --page-bg: #f9fafb; --page-fg: #191f28; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --page-bg: #17171c; --page-fg: #f2f4f6; color-scheme: dark; } }
:root[data-theme="dark"] { --page-bg: #17171c; --page-fg: #f2f4f6; color-scheme: dark; }
html, body { height: 100%; overflow-x: hidden; }
body { background: var(--page-bg); color: var(--page-fg); }
#root { height: 100%; }
${css}
</style>
<div id="root"></div>
<script type="module">
${safeJs}
</script>
`;

const outDir = path.join(root, 'artifact');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'index.html'), html);
console.log(`artifact/index.html  ${(html.length / 1024).toFixed(0)} KB`);
