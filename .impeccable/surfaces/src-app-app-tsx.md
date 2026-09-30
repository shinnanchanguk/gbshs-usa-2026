---
version: 1
slug: "src-app-app-tsx"
primary_target: "src/app/App.tsx"
related_targets: []
---

# Surface: 여행 안내 한 장 넘기기 (앱 전체)

Scope: 앱 전체(표지 → 출발 전 → 1~9일차 → 다녀와서). Mode: Operate(현장 휴대폰 한 손 사용), Read(출발 전 안내).
Audience/job: 학생은 지금·다음·다시 모이는 곳, 교사는 출석, 학부모는 한국 시각. 모두 휴대폰 세로 390폭이 기본.
Constraints: 공개 레포(이름·좌석은 암호문), DB 없음(기기 저장), 해외 데이터 불안정, 긴 줄표 금지, SVG 아이콘만.

## Direction contract

THESIS: 장 하나가 장소 하나이고, 넘기는 손짓이 곧 버스가 움직이는 일이다. 지도는 장을 따라 앞 장소에서 이 장소까지 실제 도로를 그리며 옮겨 간다. 카테고리 기본값인 "일차 탭 + 긴 목록 + 따로 노는 지도"를 거부한다.

OWN-WORLD: 크로마(경기도교육청 연수 덱) 이식. 따뜻한 종이 #f4f1eb 바탕에 필름 그레인, 검은 잉크 #111, 오렌지 #ed5a14 한 가지 강조(지금·현재 구간·집결), Space Grotesk + Wanted Sans 굵은 제목에 1px 검은 제목 선, JetBrains Mono 숫자(시각·분·km), 12~16px 둥근 흰 종이 카드, 어두운 둥근 패널(집결 패스·지도 위 칩). 지도도 종이색으로 다시 칠한다.

STORY: 학생은 넘기며 "몇 시에 어디서 얼마나 있고, 다음 장소까지 얼마나 가는지"를 안다. 믿음: 이 화면만 따라가면 된다. 행동: 느낀 점 남기기, 교사는 출석.

FIRST VIEWPORT: 390x844. 위 52px 상단 띠(왼쪽 일차·날짜 단추, 오른쪽 "지금" 알약과 메뉴). 그 아래 지도 36vh(종이색, 앞 장소→이 장소 구간 오렌지 굵은 선, 번호 핀). 지도 아래 가장자리에 그날 노선 띠(지하철 노선도처럼 정류장 점, 구간 길이 = 시간). 그 아래 장 카드: 오렌지 모노 시각줄(10:00–11:00 · 1시간), 28px 굵은 제목, 1px 선, 들어오는 길 칩(버스 2시간 30분 · 130km), 대표 사진, 할 일, 어두운 집결 패스. 맨 아래 엄지 영역에 이전·다음 단추(다음은 검은 알약에 다음 장소 이름·시각).

FORM: 브리프가 고정한 구조(지도 + 한 장씩 넘기는 카드)를 1순위로 두고, concept-seed 0f474576 이 뽑은 4번(시간 척추 목록)·3번(탑승권 스텁)·7번(노선도 도식) 가운데 7번의 노선도 띠, 3번의 탑승권 스텁(집결 패스), 4번의 시간 척추(일정 시트)를 기부받아 올렸다.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Signature interaction: 다음을 누르거나 옆으로 밀면 지도가 앞 장소와 이 장소를 함께 담도록 부드럽게 옮겨 가고, 그 구간 도로선이 오렌지로 그려진다. 비행기 장은 지구본으로 바뀌어 인천에서 JFK까지 호를 그린다.
Motion grammar: 상태를 알리는 움직임만. 카드 넘김 220ms 감속, 지도 900ms, 구간 선 그리기 600ms. prefers-reduced-motion 이면 즉시 이동.
Memorable moment: 비행기 장의 지구본 호, 그리고 노선도 띠에서 "지금" 점이 깜빡이는 것.
Unresolved: 로그인·DB 연결 뒤 출석·느낀 점 서버 저장.
