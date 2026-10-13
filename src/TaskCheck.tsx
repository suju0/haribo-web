/**
 * 작업 표의 체크 아이콘 (대체 버전 전용).
 *
 * 누를 수 있는 체크박스가 아니라, 그 작업의 담당자가 이 변경에 답했는지를 보여주는 표시예요.
 *  - pending : 아직 답하지 않음(대기)        → 연한 회색
 *  - other   : 다른 담당자가 이미 답함        → 연한 파랑
 *  - mine    : 내가 답한 작업(내 담당)        → 진한 파랑
 *
 * 움직임은 두 가지를 둘 다 남겨 두었고, 화면 위 스위치(checkMotion.tsx)로 골라서 비교해요.
 *
 *  A) 'tds' · 토스 방식 (50548을 영상으로 재서 그대로 따라 함)
 *    - 연한 체크(대기 · 담당자가 답함 = TDS의 "비활성 체크")를 누르면 옆으로 흔들려요.
 *      x 위치가 0 → 2 → -2 → 1 → -1 → 0px 로 437.5ms 동안 움직여요. (영상에서 가운데 위치가 좌우로 흔들리는 걸 확인)
 *    - 내가 답한 체크(진한 파랑 = TDS의 "켜진 체크")는 스프링으로 튀어요.
 *
 *  B) 'spring' · 기존 방식 (처음에 만든 스프링 바운스)
 *    - 모든 체크를 누르면(값이 안 바뀌어도) 누르는 동안 작아지고(0.8), 놓으면 살짝 커졌다가(1.1) 원래 크기로 여러 번 튕기며 돌아와요.
 *
 *  공통: 표시가 진한 파랑으로 바뀔 때(내가 답했을 때)는 두 방식 모두 스프링으로 튀어요.
 *  스프링 값: 누름 rapid(강성 1000 · 감쇠 55) → 커짐 quick(800 · 55) → 돌아옴 bounce(300 · 9).
 */
import { useEffect, useRef } from 'react';
import { adaptive } from '@toss/tds-colors';
import { useCheckMotion } from './checkMotion';

export type TaskCheckState = 'pending' | 'other' | 'mine';

const CHECK_PATH =
  'm10.4099 17.8538c-.3393 0-.67866-.1131-.90488-.4524l-5.20306-5.2031c-.56556-.5655-.56556-1.3573 0-1.9228.56555-.56559 1.35732-.56559 1.92287 0l4.18507 4.185 7.4653-7.46523c.5655-.56555 1.3573-.56555 1.9228 0 .5656.56555.5656 1.35732 0 1.92287l-8.3701 8.37016c-.3393.4524-.6787.5655-1.018.5655z';

const LOOK: Record<TaskCheckState, { fill: string; opacity: number }> = {
  // 연한 회색 체크: #EDEFF0
  pending: { fill: '#EDEFF0', opacity: 1 },
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
  const motion = useCheckMotion();
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

  /** 비활성 체크를 눌렀을 때: 옆으로 흔들려요 (TDS와 같은 값) */
  const svgRef = useRef<SVGSVGElement>(null);
  const wiggleAnim = useRef<Animation>();
  const wiggle = () => {
    const el = svgRef.current;
    if (!el || typeof el.animate !== 'function') return;
    wiggleAnim.current?.cancel();
    wiggleAnim.current = el.animate(
      [0, 2, -2, 1, -1, 0].map((x) => ({ transform: `translateX(${x}px)` })),
      { duration: 437.5, easing: 'linear' }
    );
  };

  const press = () => {
    // 토스 방식: 연한 체크는 흔들리기만 해요. 기존 방식은 모든 체크가 눌렸다가 튕겨요.
    if (motion === 'tds' && state !== 'mine') {
      wiggle();
      return;
    }
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
    if (state === 'mine') {
      void release();
    }
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
      ref={svgRef}
      onPointerDown={press}
      onPointerUp={() => (motion === 'spring' || state === 'mine') && void release()}
      onPointerLeave={() => (motion === 'spring' || state === 'mine') && cur.current.x < 0.99 && void release()}
      onPointerCancel={() => (motion === 'spring' || state === 'mine') && void release()}
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
