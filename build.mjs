// 단일 파일 index.html 만들기: src/shell.html에 엔진·HWPX 틀·앱 코드를 넣고, 쓰인 Tailwind 클래스만 컴파일해 내장
// 실행: node build.mjs   (Tailwind CLI는 npx로 내려받음 · 결과 index.html은 인터넷 없이 열림)
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const src = f => readFileSync(join('src', f), 'utf8');
const put = (html, mark, text) => html.replace(mark, () => text);

let html = src('shell.html');
html = put(html, '/*@@ENGINE@@*/', src('engine.js'));
html = put(html, '/*@@HWPX@@*/', '// HWPX(한글) 문서 틀: hwpx 스킬의 report 템플릿 헤더(글자·문단·테두리 스타일, 글꼴은 모두 맑은 고딕)와 기본 패키지 파일\n' + src('hwpx_tpl.js'));
html = put(html, '/*@@APP@@*/', src('app.js') + '\n' + src('activity.js'));

// 스크립트 안에 </script 가 있으면 페이지가 깨짐
const scripts = html.split('<script>').slice(1).map(s => s.split('</script>')[0]);
if (scripts.some(s => /<\/script/i.test(s))) throw new Error('script 안에 </script 문자열이 있습니다');

const tmp = mkdtempSync(join(tmpdir(), 'maplab-'));
writeFileSync(join(tmp, 'page.html'), html);
writeFileSync(join(tmp, 'in.css'), '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n');
execSync(`npx --yes tailwindcss@3.4.16 -i "${join(tmp, 'in.css')}" -o "${join(tmp, 'out.css')}" --content "${join(tmp, 'page.html')}" --minify`, { stdio: 'inherit' });
html = put(html, '/*@@TW@@*/', readFileSync(join(tmp, 'out.css'), 'utf8').trim());

writeFileSync('index.html', html);
console.log(`index.html ${(Buffer.byteLength(html) / 1024).toFixed(1)} KB`);
