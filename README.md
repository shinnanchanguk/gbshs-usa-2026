# USA 2026 · 미국 이공계 진로체험학습 안내 사이트

경기북과학고등학교 1학년 해외 이공계 진로체험학습(2026. 10. 15.~10. 23., 미국 동부) 안내 자료입니다.
슬라이드를 넘기면서 **시간 · 장소 · 할 일 · 유의사항**을 확인하고, 지도에서 그날 동선을 봅니다.

- 사이트: https://shinnanchanguk.github.io/gbshs-usa-2026/ (입장 번호는 담임 선생님께)
- 내용 출처: 운영계획(안) 세부 일정표 + 2026. 9. 21. 사전답사 결과 공유 회의 + 답사 사진

## 무엇이 들어 있나

| 기능 | 설명 |
|---|---|
| 일정 사이드 패널 | 공통 안내 + 1~9일차. 일차를 누르면 그날 슬라이드 시간표가 펼쳐지고 지도가 그날 동선으로 이동 |
| 슬라이드 | 시간 · 제목 · 대표 사진 · 설명 · 유의사항 · 집결 장소. ←/→ 키, 휴대폰은 좌우로 밀어서 넘김 |
| 지도 | MapLibre + OpenFreeMap (무료, API 키 없음). 시간 순서 번호 핀, 지금 슬라이드는 라임색 |
| 출석 체크 (선생님) | 장소 슬라이드마다 반별 번호판. 번호를 누르면 출석, 반 전원이면 "출석 완료"가 지도 핀·사이드바에 표시 |
| 느낀 점 (학생) | 슬라이드마다 소감 칸, 자동 저장. "내 소감 모아보기"에서 한꺼번에 복사 |
| 피드백 (선생님) | 슬라이드마다 + 사이트 전체 피드백 입력칸. **프롬프트 복사**를 누르면 어느 슬라이드·어느 파일인지까지 담긴 글이 복사됨 |

> 지금은 시험 운영 중이라 누구나 선생님/학생 역할을 바꿔 가며 써 볼 수 있습니다.
> **DB가 없습니다.** 출석 · 소감 · 피드백은 그 기기의 브라우저에만 저장됩니다(다른 사람과 자동 공유되지 않음).

## 폴더 구조

```
content/
  trip.json              여행 기본 정보, 반별 학생 수(출석판 번호 개수)
  days/day0.json         공통 안내
  days/day1.json ~ day9.json   일차별 슬라이드
  photo-sources.json     사진 목록 (npm run photos:import 가 만듦)
  photo-excluded.json    개인정보 등으로 뺀 사진과 이유
public/photos/           웹용으로 줄인 사진 (s<답사일>/f<폴더번호>/…webp)
src/
  content/schema.ts      데이터 구조 설명 + 검사 규칙 ← 내용 고치기 전에 먼저 읽기
  features/…             화면 (지도, 슬라이드, 출석, 소감, 피드백, 입장 번호)
  styles/                디자인 (galpi2 Expedition 디자인 토큰·글꼴)
scripts/
  import-photos.mjs      답사 사진 → 웹용 WebP (EXIF·GPS 제거)
  check-content.mjs      내용 검사 (빌드 전에 자동 실행)
```

## 내 컴퓨터에서 실행하기

Node.js 22 이상이 필요합니다.

```bash
npm install
npm run dev        # http://localhost:5173/gbshs-usa-2026/
npm run check      # 내용 검사만
npm run build      # 검사 + 타입 검사 + 배포용 빌드(dist/)
```

## 내용 고치기

1. `content/days/dayN.json`에서 해당 슬라이드(`id`로 찾기)를 고칩니다. 각 칸의 뜻은 `src/content/schema.ts` 주석에 있습니다.
2. `npm run check`로 검사합니다. 시각 순서, 사진 파일, 좌표 범위, id 중복 등을 확인합니다.
3. 커밋하고 `main`에 push하면 GitHub Actions가 자동으로 사이트를 다시 배포합니다(1~2분).

주의할 점

- 슬라이드 `id`는 바꾸지 마세요. 링크와 출석 기록이 id에 묶여 있습니다.
- 좌표는 `[경도, 위도]` 순서입니다. 구글 지도에서 복사한 `(위도, 경도)`와 반대입니다.
- **공개 레포입니다.** 학생·교사 이름, 전화번호, 건강 정보, 객실·좌석 배정은 절대 넣지 마세요.

## 사진 추가하기

1. 구글 드라이브에서 답사 사진 폴더를 받아 압축을 풉니다. 폴더 모양은 `N일차_날짜/NN_분류_장소/사진.jpg`여야 합니다.
2. 레포 **밖** 폴더에 두고 실행합니다.
   ```bash
   npm run photos:import -- ../답사사진
   ```
   동영상(.mp4, .mov)은 [ffmpeg](https://ffmpeg.org)가 설치돼 있으면 웹용 MP4(1280px)와 표지 사진으로 바뀌어 사진처럼 들어갑니다(사진 보기 창에서 재생).
3. 새 사진이 `content/photo-sources.json`에 추가됩니다. 각 사진을 알맞은 슬라이드의 `photos`에 `{ "id": …, "caption": … }`로 넣습니다.
   `npm run check`는 **받은 사진이 모두 어딘가에 쓰였는지** 확인합니다. 쓰지 않을 사진은 `content/photo-excluded.json`에 이유와 함께 적고 다시 `photos:import`를 실행하면 목록과 파일에서 빠집니다.

## 선생님 피드백 반영하기

선생님이 사이트에서 **프롬프트 복사**로 보내 준 글에는 위치(일차·슬라이드·링크), 파일 경로(`content/days/dayN.json → slides[id="…"]`), 지금 적힌 내용, 피드백이 들어 있습니다.
그 글을 그대로 AI 코딩 도구(Claude Code 등)에 붙여 넣으면 이 레포의 `CLAUDE.md` 규칙에 따라 해당 파일을 고칩니다. 사람이 직접 고쳐도 됩니다.

## 입장 번호 바꾸기

`src/features/pin/PinGate.tsx`의 `PIN_HASH`를 새 번호의 SHA-256 값으로 바꿉니다.

```bash
printf '새번호' | sha256sum
```

입장 번호는 화면을 가리는 장치일 뿐입니다. 레포가 공개되어 있으므로 비밀이어야 하는 정보는 애초에 넣지 않습니다.

## 배포

`main` 브랜치에 push하면 `.github/workflows/deploy.yml`이 검사 → 빌드 → GitHub Pages 배포를 합니다.
처음 한 번은 레포 Settings → Pages → Source를 **GitHub Actions**로 둡니다.

## 사용한 것과 라이선스

- React, Vite, TypeScript, MapLibre GL JS, 지도 타일 [OpenFreeMap](https://openfreemap.org) (© OpenMapTiles © OpenStreetMap contributors)
- 디자인: galpi2 Expedition 디자인 토큰
- 글꼴: Paperlogy, Manrope, Syne — SIL Open Font License 1.1 (`LICENSES/`)
