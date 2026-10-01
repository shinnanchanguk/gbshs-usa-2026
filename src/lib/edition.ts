/**
 * 사이트 판.
 * - 본 사이트: 입장 코드로 명단을 열고, 학생·선생님·보호자 기능이 모두 있다.
 * - 학생 사전 안내판(GUIDE): 비밀번호 없이 공유한다. 명단에서 오는 자리·방·연락처·멘토 이름은 "추후 공지 예정"으로 가리고,
 *   느낀 점 쓰기·발표회 보고서·공지·선생님 기능은 뺀다. 준비물·일정·지도·장소 안내는 그대로 본다.
 */
import type { Roster } from './roster'

export const GUIDE: boolean = __GUIDE__

/** 사진·아이콘처럼 본 사이트에만 올려 둔 파일의 주소 앞부분 */
export const SITE_BASE: string = __SITE_BASE__

/** 사전 안내판이 쓰는 빈 명단(이름·번호·연락처가 하나도 없다) */
export const PUBLIC_ROSTER: Roster = { students: [], teachers: [], roles: {}, emergency: {}, nightDuty: [], mentorsMIT: [] }

/** 사전 안내판에서 명단 대신 보여 주는 말 */
export const LATER = '추후 공지 예정이에요.'
