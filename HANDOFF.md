# Handoff: OvenMediaLabs site rebuild (Docusaurus migration)

> 이 문서를 새 Claude 세션에 그대로 넘기면 컨텍스트 회복 가능. 최신 갱신: 블로그 디자인 개편 + 이미지 평탄화 (upstream PR 머지 완료) 직후.

## 1. 프로젝트 한 줄 정리

OvenMediaLabs (구 AirenSoft)는 마케팅 사이트(현재 `ovenmedialabs.com`, 정적 HTML), Medium 엔지니어링 블로그(`medium.com/@OvenMediaEngine`), 그리고 GitBook 매뉴얼들(`docs.ovenmediaengine.com`, `docs.enterprise.ovenmediaengine.com`, `docs.ovenplayer.com`)을 **하나의 Docusaurus 3.10 사이트**로 통합 중. `/blog/*`, `/docs/ome/`, `/docs/ome-enterprise/`, `/docs/ovenplayer/` 서브패스 구조.

- 레포: `https://github.com/OvenMediaLabs/airensoft.com` (디렉토리명은 레거시)
- 작업 브랜치: **`feat/docusaurus-migration`** (메인은 `main`)
- 프로덕션: GitHub Pages, CNAME `ovenmedialabs.com`
- 새 도메인 후보: `ovenmedialabs.com` 그대로

## 2. 사용자가 정한 핵심 룰

- 사이트 이름은 **ovenmedialabs.com** (airensoft.com 아님). 커밋/PR prefix는 `feat:`. 단 **upstream 레포(OvenMediaEngine 등)는 그쪽 컨벤션 따름** — 거기선 `docs:` / `build:` 등을 씀.
- PR 본문은 **Summary + Why만**. Test plan / What changed / After merge 같은 섹션은 노이즈 — 리뷰어가 diff 보면 다 알 수 있으니 안 씀.
- 인터럽트 시 즉시 멈추고 명시적 진행 신호 대기.
- 파일 참조는 markdown 링크 (예: `[src/file.ts](src/file.ts#L42)`). backtick으로 감싸지 않음.
- 블로그 본문에서 em-dash(—), en-dash(–)를 문장 구두점으로 쓰지 않기. 쉼표/마침표/콜론/괄호 사용.
- 편집자는 비개발자지만 HTML/Markdown 가능. 개발자 PR도 받음. Markdown 우선.

## 3. 현재 상태 (이 세션 끝 시점)

### 빌드 / 서버
- `npm install` 완료. Node 20+ 필요.
- `npm start -- --port 3100` 으로 dev 서버 동작 (3000은 다른 프로세스 점유 중).
- `npm run build` production 통과. 경고만 있고 에러 없음.
- onBrokenLinks / onBrokenAnchors는 현재 `warn`. 컷오버 직전 `throw`로 flip 예정.

### Git
- 브랜치: `feat/docusaurus-migration` (이전 `hugo-migration`에서 rename).
- 최근 커밋:
  - `431b7da0d feat: redesign blog, drop image wrapper, rewrite Medium links`
  - `073596fc4 feat: refine blog tags with news/case-study/benchmark/tutorial`
  - `4ca602685 feat: migrate 35 Medium posts to local blog`
  - `66d4523c7 feat: brand polish + marketing pages for the new Docusaurus site`
- 트리 clean. 미커밋 변경 없음.

## 4. 이미 끝난 작업

### 4.1 Scaffold (이전 세션들)
- Docusaurus 3.10.1 + React 19 + `@docusaurus/faster` (RSpack) + TypeScript.
- `docusaurus.config.ts`, `sidebars*.ts` 다수 (각 docs source 별).

### 4.2 디자인 / 브랜드
- **OvenMedia Labs 컬러 팔레트** 적용 (이전 yellow `#ffb800` 사용 중단):
  - `--omb-navy-deep #14274E`, `--omb-navy #394867`, `--omb-blue-gray #9BA4B4`, `--omb-tan #C5A38E`, `--omb-sky #38BDF8`
  - 모든 yellow 흔적 brand 컬러로 교체됨.
- 커스텀 Prism 코드 테마 (`omeCodeTheme`) — 차분한 5색, 눈에 덜 자극.
- 사이드바: 그룹 라벨(annotation) trailing fade line + 브랜드 컬러, depth 1 wrapper 제거하고 실제 메뉴가 depth 1에 위치.
- Edit this page 링크 + Previous/Next pagination 숨김 (`.pagination-nav { display: none }`).
- Admonition / details 폰트 축소.
- 이미지 흰 배경 카드 wrapper — 어두운 페이지 배경에서 흰 다이어그램 가독성 확보.
- 마케팅 페이지: `src/pages/index.mdx`, `ome.mdx`, `company.mdx`, `contact.mdx`, `latency.mdx`, `ome-enterprise.mdx`, `agplv3.mdx`, `eula.mdx`, `404.mdx`.

### 4.3 Docs 통합 (3-source)
- 3개 upstream의 `docs-site/` 폴더를 직접 import. **MDX 원본을 upstream에 두고 downstream으로 sync**:
  - `OvenMediaLabs/OvenMediaEngine` (OSS) → `docs/ome/`
  - `OvenMediaLabs/OvenMediaEngineEnterprise` → `docs/ome-enterprise/`
  - `OvenMediaLabs/OvenPlayer` → `docs/ovenplayer/`
- **각 upstream에 PR 머지됨** (브랜치 `feat/docusaurus-migration`).
- 동기화 스크립트: [scripts/sync-docs.sh](scripts/sync-docs.sh) — `git read-tree --prefix=$prefix/ -u $remote/master^{tree}:docs-site` 사용 (subtree split보다 빠름, Enterprise 같은 큰 history도 즉시).
- GitBook 변환 스크립트 [scripts/migrate-docs.py](scripts/migrate-docs.py)는 풀 전환 끝나기 전까지 보관 (재사용 가능성).

### 4.4 Blog (이전 세션)
- **35개 Medium 글 마이그레이션 완료** — `blog/<YYYY-MM-DD>-<slug>/index.mdx`.
- 188개 이미지 Medium CDN에서 다운로드, co-located.
- 스크립트: [scripts/migrate-medium.py](scripts/migrate-medium.py). 표준 라이브러리만 사용. 재실행 안전.
- Frontmatter: `slug`, `title`, `description`, `authors: [ovenmedialabs]`, `date`(원본 ISO), `tags`(자동 분류), `image`(첫 이미지), `canonical_url`(원본 Medium URL).
- 자동 태그: webrtc / llhls / srt / sub-second-latency / fundamentals / ome / news / case-study / benchmark / tutorial.
- [scripts/medium-redirects.json](scripts/medium-redirects.json) — 35개 Medium canonical URL → `/blog/<slug>` 매핑 (향후 도메인 리다이렉트 레이어용).
- `blog/authors.yml`, `blog/tags.yml` 정의됨. `welcome-to-our-new-blog` 1개 + Medium 34개 = 총 35 글.

### 4.5 Blog 디자인 + 이미지 표면 개편 (이 세션)
- **"OvenMedia Labs"** (띄어쓰기) 공식 명칭으로 통일 — docusaurus.config.ts (title/blogTitle/blogDescription/feed/copyright), blog/authors.yml, welcome 글, swizzle 컴포넌트. GitHub org/URL의 `OvenMediaLabs`는 그대로 둠 (path는 변경 불가).
- **목록 페이지** — horizontal 카드 (좌 16:9 썸네일 + 우 텍스트), 작성자 블록 제거, description 발췌 line-clamp, 태그 pill. [src/theme/BlogPostItem/index.tsx](src/theme/BlogPostItem/index.tsx) + [styles.module.css](src/theme/BlogPostItem/styles.module.css).
- **본문 페이지** — 좌측 "Recent Posts" 사이드바 숨김 (글 상세에서만), 본문 폭 760px로 좁히고 row justify-content: center로 가운데 정렬, 작성자 한 줄 컴팩트 (아바타 36px + 이름 + 부제), 소셜 아이콘 숨김, 첫 문단 lede 강조 + 아래 hairline, h2 위 hairline. Footer Tags 라벨 숨기고 pill을 목록과 통일. "Edit this page" 제거 (config의 `editUrl` 삭제).
- **마케팅 영역 (글 끝)** — [src/theme/BlogPostItem/PostFooterExtras.tsx](src/theme/BlogPostItem/PostFooterExtras.tsx): 그라데이션 Product CTA 배너 (Get started + Star on GitHub), "You might also like" 3카드 (태그 오버랩 점수 + 날짜 fallback), "View all posts →" 링크.
- **데이터 소스** — [scripts/build-blog-index.py](scripts/build-blog-index.py)가 모든 blog/<slug>/index.mdx frontmatter를 [src/data/blog-index.json](src/data/blog-index.json)으로 추출 (36개). frontmatter 바뀌면 재실행 필요. 자동화는 미정.
- **아바타** — [static/images/airen_ci/OML_Symbol_White.svg](static/images/airen_ci/OML_Symbol_White.svg) 새로 만듦 (Symbol_Default 복제 후 흰색 톤). 다크 배경에서 깨져 보이던 문제 해결.
- **Medium 내부 링크 → 로컬 path 변환** — [scripts/rewrite-medium-links.py](scripts/rewrite-medium-links.py): 35개 redirects.json 매핑 사용. 12개 링크 / 6개 글에 적용됨. canonical_url frontmatter는 의도적으로 유지 (SEO).
- **이미지 흰 wrapper 제거 + 다이어그램 평탄화** — [scripts/flatten-transparent-images.py](scripts/flatten-transparent-images.py): docs/blog 의 투명 PNG 55개에 흰 배경 + 24px 흰 테두리 baking. `static/images/`는 제외 (CI 로고). `.gitignore`에 `.alpha-backup/` 추가. CSS의 `.markdown img { background: white; padding }` wrapper 삭제, layout만 남김.
- **Upstream PR 머지됨** — 다이어그램 평탄화는 sync 덮어쓰기 방지 위해 upstream에도 반영:
  - OvenMediaEngine PR #2121 (4 files) — 머지
  - OvenMediaEngineEnterprise PR #49 (5 files) — 머지
  - OvenPlayer — 변환 대상 없음
  - [scripts/sync-docs.sh](scripts/sync-docs.sh) 재실행으로 downstream 동기화 확인 완료.

### 4.6 CI / 배포
- `.github/workflows/deploy.yml` — main push 시 GH Pages 빌드 + 배포. Node 22, `NODE_OPTIONS=--max-old-space-size=4096`.
- CNAME `ovenmedialabs.com` 이미 `static/`에 있음.

## 5. 앞으로 할 일 (우선순위 순)

### A. 블로그 후속 (선택적)
1. **`prebuild` hook으로 [scripts/build-blog-index.py](scripts/build-blog-index.py) 자동화** — 현재는 frontmatter 바꿀 때 수동으로 재실행. `package.json`에 prestart/prebuild로 묶는 게 안전.
2. **관련글 카드 썸네일 추가** (선택) — 지금은 텍스트만. 필요하면 처음 이미지를 `/static/blog-thumbs/<dir>/`에 복사해서 활용.
3. **GTM/Cookiebot 동작 검증** — 아래 D.16과 동일.

### B. 가까운 우선순위 (자동화 / 편집자 UX)
4. **자동 sync 워크플로** — GitHub Action으로 [scripts/sync-docs.sh](scripts/sync-docs.sh) 주기/이벤트 실행 → 자동 PR.
5. **사이드바 유지 정책 결정** — 편집자가 페이지 추가 시 `sidebars-*.ts` 어떻게 갱신할지: (a) 손으로 (현재), (b) Docusaurus autogenerated 전환, (c) 미니 sidebar-gen 스크립트.
6. **편집자용 로컬 프리뷰 스크립트** — 각 upstream `docs-site/preview.sh`: `~/.cache/ovenmedialabs-preview`에 사이트 clone + 현재 docs-site를 symlink + `npm start`. 외부 기여자 PR 전 로컬 확인용. Mac/Linux 우선, Node + git만 있으면 됨.
7. **npm start 자동 sync** (선택) — prestart hook으로 [scripts/sync-docs.sh](scripts/sync-docs.sh) 자동 실행.

### C. 콘텐츠 / 기능
8. **모바일 breakpoint 검증** — 사이드바/카드/타이포 깨짐 확인.
9. **API docs (OpenAPI)** — REST/WebSocket API 레퍼런스 자동 생성. `docusaurus-plugin-openapi-docs` 후보. OME에 OpenAPI 스펙 있는지 확인 필요.
10. **301 리다이렉트 맵** — GitBook URL → 새 `/docs/...`. (Medium 쪽은 [scripts/medium-redirects.json](scripts/medium-redirects.json) 이미 있음.)

### D. 빌드 경고 정리 (컷오버 전)
11. **`/docs/ome/transcoding` 중복 라우트**: upstream OvenMediaEngine 레포의 `docs-site/transcoding/`에 `README.md`(title: ABR and Transcoding)와 `transcoding.md`(title: Transcoding)가 같은 URL로 매핑됨. **upstream에서 슬러그/파일명 수정 필요** — downstream 수정은 sync 시 덮어쓰임.
12. **누락 이미지 워닝 정리** — 일부 페이지에 broken image link.
13. **onBrokenLinks / onBrokenAnchors → throw flip** — 위 둘 다 잡고 나서 컷오버 직전에.
14. **`/ome#ovenplayer`, `/ome#ovenlivekit` broken anchor**: false positive — [src/pages/ome.mdx](src/pages/ome.mdx)에 `id=...`가 존재하므로 런타임 정상. Docusaurus 빌드 체커가 HTML element id를 못 봄. `throw` flip 시 ignore 처리 필요.
15. **HTML minifier 경고**: 기존 docs의 nested `<a>` (release-notes 다수). upstream 정리 필요.
16. **GTM + Cookiebot 검증** — `docusaurus.config.ts`의 GA/GTM/Cookiebot 셋업이 새 사이트에서 실제 동작 확인 (legacy `index.html` lines 46-77 참조).

### E. 컷오버
17. **GitBook 도메인 리다이렉트** — `docs.ovenmediaengine.com`, `docs.enterprise.*`, `docs.ovenplayer.com` → 새 페이지 매핑.
18. **`ovenmedialabs.com` DNS 전환 + HTTPS**.
19. **Production 빌드 + 배포 파이프라인 최종 확인** — GH Pages 동작.
20. **main 머지 + 브랜치 정리**.

## 6. 핵심 파일 / 디렉토리

```
docusaurus.config.ts            ← site config, navbar/footer/headTags/Prism theme, 3 docs plugin instances
sidebars-ome.ts                 ← OME OSS 사이드바 (수동 유지)
sidebars-ome-enterprise.ts      ← Enterprise 사이드바
sidebars-ovenplayer.ts          ← OvenPlayer 사이드바

scripts/
├── sync-docs.sh                ← upstream docs-site/ → 로컬 docs/<source>/ 동기화 (git read-tree)
├── migrate-docs.py             ← GitBook → MDX 변환기 (legacy, 풀 전환 후 archive)
├── migrate-medium.py           ← Medium HTML → blog MDX 변환기 + redirects.json 생성
└── medium-redirects.json       ← 35개 Medium URL → /blog/<slug> 매핑

src/
├── pages/                      ← 마케팅 페이지 + 404
├── theme/                      ← Navbar/Footer swizzle
├── clientModules/              ← bootstrap-dark, legacy-marketing.ts
└── css/
    ├── custom.css              ← Infima + 브랜드 팔레트 + 사이드바/코드/이미지 커스텀
    └── legacy-marketing.css    ← 레거시 style.css 복사본

docs/
├── ome/                        ← OSS docs (upstream sync)
├── ome-enterprise/             ← Enterprise docs (upstream sync)
└── ovenplayer/                 ← OvenPlayer docs (upstream sync)

blog/                           ← 35개 글 + authors.yml + tags.yml
└── <YYYY-MM-DD>-<slug>/
    ├── index.mdx
    └── *.png / *.jpeg          ← co-located images

static/
├── images/, assets/, CNAME, robots.txt, .htaccess

.github/workflows/deploy.yml    ← GH Pages 배포

HANDOFF.md                      ← 이 문서
```

## 7. 자주 마주치는 gotcha

- **MDX 3 admonition**: `:::info[Title]` (대괄호). v2 형식 (`:::info Title` 공백)은 깨짐.
- **`<Identifier>` 본문 escape**: `<Instance_IP>` 같은 텍스트는 MDX가 JSX 컴포넌트로 파싱 시도. `&lt;Instance_IP>` 로 escape 필요. (migrate-medium.py에서 이미 처리됨.)
- **`{` / `}` 본문 escape**: 마찬가지로 `&#123;` / `&#125;` 처리.
- **이미지 import 경로**: depth 0(같은 디렉토리)도 `./` prefix 필요. 그냥 파일명만 쓰면 webpack이 못 찾음.
- **`*`가 들어간 파일명**: Medium의 `1*xxxx.png`처럼 `*` 들어가면 webpack glob 충돌. `-`로 정규화.
- **공백/괄호 들어간 GitBook asset 이름**: URL 디코드 후 `[^\w.\-/]+` → `-` 치환. (migrate-docs.py 처리.)
- **사이드바 잘림 (짧은 본문)**: `.docSidebarContainer min-height: calc(100vh + var(--ifm-navbar-height))` 필요. clip-path도 주의.
- **사이드바 horizontal scroll**: `overflow-x: hidden !important` 명시 (overflow-y: auto가 overflow-x: visible을 auto로 promote).
- **Bootstrap dark**: `<html data-bs-theme="dark">`. `headTags`의 inline script + clientModule 둘 다 유지 (FOUC 방지).
- **마케팅 페이지 full-bleed**: `wrapperClassName: marketing-page` + `hide_table_of_contents: true` 프론트매터, CSS에 `.marketing-page main { max-width: none }`.
- **upstream 수정 vs downstream 수정**: docs/ome/, docs/ome-enterprise/, docs/ovenplayer/ 안의 파일은 sync 시 덮어쓰임. 항상 **upstream 레포에서 PR**.

## 8. 외부 시스템 / 참조

- Upstream 3개 레포 (모두 `OvenMediaLabs/` org):
  - `OvenMediaEngine` (OSS, public)
  - `OvenMediaEngineEnterprise` (private, GitHub PAT 필요 — `GITHUB_TOKEN` env)
  - `OvenPlayer`
- Medium export 디렉토리: `/Users/getroot/Downloads/medium-export-7bdeda746d7ad07f255675403aca74c25c06130c33fc4753aef47fccd6b876df/` (재실행 시 필요)
- Memory: `/Users/getroot/.claude/projects/-Users-getroot-Project-airensoft-com/memory/`
  - `project-naming.md` — ovenmedialabs.com, feat: prefix
  - `feedback-pause-and-wait.md` — 인터럽트 처리
  - `feedback-pr-body-scope.md` — PR 본문 최소화

## 9. 새 세션 첫 단계

1. `npm install && npm start -- --port 3100`. http://localhost:3100/blog/ 에서 글 35개가 horizontal 카드 레이아웃으로 보이는지 확인. /docs/ 3개 정상. 아무 글이나 열어서 CTA 배너 + "You might also like" 3카드 표시되는지.
2. `git log -1` — 최신 커밋 `feat: redesign blog, drop image wrapper, rewrite Medium links` 확인. 트리 clean.
3. 사용자 지시 기다리기. §5 A/B/C/D 중 상황에 맞게.

행운을.
