/**
 * 작업 표 체크 아이콘의 움직임 두 가지를 비교해서 고르려고 만든 스위치 (대체 버전 전용).
 *  - 'tds'   : 50548(TDS)을 영상으로 재서 따라 한 방식. 연한 체크(대기 · 담당자가 답함)를 누르면 옆으로 흔들려요.
 *  - 'spring': 처음에 만든 방식. 모든 체크를 누르면 작아졌다가 여러 번 튕기며 돌아와요(값이 안 바뀌어도).
 * 둘 다 TaskCheck.tsx 에 그대로 남아 있고, 고르는 값은 브라우저에 기억해요.
 * 정하고 나면 Detail.tsx 의 SHOW_CHECK_MOTION_SWITCH 를 false 로 바꿔서 스위치만 숨기면 돼요.
 */
import { useSyncExternalStore } from 'react';
import { adaptive } from '@toss/tds-colors';
import { Paragraph } from '@toss/tds-mobile';

export type CheckMotion = 'tds' | 'spring';

const KEY = 'task-check-motion';

const read = (): CheckMotion => {
  try {
    const v = window.localStorage.getItem(KEY);
    if (v === 'tds' || v === 'spring') return v;
  } catch {
    /* 저장소를 못 쓰는 환경이면 기본값 */
  }
  return 'tds';
};

let current: CheckMotion = read();
const listeners = new Set<() => void>();

export const setCheckMotion = (m: CheckMotion) => {
  current = m;
  try {
    window.localStorage.setItem(KEY, m);
  } catch {
    /* 무시 */
  }
  listeners.forEach((l) => l());
};

export const useCheckMotion = (): CheckMotion =>
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
    () => 'tds'
  );

const OPTIONS: { value: CheckMotion; label: string }[] = [
  { value: 'tds', label: '토스 방식 · 좌우 흔들림' },
  { value: 'spring', label: '기존 방식 · 스프링 바운스' },
];

/** 체크 움직임 고르기 (비교용) */
export function CheckMotionSwitch() {
  const motion = useCheckMotion();
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
      <Paragraph.Text typography="st12" color={adaptive.grey500}>
        체크 움직임 비교
      </Paragraph.Text>
      {OPTIONS.map((o) => {
        const active = motion === o.value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => setCheckMotion(o.value)}
            style={{
              border: 0,
              cursor: 'pointer',
              padding: '6px 12px',
              borderRadius: 999,
              background: active ? adaptive.blue50 : adaptive.grey100,
              fontFamily: 'inherit',
              lineHeight: 1,
            }}
          >
            <Paragraph.Text typography="st12" fontWeight={active ? 'bold' : 'medium'} color={active ? adaptive.blue700 : adaptive.grey600}>
              {o.label}
            </Paragraph.Text>
          </button>
        );
      })}
    </div>
  );
}
