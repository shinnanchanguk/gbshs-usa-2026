---
name: USA 2026
description: 경기북과학고 1학년 미국 동부 진로체험학습 안내. 따뜻한 종이 위에 검은 잉크와 주황 한 가지로 그린, 한 장씩 넘기는 노선 카드.
colors:
  accent: "#ed5a14"
  accent-ink: "#b53f0a"
  paper: "#fbf8f2"
  paper-2: "#ece7dc"
  sheet: "#ffffff"
  ink: "#111111"
  ink-2: "#3b3833"
  muted: "#6b655e"
  line: "rgba(17, 17, 17, 0.14)"
  line-2: "rgba(17, 17, 17, 0.26)"
  dark: "#151412"
  dark-2: "#24221f"
  on-dark: "#f4f1eb"
  on-dark-muted: "#a8a198"
  blue: "#1e5fce"
  purple: "#7a42b8"
  pink: "#c9477f"
  green: "#235c34"
  ochre: "#8a5a00"
  map-water: "#d6dfdf"
  map-park: "#e4e4d3"
  map-building: "#e7e1d5"
  map-road-casing: "#ddd6c8"
  map-boundary: "#b9b1a3"
  map-label: "#8d867c"
  map-stop-passed: "#e4ded2"
typography:
  display:
    fontFamily: "'Chroma Grotesk', 'Wanted Sans', 'Apple SD Gothic Neo', 'Noto Sans KR', system-ui, sans-serif"
    fontSize: "clamp(3rem, 16vw, 4.5rem)"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "'Chroma Grotesk', 'Wanted Sans', 'Apple SD Gothic Neo', 'Noto Sans KR', system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.03em"
  title:
    fontFamily: "'Chroma Grotesk', 'Wanted Sans', 'Apple SD Gothic Neo', 'Noto Sans KR', system-ui, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 700
    letterSpacing: "-0.02em"
  title-sm:
    fontFamily: "'Wanted Sans', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 800
    letterSpacing: "-0.01em"
  lead:
    fontFamily: "'Wanted Sans', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.65
  body:
    fontFamily: "'Wanted Sans', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
    fontFeature: "'tnum' 1"
  body-sm:
    fontFamily: "'Wanted Sans', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "'Wanted Sans', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
  label-xs:
    fontFamily: "'Wanted Sans', 'Apple SD Gothic Neo', 'Noto Sans KR', 'Malgun Gothic', system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 700
  numeral:
    fontFamily: "'Chroma Mono', ui-monospace, 'SF Mono', Menlo, 'Wanted Sans', monospace"
    fontSize: "0.875rem"
    fontWeight: 700
    letterSpacing: "-0.01em"
    fontFeature: "'tnum' 1, 'zero' 0"
  numeral-lg:
    fontFamily: "'Chroma Mono', ui-monospace, 'SF Mono', Menlo, 'Wanted Sans', monospace"
    fontSize: "2rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.01em"
    fontFeature: "'tnum' 1, 'zero' 0"
rounded:
  sm: "8px"
  tile: "10px"
  md: "12px"
  dock: "14px"
  lg: "16px"
  xl: "20px"
  sheet: "22px"
  pill: "999px"
spacing:
  s-1: "4px"
  s-2: "8px"
  s-3: "12px"
  s-4: "16px"
  s-5: "20px"
  s-6: "24px"
  s-8: "32px"
  s-10: "40px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "46px"
  button-primary-on-dark:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "52px"
  button-ghost:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "46px"
  button-small:
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "36px"
  icon-button:
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    size: "44px"
  next-stop-button:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.dock}"
    padding: "6px 12px 6px 16px"
    height: "52px"
  next-stop-button-disabled:
    backgroundColor: "{colors.paper-2}"
    textColor: "{colors.muted}"
    rounded: "{rounded.dock}"
    height: "52px"
  prev-button:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.dock}"
    size: "48px"
  now-pill:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.numeral}"
    rounded: "{rounded.pill}"
    padding: "0 14px"
    height: "36px"
  chip:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 12px"
    height: "34px"
  chip-on:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "0 12px"
    height: "34px"
  tag:
    textColor: "{colors.ink}"
    typography: "{typography.label-xs}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
  tag-live:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.ink}"
    typography: "{typography.label-xs}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
  card:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "16px"
  well:
    backgroundColor: "{colors.paper-2}"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.md}"
    padding: "12px 14px"
  leg-row:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
  leg-icon:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.tile}"
    size: "34px"
  dark-panel:
    backgroundColor: "{colors.dark}"
    textColor: "{colors.on-dark}"
    rounded: "{rounded.lg}"
    padding: "16px"
  meeting-pass:
    backgroundColor: "{colors.dark}"
    textColor: "{colors.on-dark}"
    rounded: "{rounded.lg}"
    padding: "14px 16px"
  meeting-pass-time:
    textColor: "{colors.accent}"
    typography: "{typography.numeral-lg}"
  input-text:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "12px"
  input-code:
    backgroundColor: "{colors.dark-2}"
    textColor: "{colors.on-dark}"
    rounded: "{rounded.dock}"
    padding: "0 16px"
    height: "60px"
  sheet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sheet}"
  schedule-row-current:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.tile}"
    padding: "4px 8px"
    height: "44px"
  route-stop-current:
    backgroundColor: "{colors.accent}"
    height: "18px"
---

# Design System: USA 2026

## Overview

**Creative North Star: "The Paper Route Card"**

이 앱은 도름슬라이드 경기도교육청 연수 덱의 크로마 테마를 휴대폰 한 손 안내서로 옮긴 세계입니다. 따뜻한 종이 바탕 위에 아주 옅은 필름 그레인이 깔리고, 글과 선은 전부 검은 잉크로 긋습니다. 색은 주황 하나만 씁니다. 주황은 지금, 나, 다시 모이는 곳, 꼭 지킬 것을 가리키고, 나머지 위계는 굵기와 1px 선, 그리고 종이의 층(바탕, 움푹한 우물, 흰 카드, 어두운 패널)으로 만듭니다.

장 하나가 장소 하나인 카드이고, 휴대폰 세로 화면에서는 위 띠, 지도, 노선도 띠, 장 카드, 엄지 영역의 넘기기 띠가 위에서 아래로 쌓입니다. 지도는 따로 노는 장식이 아니라 같은 종이색으로 다시 칠한 판이며, 지금 장으로 오는 구간만 주황으로 그립니다. 시각, 분, km, 날짜, 좌석 같은 숫자는 모두 모노 글꼴로 적어 시간표와 탑승권처럼 읽힙니다. 밀도는 현장용입니다. 첫 화면에서 지금, 다음, 다시 모일 곳과 시각이 먼저 보이고 설명은 짧습니다.

확정된 거부: 여행 앱의 기본형인 "일차 탭, 긴 목록, 따로 노는 지도" 구성, 그리고 이모지나 문자 기호로 그린 아이콘.

**Key Characteristics:**
- 따뜻한 종이 바탕과 화면 전체에 깔린 필름 그레인(곱하기 합성, 불투명도 0.11). 그레인이 약 3% 어둡게 덮으므로 바탕 토큰은 `#fbf8f2`이고 화면에 보이는 값은 `#f4f1eb`입니다.
- 검은 잉크 하나와 주황 하나. 크로마 네 빛깔 그라데이션은 비행 호와 체크리스트 진행 막대에만
- 굵은 기하 산세리프 제목 아래 1px 검은 선
- 셀 수 있는 숫자는 전부 JetBrains Mono 탭 숫자
- 반복 목록과 띠의 경계는 점선 hairline
- 12~16px 둥근 흰 종이 카드와 어두운 둥근 패널(탑승권 스텁, 내 좌석, 내 방, 입장 코드)
- 평면이 기본. 옅은 그림자는 지도 위에 뜬 조작과 올라오는 시트에만

## Colors

따뜻한 무채색 종이와 검은 잉크가 전부이고, 주황 한 가지가 놓치면 안 되는 것을 가리킵니다.

### Primary
- **Signal Orange** (`accent`): 노선도 띠의 현재 막대, 지도의 지금 핀과 지금 구간 선, 지금 시각 표시(세로선과 깜빡이는 점, 위 띠 "지금" 알약의 점), 진행 중 태그, 어두운 패널 위 모이는 시각과 내 좌석·내 방 번호, 내 좌석과 내 이름 선택, 마감까지 남은 날 알약, 비상 연락 사다리의 마지막 줄, 입장 단추. 채움과 선, 어두운 바탕 위 숫자로만 씁니다.
- **Burnt Orange Ink** (`accent-ink`): 종이 위에 주황 글자가 필요할 때 쓰는 짙은 주황입니다. 장 시각줄, 일정 시트의 현재 일차, 다음 마감 날짜, 내 호차와 내 방 라벨, 경고 블록 아이콘, 표지의 일차 번호. 종이 위 대비 5.1:1.

### Secondary
- **Chroma Blue** (`blue`), **Chroma Purple** (`purple`), **Chroma Pink** (`pink`): 크로마 덱의 보조 빛깔입니다. 주황과 이어 그라데이션을 만들고, 반 색으로도 씁니다.
- **Forest Green** (`green`): 인원 확인에서 "모두 왔어요" 상태 글자와 인원 수.
- **Ochre** (`ochre`): 팁 블록의 아이콘.
- 반 색은 `--class-1` 파랑, `--class-2` 초록, `--class-3` 보라, `--class-4` 황토, `--class-5` 분홍으로 위 다섯 빛깔과 같은 값입니다. 좌석표에서 흰 종이에 13~15%만 섞은 옅은 칠(범례 점은 30~32%)로만 쓰고, 글자색이나 넓은 면으로 쓰지 않습니다.

### Neutral
- **Warm Paper** (`paper`): 앱 바탕, 위·아래 띠, 시트, 입력칸 바탕. 어두운 패널 위 글자(`on-dark`)도 같은 값입니다.
- **Deep Paper** (`paper-2`): 움푹한 우물입니다. 경고 블록, 힌트, 교사 메모, 세그먼트 틀, 사진이 뜨기 전 자리, 눌러지는 줄의 hover 바탕.
- **Sheet White** (`sheet`): 카드, 칩, 오는 길 줄, 보조 단추의 바탕. 지도의 도로 안쪽도 이 색입니다.
- **Ink** (`ink`): 모든 제목과 본문, 1px 제목 선, 주 단추와 다음 단추와 지금 알약의 채움, 지도 동선과 핀 테두리.
- **Soft Ink** (`ink-2`): 목록 본문, 보조 문장, 칩 글자.
- **Muted Stone** (`muted`): 라벨, 보조 수치, 영문 병기, 흐린 아이콘. 종이 위 5.1:1.
- **Hairline** (`line`): 카드 테두리, 목록 사이 점선.
- **Hairline Strong** (`line-2`): 위·아래 띠 경계 점선, 칩과 보조 단추 테두리, 시트 손잡이.
- **Night Panel** (`dark`): 탑승권 스텁, 내 좌석, 내 방, 꼭 지킬 약속 배너, 표지 카드, 입장 양식, 비상 연락 사다리, 좌석표의 선생님 자리.
- **Night Panel Raised** (`dark-2`): 어두운 패널 안의 입력칸.
- **Night Muted** (`on-dark-muted`): 어두운 패널 위 라벨, 다음 단추의 시각줄, 지금 알약이 쉬고 있을 때의 점.

### Map Paint
바탕 지도(OpenFreeMap positron)는 `paintPaper()`가 종이로 다시 칠합니다. 배경은 `paper`, 물은 `map-water`, 공원·숲은 `map-park` 계열, 건물은 `map-building`, 도로 안쪽은 `sheet`, 도로 테두리는 `map-road-casing`, 경계선은 `map-boundary`, 바탕 지명은 `map-label`(도시와 나라 이름만 `muted`)이고 지명 후광은 종이색 0.9입니다. 바탕 지명은 일부러 옅게 두어 우리 번호 핀과 이름표가 먼저 읽히게 합니다. 그 위 동선 레이어의 규격은 Components의 지도 항목에 있습니다.

### Named Rules
**The One Orange Rule.** 주황은 놓치면 안 되는 것 하나만 가리킵니다: 지금, 나, 다시 모이는 곳과 시각, 꼭 지킬 것. 한 화면에 보이는 주황은 모두 같은 대상을 가리켜야 합니다(지금 장이면 지도 핀, 지도 구간, 노선도 막대가 함께 주황). 분류 색, 장식, 링크, hover에는 쓰지 않습니다.

**The Accent-Ink Rule.** 종이 위 주황 글자는 `accent-ink`로 씁니다. `accent`는 종이 위에서 3.1:1밖에 안 되므로 채움, 굵은 선, 어두운 패널 위 숫자에만 씁니다.

**The Chroma Gradient Rule.** 파랑, 보라, 분홍, 주황으로 이어지는 크로마 그라데이션은 비행 장 지구본의 인천에서 JFK까지 이어지는 호와 체크리스트 진행 막대, 두 곳에만 씁니다. 넓은 면, 제목, 단추, 카드 테두리에는 쓰지 않습니다.

## Typography

**Display Font:** Chroma Grotesk (자체 호스팅 Space Grotesk 가변 글꼴, 300~700). 한글 글자는 Wanted Sans로 이어집니다.
**Body Font:** Wanted Sans (KS X 1001 한글 2,350자와 라틴만 남긴 부분 글꼴, 400~1000), 없는 글자는 Apple SD Gothic Neo, Noto Sans KR, Malgun Gothic.
**Label/Mono Font:** Chroma Mono (자체 호스팅 JetBrains Mono 가변 글꼴).

**Character:** 기하 산세리프 라틴과 단단한 한글 고딕이 굵게 붙어 연수 덱 슬라이드 제목처럼 읽히고, 모노 숫자가 시간표와 탑승권의 기계적인 정확함을 더합니다. 세 글꼴 모두 레포에 자체 호스팅되어 있고 SIL OFL 1.1입니다.

### Hierarchy
- **Display** (700, clamp(3rem, 16vw, 4.5rem), 0.95, -0.04em): 입장 화면의 "USA 2026". 표지 어두운 카드의 영문 제목도 같은 글꼴을 2.5rem, 줄높이 1로 씁니다.
- **Headline** (700, 1.75rem, 1.2, -0.03em): 장 제목과 일차 제목. `text-wrap: balance`, 바로 아래 1px 검은 선. 360px 이하 화면에서는 1.5rem.
- **Title** (700, 1.375rem, -0.02em): 시트 제목. 위 띠의 일차 이름("2일차")은 같은 글꼴 1.125rem입니다.
- **Title Small** (Wanted Sans 800, 0.9375rem, -0.01em): 블록, 카드, 체크 항목, 양식 제목. 15px는 단계 목록과 점 목록 본문(줄높이 1.6)에도 쓰는 중간 단계입니다.
- **Lead** (400, 1.0625rem, 1.65): 장마다 한 문단인 요약. `text-wrap: pretty`.
- **Body** (400, 1rem, 1.55) / **Body Small** (0.875rem): 본문과 가장 많이 쓰는 보조 글. 전역으로 `word-break: keep-all`, `overflow-wrap: anywhere`, 탭 숫자가 켜져 있습니다.
- **Label** (700, 0.75rem) / **Label XS** (700, 0.6875rem): 칸 이름, 태그, 범례, 좌석표 머리. 대개 `muted`. 대문자 변환이나 넓은 자간을 쓰지 않습니다.
- **Numeral** (Chroma Mono 700, 0.875rem, -0.01em, 탭 숫자, 가로줄 없는 0): 장 시각줄(14:10 – 15:00), 머무는 시간 알약, km, 날짜, 장 번호 "10 / 15", 노선도 띠 양 끝 시각.
- **Numeral Large** (Chroma Mono 700, 2rem, 1.1): 탑승권 스텁의 모이는 시각. 같은 계열로 일차 표지 날짜 2.75rem, 내 좌석 번호 3rem, 표지 D-day 1.75rem, 입장 코드 1.625rem(자간 0.2em)을 씁니다.

시각 범위는 앞뒤를 띄운 en dash로 적습니다(14:10 – 15:00). 비행 장은 "한국 10:00 출발, 현지 11:10 도착"처럼 나라별 시각을 함께 적고, 글 속 화살표는 문자 대신 SVG 화살표로 그립니다.

### Named Rules
**The Mono Numerals Rule.** 시각, 분, km, 날짜, 좌석, 방, 장 번호처럼 세거나 맞춰 볼 값은 모두 Chroma Mono 탭 숫자로 씁니다. 문장 속에 섞인 숫자만 본문 글꼴로 둡니다.

**The Title Line Rule.** 새 단위가 시작되는 곳에는 1px 검은 실선을 긋습니다: 장 제목 아래, 시트 머리 아래, 입장 제목 아래, 일정·마감·멘토 목록의 첫 줄 위, 휴대폰 지도의 아래 가장자리. 수치 칸(facts)의 머리만 2px입니다. 반복 항목 사이에는 실선을 쓰지 않습니다.

**The Three Voices Rule.** 제목은 Chroma Grotesk(한글은 Wanted Sans), 본문과 UI는 Wanted Sans, 숫자는 Chroma Mono. 네 번째 글꼴이나 기기 기본 글꼴로 제목을 쓰지 않습니다.

## Layout

휴대폰 세로 390px이 기준입니다. 앱 전체가 `100dvh` 격자이고 행은 위 띠(52px + safe-area), 지도(`clamp(190px, 33svh, 330px)`, 크게 보기에서는 `clamp(300px, 60svh, 640px)`), 노선도 띠(44px), 장 카드(나머지), 아래 넘기기 띠(74px + safe-area) 순입니다. 장소가 없는 안내 장에서는 휴대폰 지도 칸 높이를 0으로 접되, 지도 캔버스 크기는 그대로 두어 다시 펼 때 새로 그리지 않습니다.

960px 이상에서는 두 열로 나뉩니다. 왼쪽 `minmax(400px, 460px)` 열에 위 띠, 노선도 띠, 장 카드, 넘기기 띠가 쌓이고, 오른쪽 나머지 폭 전체가 지도이며 1px 검은 선으로 갈립니다. 지도 크게 보기 단추는 이때 숨깁니다. 시트는 휴대폰에서 아래에서 올라오는 판(최대 88dvh), 넓은 화면에서는 오른쪽에 붙는 460px 전체 높이 판입니다.

장 카드 본문은 최대 680px 가운데 정렬, 여백은 위 20px, 좌우 18px, 아래 40px입니다. 넓은 화면에서는 좌우 24px, 360px 이하에서는 좌우 14px. 간격은 4px 단위(`s-1`~`s-10`)이고 블록 사이는 16px, 큰 묶음 사이는 24px, 장 끝의 느낀 점·인원 확인·다음 장 카드 앞은 32px입니다. 누르는 곳은 최소 44px(주 단추 46px, 이전 단추 48px, 다음 단추 52px).

장은 옆으로 밀거나 ←/→ 키로 넘기고, 트랙이 220ms 감속으로 옮겨 갑니다. 넓은 화면에서는 장 카드가 각자 세로로 스크롤합니다. 휴대폰에서는 지도·노선도 띠·장 카드가 한 번에 스크롤되어, 글을 올리면 지도가 함께 위로 밀려 나가고 노선도 띠만 위 띠 아래에 붙어 남습니다. 맨 위로 끌어내리면 다시 지도가 보입니다. 장이 바뀌면 새 장의 윗부분을 방금 보던 자리에 둔 뒤 지도를 부드럽게 다시 내려 보여 주고, 옆으로 넘기는 동안 옆 장은 윗부분이 노선도 띠 바로 아래에 오게 맞춥니다.

### Named Rules
**The Thumb Dock Rule.** 장 넘기기는 언제나 맨 아래 띠에 있습니다: 왼쪽 48px 이전 단추, 가운데 모노 장 번호 "10 / 15", 나머지 폭 전부를 차지하는 검은 다음 단추. 다음 단추에는 다음 장의 시각과 제목을 싣습니다.

**The Map Follows Rule.** 지도는 휴대폰에서 위 띠 바로 아래(글을 읽으려고 올리면 비켜 주고, 장이 바뀌면 다시 내려옴), 넓은 화면에서 오른쪽 전체 높이에 있고, 장을 넘길 때마다 앞 장소와 이 장소를 함께 담도록 옮겨 갑니다. 카메라는 지금 장소 이름표와 지도 단추 자리만큼 여백을 더 두고 맞춥니다.

## Elevation & Depth

평면이 기본입니다. 깊이는 종이의 층으로 만듭니다: 종이 바탕(`paper`) 위에 움푹한 우물(`paper-2`), 톤과 1px 선으로 살짝 뜬 흰 카드(`sheet`), 가장 강한 어두운 패널(`dark`). 강조가 필요한 카드(느낀 점, 인원 확인)는 그림자 대신 1.5px 검은 테두리를 씁니다. 화면 전체 위에는 필름 그레인 층이 곱하기 합성, 불투명도 0.11로 덮이고 누르기를 막지 않습니다(입장 화면도 같음). 사진 크게 보기는 거의 검은 `#0d0c0b` 전체 화면입니다.

### Shadow Vocabulary
- **Float** (`box-shadow: 0 1px 2px rgba(17,17,17,0.06), 0 4px 12px rgba(17,17,17,0.06)`): 지도 위에 떠 있는 조작(지도 크게 단추, 출처 표시)과 세그먼트의 선택된 칸.
- **Lift** (`box-shadow: 0 2px 6px rgba(17,17,17,0.08), 0 12px 32px rgba(17,17,17,0.12)`): 아래에서 올라오는 시트.
- **Mine Ring** (`box-shadow: inset 0 0 0 1px #111`): 호차별 안내에서 내 호차 카드. 테두리와 합쳐 2px 잉크 가장자리가 됩니다.
- **Input Focus Ring** (`box-shadow: 0 0 0 1px #111`): 느낀 점 입력칸 포커스. 테두리가 잉크로 바뀌며 함께 2px이 됩니다.
- **Now Pulse** (`box-shadow: 0 0 0 0 → 0 0 0 8px rgba(237,90,20,0)`, 1.8s 반복): 지금 알약의 점과 노선도 띠의 지금 점에만.
- **Scrim**: 시트 뒤 `rgba(17,17,17,0.4)`, 넓은 화면에서는 0.25.

### Named Rules
**The Flat Paper Rule.** 종이 위에 놓인 카드는 그림자 없이 색 층과 1px 선으로만 뜹니다. 그림자는 지도 위에 떠 있는 조작과 아래에서 올라오는 시트에만 씁니다.

## Shapes

모서리는 모두 부드럽게 둥글지만 알약 모양은 작은 것에만 씁니다. 작은 칸(체크박스 7px, 세그먼트 9px, 입력 예시 6px)부터 `sm` 8px(좌석, 사진 크게 보기), `tile` 10px(사진 썸네일, 오는 길 아이콘 칸, 일정 줄, 반·이름 고르기), `md` 12px(단추, 오는 길 줄, 우물, 입력칸), `dock` 14px(아래 띠의 이전·다음 단추, 경고·팁 블록, 입장 코드 칸), `lg` 16px(카드, 대표 사진, 탑승권, 어두운 패널), `xl` 20px(표지 카드, 입장 양식), `sheet` 22px(시트 윗모서리, 버스 좌석표 앞머리)입니다. 알약(`pill`)은 지금 알약, 칩, 태그, 머무는 시간, 전화 단추, 진행 막대에만 씁니다.

선은 세 가지입니다. 카드 테두리는 1px `line`, 칩과 보조 단추는 1px `line-2`, 강조 카드·체크박스·계산기 입력은 1.5px 잉크. 반복 항목 사이와 위·아래 띠 경계는 점선입니다. 번호 점(단계 번호, 일정 척추의 점, 숙소 번호, 지도 핀)은 원이고, 노선도 띠의 일정 막대는 모서리 3px의 짧은 막대입니다.

아이콘은 모두 한 벌의 SVG(`Icon`)로 그립니다. 24×24 viewBox 가운데에 맞춰 그린 선 그림, 채움 없음, `currentColor`, 굵기 1.8(글 속 화살표 2, 체크 2.4), 끝과 이음은 둥글게, 크기는 rem이라 글자 확대를 따라갑니다.

### Named Rules
**The Dashed Seam Rule.** 반복 항목 사이와 위·아래 띠의 경계는 점선 hairline입니다. 점선은 "아직 아님"도 말합니다: 선택 일정의 막대, 빈 좌석, 아직 안 온 학생, 탑승권의 절취선. 실선은 새 단위의 시작에만 씁니다.

## Components

### Buttons
단단하고 짧게 눌리는 잉크 단추입니다.
- **Shape:** 부드러운 모서리(12px). 아래 띠의 이전·다음 단추만 14px.
- **Primary:** 잉크 채움에 종이색 글자, 높이 46px, 좌우 16px, Wanted Sans 700 0.9375rem.
- **Ghost:** 흰 종이 바탕에 1px `line-2` 테두리. hover에서 테두리가 잉크로 바뀝니다.
- **Small:** 높이 36px, 좌우 12px, 0.875rem.
- **Primary on dark (입장 양식만):** 어두운 양식 위의 들어가기 단추는 주황 채움에 잉크 글자, 높이 52px.
- **Icon button:** 44px 정사각, 12px 모서리, hover에서 `paper-2`. 어두운 판 위에서는 종이색 아이콘에 10% 종이 hover.
- **Link button:** `muted` 글자에 밑줄(3px 띄움), 높이 44px.
- **States:** 누르면 `scale(0.98)`(지금 알약은 0.96), 160ms 감속. 비활성은 불투명도 0.4. 키보드 포커스는 전역 2px 잉크 윤곽선, 2px 띄움, 6px 모서리.

### Chips and Tags
- **Chip:** 높이 34px 알약, 흰 종이 바탕, `line-2` 테두리, 0.75rem 700 `ink-2`. 켜지면 잉크 채움에 종이색 글자. 느낀 점 주제 고르기에 씁니다. 반 고르기와 이름 고르기는 같은 켜짐 규칙을 10px 모서리 칸으로 씁니다(내 이름 선택만 주황).
- **Chip link:** 흰 종이 알약(1px `line-2`, 0.875rem 600)에 외부 링크 아이콘. 장 머리 오른쪽의 "지도 앱" 단추는 같은 모양을 바탕 없이 0.75rem으로 줄인 것입니다.
- **Tag:** 0.6875rem 700 알약, 1px `line-2` 테두리. 진행 중(`live`)은 주황 채움에 잉크 테두리와 글자, 다음(`next`)은 잉크 테두리, 조용한 태그(`quiet`)는 `muted` 600.
- **Stay pill:** 장 시각줄 옆 머무는 시간. `line-2` 테두리 알약, 모노 0.75rem `ink-2`.

### Segmented Control
`paper-2` 우물(4px 안쪽 여백, 12px 모서리) 안에 높이 40px 칸이 나란히 있고, 선택된 칸만 흰 종이로 떠오르며 Float 그림자를 받습니다. 칸 안의 보조 글은 모노 0.6875rem `muted`.

### Cards / Containers
- **Corner Style:** 카드 16px, 줄·우물 12px, 경고·팁 블록 14px.
- **Background:** 흰 카드(`sheet`) + 1px `line`. 우물은 `paper-2`에 테두리 없음. 팁 블록은 흰 종이와 `line`, 경고 블록은 `paper-2`이고 경고 아이콘과 점은 주황.
- **Shadow Strategy:** 없음(Elevation의 Flat Paper Rule).
- **Emphasis:** 느낀 점과 인원 확인 카드는 1.5px 잉크 테두리, 장 끝에 32px 띄워 둡니다.
- **Internal Padding:** 카드 16px, 줄 10px 12px, 블록 14px 16px.

### Dark Panels
어두운 둥근 패널은 "내 것, 꼭 볼 것"을 담는 판입니다. `dark` 바탕, 종이색 글자, `on-dark-muted` 라벨, 16px 모서리(표지와 입장 양식은 20px), 안쪽 16px. 핵심 숫자 하나만 주황 모노로 크게 씁니다(모이는 시각, 내 좌석, 내 방, D-day). 패널 안 구분선은 종이색 30~35% 점선입니다. 꼭 지킬 약속 배너는 같은 판에 주황 경고 아이콘을 둡니다.

### Meeting Pass (탑승권 스텁)
다시 모이는 곳을 탑승권 조각처럼 보여 주는 이 앱의 대표 부품입니다. 어두운 패널을 두 칸으로 나눠 왼쪽에 깃발 아이콘(주황)과 "다시 모이는 곳" 라벨, 장소 이름(1.125rem 700), 짧은 메모를 두고, 오른쪽 칸에 "모이는 시각" 라벨과 주황 모노 2rem 시각을 오른쪽 정렬로 둡니다. 두 칸 사이는 1.5px 종이색 35% 점선 절취선이고, 절취선 위아래 끝에 종이색 16px 반원 홈을 파서 떼어 내는 표를 만듭니다.

### Page Head (장 머리)
장 카드의 머리입니다. 첫 줄은 짙은 주황 모노 시각줄(14:10 – 15:00), 머무는 시간 알약, 오른쪽 끝에 장 종류 아이콘과 이름(`muted` 0.75rem). 그 아래 Headline 제목과 1px 검은 선, 그 아래 핀 아이콘과 장소 이름(영문 병기는 `muted`)과 "지도 앱" 칩. 한국 시각 줄은 모노로 붙고, 학부모 보기에서는 잉크 600 0.875rem으로 또렷하게, 그 밖의 보기에서는 `muted` 0.75rem으로 조용하게 둡니다.

### Leg Row (오는 길)
이 장소까지 오는 길 한 줄입니다. 흰 종이 줄(12px 모서리, `line` 테두리)의 왼쪽에 34px 잉크 칸(10px 모서리) 속 종이색 이동 수단 아이콘(버스, 걷기, 비행기, 배), 가운데 "오는 길" 라벨과 설명, 오른쪽에 모노 굵은 소요 시간과 `muted` 거리.

### Photos
대표 사진은 16:10 칸을 채우고(`cover`), 16px 모서리, 1px `line` 테두리. 그 아래 4칸 정사각 썸네일(10px 모서리, 6px 간격), 마지막 칸은 흰 종이에 사진 아이콘과 남은 장수. 사진 아래 캡션과 출처는 0.75rem `muted`. 크게 보기에서는 `contain`으로 사진 전체를 보여 줍니다.

### Inputs / Fields
- **Style:** 느낀 점 입력은 종이 바탕, 1px `line-2`, 12px 모서리, 안쪽 12px, 본문 1rem 1.6. 계산기 입력은 1.5px 잉크 테두리, 높이 44px, 모노 1.125rem.
- **Focus:** 글로우 없이 테두리가 잉크가 되고 1px 잉크 링이 더해집니다. 커서는 주황.
- **On dark (입장 코드):** `dark-2` 바탕, 종이색 35% 1.5px 테두리, 14px 모서리, 높이 60px, 모노 1.625rem 가운데 정렬, 숫자 6자리를 3자리씩 끊어 보여 줌(자간만큼 들여써 가운데를 맞춤). 포커스와 오류는 주황 테두리, 오류 문구는 주황 700.
- **Checkbox:** 24px, 1.5px 잉크 테두리, 7px 모서리. 체크하면 잉크 채움에 종이색 체크 아이콘, 항목 글자는 `muted` 취소선.

### Notice (공지)
- **Card:** 학생 팝업과 선생님 팝업 관리가 같은 카드를 씁니다. 제목(Title 1.375rem, 관리 목록에서는 1.125rem) 아래 1px 잉크 선, 그 아래 올린 선생님 이름(`ink` 800)과 올린 시각(모노), 고쳤으면 "고침"과 고친 시각, 그다음 본문(1rem 1.65, 줄바꿈 그대로). 관리 목록에서는 본문을 세 줄까지만 보여 줍니다.
- **Popup:** 화면 전체를 덮는 창(뒤 `rgba(17,17,17,0.45)`, 위·아래 띠까지 가림) 가운데 최대 440px 종이 판, 22px 모서리, Lift 그림자. 머리에 주황 글자(`accent-ink`) 확성기 아이콘과 "공지", 여러 건이면 오른쪽에 이전·다음 아이콘 단추와 모노 "1 / 2", 아래에 점(지금 것은 18px 잉크 알약). 본문만 안에서 스크롤하고 아래 "다시 보지 않기"(Ghost)·"닫기"(Primary)는 점선 아래에 늘 보입니다. 옆으로 밀어도 넘어갑니다.
- **Manage:** 시트 안 위에 "공지하기"(Primary)·"학생 화면으로 보기"(Ghost) 두 칸, 그 아래 공지 카드마다 흰 판(16px 모서리, 1px `line-2`)과 오른쪽 아래 "고치기"·"지우기"(Small Ghost). 지우기는 한 번 더 묻고, 확인 단추만 짙은 주황 채움(`accent-ink`)에 흰 글자입니다.

### Navigation
- **Top bar:** 높이 52px, 종이 바탕, 아래 1px `line-2` 점선. 왼쪽은 일차 이름(Chroma Grotesk 1.125rem 700)과 모노 날짜, 아래 화살표 아이콘이 붙은 단추로 일정 시트를 엽니다. 오른쪽은 "지금" 알약(잉크 36px 알약, 모노 글자, 여행 전에는 D-day, 여행 중에는 점과 "지금", 일정 안이면 점이 주황으로 깜빡임)과 메뉴 아이콘 단추.
- **Bottom dock:** 높이 74px, 위 1px `line-2` 점선. 이전 단추는 48px 흰 종이 정사각(14px 모서리, `line-2` 테두리). 장 번호는 모노 "10 / 15"(전체 수는 `muted`). 다음 단추는 잉크 채움 14px 모서리 높이 52px 이상, 첫 줄에 다음 장 시각(모노 0.6875rem `on-dark-muted`, 다른 일차로 넘어가면 그 일차 이름), 둘째 줄에 다음 장 제목(0.8125rem 700, 두 줄까지), 오른쪽 끝 오른쪽 화살표. 마지막 장에서는 `paper-2` 바탕에 `muted` 글자.
- **Schedule sheet (시간 척추):** 일차마다 접히는 머리(Chroma Grotesk 일차 이름, 모노 날짜, 제목 한 줄), 펼치면 모노 시각, 종류 아이콘, 장 제목이 한 줄씩. 지금 보는 장은 잉크 채움 줄, 현재 일차 이름은 짙은 주황.
- **Sheets:** 종이 바탕, 윗모서리 22px, 38px 손잡이, 머리 아래 1px 검은 선, 260ms 올라오기(넓은 화면은 오른쪽에서 밀려 들어옴).

### Route Strip (노선도 띠)
지하철 노선도처럼 그날 일정을 한 줄로 보여 주는 이 앱의 대표 부품입니다. 높이 44px, 위는 1px 잉크 실선(휴대폰에서 지도 아래 가장자리), 아래는 `line-2` 점선. 양 끝에 그날 첫 시각과 끝 시각(모노 0.6875rem `muted`), 가운데 1.5px 잉크 28% 가는 선 위에 일정 막대를 시각대로 놓고 막대 길이는 머무는 시간입니다. 보통 막대는 높이 10px 잉크, 이동·비행 장은 6px `muted` 55%, 선택 일정은 종이 바탕 1.5px 잉크 점선, 지금 보는 장은 높이 18px 주황에 1.5px 잉크 테두리. 실제 지금 시각은 주황 2px 세로선과 깜빡이는 8px 주황 점입니다. 시각이 없는 묶음(출발 전, 다녀와서)은 8px 잉크 25% 점을 늘어놓고 지금 장만 22px 주황 알약으로 늘립니다.

### Map
- **Base:** Colors의 Map Paint.
- **Routes:** 다른 날 동선은 잉크 14% 1.5px(출발 전·다녀와서에서는 55% 2.2px로 또렷하게), 그날 동선은 잉크 72% 2.6px, 걷기 구간은 잉크 80% 2.4px 점선.
- **Current leg:** 주황 5px 선을 종이색 9px 테두리 위에 700ms 동안 그려 나가듯 나타냅니다. 비행 장은 지구본으로 바꿔 크로마 그라데이션 4px 대원 호를 그립니다.
- **Pins:** 그날 장소는 흰 종이 원(반지름 10) 잉크 테두리 1.8에 잉크 번호, 지나온 곳은 `map-stop-passed`에 테두리 1.2. 가까운 장소는 반지름 13 원 하나에 "2-4"처럼 묶습니다. 지금 장소는 주황 원(반지름 13) 잉크 테두리 2와 주황 18% 후광(반지름 22), 오른쪽에 13px 잉크 이름표(종이색 후광 2.2). 숙소와 공항은 잉크 원에 종이색 테두리 2.
- **Controls:** 오른쪽 위 40px 흰 종이 정사각(12px 모서리, `line-2` 테두리, Float 그림자) 지도 크게 단추. 출처 표시는 접힌 채 오른쪽 아래.
- **Motion:** 카메라 900ms, 지구본 1400ms. 움직임 줄이기 설정에서는 즉시 이동하고 선도 바로 다 그립니다.

### Seat Map (좌석표)
흰 종이 판, 앞머리 22px 모서리. 좌석은 8px 모서리 칸에 반 색을 옅게 섞은 칠, 선생님 자리는 어두운 패널, 가이드·직원은 `paper-2`, 빈자리는 점선. 내 자리는 주황 채움에 2px 잉크 테두리. 교사 출석 모드에서는 온 학생이 잉크 채움, 아직 안 온 학생이 점선입니다.

### Checklist Progress
모노 "0 / 25" 옆 6px 알약 막대, 바탕 `paper-2`, 채움은 크로마 그라데이션이 왼쪽에서부터 220ms 동안 늘어납니다.

## Do's and Don'ts

### Do:
- **Do** 앱 바탕을 `paper`(#fbf8f2)로 깔고 필름 그레인 층(곱하기, 0.11)을 그 위에 둡니다. 둘이 겹친 화면 값이 레퍼런스 종이색 #f4f1eb 입니다. 지도 바탕도 같은 `#fbf8f2`로 칠합니다.
- **Do** 시각, 분, km, 날짜, 좌석, 방, 장 번호는 Chroma Mono 탭 숫자로 적고, 시각 범위는 띄어 쓴 en dash(14:10 – 15:00)로 잇습니다.
- **Do** 장 제목 아래에는 1px 검은 실선, 반복 항목 사이와 띠 경계에는 점선 hairline을 긋습니다.
- **Do** 종이 위 주황 글자는 `accent-ink`(#b53f0a)로, 밝은 `accent`(#ed5a14)는 채움, 굵은 선, 어두운 패널 위 숫자로만 씁니다.
- **Do** 다시 모이는 곳과 시각은 탑승권 스텁(어두운 패널, 절취선, 주황 모노 시각)으로 보여 줍니다.
- **Do** 화면의 기호는 모두 `Icon` 컴포넌트(24 viewBox, 선 굵기 1.8, `currentColor`)로 그리고, 내용 글 속 화살표는 `rich()`를 거쳐 SVG로 바꿉니다.
- **Do** 지도 위 지금 구간은 주황 5px 선을 종이색 9px 테두리 위에 그리고, 나머지 동선은 잉크의 농도로만 구분합니다.
- **Do** 누르는 곳은 최소 44px로 두고, 움직임은 상태를 알릴 때만 씁니다(넘김 220ms, 지도 900ms, 구간 그리기 700ms, 움직임 줄이기 설정이면 즉시).

### Don't:
- **Don't** 주황을 분류 색, 장식, 링크, hover에 쓰지 않습니다. 한 화면의 주황은 모두 같은 대상을 가리켜야 합니다.
- **Don't** 밝은 `accent`를 종이 위 글자색으로 쓰지 않습니다(3.1:1).
- **Don't** 크로마 그라데이션을 비행 호와 체크리스트 진행 막대 밖에 쓰지 않습니다.
- **Don't** 종이 위에 놓인 카드에 그림자를 주지 않습니다. 그림자는 지도 위에 뜬 조작과 시트에만 씁니다.
- **Don't** 이모지나 문자 기호(▶ ✓ ★ → ✕ 등)를 화면 기호로 쓰지 않습니다.
- **Don't** 사용자에게 보이는 한글 문구에 긴 줄표를 쓰지 않습니다.
- **Don't** 네 번째 글꼴이나 기기 기본 글꼴로 제목을 쓰지 않습니다.
- **Don't** 반 색을 글자색이나 넓은 면으로 쓰지 않습니다. 좌석표의 옅은 칠과 범례 점으로만 씁니다.
