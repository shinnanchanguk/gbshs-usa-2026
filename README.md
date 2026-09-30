# USA 2026 · 미국 이공계 진로체험학습 안내 사이트

경기북과학고등학교 1학년 해외 이공계 진로체험학습(2026. 10. 15.~10. 23., 미국 동부 6박 9일) 안내 사이트입니다.
장을 한 장씩 넘기면 그 순서가 곧 시간표이고 버스 동선이며, 지도가 앞 장소에서 이 장소까지 오는 길을 따라 그립니다.

- 사이트: https://shinnanchanguk.github.io/gbshs-usa-2026/ (입장 코드는 담임 선생님께)
- 내용 출처: 운영계획(안)·수정(안), 9/21 사전답사 결과 공유 회의, 9/30 학생 브리핑·면책/의료 동의서 설명, 버스 좌석표·객실 배치도, 답사 사진

## 무엇이 들어 있나

| 묶음 | 내용 |
|---|---|
| 출발 전 | 날짜별 할 일, 면책·의료 동의서 쓰는 법, 챙길 것(체크), 꼭 지킬 약속, 돈과 결제(팁 계산), 휴대폰·비행 준비, 버스와 내 자리, 숙소와 방, 멘토, 비상 연락처 |
| 1~9일차 | 일차 표지(식사·숙소·시간 척추) → 장소마다 한 장: 시각·머무는 시간, 오는 길(수단·시간·거리), 사진, 할 일, 꼭 지킬 것, 답사 선생님 요령, 다시 모이는 곳·시각 |
| 다녀와서 | 도착 뒤 일정, 발표회 보고서(느낀 점을 활동 주제별로 모아 초안 복사) |

역할(오른쪽 위 사람 단추)

- 학생: 내 호차·자리·짝·방·도우미 역할, 장마다 느낀 점(활동 주제 표시)
- 선생님: 장마다 인원 확인(반별 번호판 또는 버스 좌석표), 선생님 메모(자료가 바뀐 점·확인할 것), 업무 분장·야간 근무
- 보호자: 모든 시각 옆에 한국 시각, 우리 아이 자리·방

지도는 MapLibre + OpenFreeMap(키 없음)이고, 장소 사이 길은 OSRM(OpenStreetMap)으로 미리 계산해 `content/routes.json`에 넣어 두었습니다.
한 번 연 화면·사진·지도는 기기에 저장돼 해외에서 인터넷이 약해도 열립니다(서비스 워커).

> **DB가 아직 없습니다.** 느낀 점·인원 확인·체크리스트는 그 휴대폰에만 저장됩니다. 저장 코드는 `src/lib/repo.ts` 한곳에 모아 두어 로그인·DB를 붙일 때 이 파일만 바꾸면 됩니다.

## 입장 코드와 명단 (공개 레포)

학생 이름·좌석·객실·인솔교사 연락처·멘토 이름은 **암호문(`content/roster.enc.json`)으로만** 레포에 있습니다.
입장 코드로 PBKDF2(60만 번) 열쇠를 만들어 AES-GCM으로 풉니다. 코드를 모르면 내용을 볼 수 없습니다.
건강 정보(요보호 학생 명단)는 암호문에도 넣지 않습니다.

- 코드·원본은 레포 밖 `private/`(.gitignore)에만 있습니다: `private/access-code.txt`, `private/roster.json`
- 명단이 바뀌면 `private/roster.json`을 고친 뒤 `npm run roster:seal`로 암호문을 다시 만듭니다.
- 입장 코드는 숫자 6자리입니다. 바꾸려면 `private/access-code.txt`에 새 숫자 6자리를 적고 `npm run roster:seal`을 실행합니다(파일을 지우면 새 코드가 생깁니다). 이미 들어온 기기는 다시 입력합니다.
- 숫자 6자리는 로그인이 붙기 전까지 쓰는 임시 잠금입니다. 공개된 암호문에 100만 가지 숫자를 다 넣어 보면 풀리므로, 로그인·서버 명단으로 옮기면 암호문과 이 코드를 없앱니다.
- 카톡으로 `https://shinnanchanguk.github.io/gbshs-usa-2026/#/code/<코드>` 링크를 보내면 누르기만 해도 열립니다(코드는 `#` 뒤라 서버로 가지 않음).

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

- React, Vite, TypeScript, MapLibre GL JS, 지도 타일 [OpenFreeMap](https://openfreemap.org) (© OpenMapTiles © OpenStreetMap contributors), 경로 계산 [OSRM](https://project-osrm.org) (© OpenStreetMap contributors)
- 디자인: 도름슬라이드 크로마 테마
- 글꼴: Space Grotesk, JetBrains Mono, Wanted Sans(한글 2,350자 부분 글꼴) · SIL Open Font License 1.1 (`LICENSES/`)
