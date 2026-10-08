# USA 2026 · 미국 이공계 진로체험학습 안내 사이트

경기북과학고등학교 1학년 해외 이공계 진로체험학습(2026. 10. 15.~10. 23., 미국 동부 6박 9일) 안내 사이트입니다.
장을 한 장씩 넘기면 그 순서가 곧 시간표이고 버스 동선이며, 지도가 앞 장소에서 이 장소까지 오는 길을 따라 그립니다.

- 사이트: https://shinnanchanguk.github.io/gbshs-usa-2026/ (ZUDO 로그인으로 들어와요. ZUDO 학생·학부모·교직원 첫 화면의 「미국 체험학습 안내」)
- 내용 출처: 운영계획(안)·수정(안), 9/21 사전답사 결과 공유 회의, 9/30 학생 브리핑·면책/의료 동의서 설명, 버스 좌석표·객실 배치도, 답사 사진, 10/1 인솔 선생님 피드백(3차)

## 무엇이 들어 있나

| 묶음 | 내용 |
|---|---|
| 출발 전 | 날짜별 할 일, 면책·의료 동의서 쓰는 법, 챙길 것(체크), 꼭 지킬 약속, 돈과 결제(팁 계산), 휴대폰·비행 준비, 버스와 내 자리, 숙소와 방, 멘토, 비상 연락처 |
| 1~9일차 | 일차 표지(식사·숙소·시간 척추) → 장소마다 한 장: 시각·머무는 시간, 오는 길(수단·시간·거리), 사진, 할 일, 꼭 지킬 것, 답사 선생님 요령, 다시 모이는 곳·시각 |
| 다녀와서 | 도착 뒤 일정, 발표회 보고서(느낀 점을 활동 주제별로 모아 초안 복사) |

역할(오른쪽 위 사람 단추)

- 학생: 내 호차·자리·짝·방·도우미 역할, 장소마다 현장 기록(사진 5장까지 + 느낀 점·메모, 느낀 점은 활동 주제 표시)
- 선생님: 장마다 인원 확인(반별 번호판 또는 버스 좌석표), 선생님 메모(자료가 바뀐 점·확인할 것), 업무 분장·야간 근무, 공지하기·팝업 관리(보호자에게도 띄울지 고름), 학생 느낀 점을 살핌 설문용 엑셀로 받기
- 보호자: 모든 시각 옆에 한국 시각, 우리 아이 자리·방, 우리 아이가 장소마다 남긴 사진·메모(「발표회 보고서」 장에서 모아 보기), '보호자 화면에도 띄우기'로 올린 공지

지도는 MapLibre + OpenFreeMap(키 없음)이고, 장소 사이 길은 OSRM(OpenStreetMap)으로 미리 계산해 `content/routes.json`에 넣어 두었습니다.
한 번 연 화면·사진·지도는 기기에 저장돼 해외에서 인터넷이 약해도 열립니다(서비스 워커).

> **DB가 아직 없습니다.** 느낀 점·사진·인원 확인·체크리스트·공지는 그 휴대폰에만 저장됩니다(보호자는 지금은 아이 휴대폰에서만 아이 기록을 봅니다). 저장 코드는 `src/lib/repo.ts` 한곳(사진 바이트는 `src/lib/photoStore.ts`)에 모아 두어 로그인·DB를 붙일 때 이 두 파일만 바꾸면 됩니다.

### 장소마다 현장 기록(사진·메모)

느낀 점 장과 대학·특강·견학·식사·쇼핑 장소 장에 「현장 기록」 칸이 있습니다(`canRecord`, `src/content/index.ts`).
학생은 이름을 고른 뒤 장소마다 사진을 5장까지 올리고 느낀 점(또는 짧은 메모)을 씁니다. 사진은 휴대폰에서 긴 변 1600px JPEG로 줄이며 다시 그려서 촬영 위치(GPS) 같은 EXIF 정보가 빠지고, 기기의 IndexedDB에 저장됩니다.
보호자 화면은 자녀 기록을 읽기만 하고, 선생님 화면과 학생 사전 안내판에는 이 칸이 없습니다. DB를 붙일 때 지킬 접근 규칙은 `useFieldPhotos` 주석에 있습니다.

### 느낀 점 → 살핌 설문 엑셀

선생님 메뉴의 「살핌 설문용 엑셀 받기」는 살핌(`salpeeem`) 설문 양식 그대로 엑셀을 만듭니다(`src/features/reflection/salpeemExport.ts`).
시트 `설문응답`, 첫 줄 `학번 · 이름 · 질문…`, 학생 한 명이 한 줄입니다. 학번은 네 자리(학년 1 + 반 1 + 번호 2, 예 1103)라 살핌 학번 체계를 `G1C1N2`로 두고 올리면 됩니다.
질문 칸은 느낀 점을 쓰는 장마다 하나이고 제목은 `[2일차 장 제목] 질문`입니다. 살핌이 "질문: 답"을 첫 쌍점에서 가르고 `타임스탬프·이메일·응답시간` 같은 칸을 건너뛰므로, 질문 제목에는 쌍점과 그 낱말을 남기지 않고 답은 한 줄로 만듭니다.
살핌은 학번과 이름이 명단과 둘 다 맞는 학생만 받으니, 살핌 학생 명단을 먼저 등록해 두어야 합니다.

## 학생 사전 안내판 (비밀번호 없는 링크)

https://shinnanchanguk.github.io/gbshs-usa-2026/guide/

같은 코드를 한 번 더 빌드해(`vite.guide.config.ts`, `__GUIDE__`) 입장 코드 없이 여는 학생용 사전 안내판입니다.
준비물·날짜별 할 일·약속·여행 일정·지도·장소 안내는 그대로 보이고, 명단에서 오는 것(버스 자리·방 배정·인솔 선생님 연락처·멘토 이름·도우미 역할)은 "추후 공지 예정"으로 가립니다.
느낀 점 쓰기·발표회 보고서 장·공지·선생님 기능은 빠지고, 암호문 명단 파일도 들어가지 않습니다(`src/lib/edition.ts`).

- 빠진 기능을 가리키는 내용 문장은 `content/guide-overrides.json`에서 사전 안내판에서만 바꿔 보여 줍니다. 원래 문장을 고치면 이 파일의 `from`도 같이 고쳐야 하고, `npm run check`가 어긋나면 알려 줍니다.
- `npm run build`가 본 사이트(`dist/`)와 사전 안내판(`dist/guide/`)을 함께 만듭니다. 사진은 본 사이트에 올린 것을 같이 씁니다.
- 사전 안내판은 서비스 워커를 두지 않고, 본 사이트 서비스 워커는 `/guide/` 주소를 건드리지 않습니다.
- `npm run build` 끝에서 `scripts/check-guide.mjs`가 사전 안내판에 암호문 명단·복호화 코드·선생님 메모가 없는지 보고, 있으면 빌드를 멈춥니다(명단 파일이 있는 컴퓨터에서는 이름·전화번호까지 확인).

## ZUDO 로그인과 명단 (공개 레포)

들어오는 길은 ZUDO(학교 기숙사 시스템, https://zudo.my) 로그인입니다(2026-10-07).

- ZUDO 의 「미국 체험학습 안내」 배너 → `/trip-handoff` 가 5분짜리 한 번 쓰는 코드를 만들어 `#/zudo/<코드>` 로 보냅니다.
- 이 사이트가 코드를 `POST /api/trip/session` 으로 기기용 토큰(10/25까지)과 바꿔 기기에 저장합니다(`src/lib/zudo.ts`). 그다음부터는 ZUDO 로그인 없이, 인터넷 없이도 열립니다.
- 대상: 1학년 학생, 인증을 마친 1학년 학부모(자녀 고정), 인솔 교사 허용 목록. 판정은 ZUDO 가 요청마다 다시 합니다(`zudo/src/lib/trip/access.ts`).
- 서버 자료는 ZUDO 에만 있습니다: 학생 개인 항공권 PDF(비공개 저장공간), 아침 기상 확인 기록. 이 레포에는 비밀값이 없습니다.
- 「이 기기에서 잠그기」는 명단 열쇠·기기 토큰·저장한 항공권을 지웁니다.

학생 이름·좌석·객실·인솔교사 연락처·멘토 이름은 **암호문(`content/roster.enc.json`)으로만** 레포에 있습니다.
명단 열쇠로 PBKDF2(60만 번) 열쇠를 만들어 AES-GCM으로 풉니다. 건강 정보(요보호 학생 명단)는 암호문에도 넣지 않습니다.

- 열쇠·원본은 레포 밖 `private/`(.gitignore)에만 있습니다: `private/access-code.txt`, `private/roster.json`
- 명단 열쇠는 영문 대문자·숫자 26자 무작위입니다. ZUDO 로그인 또는 아래 비상용 PIN 확인을 마치면 서버가 넘겨줍니다(ZUDO 환경변수 `TRIP_ROSTER_CODE` 와 같은 값). 사람이 직접 입력할 필요는 없습니다.
- 명단이 바뀌면 `private/roster.json`을 고친 뒤 `npm run roster:seal`로 암호문을 다시 만듭니다. ZUDO 로 들어온 기기는 저장해 둔 열쇠로 저절로 다시 엽니다.
- 열쇠를 바꾸려면 `private/access-code.txt`를 지우고 `npm run roster:seal` → 같은 값을 ZUDO 의 `TRIP_ROSTER_CODE` 로.
- 비상용: 첫 화면의 「비상용 PIN으로 열기」에서 선생님께 받은 숫자 6자리를 입력합니다. 처음 열 때는 인터넷이 필요합니다. `POST /api/trip/access-code`가 서버에서 PIN을 확인한 뒤 명단 열쇠만 넘겨줍니다. ZUDO 계정이나 항공권·기상 확인 권한은 생기지 않습니다.
- 비상용 PIN은 ZUDO 서버의 `TRIP_FALLBACK_PIN`에만 설정하고, 로컬 사본은 `private/fallback-pin.txt`에 둡니다. 이 값으로 명단을 다시 암호화하지 않습니다. 서버가 시도 횟수를 제한할 수 있도록 명단 열쇠와 PIN을 분리합니다.
- 예전에 받은 `https://shinnanchanguk.github.io/gbshs-usa-2026/#/code/<열쇠>` 링크도 계속 열립니다(열쇠는 `#` 뒤라 서버로 가지 않음). 화면에서 긴 열쇠를 직접 입력하는 방식은 없습니다.
- 예전(2026-10-07 전) 6자리 코드로 봉한 암호문은 git 기록에 남아 있습니다. 그 판들은 6자리라 풀릴 수 있다고 보고 다룹니다.

## 오프라인 안내 PDF

`npm run build` 마지막에 `scripts/build-offline-pdf.mjs` 가 인쇄용 화면(`#/print`, `src/features/print/PrintGuide.tsx`)을 A4 PDF 로 떠서 `dist/offline/USA2026_offline-guide.pdf` 에 둡니다(이름 없는 공개 내용: 비상 연락처·숙소·항공편·아침 출발·일차별 일정과 다시 모이는 곳·약속·챙길 것).
메뉴의 「오프라인 안내 PDF 받기」를 누르면 본 사이트는 휴대폰에서 ① 내 정보 쪽(자리·방·짝·도우미·인솔 선생님 연락처) ② 공통 안내 ③ 내 항공권을 한 파일로 합칩니다(`personalPdf.ts`, pdf-lib). 사전 안내판은 공통 안내만 받습니다.

## 폴더 구조

```
content/
  trip.json              여행 전체: 반·버스·숙소·항공·마감일·챙길 것·연락처·서류 작성법·멘토
  days/day0.json         출발 전
  days/day1~9.json       일차별 장
  days/day10.json        다녀와서
  seating.json           버스 좌석 구조(이름 없음)
  routes.json            장소 사이 실제 길(npm run routes 로 만듦)
  roster.enc.json        명단 암호문(npm run roster:seal 로 만듦)
  photo-sources.json     사진 목록 (npm run photos:import 가 만듦)
src/
  content/schema.ts      데이터 구조 설명 + 검사 규칙 ← 내용 고치기 전에 먼저 읽기
  content/index.ts       장을 한 줄로 이어 붙이고 앞 장소·길·시각을 계산
  features/…             지도, 넘기기, 장 화면, 위젯(좌석·방·연락처·보고서), 출석, 느낀 점
  lib/repo.ts            사용자 기록 저장(지금은 기기 저장, 나중에 DB)
  lib/roster.ts          명단 암호문 풀기
  styles/                디자인(크로마 테마: 도름슬라이드 경기도교육청 연수 덱)
public/sw.js             오프라인 저장
scripts/
  check-content.mjs      내용 검사 (빌드 전에 자동 실행, 공개 파일에 명단 이름이 새는지도 검사)
  build-routes.mjs       장소 사이 길 받기
  seal-roster.mjs        명단 암호문 만들기
  import-photos.mjs      답사 사진 → 웹용 WebP (EXIF·GPS 제거)
```

## 내 컴퓨터에서 실행하기

Node.js 22 이상이 필요합니다.

```bash
npm install
npm run dev        # http://localhost:5173/gbshs-usa-2026/
npm run check      # 내용 검사만
npm run build      # 검사 + 타입 검사 + 배포용 빌드(dist/)
npm run routes     # 장소 좌표를 바꿨으면 길 다시 받기
```

미리 보기: 주소에 `?now=2026-10-16T10:30-04:00`을 붙이면 그 순간이 "지금"인 것처럼 보입니다.

## 내용 고치기

1. `content/days/dayN.json`에서 해당 장(`id`로 찾기)을 고칩니다. 칸의 뜻은 `src/content/schema.ts` 주석에 있습니다.
2. 장소 좌표를 바꿨으면 `npm run routes`로 길을 다시 받습니다.
3. `npm run check`로 검사하고, 커밋해서 `main`에 push하면 GitHub Actions가 다시 배포합니다(1~2분).

주의할 점

- 장 `id`는 바꾸지 마세요. 링크와 느낀 점·출석 기록이 id에 묶여 있습니다.
- 좌표는 `[경도, 위도]` 순서입니다. 구글 지도에서 복사한 `(위도, 경도)`와 반대입니다.
- **공개 레포입니다.** 학생·교사 이름, 전화번호, 건강 정보, 객실·좌석 배정은 공개 파일에 넣지 마세요(`npm run check`가 `private/roster.json`의 이름으로 공개 파일을 검사합니다).

## 사진 추가하기

1. 구글 드라이브에서 답사 사진 폴더를 받아 압축을 풉니다. 폴더 모양은 `N일차_날짜/NN_분류_장소/사진.jpg`여야 합니다.
2. 레포 **밖** 폴더에 두고 `npm run photos:import -- ../답사사진`을 실행합니다.
3. 새 사진을 알맞은 장의 `photos`에 넣습니다. 쓰지 않을 사진은 `content/photo-excluded.json`에 이유와 함께 적습니다.

## 배포

`main` 브랜치에 push하면 `.github/workflows/deploy.yml`이 검사 → 빌드 → GitHub Pages 배포를 합니다.

## 사용한 것과 라이선스

- React, Vite, TypeScript, MapLibre GL JS, [SheetJS](https://sheetjs.com)(xlsx 0.20.3, Apache-2.0, 느낀 점 엑셀), [pdf-lib](https://pdf-lib.js.org)(1.17.1, MIT, 오프라인 안내 PDF 합치기), 지도 타일 [OpenFreeMap](https://openfreemap.org) (© OpenMapTiles © OpenStreetMap contributors), 경로 계산 [OSRM](https://project-osrm.org) (© OpenStreetMap contributors)
- 디자인: 도름슬라이드 크로마 테마
- 글꼴: Space Grotesk, JetBrains Mono, Wanted Sans(한글 2,350자 부분 글꼴) · SIL Open Font License 1.1 (`LICENSES/`)
