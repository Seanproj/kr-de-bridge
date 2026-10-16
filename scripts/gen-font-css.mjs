// Pretendard(dynamic subset) CSS를 font-display: optional로 바꿔 src/styles/pretendard.css로 생성한다.
// swap이면 폰트가 늦게 도착할 때 줄바꿈이 바뀌며 레이아웃이 밀린다(CLS). optional은 첫 방문에 늦으면
// 시스템 한글 폰트(Apple SD Gothic Neo/Noto Sans KR)로 보여주고, 다음 방문부터 캐시된 Pretendard를 쓴다.
// pretendard 패키지를 업그레이드하면 다시 실행: node scripts/gen-font-css.mjs
import { readFileSync, writeFileSync } from "node:fs";
const dir = "node_modules/pretendard/dist/web/variable/";
const src = readFileSync(new URL(`../${dir}pretendardvariable-dynamic-subset.css`, import.meta.url), "utf8");
const out = src
  .replace(/font-display:\s*swap/g, "font-display: optional")
  .replace(/url\((['"]?)\.\/(woff2-dynamic-subset\/[^)'"]+)\1\)/g, `url("../../${dir}$2")`);
if (!out.includes("optional")) throw new Error("font-display 치환 실패");
writeFileSync(new URL("../src/styles/pretendard.css", import.meta.url), "/* 생성 파일 — scripts/gen-font-css.mjs */\n" + out);
console.log("pretendard.css 생성");
