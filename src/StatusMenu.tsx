/**
 * 내 작업 진행 상태 고르기 (대체 버전 전용 드롭다운).
 * TDS 의 Menu(Menu.Trigger + Menu.Dropdown + Menu.DropdownCheckItem)와 같은 모양으로 그렸어요.
 * TDS 는 허용된 도메인 밖에서 막혀서 같은 값(둥근 20px · 흰 반투명 · 그림자 · 체크 항목)으로 직접 구현했어요.
 */
import { useEffect, useRef, useState } from 'react';
import { adaptive } from '@toss/tds-colors';
import { Paragraph } from '@toss/tds-mobile';
import { PROGRESS_LABEL, PROGRESS_ORDER, type TaskProgress } from './data';

const Check = ({ on }: { on: boolean }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden style={{ flexShrink: 0 }}>
    <path
      d="M6.5 12.5 10.5 16.5 17.5 8"
      stroke={on ? adaptive.blue500 : 'transparent'}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function StatusMenu({ value, onChange }: { value: TaskProgress; onChange: (p: TaskProgress) => void }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onDown);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onDown);
    };
  }, [open]);

  return (
    <div ref={wrapRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          height: 32,
          padding: '0 10px 0 12px',
          borderRadius: 10,
          border: `1px solid ${adaptive.grey200}`,
          background: adaptive.background,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 600, color: adaptive.grey900, lineHeight: '19.5px' }}>{PROGRESS_LABEL[value]}</span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden
          style={{ transition: 'transform 160ms ease', transform: open ? 'rotate(180deg)' : 'none' }}
        >
          <path d="M3.5 6 8 10.5 12.5 6" stroke={adaptive.grey700} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div
          role="menu"
          aria-label="내 작업 상태"
          className="status-menu-pop"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            zIndex: 50,
            minWidth: 180,
            padding: '10px 0',
            borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.7)',
            background: 'rgba(255,255,255,0.8)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 16px 60px rgba(0,29,58,0.18)',
          }}
        >
          <div style={{ padding: '8px 20px 8px 16px', marginBottom: 4 }}>
            <Paragraph.Text typography="t7" fontWeight="bold" color={adaptive.grey500}>
              내 작업 상태
            </Paragraph.Text>
          </div>
          {PROGRESS_ORDER.map((p) => {
            const on = p === value;
            return (
              <button
                key={p}
                type="button"
                role="menuitemradio"
                aria-checked={on}
                className="status-menu-item"
                onClick={() => {
                  onChange(p);
                  setOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  gap: 6,
                  padding: '8px 20px 8px 12px',
                  border: 0,
                  background: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                }}
              >
                <Check on={on} />
                <span style={{ fontSize: 17, lineHeight: '25.5px', fontWeight: on ? 700 : 500, color: on ? adaptive.blue500 : adaptive.grey700, whiteSpace: 'nowrap' }}>
                  {PROGRESS_LABEL[p]}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
