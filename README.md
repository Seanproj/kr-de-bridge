# 한독 행정 브릿지 (가칭)

독일에 사는 한국인을 위한 행정 정보 카드 웹앱. 명세는 [SPEC.md](SPEC.md).

```bash
npm install
npm run dev          # http://localhost:4321 (검색은 build 후에만 동작)
npm run build        # astro build + pagefind 색인 → dist/
npm run preview
npm run check:data   # data/*.json 스키마·참조 검사
```

## 구조

| 경로 | 내용 |
|---|---|
| `data/cards.json`, `data/scenarios.json` | 모든 콘텐츠. 여기만 고치면 된다 |
| `src/schema.mjs` | zod 스키마 (빌드·CI 공용). `verified`는 `checkedAt`+공식 출처 필수 |
| `src/pages/c/[id].astro` | 카드 상세 (SPEC 5.2 순서 고정) |
| `src/pages/s/[id].astro` | 시나리오 체크리스트 (localStorage) |
| `scripts/gen-og.mjs` | 카드별 OG 이미지 생성 (Playwright) — 제목이 바뀌면 다시 실행 |
| `scripts/gen-icons.mjs` | PWA 아이콘 생성 |
| `scripts/content-health.mjs` | 월간 링크·신선도 점검 (GitHub Action) |

## 콘텐츠 규칙

- `checkedAt`은 **사람이 공식 출처와 직접 대조한 날짜만** 적는다.
- `toVerify` 중 `[웹 조사 YYYY-MM-DD]`로 시작하는 항목은 웹 조사로 찾았지만 아직 원문과 대조하지 않은 내용이다. 대조가 끝나면 항목을 지우고 `checkedAt`·`status`를 갱신한다.
- `draft` 카드도 숨기지 않고 배지로 표시한다.

## 배포

Cloudflare Pages: 빌드 명령 `npm run build`, 출력 `dist`, 환경변수 `SITE_URL`.
GitHub Pages: `main`에 push하면 `.github/workflows/deploy.yml`이 자동 배포한다 (Settings → Pages → Source: GitHub Actions).
