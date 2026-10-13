/**
 * 작업 표의 체크 아이콘 (대체 버전 전용).
 *
 * 누를 수 있는 체크박스가 아니라, 그 작업의 담당자가 이 변경에 답했는지를 보여주는 표시예요.
 *  - pending : 아직 답하지 않음(대기)        → 연한 회색
 *  - other   : 다른 담당자가 이미 답함        → 연한 파랑
 *  - mine    : 내가 답한 작업(내 담당)        → 진한 파랑
 *
 * 움직임은 TDS 체크 아이콘처럼 스프링으로 튀어요.
 *  - 누르는 동안: 작아져요(scale 0.8, rapid: 강성 1000 · 감쇠 55)
 *  - 놓으면: 살짝 커졌다가(1.1, quick: 강성 800 · 감쇠 55) 원래 크기로 여러 번 튕기며 돌아와요(bounce: 강성 300 · 감쇠 9)
 *  - 값이 바뀌지 않아도(예: 회색을 눌러도) 누르면 똑같이 튀어요.
 *  - 표시가 바뀔 때(예: 내가 답해서 회색 → 진한 파랑)도 "놓았을 때" 움직임이 나와요.
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

/** 스프링 값 (TDS 체크 아이콘과 같은 이름). 마지막 bounce 의 감쇠만 더 여러 번 튕기도록 낮췄어요. */
const SPRING = {
  rapid: { k: 1000, c: 55 },
  quick: { k: 800, c: 55 },
  bounce: { k: 300, c: 9 },
};

/** 스프링을 직접 계산해서 값을 한 프레임씩 흘려보내요. 돌려주는 함수를 부르면 멈춰요. */
function spring(
  from: number,
  to: number,
  v0: number,
  stiffness: number,
  damping: number,
  onFrame: (x: number, v: number) => void,
  onDone: () => void,
  maxMs: number
) {
  let x = from;
  let v = v0;
  let last = performance.now();
  const start = last;
  let raf = 0;
  const tick = (now: number) => {
    const dt = Math.min(0.034, (now - last) / 1000);
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
      onDone();
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
  const cur = useRef({ x: 1, v: 0 });
  const token = useRef(0);
  const stop = useRef<() => void>();

  /** 현재 크기에서 목표 크기까지 스프링으로 가요. 새 움직임이 시작되면 이전 움직임은 멈춰요. */
  const step = (id: number, to: number, k: number, c: number, maxMs: number) =>
    new Promise<void>((resolve) => {
      if (id !== token.current) return;
      stop.current = spring(
        cur.current.x,
        to,
        cur.current.v,
        k,
        c,
        (x, v) => {
          cur.current = { x, v };
          if (pathRef.current) pathRef.current.style.transform = `scale(${x})`;
        },
        resolve,
        maxMs
      );
    });

  const press = () => {
    const id = ++token.current;
    stop.current?.();
    void step(id, 0.8, SPRING.rapid.k, SPRING.rapid.c, 200);
  };

  /** 놓았을 때: 살짝 커졌다가 → 여러 번 튕기며 원래 크기로 */
  const release = async () => {
    const id = ++token.current;
    stop.current?.();
    await step(id, 1.1, SPRING.quick.k, SPRING.quick.c, 260);
    await step(id, 1, SPRING.bounce.k, SPRING.bounce.c, 1500);
    if (id === token.current && pathRef.current) {
      pathRef.current.style.transform = 'none';
      cur.current = { x: 1, v: 0 };
    }
  };

  // 표시가 바뀌면(내가 답했을 때 등) 놓았을 때와 같은 움직임
  useEffect(() => {
    if (prev.current === state) return;
    prev.current = state;
    void release();
    return () => stop.current?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  useEffect(() => () => stop.current?.(), []);

  const look = LOOK[state];
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label={LABEL[state]}
      onPointerDown={press}
      onPointerUp={release}
      onPointerLeave={() => token.current > 0 && cur.current.x < 0.99 && void release()}
      onPointerCancel={release}
      style={{ width: size, height: size, flex: '0 0 auto', display: 'block', touchAction: 'manipulation', userSelect: 'none' }}
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
