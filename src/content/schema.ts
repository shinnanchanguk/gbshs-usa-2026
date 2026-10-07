/**
 * 안내 자료의 데이터 구조.
 *
 * content/trip.json, content/days/day0.json ~ day10.json, content/seating.json 이 이 구조를 따른다.
 * `npm run check` 가 이 스키마로 모든 파일을 검사한다(빌드할 때도 자동으로 검사).
 *
 * 사이트는 day0(출발 전) → day1 ~ day9(여행) → day10(다녀와서)의 장(slide)을 한 줄로 이어 붙여
 * 한 장씩 넘긴다. 장의 순서가 곧 시간 순서이고 동선이다.
 */
import { z } from 'zod'

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, '시각은 "09:30" 처럼 두 자리:두 자리로 적는다')
const ymd = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

/** [경도, 위도] — 지도 라이브러리 순서. 구글 지도에서 복사한 (위도, 경도)와 순서가 반대다. */
export const Coords = z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)])

export const PhotoRef = z.object({
  /** content/photo-sources.json 의 사진 키. 예: "s1/f04/20260911_132237" */
  id: z.string().regex(/^s\d+\/f\d{2}\/[^/]+$/),
  caption: z.string().min(1),
})

export const Place = z.object({
  name: z.string().min(1),
  nameEn: z.string().optional(),
  address: z.string().optional(),
  coords: Coords,
})

export const SlideKind = z.enum([
  'guide', // 출발 전·다녀와서 안내
  'day', // 일차 표지
  'move', // 공항·이동
  'flight', // 비행기 안
  'campus', // 대학 탐방·멘토링
  'lecture', // 특강
  'culture', // 박물관·명소
  'meal', // 식사
  'hotel', // 숙소
  'shopping', // 쇼핑·마트
])

/** 앞 장소에서 이 장소까지 오는 길 */
export const Leg = z.object({
  mode: z.enum(['bus', 'walk', 'flight', 'boat']),
  /** 예정 소요 시간(분). 운영계획 일정표·브리핑 기준. 모르면 비운다. */
  minutes: z.number().int().min(1).optional(),
  /** 화면에 그대로 나가는 한 줄. 예: "JFK 공항에서 버스로 2~3시간" */
  text: z.string().min(1),
})

/**
 * 특수 화면. 일반 장(요약·할 일·유의사항)에 더해 그 자리에 전용 화면을 붙인다.
 * cover: 여행 표지 · checklist: 준비물 체크 · deadlines: 날짜별 할 일 · forms: 면책·의료 동의서 작성법
 * rules: 꼭 지킬 약속 · money: 돈과 결제 · bus: 버스 좌석 · rooms: 객실 · hotels: 숙소 3곳
 * contacts: 비상 연락처 · mentors: 멘토 전공 · report: 느낀 점 모아 보고서 쓰기
 */
export const Widget = z.enum(['cover', 'checklist', 'deadlines', 'forms', 'rules', 'money', 'bus', 'rooms', 'hotels', 'contacts', 'mentors', 'report'])

/** 내용 출처 */
export const Source = z.enum([
  'plan', // 운영계획(안) 1차
  'plan-v2', // 운영계획 수정(안) 2026. 9. 30. 무렵
  'recording', // 2026. 9. 21. 사전답사 결과 공유 회의 녹음
  'briefing', // 2026. 9. 30. 학생 대상 사전답사 브리핑 녹음·슬라이드
  'waiver', // 2026. 9. 30. 면책·의료 동의서 설명 녹음과 안내 PDF
  'roster', // 버스 좌석표·객실 배치도 엑셀(이름은 공개 화면에 넣지 않음)
  'mentor', // MIT 멘토 정보 엑셀·교사 카톡(이름은 공개 화면에 넣지 않음)
  'feedback', // 2026. 10. 1. 인솔 교사 카톡 피드백(3차 자료, 이름은 적지 않음)
  'meeting', // 2026. 10. 7. 인솔 교사 회의 녹음(4차 자료, 이름은 적지 않음)
])

export const ThemeId = z.enum(['campus', 'lecture', 'research', 'lab', 'global', 'arts', 'english', 'science'])

export const Slide = z.object({
  /** 링크 주소와 출석·느낀 점 기록에 쓰이는 고유 이름. 예: "d2-harvard-lecture". 한 번 정하면 바꾸지 않는다. */
  id: z.string().regex(/^d\d{1,2}-[a-z0-9-]+$/, 'id 는 "d<일차>-영문소문자-하이픈" 형식'),
  kind: SlideKind,
  widget: Widget.optional(),
  time: z
    .object({
      start: hhmm,
      end: hhmm.optional(),
      /** 한국 시각이면 "KST". 비우면 미국 동부 현지 시각(EDT). */
      tz: z.enum(['KST', 'EDT']).optional(),
    })
    .optional(),
  title: z.string().min(1),
  place: Place.optional(),
  /** 앞 장소에서 여기까지 오는 길(버스·도보·비행기·배) */
  leg: Leg.optional(),
  /** (선택) 일정. 집합 시간을 못 지키거나 일정이 밀리면 빠질 수 있는 일정 */
  optional: z.boolean().optional(),
  /** 대표 사진 (photos 안에 있는 id 중 하나) */
  cover: z.string().optional(),
  photos: z.array(PhotoRef),
  /** 한 줄 요약 */
  summary: z.string().min(1),
  /** 할 일·설명 (한 줄에 하나) */
  details: z.array(z.string().min(1)),
  /** 꼭 지킬 것 */
  notices: z.array(z.string().min(1)),
  /** 답사 다녀온 선생님이 알려 준 요령 */
  tips: z.array(z.string().min(1)).default([]),
  /** 다시 모이는 곳·시각 */
  meeting: z.object({ place: z.string().min(1), time: hhmm.optional(), note: z.string().optional() }).optional(),
  /** 호차마다 다른 안내. 예: {"1": "한밭에서 먹어요", "2": "효동각에서 먹어요"} */
  busNotes: z.object({ '1': z.string().min(1), '2': z.string().min(1) }).optional(),
  /** 더 알아보기 링크(공식 사이트 등) */
  links: z.array(z.object({ label: z.string().min(1), url: z.url({ protocol: /^https$/ }) })).default([]),
  /** 담임 선생님 출석판을 보여줄지 */
  attendance: z.boolean(),
  /** 학생 느낀 점 칸을 보여줄지 */
  reflect: z.boolean(),
  /** 느낀 점을 쓸 때 떠올릴 질문(한 줄) */
  prompt: z.string().optional(),
  /** 발표회 보고서 활동 주제 가운데 이 장과 맞는 것 */
  themes: z.array(ThemeId).default([]),
  sources: z.array(Source).min(1),
  /** 이전 자료와 달라진 점(교사 화면에만 보임) */
  changes: z.array(z.string().min(1)),
  /** 교사용 메모: 아직 정해지지 않은 것, 인솔할 때 참고할 것 (교사 화면에만 보임) */
  teacherNotes: z.array(z.string().min(1)),
})

export const Meals = z.object({
  breakfast: z.string().min(1).optional(),
  lunch: z.string().min(1).optional(),
  dinner: z.string().min(1).optional(),
})

export const Day = z.object({
  /** 0 = 출발 전, 1~9 = 일차, 10 = 다녀와서 */
  n: z.number().int().min(0).max(10),
  /** YYYY-MM-DD (출발 전·다녀와서는 비움) */
  date: ymd.optional(),
  weekday: z.enum(['월', '화', '수', '목', '금', '토', '일']).optional(),
  title: z.string().min(1),
  region: z.string().min(1),
  summary: z.string().min(1),
  /** 그날 밤 묵는 숙소 id (trip.hotels) */
  hotel: z.string().optional(),
  meals: Meals.optional(),
  slides: z.array(Slide).min(1),
})

const Contact = z.object({ name: z.string().min(1), phone: z.string().min(1), note: z.string().optional(), url: z.url({ protocol: /^https$/ }).optional() })

export const Trip = z.object({
  title: z.string(),
  subtitle: z.string(),
  school: z.string(),
  period: z.string(),
  startDate: ymd,
  endDate: ymd,
  /** 반별 학생 수 (출석판 번호 개수) */
  classes: z.array(z.object({ no: z.number().int().min(1), size: z.number().int().min(1), boys: z.number().int(), girls: z.number().int() })).min(1),
  buses: z.array(z.object({ no: z.number().int(), classes: z.array(z.number().int()), students: z.number().int(), teachers: z.number().int(), note: z.string() })),
  hotels: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      nameEn: z.string(),
      address: z.string(),
      phone: z.string(),
      coords: Coords,
      nights: z.array(ymd).min(1),
      notes: z.array(z.string()),
    }),
  ),
  flights: z.array(
    z.object({
      id: z.string(),
      code: z.string(),
      from: z.string(),
      to: z.string(),
      depart: z.string(),
      arrive: z.string(),
      duration: z.string(),
    }),
  ),
  themes: z.array(z.object({ id: ThemeId, label: z.string(), hint: z.string() })),
  deadlines: z.array(z.object({ date: ymd, time: z.string().optional(), title: z.string(), who: z.enum(['all', 'student', 'parent', 'teacher']), detail: z.string() })),
  checklist: z.array(z.object({ group: z.string(), items: z.array(z.object({ id: z.string(), label: z.string(), detail: z.string().optional() })) })),
  contacts: z.array(z.object({ group: z.string(), items: z.array(Contact) })),
  forms: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      what: z.string(),
      steps: z.array(z.object({ field: z.string(), write: z.string(), example: z.string().optional() })),
    }),
  ),
  mentors: z.array(z.object({ school: z.string(), count: z.string(), grouping: z.string(), majors: z.array(z.object({ field: z.string(), detail: z.string(), from: z.string() })) })),
  siteUrl: z.string().url(),
  repo: z.string(),
})

/** 버스 좌석 구조. 이름 없이 자리마다 반·역할만 적는다. 이름은 암호문(content/roster.enc.json)에만 있다. */
export const Seating = z.object({
  buses: z.array(
    z.object({
      no: z.number().int(),
      /** 뒤로 갈수록 늘어나는 줄. 한 줄은 [왼쪽 창가, 왼쪽 통로, 오른쪽 통로, 오른쪽 창가] 좌석 번호, 빈 자리는 null */
      rows: z.array(z.tuple([z.number().nullable(), z.number().nullable(), z.number().nullable(), z.number().nullable()])),
      /** 맨 뒤 오른쪽 화장실이 차지하는 줄 번호(0부터) */
      toiletRows: z.array(z.number().int()),
      seats: z.record(z.string(), z.object({ role: z.enum(['student', 'teacher', 'guide', 'staff', 'empty']), classNo: z.number().int().optional(), helper: z.boolean().optional() })),
    }),
  ),
})

export const PhotoSources = z.object({
  folders: z.record(z.string(), z.object({ survey: z.string(), folder: z.string() })),
  photos: z.record(
    z.string(),
    z.object({
      src: z.string(),
      thumb: z.string(),
      from: z.string(),
      takenAt: z.string().nullable(),
      w: z.number(),
      h: z.number(),
      /** 동영상이면 웹용 MP4 경로 (src·thumb 는 표지 이미지) */
      video: z.string().optional(),
    }),
  ),
})

export type SlideKind = z.infer<typeof SlideKind>
export type Slide = z.infer<typeof Slide>
export type Day = z.infer<typeof Day>
export type Trip = z.infer<typeof Trip>
export type PhotoRef = z.infer<typeof PhotoRef>
export type PhotoSources = z.infer<typeof PhotoSources>
export type Seating = z.infer<typeof Seating>
export type Widget = z.infer<typeof Widget>
export type ThemeId = z.infer<typeof ThemeId>
export type Leg = z.infer<typeof Leg>
