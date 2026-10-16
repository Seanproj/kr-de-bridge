# 한독 행정 브릿지 (가칭) — SPEC

> Claude Code 작업용 명세서. 이 파일과 `data/` 폴더를 새 저장소 루트에 두고 시작한다.
> 작성일: 2026-10-16 · 버전: v1 기획

---

## 1. 한 줄 정의

독일에 사는 한국인이 **한국 일을 독일에서**, **독일 일을 한국인의 눈으로** 처리할 수 있도록
"필요 서류 → 어디서 → 얼마나 걸리는지 → 자주 하는 실수"를 카드 형태로 알려주는 한국어 정보 웹앱.

## 2. 목표 / 비목표

**목표**
- 상황(시나리오)만 고르면 해야 할 일이 순서대로 보인다.
- 모든 정보에 **공식 출처 링크**와 **마지막 확인일**이 붙어 있다.
- 실제 경험담(블로그 글 등)을 카드에 연결해 "사람이 해본 정보"임을 보여준다.
- 링크 하나로 다른 사람에게 공유할 수 있다 (카드별 고유 URL).

**비목표 (v1에서 하지 않음)**
- 회원가입, 로그인, 서버 DB
- 개인 서류·개인정보 저장 (체크리스트 진행 상태만 브라우저 localStorage에 저장)
- 법률·세무 자문 (모든 페이지에 면책 문구)
- 실시간 크롤링 (정보는 사람이 확인해서 JSON으로 관리)

## 3. 대상 사용자

1. 독일에 막 도착한 한국인 (주재원, 동반 가족, 유학생, 휴직 후 동반 체류자)
2. 한국에 부동산·계좌·가족 업무가 남아 있는 장기 체류자
3. 귀국을 준비하는 사람
4. (2차) 이들의 가족 — 링크를 받아서 읽는 사람

## 4. 정보 구조 (IA)

```
홈
├── 상황별 시작하기 (시나리오 카드 3~6개)   ← 첫 화면의 주인공
├── 카테고리 (서류·공증 / 금융·세금 / 연금·보험 / 운전·이동 / 체류·주민 / 가족 / 공공·기타)
├── 검색
└── 최근 업데이트된 카드

카드 상세  /c/{id}
시나리오 상세 /s/{id}   ← 체크리스트 형태, 진행 상태 로컬 저장
정보 제보 /report?card={id}
소개·면책 /about
```

## 5. 화면 명세

### 5.1 홈
- 상단: 서비스 한 줄 소개 + 검색창
- **"지금 어떤 상황인가요?"** 시나리오 카드 (아이콘, 제목, 포함 카드 수, 예상 소요)
- 카테고리 칩 가로 스크롤
- "최근 확인된 정보" 리스트 (checkedAt 최신순 5개)

### 5.2 카드 상세 (핵심 화면)
위에서 아래 순서 고정:
1. 제목 + **방향 태그** (🇰🇷→🇩🇪 / 🇩🇪→🇰🇷 / 🇩🇪 현지 / 🇰🇷 한국 업무) + 방식 태그 (온라인 가능 / 방문 필요 / 예약 필요)
2. **신뢰도 배지**: `확인됨 2026-10-16` / `일부 확인` / `초안 — 확인 필요`
   - checkedAt이 180일 이상 지나면 자동으로 "오래된 정보일 수 있음" 경고
3. 한 줄 요약, "이런 분께 해당" (audience)
4. **진행 순서** (번호 매긴 단계, 각 단계 1~3문장)
5. **준비물** 체크리스트 (탭하면 체크, 로컬 저장)
6. **어디서**: 기관명 + 링크 버튼
7. **소요 기간 / 비용** 2칸 요약
8. **⚠️ 자주 하는 실수** (강조 박스 — 이 앱의 차별점)
9. **경험담**: 블로그 링크 카드 (제목, 작성자, 요약 1~2줄)
10. **공식 출처** 목록 (official / secondary 구분 표시)
11. 관련 카드
12. 하단 고정 버튼: `공유하기` · `정보가 바뀌었어요 (제보)`

### 5.3 시나리오 상세
- 순서가 있는 카드 목록 → 각 항목 체크 가능, 진행률 바
- 각 항목에 "왜 이 순서인가" 한 줄 (예: "Anmeldung 확인서가 있어야 면허 교환 가능")

### 5.4 제보
- v1: `mailto:` 또는 GitHub Issue 템플릿 링크로 연결 (서버 없음)
- 필드: 카드 id(자동), 무엇이 바뀌었나, 근거 링크, (선택) 연락처

## 6. 데이터 구조

정보는 전부 `data/*.json`에 있고, 빌드 시 정적 페이지로 생성한다.

```ts
type Direction = "KR→DE" | "DE→KR" | "DE" | "KR";
type Method = "online" | "visit" | "appointment" | "mail";
type Category =
  | "documents" | "finance" | "pension-insurance"
  | "driving" | "residence" | "family" | "public";

interface Source {
  title: string;
  url: string;
  type: "official" | "secondary";   // 정부·공공기관 = official
}

interface Card {
  id: string;                 // URL slug, kebab-case
  title: string;
  summary: string;            // 한 줄
  category: Category;
  direction: Direction;
  methods: Method[];
  audience: string;           // "이런 분께 해당"
  steps: { title: string; detail: string }[];
  documents: string[];
  where: { name: string; url?: string; note?: string }[];
  duration: string;           // 사람이 읽는 문자열
  cost: string;
  mistakes: string[];
  sources: Source[];
  verification: {
    status: "verified" | "partial" | "draft";
    checkedAt: string | null; // YYYY-MM-DD, 실제로 출처와 대조한 날짜
    toVerify: string[];       // 아직 확인 안 된 주장 목록
  };
  experience: { title: string; author: string; url: string; summary: string }[];
  related: string[];          // card id
  updatedAt: string;
}

interface Scenario {
  id: string;
  title: string;
  icon: string;               // 이모지
  description: string;
  steps: { cardId: string; why: string }[];
}
```

**규칙**
- `verification.status === "draft"`인 카드는 화면에 "초안 — 확인 필요" 배지를 반드시 표시한다. 숨기지 않는다.
- `checkedAt`은 사람이 출처와 직접 대조한 날짜만 넣는다. 추정 금지.
- 금액·기한 같은 숫자는 반드시 `sources`의 official 출처로 뒷받침되어야 `verified`가 될 수 있다.

## 7. 기술 스택 (권장)

| 항목 | 선택 | 이유 |
|---|---|---|
| 프레임워크 | **Astro** (정적 생성) | 콘텐츠 중심, 빠름, 카드별 URL·SEO |
| 스타일 | Tailwind CSS | 빠른 모바일 UI |
| 검색 | Pagefind | 정적 사이트 전문 검색, 서버 불필요 |
| PWA | @vite-pwa/astro | 홈 화면 설치, 오프라인 열람 |
| 데이터 검증 | zod (Astro content collections) | JSON 스키마 오류를 빌드에서 차단 |
| 배포 | Cloudflare Pages 또는 GitHub Pages | 무료, 커스텀 도메인 |
| 로컬 상태 | localStorage (try/catch 감싸기) | 체크리스트 진행 상태만 |

모바일 우선: 기준 폭 375px, 터치 영역 44px 이상, 다크 모드 지원.

## 8. 콘텐츠 유지보수 자동화

- **링크 검사**: GitHub Action이 월 1회 모든 `sources.url`을 확인해서 깨진 링크를 Issue로 등록
- **오래된 정보 리포트**: checkedAt이 180일 넘은 카드 목록을 같은 Action이 Issue로 등록
- **스키마 검사**: PR마다 `data/*.json`을 zod로 검증

## 9. 개발 순서 (Claude Code 작업 단위)

1. Astro + Tailwind 프로젝트 생성, `data/cards.json` · `data/scenarios.json`을 content collection으로 연결, zod 스키마 작성 → 빌드에서 현재 데이터가 통과하는지 확인
2. 카드 상세 페이지 (5.2 순서 그대로), 신뢰도 배지 + 180일 경고 로직
3. 홈 (시나리오, 카테고리, 최근 확인)
4. 시나리오 상세 + 체크리스트 localStorage
5. Pagefind 검색
6. 공유 버튼 (Web Share API, 미지원 시 링크 복사), OG 이미지 (카드 제목 들어간 정적 이미지)
7. PWA 설정
8. 제보 링크 (GitHub Issue 템플릿)
9. GitHub Actions: 스키마 검사, 월간 링크·신선도 검사
10. 배포

## 10. 완료 기준 (v1)

- [ ] 15개 카드, 3개 시나리오가 모두 렌더링되고 카드별 URL이 있다
- [ ] 모든 카드에 신뢰도 배지와 공식 출처가 보인다
- [ ] 375px 폭에서 가로 스크롤 없음, Lighthouse 모바일 성능 90+
- [ ] 오프라인에서 이미 열어본 카드가 열린다
- [ ] 검색으로 "아포스티유", "면허", "연금" 등이 찾아진다
- [ ] 면책 문구가 모든 카드 하단에 있다

## 11. 면책 문구 (모든 카드 하단)

> 이 정보는 개인 경험과 공개 자료를 정리한 것으로 법률·세무 자문이 아닙니다.
> 제도는 바뀔 수 있으니 진행 전 반드시 각 기관의 공식 안내를 확인하세요.

## 12. v2 이후 아이디어

- 카드 40~50개로 확장 (SPEC 부록 A 목록 참고)
- 독일 기관 편지에서 기한·할 일 추출 (Claude API, 사진은 저장하지 않음)
- 영어·독일어 병기 용어집 (Anmeldebestätigung = 거주지등록확인서 등)
- 블로그 글과 카드의 양방향 연결

## 부록 A. 확장 후보 카드

서류: 여권 재발급, 공인번역사 찾기, 졸업·경력증명서 발급과 anabin 학위 인정
금융: 비거주자 계좌 전환, 세법상 거주자 판정, 한국 임대소득과 이중과세, 독일 세금신고의 해외소득
보험: 독일 공보험 vs 사보험, 한국 실손보험 유지 여부
체류: 비자 연장(Ausländerbehörde), 한국 주민등록 해외이주 신고 vs 유지
가족: 독일 출생신고 → 한국 가족관계 등록, 독일 혼인 → 한국 혼인신고, 자녀 국적
생활: 한국 택배 통관(Zoll), 방송수신료(Rundfunkbeitrag), 계약 해지 기한
