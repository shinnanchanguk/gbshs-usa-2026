/**
 * 아이콘 (galpi2 아이콘 세트에서 가져온 것 + 이 사이트에 필요한 것 몇 개)
 *
 * 공통 규격
 *   · viewBox 24×24, fill 없음, 선만 사용
 *   · stroke 는 currentColor → 색은 쓰는 곳의 글자색(Expedition 팔레트)을 그대로 따라간다
 *   · stroke-width 기본 1.8 (규격 1.6~2 안), linecap·linejoin 은 round 로 통일
 *   · size 는 rem 단위 기본값이라 Ctrl+휠 글자 크기 조절을 같이 따라간다
 */

import type { ReactNode, SVGProps } from "react";

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "children"> {
  /** 아이콘 한 변의 길이. 숫자를 주면 px, 문자열이면 그대로 쓴다. 기본은 1.25rem. */
  size?: number | string;
  /** 선 굵기. 세트 기본값 1.8 을 벗어나지 않게 쓴다. */
  strokeWidth?: number;
}

function Icon({
  size = "1.25rem",
  strokeWidth = 1.8,
  children,
  ...rest
}: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {children}
    </svg>
  );
}

/** 닫기·취소 */
export function IconClose(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m6 6 12 12" />
      <path d="m18 6-12 12" />
    </Icon>
  );
}

/** 이전 */
export function IconChevronLeft(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m14.8 5.8-6.2 6.2 6.2 6.2" />
    </Icon>
  );
}

/** 다음 */
export function IconChevronRight(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m9.2 5.8 6.2 6.2-6.2 6.2" />
    </Icon>
  );
}

/** 펼치기 */
export function IconChevronDown(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="m5.8 9.2 6.2 6.2 6.2-6.2" />
    </Icon>
  );
}

/** 삭제·연결 해제 */
export function IconTrash(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.5 7h15" />
      <path d="M9 3.8h6l.8 3.2H8.2z" />
      <path d="M6.5 7 7.4 20h9.2l.9-13" />
      <path d="M10 10.4v5.8" />
      <path d="M14 10.4v5.8" />
    </Icon>
  );
}

/** 자물쇠 (개인정보를 가린 상태) */
export function IconLock(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4.6" y="10.4" width="14.8" height="10.2" rx="2.2" />
      <path d="M8.2 10.4V7.6a3.8 3.8 0 0 1 7.6 0v2.8" />
      <path d="M12 14.4v2.4" />
    </Icon>
  );
}

/** 펜 (직접 가리기) */
export function IconPen(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M15.2 4.4 19.6 8.8" />
      <path d="M3.4 20.6 4.6 16.4 15.9 5.1a2 2 0 0 1 2.83 0l1.17 1.17a2 2 0 0 1 0 2.83L8.6 20.4z" />
    </Icon>
  );
}

/** 체크 */
export function IconCheck(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4.6 12.6 9.6 17.6 19.4 6.8" />
    </Icon>
  );
}

/** 뒤로가기 (IconArrowRight 를 좌우로 뒤집은 것, 가로 여백 4·5 를 그대로 맞춘다) */
export function IconArrowLeft(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 12H5" />
      <path d="m11 6-6 6 6 6" />
    </Icon>
  );
}

/** 화살표 (다음으로) */
export function IconArrowRight(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </Icon>
  );
}

/** 경고 */
export function IconWarning(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 3.6 21.2 19.8a1 1 0 0 1-.87 1.5H3.67a1 1 0 0 1-.87-1.5z" />
      <path d="M12 9.6v4.6" />
      <path d="M12 17.4h.01" />
    </Icon>
  );
}

/** 크게 보기 (네 귀퉁이가 바깥을 향한다) */
export function IconMaximize(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M8.8 3.2H3.2v5.6" />
      <path d="M15.2 3.2h5.6v5.6" />
      <path d="M8.8 20.8H3.2v-5.6" />
      <path d="M15.2 20.8h5.6v-5.6" />
    </Icon>
  );
}

/** 원래 크기로 (네 귀퉁이가 안쪽을 향한다) */
export function IconMinimize(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.2 8.8h5.6V3.2" />
      <path d="M20.8 8.8h-5.6V3.2" />
      <path d="M3.2 15.2h5.6v5.6" />
      <path d="M20.8 15.2h-5.6v5.6" />
    </Icon>
  );
}

/* ── 이 사이트에서 더한 아이콘 (같은 규격) ─────────────────────── */

/** 지도 핀 */
export function IconPin(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.4" />
    </Icon>
  );
}

/** 복사 */
export function IconCopy(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="8.5" y="8.5" width="11.5" height="11.5" rx="2.4" />
      <path d="M15.5 8.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.5a2 2 0 0 0 2 2h2.5" />
    </Icon>
  );
}

/** 메뉴 (가로줄 셋) */
export function IconMenu(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h16" />
    </Icon>
  );
}

/** 시계 */
export function IconClock(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </Icon>
  );
}

/** 사람들 (출석) */
export function IconUsers(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <path d="M15.5 5.6a3.2 3.2 0 0 1 0 6" />
      <path d="M17.5 13.6A5.5 5.5 0 0 1 20.5 19" />
    </Icon>
  );
}

/** 말풍선 (피드백) */
export function IconMessage(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20 12.5a7.5 7.5 0 0 1-11 6.6L4 20l1-4.2A7.5 7.5 0 1 1 20 12.5Z" />
    </Icon>
  );
}

/** 사진 */
export function IconPhoto(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3.5" y="5" width="17" height="14" rx="2.4" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="m20.5 15.5-4.5-4.5-8.5 8" />
    </Icon>
  );
}

/** 지도 (접은 종이 지도) */
export function IconMap(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M9 4.5 3.5 6.5v13L9 17.5l6 2 5.5-2v-13L15 6.5l-6-2Z" />
      <path d="M9 4.5v13" />
      <path d="M15 6.5v13" />
    </Icon>
  );
}

/** 보내기 (종이비행기) */
export function IconSend(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M20.5 3.5 10 14" />
      <path d="m20.5 3.5-6.5 17-4-6.5-6.5-4 17-6.5Z" />
    </Icon>
  );
}
