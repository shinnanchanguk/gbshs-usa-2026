/**
 * 선생님이 남긴 피드백을 "그대로 붙여넣으면 AI 가 레포를 고칠 수 있는" 프롬프트 글로 만든다.
 * 어느 일차·어느 슬라이드·어느 파일인지와 지금 적힌 내용을 함께 담는다.
 */
import { dayDateLabel, dayLabel, slideById, timeLabel, trip } from '../content'
import type { FeedbackItem } from '../app/state'

export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

function describe(item: FeedbackItem, n: number): string {
  const lines = [`## 피드백 ${n}`]
  const slide = item.slideId ? slideById.get(item.slideId) : null
  if (!slide) {
    lines.push('- 위치: 사이트 전체')
    if (item.slideId) lines.push(`- (지금은 없는 슬라이드 id: ${item.slideId})`)
  } else {
    const when = timeLabel(slide)
    lines.push(
      `- 위치: ${dayLabel(slide.day)}${slide.day.date ? ` ${dayDateLabel(slide.day)}` : ''} · 슬라이드 ${slide.order}/${slide.day.slides.length} 「${slide.title}」${when ? ` ${when}` : ''}`,
      `- 링크: ${trip.siteUrl}#/s/${slide.id}`,
      `- 파일: content/days/day${slide.day.n}.json → slides[id="${slide.id}"]`,
      '- 지금 적힌 내용:',
      `  - 요약: ${slide.summary}`,
    )
    if (slide.details.length) lines.push(`  - 설명: ${slide.details.join(' / ')}`)
    if (slide.notices.length) lines.push(`  - 유의사항: ${slide.notices.join(' / ')}`)
    if (slide.meeting) lines.push(`  - 집결: ${slide.meeting.place}${slide.meeting.time ? ` ${slide.meeting.time}` : ''}`)
    if (slide.cover) lines.push(`  - 대표 사진: ${slide.cover}`)
  }
  lines.push(`- 작성: ${item.author || '(이름 없음)'} · ${formatDateTime(item.createdAt)}`, '- 피드백:', ...item.text.split('\n').map((l) => `  > ${l}`))
  return lines.join('\n')
}

export function buildPrompt(items: FeedbackItem[]): string {
  const header = [
    '[미국 진로체험 안내 사이트 피드백]',
    `레포: https://github.com/${trip.repo}`,
    `사이트: ${trip.siteUrl}`,
    '',
  ]
  const body = items.map((item, i) => describe(item, i + 1))
  const footer = [
    '',
    '요청: 위 피드백을 content/ 폴더의 해당 파일에 반영해 주세요. 사실(시간·장소·이름)이 바뀌는 경우 운영계획(안)이나 회의 녹음과 다르면 teacherNotes 에 적어 주세요. 반영 후 `npm run check` 와 `npm run build` 가 통과해야 합니다.',
  ]
  return [...header, ...body.flatMap((b) => [b, '']), ...footer].join('\n')
}
