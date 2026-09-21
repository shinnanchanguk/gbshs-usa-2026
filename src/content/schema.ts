/**
 * 안내 자료의 데이터 구조.
 *
 * content/trip.json, content/days/*.json 이 이 구조를 따라야 한다.
 * `npm run check` 가 이 스키마로 모든 파일을 검사한다(빌드할 때도 자동으로 검사).
 */
import { z } from 'zod'

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, '시각은 "09:30" 처럼 두 자리:두 자리로 적는다')

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

export const SlideKind = z.enum(['info', 'move', 'flight', 'campus', 'lecture', 'culture', 'meal', 'hotel', 'shopping'])

export const Slide = z.object({
  /** 링크 주소에 쓰이는 고유 이름. 예: "d2-harvard-lecture" */
  id: z.string().regex(/^d\d-[a-z0-9-]+$/, 'id 는 "d<일차>-영문소문자-하이픈" 형식'),
  kind: SlideKind,
  time: z
    .object({
      start: hhmm,
      end: hhmm.optional(),
      /** 한국 시각이면 "KST". 비우면 미국 동부 현지 시각. */
      tz: z.enum(['KST', 'EDT']).optional(),
    })
    .optional(),
  title: z.string().min(1),
  place: Place.optional(),
  /** 대표 사진 (photos 안에 있는 id 중 하나) */
  cover: z.string().optional(),
  photos: z.array(PhotoRef),
  /** 한 줄 요약 */
  summary: z.string().min(1),
  /** 할 일·설명 (한 줄에 하나) */
  details: z.array(z.string().min(1)),
  /** 유의사항 */
  notices: z.array(z.string().min(1)),
  /** 집결 장소·시각 */
  meeting: z.object({ place: z.string().min(1), time: hhmm.optional(), note: z.string().optional() }).optional(),
  /** 담임 선생님 출석판을 보여줄지 */
  attendance: z.boolean(),
  /** 내용 출처: recording = 9/21 회의 녹음, plan = 운영계획(안) */
  sources: z.array(z.enum(['recording', 'plan'])).min(1),
  /** 운영계획(안)과 회의 녹음이 다른 점 */
  changes: z.array(z.string().min(1)),
  /** 교사용 메모: 아직 정해지지 않은 것, 인솔할 때 참고할 것 (교사 모드에서만 보임) */
  teacherNotes: z.array(z.string().min(1)),
})

export const Day = z.object({
  /** 0 = 공통 안내, 1~9 = 일차 */
  n: z.number().int().min(0).max(9),
  /** YYYY-MM-DD (공통 안내는 비움) */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  weekday: z.enum(['월', '화', '수', '목', '금', '토', '일']).optional(),
  title: z.string().min(1),
  region: z.string().min(1),
  summary: z.string().min(1),
  /** 그날 묵는 숙소 이름 (없으면 비움) */
  hotel: z.string().optional(),
  slides: z.array(Slide).min(1),
})

export const Trip = z.object({
  title: z.string(),
  subtitle: z.string(),
  school: z.string(),
  period: z.string(),
  /** 반별 학생 수 (출석판 번호 개수) */
  classes: z.array(z.object({ no: z.number().int().min(1), size: z.number().int().min(1) })).min(1),
  siteUrl: z.string().url(),
  repo: z.string(),
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
