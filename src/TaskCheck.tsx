/**
 * 작업 표의 체크 아이콘 (대체 버전 전용).
 *
 * 누를 수 있는 체크박스가 아니라, 그 작업의 담당자가 이 변경에 답했는지를 보여주는 표시예요.
 *  - pending : 아직 답하지 않음(대기)        → 연한 회색
 *  - other   : 다른 담당자가 이미 답함        → 연한 파랑
 *  - mine    : 내가 답한 작업(내 담당)        → 진한 파랑
 *
 * 표시가 바뀔 때(예: 내가 답해서 회색 → 진한 파랑) 토스 체크 아이콘처럼 통통 튀어요.
 * 움직임은 TDS 체크 아이콘의 스프링 값을 그대로 따랐어요:
 *   커졌다가(scale 1.1, quick: 강성 800 · 감쇠 55) → 원래 크기로 튀며 돌아옴(bounce: 강성 300 · 감쇠 15)
 */
import { useEffect, useRef } from 'react';
import { adaptive } from '@toss/tds-colors';

export type TaskCheckState = 'pending' | 'other' | 'mine';

const CHECK_PATH =
  'm10.4099 17.8538c-.3393 0-.67866-.1131-.90488-.4524l-5.20306-5.2031c-.56556-.5655-.56556-1.3573 0-1.9228.56555-.56559 1.35732-.56559 1.92287 0l4.18507 4.185 7.4653-7.46523c.5655-.56555 1.3573-.56555 1.9228 0 .5656.56555.5656 1.35732 0 1.92287l-8.3701 8.37016c-.3393.4524-.6787.5655-1.018.5655z';

const LOOK: Record<TaskCheckState, { fill: string; opacity: number }> = {
  pending: { fill: adaptive.grey300, opacity: 1 },
  other: { fill: adaptive.blue500, opacity: 0.4 },
  mine: { fill: adaptive.blue500, opacity: 1 },
};

const LABEL: Record<TaskCheckState, string> = {
  pending: '아직 답하지 않았어요',
  other: '담당자가 답했어요',
  mine: '내가 답했어요',
};

/** 스프링을 직접 계산해서 값을 한 프레임씩 흘려보내요 */
function spring(
  from: number,
  to: number,
  v0: number,
  stiffness: number,
  damping: number,
  onFrame: (x: number, v: number) => void,
  onDone: (x: number, v: number) => void,
  maxMs = 900
) {
  let x = from;
  let v = v0;
  let last = performance.now();
  const start = last;
  let raf = 0;
  const tick = (now: number) => {
    let dt = Math.min(0.034, (now - last) / 1000);
    last = now;
    const steps = Math.max(1, Math.ceil(dt / (1 / 240)));
    const h = dt / steps;
    for (let i = 0; i < steps; i++) {
      v += (-stiffness * (x - to) - damping * v) * h;
      x += v * h;
    }
    onFrame(x, v);
    if ((Math.abs(x - to) < 0.0015 && Math.abs(v) < 0.02) || now - start > maxMs) {
      onFrame(to, 0);
      onDone(to, 0);
      return;
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

export function TaskCheck({ state, size = 20 }: { state: TaskCheckState; size?: number }) {
  const pathRef = useRef<SVGPathElement>(null);
  const prev = useRef<TaskCheckState>(state);
  const cancel = useRef<() => void>();

  useEffect(() => {
    if (prev.current === state) return;
    prev.current = state;
    const el = pathRef.current;
    if (!el) return;
    cancel.current?.();
    const set = (s: number) => {
      el.style.transform = `scale(${s})`;
    };
    // 1) 살짝 커지고(quick) → 2) 원래 크기로 튀며 돌아와요(bounce)
    let stop1 = spring(1, 1.1, 0, 800, 55, (x) => set(x), (x) => {
      stop2 = spring(x, 1, 0, 300, 15, (y) => set(y), () => {
        el.style.transform = 'none';
      });
    }, 220);
    let stop2 = () => {};
    cancel.current = () => {
      stop1();
      stop2();
    };
    return () => cancel.current?.();
  }, [state]);

  const look = LOOK[state];
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label={LABEL[state]}
      style={{ width: size, height: size, flex: '0 0 auto', display: 'block' }}
    >
      <title>{LABEL[state]}</title>
      <path
        ref={pathRef}
        d={CHECK_PATH}
        fill={look.fill}
        style={{
          opacity: look.opacity,
          transformBox: 'fill-box',
          transformOrigin: '50% 50%',
          transition: 'fill 160ms ease-out, opacity 160ms ease-out',
        }}
      />
    </svg>
  );
}
