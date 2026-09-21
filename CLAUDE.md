# 이 레포에서 AI 도구가 지킬 규칙

미국 진로체험학습 안내 사이트. 내용은 `content/`, 화면은 `src/`.

## 선생님 피드백 프롬프트를 받았을 때
프롬프트에 `파일: content/days/dayN.json → slides[id="…"]`가 있다. 그 슬라이드만 고친다.

1. `src/content/schema.ts`를 먼저 읽고 필드 뜻을 확인한다.
2. 문체: 학생이 읽는 글(summary/details/notices/caption)은 해요체, 짧게. 이모지·과장 금지.
3. 사실(시간·장소·숫자)을 바꾸면, 운영계획(안)이나 회의 내용과 달라지는 점을 그 슬라이드의 `teacherNotes`에 한 줄로 남긴다.
4. 슬라이드 `id`는 절대 바꾸지 않는다(링크·출석 기록이 묶여 있음). 새 슬라이드는 새 id로.
5. 일차 안에서 `time.start`는 시간 순서를 지킨다.
6. 좌표는 `[경도, 위도]`. 모르면 넣지 말고 teacherNotes에 "위치 확인 필요".
7. 공개 레포: 학생·교사 실명, 개인 전화번호, 건강 정보, 객실·좌석 배정 금지.
8. 끝나면 `npm run check`와 `npm run build`가 통과하는지 확인한다.

## 사진
- 새 사진은 `npm run photos:import -- <원본폴더>`로 가져온다. 원본은 레포에 넣지 않는다.
- 가져온 사진은 모두 어떤 슬라이드의 `photos`에 들어가야 한다(`npm run check`가 확인). 뺄 사진은 `content/photo-excluded.json`에 이유를 적는다.
