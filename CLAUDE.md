# 이 레포에서 AI 도구가 지킬 규칙

미국 진로체험학습 안내 사이트. 내용은 `content/`, 화면은 `src/`. 구조와 명령은 `README.md`.

## 내용(장)을 고칠 때
1. `src/content/schema.ts`를 먼저 읽고 필드 뜻을 확인한다.
2. 문체: 학생이 읽는 글은 해요체, 짧게. 이모지·과장·긴 줄표(—) 금지.
3. 사실(시간·장소·숫자)을 바꾸면 이전 자료와 달라진 점을 그 장의 `changes`에, 아직 정해지지 않은 것은 `teacherNotes`에 한 줄로 남긴다.
4. 장 `id`는 절대 바꾸지 않는다(링크·느낀 점·출석 기록이 묶여 있음). 새 장은 새 id로.
5. 일차 안에서 `time.start`는 시간 순서를 지킨다. 이동은 따로 장을 만들지 말고 도착하는 장의 `leg`로 적는다.
6. 좌표는 `[경도, 위도]`. 모르면 넣지 말고 teacherNotes에 "위치 확인 필요". 좌표를 바꾸면 `npm run routes`.
7. 공개 레포: 학생·교사 실명, 개인 전화번호, 건강 정보, 객실·좌석 배정은 공개 파일에 금지. 명단은 `private/roster.json` → `npm run roster:seal` 암호문으로만.
8. 끝나면 `npm run check`와 `npm run build`가 통과하는지 확인한다.

## 저장
- 느낀 점·출석·체크리스트는 `src/lib/repo.ts` 한곳에서 저장한다(지금은 기기 저장). DB를 붙일 때 이 파일만 바꾼다.

## 사진
- 새 사진은 `npm run photos:import -- <원본폴더>`로 가져온다. 원본은 레포에 넣지 않는다.
- 가져온 사진은 모두 어떤 장의 `photos`에 들어가야 한다(`npm run check`가 확인). 뺄 사진은 `content/photo-excluded.json`에 이유를 적는다.
