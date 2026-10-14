/**
 * 이슈 카드 안 작업 상태 칩 위치 비교 스위치 (대체 버전 전용, 임시).
 *  - 'right': 줄 오른쪽 끝, 작업 표와 같은 32px 칩, 텍스트 영역 세로 가운데
 *  - 'title': 이전 모양. 작업 이름 옆에 작은 칩 하나(대기 / 확인 완료 / 작업 반영)
 * 정하고 나면 Detail.tsx 의 SHOW_CHIP_POSITION_SWITCH 를 false 로 바꿔서 스위치만 숨기면 돼요.
 */
import { useSyncExternalStore } from 'react';
import { adaptive } from '@toss/tds-colors';
import { Paragraph } from '@toss/tds-mobile';

export type ChipPosition = 'right' | 'title';
// 오른쪽으로 정했어요. 비교하려면 SHOW_CHIP_POSITION_SWITCH 를 true 로 바꾸세요.
let current: ChipPosition = 'right';
const listeners = new Set<() => void>();
export const setChipPosition = (p: ChipPosition) => {
  current = p;
  listeners.forEach((l) => l());
};
export const useChipPosition = (): ChipPosition =>
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => current,
    () => 'right'
  );

const OPTIONS: { value: ChipPosition; label: string }[] = [
  { value: 'right', label: '오른쪽 · 32px 칩 (지금)' },
  { value: 'title', label: '제목 옆 · 작은 칩 (이전)' },
];

export function ChipPositionSwitch() {
  const pos = useChipPosition();
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
      <Paragraph.Text typography="st12" color={adaptive.grey500}>
        칩 위치 비교
      </Paragraph.Text>
      {OPTIONS.map((o) => {
        const active = pos === o.value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => setChipPosition(o.value)}
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
