import { createContext, forwardRef, useContext, useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Badge, Paragraph, Tooltip } from '@toss/tds-mobile';
import { adaptive } from '@toss/tds-colors';
import { STANDALONE } from './copy';

/* ───────── 디자인(Browser · A2 / A3)에서 가져온 아이콘 ─────────
 * 좌표는 원본 SVG의 값을 그대로 쓰고, viewBox만 각 아이콘 위치로 맞췄어요. */

type SquircleProps = { active?: boolean; size?: number };

const squircle = (active: boolean | undefined): CSSProperties => ({
  fill: active === false ? adaptive.blue200 : adaptive.blue500,
});

/** 프로젝트(로고) */
export function IconProject({ active, size = 50 }: SquircleProps) {
  return (
    <svg width={size} height={size} viewBox="25 146 50 50" aria-hidden>
      <rect x='25' y='146' width='50' height='50' rx='15.3846' style={squircle(active)} />
      <path d='M46.06 178H42.9L47.78 163.84H51.58L56.46 178H53.3L52.24 174.76H47.12L46.06 178ZM47.86 172.44H51.5L49.74 167.04H49.62L47.86 172.44Z' fill='#fff' />
    </svg>
  );
}

/** 나에게 온 변경 (알림목록_Side_icon.svg) */
export function IconInbox({ active, size = 50 }: SquircleProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 50 50" aria-hidden>
      <rect width="50" height="50" rx="15.3846" style={squircle(active)} />
      <path
        d="M25 15.7142H22.1429C18.5925 15.7142 15.7143 18.5924 15.7143 22.1428V27.8571C15.7143 31.4075 18.5925 34.2857 22.1429 34.2857H27.8572C31.4076 34.2857 34.2857 31.4075 34.2857 27.8571V24.9999"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="31.4286" cy="18.5714" r="3.57143" fill="#fff" />
    </svg>
  );
}

/** 변경 상세 (알림상세_Side_icon.svg · 모서리 반경 5로 줄인 버전) */
export function IconDetail({ active, size = 50 }: SquircleProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 50 50" aria-hidden>
      <rect width="50" height="50" rx="15.3846" style={squircle(active)} />
      <path
        d="M20.7143 34.2857H29.2857C32.0471 34.2857 34.2857 32.0471 34.2857 29.2857V20.7142C34.2857 17.9528 32.0471 15.7142 29.2857 15.7142H20.7143C17.9529 15.7142 15.7143 17.9528 15.7143 20.7142V29.2857C15.7143 32.0471 17.9529 34.2857 20.7143 34.2857Z"
        stroke="#fff"
        strokeWidth="2"
        fill="none"
      />
      <line x1="20" y1="22" x2="30" y2="22" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
      <line x1="20" y1="28" x2="26" y2="28" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** (숨김) 이전 "변경 상세" 아이콘: 직접 그린 문서 모양. 지금은 쓰지 않지만 나중에 쓸 수 있게 남겨 뒀어요. */
export function IconDetailLegacy({ active, size = 50 }: SquircleProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 50 50" aria-hidden>
      <rect width='50' height='50' rx='15.3846' style={squircle(active)} />
      <path d='M19 15.5h8.5L33 21v13.5a1.5 1.5 0 0 1-1.5 1.5h-12.5a1.5 1.5 0 0 1-1.5-1.5v-17.5a1.5 1.5 0 0 1 1.5-1.5Z' stroke='#fff' strokeWidth='2' strokeLinejoin='round' fill='none' />
      <path d='M21 27h8M21 31h5' stroke='#fff' strokeWidth='2' strokeLinecap='round' />
    </svg>
  );
}

/** 설정 (디자인의 톱니바퀴) */
export function IconSettings({ active, size = 50 }: SquircleProps) {
  return (
    <svg width={size} height={size} viewBox="25 296 50 50" aria-hidden>
      <rect x='25' y='296' width='50' height='50' rx='15.3846' style={squircle(active)} />
      <path d='M48.0668 312H51.933C52.167 312 52.3701 312.162 52.4213 312.391L52.6898 313.589C52.8158 314.15 53.1823 314.593 53.6351 314.851C54.079 315.103 54.6347 315.195 55.1742 315.028L56.4252 314.642C56.6462 314.573 56.8855 314.665 57.0033 314.864L58.9369 318.134C59.0583 318.339 59.018 318.603 58.8402 318.762L57.8881 319.613C57.4746 319.984 57.2775 320.501 57.2777 321.001C57.278 321.501 57.4756 322.017 57.8881 322.387L58.8402 323.238C59.018 323.397 59.0583 323.661 58.9369 323.866L57.0033 327.136C56.8855 327.335 56.6462 327.427 56.4252 327.358L55.1801 326.974L54.976 326.923C54.5687 326.845 54.1624 326.907 53.8109 327.064L53.64 327.15C53.2402 327.377 52.9078 327.745 52.7465 328.211L52.6888 328.417L52.4213 329.609C52.3701 329.838 52.167 330 51.933 330H48.0511C47.8172 330 47.6151 329.838 47.5638 329.609L47.2943 328.41C47.1843 327.92 46.8907 327.521 46.516 327.256L46.351 327.15L46.1791 327.063C45.7677 326.879 45.283 326.827 44.8109 326.974L43.5756 327.358C43.3543 327.427 43.1145 327.335 42.9965 327.136L41.0629 323.866C40.9414 323.661 40.9828 323.397 41.1605 323.238L42.1117 322.387C42.5253 322.016 42.7223 321.499 42.722 320.999C42.7217 320.499 42.5243 319.983 42.1117 319.613L41.1605 318.762C40.9828 318.603 40.9414 318.339 41.0629 318.134L42.9965 314.864C43.1143 314.665 43.3535 314.573 43.5746 314.642L44.8207 315.026C45.3622 315.194 45.9184 315.1 46.3607 314.85C46.8175 314.591 47.1855 314.147 47.3119 313.583L47.5785 312.391C47.6297 312.162 47.8328 312 48.0668 312Z' stroke='#fff' strokeWidth='2' strokeLinejoin='round' fill='none' />
      <circle cx='49.9935' cy='321' r='3' stroke='#fff' strokeWidth='2' fill='none' />
    </svg>
  );
}

/** 사이드바 접기/펼치기 */
export function IconSidebarToggle() {
  return (
    <svg width='24' height='22' viewBox="24 71 24 20" aria-hidden>
      <rect x='26' y='72' width='20' height='18' rx='4' fill='none' stroke={adaptive.grey300} strokeWidth='2' />
      <rect x='29' y='75' width='5' height='12' rx='2' style={{ fill: adaptive.grey300 }} />
    </svg>
  );
}

/** 프로필 아바타 (보라색 원 + 이름 첫 글자 "지") */
export function IconAvatar({ size = 35 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="25 836 35 35" aria-hidden>
      <circle cx='42.5' cy='853.5' r='17.5' fill={adaptive.purple500} />
      <path d='M41.55 850.16C41.565 852.305 42.675 854.615 44.91 855.53L43.89 857C42.33 856.34 41.235 855.005 40.635 853.4C40.035 855.155 38.925 856.61 37.35 857.33L36.3 855.86C38.505 854.885 39.645 852.41 39.66 850.16V849.32H36.81V847.79H44.34V849.32H41.55V850.16ZM45.66 859.85V846.5H47.55V859.85H45.66Z' fill='#fff' />
    </svg>
  );
}

/** 알림이 꺼져 있다는 배너의 종 아이콘 */
export function IconBellOff({ size = 50 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="185 247 50 50" aria-hidden>
      <rect x='185' y='247' width='50' height='50' rx='15.3846' style={{ fill: adaptive.blue500 }} />
      <path fillRule='evenodd' clipRule='evenodd' d='M203.782 266.397C204.949 264.683 206.917 263.195 210.002 263.195C213.087 263.195 215.054 264.683 216.222 266.397C217.362 268.072 217.752 269.971 217.752 270.945V275.823L219.042 279.695H200.961L202.252 275.823V270.945C202.252 269.971 202.641 268.072 203.782 266.397Z' fill='#fff' />
      <path d='M208.75 263.282C209.145 263.225 209.562 263.195 210.002 263.195C210.44 263.195 210.856 263.226 211.25 263.282V262.659C211.25 262.312 211.128 262.017 210.885 261.774C210.641 261.531 210.346 261.409 209.999 261.409C209.652 261.409 209.357 261.531 209.114 261.774C208.872 262.017 208.75 262.312 208.75 262.659V263.282Z' fill='#fff' />
      <path d='M210.001 282.436C209.504 282.436 209.078 282.259 208.725 281.905C208.372 281.551 208.195 281.125 208.195 280.628H211.811C211.811 281.127 211.634 281.553 211.279 281.906C210.925 282.259 210.499 282.436 210.001 282.436Z' fill='#fff' />
      <path d='M198.646 282.36L219.86 261.146' stroke='#fff' strokeWidth='2' strokeLinecap='round' />
    </svg>
  );
}

export function IconClose({ size = 10 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="1374 236 10 10" aria-hidden>
      <path d='M1384 246L1374 236M1374 246L1384 236' stroke={adaptive.grey900} strokeLinecap='round' />
    </svg>
  );
}

export function IconSparkle({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="420 722 11 11" aria-hidden>
      <path d='M424.107 725.002C424.114 724.969 424.16 724.969 424.167 725.002C424.51 726.679 425.821 727.99 427.498 728.333C427.531 728.34 427.531 728.386 427.498 728.393C425.821 728.736 424.51 730.047 424.167 731.724C424.16 731.757 424.114 731.757 424.107 731.724C423.764 730.047 422.453 728.736 420.776 728.393C420.743 728.386 420.743 728.34 420.776 728.333C422.453 727.99 423.764 726.679 424.107 725.002Z' fill='currentColor' />
      <path d='M423.39 724.775C423.615 724.018 424.738 724.044 424.903 724.851C425.186 726.234 426.266 727.314 427.649 727.597C428.482 727.767 428.482 728.958 427.649 729.129C426.266 729.411 425.186 730.492 424.903 731.875C424.733 732.708 423.542 732.708 423.371 731.875C423.089 730.492 422.008 729.411 420.625 729.129C419.792 728.958 419.792 727.767 420.625 727.597L420.754 727.568C422.075 727.247 423.097 726.191 423.371 724.851L423.39 724.775ZM424.137 726.878C423.752 727.472 423.246 727.978 422.652 728.363C423.246 728.748 423.752 729.254 424.137 729.847C424.522 729.254 425.028 728.748 425.622 728.363C425.028 727.978 424.522 727.472 424.137 726.878Z' fill='currentColor' />
      <path d='M428.366 722.73C428.428 722.423 428.866 722.423 428.929 722.73C429.068 723.407 429.597 723.937 430.274 724.075C430.581 724.138 430.581 724.576 430.274 724.639C429.597 724.777 429.068 725.307 428.929 725.984C428.866 726.291 428.428 726.291 428.366 725.984C428.227 725.307 427.698 724.777 427.02 724.639C426.714 724.576 426.714 724.138 427.02 724.075C427.698 723.937 428.227 723.407 428.366 722.73Z' fill='currentColor' />
    </svg>
  );
}

/* ───────── 디자인의 칩(작은 라벨) ───────── */

export type ChipTone = 'orange' | 'blue' | 'blueFill' | 'gray' | 'green' | 'red' | 'purple';

const TONES: Record<ChipTone, { bg: string; color: string }> = {
  // 디자인의 주황 칩(#FFF1E0 / #E8590C)은 TDS 토큰에 정확히 같은 색이 없어서 디자인 값을 그대로 써요.
  orange: { bg: '#FFF1E0', color: '#E8590C' },
  blue: { bg: adaptive.blue50, color: adaptive.blue700 },
  blueFill: { bg: adaptive.blue500, color: '#FFFFFF' },
  gray: { bg: adaptive.grey100, color: adaptive.grey600 },
  green: { bg: adaptive.green50, color: adaptive.green700 },
  red: { bg: adaptive.red50, color: adaptive.red600 },
  // "되돌림" 표시용. 파랑·주황·초록·빨강은 이미 다른 뜻으로 쓰고 있어서 겹치지 않는 보라를 써요.
  purple: { bg: '#F3EBFF', color: '#7B3FE4' },
};

/**
 * 대체 버전(STANDALONE) 칩: 토스 앱의 [보기] / [받기] 칩을 그대로 따라요.
 *  - 크기: 높이 32, 글자 13px, 안쪽 여백 위아래 6 · 좌우 13, 모서리 9 (첨부 이미지를 픽셀로 재서 환산)
 *  - 색: 파랑 계열 = [보기] (배경 #E9F1FC, 글자 #1F72EA), 회색 계열 = [받기] (배경 #F1F2F4, 글자 #4A4D52)
 *  - [대기](주황) · 초록 · 빨강 · 보라는 색은 그대로, 크기만 같아요.
 *  - 글자 굵기는 모두 같은 Medium(500)이에요.
 */
const STANDALONE_TONES: Partial<Record<ChipTone, { bg: string; color: string }>> = {
  blue: { bg: '#E9F1FC', color: '#1F72EA' },
  blueFill: { bg: '#E9F1FC', color: '#1F72EA' },
  gray: { bg: '#F1F2F4', color: '#4A4D52' },
};

/**
 * CLI 탭 칩 전체의 글자 굵기.
 * 값이 없으면 TDS 기본(굵게 700)이고, CLI 탭에서는 Medium(500)을 써요.
 */
export const BlueFillChipWeight = createContext<number | undefined>(undefined);

/** TDS Badge를 디자인 색으로 쓰는 칩 (높이 23, 모서리 6) */
export const Chip = forwardRef<HTMLSpanElement, { tone: ChipTone; children: ReactNode; icon?: ReactNode }>(function Chip(
  { tone, children, icon, ...rest },
  ref
) {
  const t = (STANDALONE && STANDALONE_TONES[tone]) || TONES[tone];
  const blueFillWeight = useContext(BlueFillChipWeight);
  return (
    <Badge
      {...rest}
      ref={ref}
      size='small'
      color='elephant'
      variant='weak'
      style={
        {
          // Badge는 색을 인라인 color / backgroundColor로 직접 지정해서, 같은 속성으로 덮어써요.
          color: t.color,
          backgroundColor: t.bg,
          '--badge-border-radius': STANDALONE ? '9px' : '6px',
          '--badge-padding': STANDALONE ? '6px 13px' : '2.5px 8px',
          ...(STANDALONE ? { '--badge-font-size': '13px', lineHeight: '20px' } : {}),
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          whiteSpace: 'nowrap',
        } as CSSProperties
      }
    >
      {icon}
      {/* Badge가 루트에 굵기를 직접 지정하므로, 글자 쪽에서 굵기를 바꿔요. */}
      {STANDALONE || blueFillWeight ? <span style={{ fontWeight: STANDALONE ? 500 : blueFillWeight }}>{children}</span> : children}
    </Badge>
  );
});

/* ───────── Filter.svg: 필터 탭 (165×44 · 반경 15 · 선택 알약 반경 11) ─────────
 * TDS SegmentedControl은 글자 크기(15px)와 폭 계산을 바꿀 수 없어서 줄바꿈이 생겨요.
 * 그래서 첨부 디자인 수치(안쪽 여백 5, 항목 높이 34, 좌우 여백 15, 글자 12px)로 직접 만들었어요. */
export function FilterTabs<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      style={{
        display: 'inline-flex',
        padding: 5,
        borderRadius: 15,
        background: adaptive.grey100,
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            style={{
              height: 34,
              padding: '0 15px',
              border: 0,
              borderRadius: 11,
              cursor: 'pointer',
              background: selected ? '#FFFFFF' : 'transparent',
              boxShadow: selected ? '0 1px 3px rgba(0, 0, 0, 0.08)' : 'none',
              transition: 'background 150ms ease-out, box-shadow 150ms ease-out',
            }}
          >
            <Paragraph.Text
              typography="st12"
              fontWeight={selected ? 'bold' : 'medium'}
              color={selected ? adaptive.grey900 : adaptive.grey600}
            >
              {o.label}
            </Paragraph.Text>
          </button>
        );
      })}
    </div>
  );
}

/* ───────── toggle.svg: 켜짐/꺼짐 토글 (42×24 · 반경 12) ─────────
 * 켜짐: 파란 배경 + 왼쪽 체크 + 오른쪽 흰 원(cx 30). 꺼짐: TDS 스위치와 같은 회색(grey200) 배경 + 왼쪽 흰 원(cx 12).
 * TDS Switch는 50×30 고정이라 같은 크기로 만들 수 없어서 직접 만들었어요. */
export function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      style={{ border: 0, padding: 0, background: 'none', cursor: 'pointer', display: 'block', lineHeight: 0 }}
    >
      <svg width="42" height="24" viewBox="0 0 42 24" aria-hidden>
        <rect
          width="42"
          height="24"
          rx="12"
          style={{ fill: checked ? adaptive.blue500 : adaptive.grey200, transition: 'fill 180ms ease-out' }}
        />
        <path
          d="M15.3125 9.34375L11.0725 14.6562L8.68753 12.1562"
          fill="none"
          stroke="#fff"
          strokeWidth="1.25"
          strokeLinecap="round"
          style={{ opacity: checked ? 1 : 0, transition: 'opacity 180ms ease-out' }}
        />
        <circle cx="12" cy="12" r="9" fill="#fff" style={{ transform: `translateX(${checked ? 18 : 0}px)`, transition: 'transform 180ms ease-out' }} />
      </svg>
    </button>
  );
}

/* ───────── Issue Filter Chip (첨부 이미지 기준) ─────────
 * 검정 배경(#252525) + 흰색 굵은 글자, 완전히 둥근 알약 모양.
 * 이미지를 픽셀로 재서(칩 78×69, 글자 높이 18, 2배율 내보내기로 보고) CSS 값으로 환산했어요:
 * 약 39×35, 안쪽 여백 위아래 8 · 좌우 12, 글자 13px 굵게. */
export function IssueFilterChip({ children, active = true }: { children: ReactNode; active?: boolean }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 12px',
        borderRadius: 999,
        // 선택된 칩은 검정(#252525), 선택 안 된 칩은 같은 크기에 연한 회색(#F2F4F6)이에요.
        background: active ? '#252525' : adaptive.grey100,
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      <Paragraph.Text typography="t7" fontWeight={STANDALONE ? 'regular' : 'semibold'} color={active ? '#FFFFFF' : adaptive.grey600}>
        {children}
      </Paragraph.Text>
    </span>
  );
}

/* ───────── 결정 사항 / 이슈 카드 아이콘 (물음표 원 · 체크 원) ───────── */
function IconSquare({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        width: 36,
        height: 36,
        borderRadius: 12,
        background: adaptive.grey100,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {children}
    </span>
  );
}

/** 이슈: 물음표가 든 원 */
export function IconIssue() {
  return (
    <IconSquare>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <circle cx="10" cy="10" r="8.25" stroke={adaptive.grey900} strokeWidth="1.5" />
        <path
          d="M7.9 7.9c0-1.1.9-1.9 2.1-1.9s2.1.8 2.1 1.8c0 .9-.5 1.3-1.2 1.7-.6.4-.9.7-.9 1.4"
          stroke={adaptive.grey900}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="10" cy="13.6" r="0.9" fill={adaptive.grey900} />
      </svg>
    </IconSquare>
  );
}

/** 결정 사항: 체크가 든 원 */
export function IconDecision() {
  return (
    <IconSquare>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <circle cx="10" cy="10" r="8.25" stroke={adaptive.grey900} strokeWidth="1.5" />
        <path d="M6.6 10.2l2.4 2.4 4.4-4.9" stroke={adaptive.grey900} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </IconSquare>
  );
}

/* ───────── 사이드바 아이콘 말풍선 (기준값) ─────────
 * 사이드바에 새 탭이 생기면 아이콘을 <SidebarHint label="탭 이름"> 으로 감싸기만 하세요.
 * 그러면 아래 기준값이 그대로 적용돼서 모든 탭의 말풍선이 똑같이 나와요.
 *
 * 기준값
 *  - TDS Tooltip, size="small", 아이콘 아래(placement="bottom") 가운데. 아이콘과의 간격은 TDS 기본(18px). 프로필은 위(top).
 *  - 마우스가 아이콘(사각 영역)에 있는 동안에만 Tooltip을 그리고, 벗어나면 Tooltip 자체를 없애서 바로 사라져요.
 *    (TDS Tooltip은 open을 꺼도 바로 닫히지 않아서 이렇게 했어요.)
 *  - 라벨이 6글자 이상이면 말풍선 박스만 오른쪽으로 10px 옮겨요. 화살표는 같은 만큼 되돌려서 항상 아이콘 가운데를 가리켜요.
 *    (왼쪽이 화면 가장자리에서 잘리지 않게. 실제 이동은 global.css의 [role='tooltip'] translate 규칙이 해요.)
 *  - 그림자는 0 8px 28px rgba(0, 29, 58, 0.10) (TDS 기본보다 약하게), 말풍선은 클릭을 가로채지 않아요(pointer-events: none).
 *    이 둘도 global.css의 [role='tooltip'] 규칙에 있어요.
 */
export const SIDEBAR_TOOLTIP = {
  size: 'small',
  /** 이 글자 수 이상이면 말풍선 박스를 오른쪽으로 옮겨요 */
  longLabelMinLength: 6,
  /** 말풍선 박스를 오른쪽으로 옮기는 거리(px) */
  shiftPx: 10,
} as const;

export const sidebarTooltipShift = (label: string) =>
  label.length >= SIDEBAR_TOOLTIP.longLabelMinLength ? SIDEBAR_TOOLTIP.shiftPx : 0;

/** 아이콘 영역에 마우스가 있을 때만 말풍선을 보여주는 사이드바 아이콘 래퍼 */
export function SidebarHint({
  label,
  placement = 'bottom',
  disabled,
  children,
}: {
  label: string;
  placement?: 'bottom' | 'top';
  /** true면 말풍선을 보여주지 않아요 (예: 사이드바가 펼쳐져 라벨이 이미 보일 때) */
  disabled?: boolean;
  children: ReactNode;
}) {
  const [hover, setHover] = useState(false);
  const shift = sidebarTooltipShift(label);
  const open = !disabled && hover;

  // 말풍선이 떠 있는 동안만 이동값(--tt-shift)을 걸어요. 벗어나면 바로 지워요.
  useEffect(() => {
    if (!open) return;
    document.body.style.setProperty('--tt-shift', `${shift}px`);
    return () => {
      document.body.style.removeProperty('--tt-shift');
    };
  }, [open, shift]);

  return (
    <div
      style={{ position: 'relative', flexShrink: 0 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {children}
      {open && (
        // 말풍선이 붙는 기준점은 아이콘과 같은 크기의 투명한 칸이에요.
        <Tooltip size={SIDEBAR_TOOLTIP.size} placement={placement} open message={label}>
          <span aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
        </Tooltip>
      )}
    </div>
  );
}

/** 답변 수정 아이콘 (모서리 둥근 사각형 + 연필). 기본 20px, 색은 글자색(currentColor)을 따라가요. */
export function IconEdit({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 4.5H8.5A4 4 0 0 0 4.5 8.5v7a4 4 0 0 0 4 4h7a4 4 0 0 0 4-4V13" />
      <path d="M19.4 4.6a1.9 1.9 0 0 1 0 2.7L12.2 14.5 9 15l.5-3.2 7.2-7.2a1.9 1.9 0 0 1 2.7 0z" />
    </svg>
  );
}
