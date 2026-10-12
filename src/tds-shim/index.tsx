/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @toss/tds-mobile 대체 구현 (배포용).
 *
 * TDS는 앱인토스가 아닌 도메인(GitHub Pages, 아티팩트 등)에서는 화면을 그리기 전에 멈춰서 하얗게 나와요.
 * 그래서 배포용 빌드에서만 `@toss/tds-mobile`을 이 파일로 바꿔 끼워요(vite alias, STANDALONE=1).
 * 로컬 개발(`npm run dev`)은 진짜 TDS를 그대로 써요.
 *
 * 이 앱에서 쓰는 컴포넌트와 속성만 만들었고, 크기·색·글자는 진짜 TDS 화면에서 잰 값을 따라요.
 * 색은 @toss/tds-colors 의 CSS 변수(--adaptiveGrey900 등)를 그대로 써요.
 */
import React, {
  cloneElement,
  forwardRef,
  isValidElement,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';

const v = (name: string) => `var(--adaptive${name})`;
const FONT =
  '"Toss Product Sans", Tossface, "SF Pro KR", "SF Pro Display", "SF Pro Icons", -apple-system, BlinkMacSystemFont, "Basier Square", "Apple SD Gothic Neo", Roboto, "Noto Sans KR", "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif';

/* ───────── Paragraph.Text ───────── */
const TYPO: Record<string, [number, number]> = {
  t3: [22, 31],
  t4: [20, 28],
  t5: [17, 25.5],
  t6: [15, 22.5],
  t7: [13, 19.5],
  st10: [16, 24],
  st11: [14, 21],
  st12: [12, 18],
};
const WEIGHT: Record<string, number> = { bold: 700, semibold: 600, medium: 500, regular: 400 };

function ParagraphText({
  typography = 't6',
  fontWeight = 'regular',
  color,
  children,
  style,
  ...rest
}: {
  typography?: string;
  fontWeight?: string;
  color?: string;
  children?: ReactNode;
  style?: CSSProperties;
  [k: string]: any;
}) {
  const [size, lh] = TYPO[typography] ?? TYPO.t6;
  return (
    <span
      data-tds-mobile-component="Paragraph.Text"
      {...(rest as object)}
      style={{
        position: 'relative',
        verticalAlign: 'middle',
        maxWidth: '100%',
        overflowWrap: 'anywhere',
        wordBreak: 'keep-all',
        hyphens: 'auto',
        fontSize: size,
        lineHeight: `${lh}px`,
        fontWeight: WEIGHT[fontWeight] ?? 400,
        color,
        ...style,
      }}
    >
      {children}
    </span>
  );
}
export const Paragraph = { Text: ParagraphText };

/* ───────── Badge ───────── */
const BADGE_SIZE: Record<string, { fs: number; pad: string; r: number; h: number; fw: number }> = {
  xsmall: { fs: 10, pad: '3px 7px', r: 9, h: 21, fw: 600 },
  small: { fs: 12, pad: '3px 7px', r: 11, h: 24, fw: 700 },
  medium: { fs: 13, pad: '4px 9px', r: 12, h: 28, fw: 700 },
  large: { fs: 14, pad: '5px 10px', r: 13, h: 32, fw: 700 },
};
const BADGE_COLOR: Record<string, { fill: string; weakBg: string; weakFg: string }> = {
  blue: { fill: '#3182f6', weakBg: 'rgba(49,130,246,0.16)', weakFg: '#1b64da' },
  teal: { fill: '#18a5a5', weakBg: 'rgba(24,165,165,0.16)', weakFg: '#0e8c8c' },
  green: { fill: '#03b26c', weakBg: 'rgba(3,178,108,0.14)', weakFg: '#02a262' },
  red: { fill: '#f04452', weakBg: 'rgba(240,68,82,0.14)', weakFg: '#e42939' },
  yellow: { fill: '#ffc342', weakBg: 'rgba(255,195,66,0.2)', weakFg: '#d67d00' },
  elephant: { fill: '#6b7684', weakBg: 'rgba(78,89,104,0.1)', weakFg: '#4e5968' },
};

export const Badge = forwardRef<
  HTMLSpanElement,
  { size?: string; color?: string; variant?: string; children?: ReactNode; style?: CSSProperties; [k: string]: any }
>(function Badge({ size = 'small', color = 'blue', variant = 'fill', children, style, ...rest }, ref) {
  const s = BADGE_SIZE[size] ?? BADGE_SIZE.small;
  const c = BADGE_COLOR[color] ?? BADGE_COLOR.blue;
  return (
    <span
      data-tds-mobile-component="Badge"
      {...(rest as object)}
      ref={ref}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
        minHeight: s.h - 6,
        padding: 'var(--badge-padding, ' + s.pad + ')',
        borderRadius: 'var(--badge-border-radius, ' + s.r + 'px)',
        fontSize: 'var(--badge-font-size, ' + s.fs + 'px)',
        fontWeight: s.fw,
        lineHeight: 1.5,
        whiteSpace: 'nowrap',
        color: variant === 'fill' ? '#ffffff' : c.weakFg,
        backgroundColor: variant === 'fill' ? c.fill : c.weakBg,
        ...style,
      }}
    >
      {children}
    </span>
  );
});

/* ───────── Button / TextButton ───────── */
const BTN_SIZE: Record<string, { h: number; r: number; fs: number; pad: string }> = {
  large: { h: 48, r: 14, fs: 17, pad: '2px 16px' },
  medium: { h: 38, r: 10, fs: 15, pad: '2px 14px' },
  small: { h: 32, r: 10, fs: 13, pad: '2px 12px' },
  tiny: { h: 28, r: 8, fs: 12, pad: '2px 10px' },
};
const BTN_COLOR: Record<string, { fill: string; fillFg: string; weakBg: string; weakFg: string }> = {
  primary: { fill: '#3182f6', fillFg: '#ffffff', weakBg: 'rgba(49,130,246,0.1)', weakFg: '#3182f6' },
  danger: { fill: '#f04452', fillFg: '#ffffff', weakBg: 'rgba(240,68,82,0.1)', weakFg: '#f04452' },
  light: { fill: '#e5e8eb', fillFg: '#4e5968', weakBg: 'rgba(222,222,255,0.19)', weakFg: '#4e5968' },
  dark: { fill: '#4e5968', fillFg: '#ffffff', weakBg: 'rgba(78,89,104,0.1)', weakFg: '#4e5968' },
};

export const Button = forwardRef<
  HTMLButtonElement,
  {
    size?: string;
    color?: string;
    variant?: string;
    display?: string;
    disabled?: boolean;
    loading?: boolean;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    children?: ReactNode;
    style?: CSSProperties;
    [k: string]: any;
  }
>(function Button(
  { size = 'large', color = 'primary', variant = 'fill', display, disabled, onClick, children, style, ...rest },
  ref
) {
  const s = BTN_SIZE[size] ?? BTN_SIZE.large;
  const c = BTN_COLOR[color] ?? BTN_COLOR.primary;
  const bg = variant === 'fill' ? c.fill : c.weakBg;
  const fg = variant === 'fill' ? c.fillFg : c.weakFg;
  return (
    <button
      type="button"
      data-tds-mobile-component="Button"
      {...(rest as object)}
      ref={ref}
      disabled={disabled}
      onClick={onClick}
      style={{
        position: 'relative',
        display: display === 'block' ? 'flex' : 'inline-flex',
        width: display === 'block' ? '100%' : undefined,
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
        height: s.h,
        minHeight: s.h,
        padding: s.pad,
        border: 0,
        borderRadius: s.r,
        background: `var(--button-background-color, ${bg})`,
        color: `var(--button-color, ${fg})`,
        fontFamily: 'inherit',
        fontSize: `var(--button-font-size, ${s.fs}px)`,
        fontWeight: 600,
        lineHeight: 1.25,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'transform 0.12s ease-out',
        ...style,
      }}
    >
      {children}
    </button>
  );
});

const Chevron = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden style={{ flexShrink: 0 }}>
    <path d="M6 3.5 10.5 8 6 12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const TextButton = forwardRef<
  HTMLButtonElement,
  {
    size?: string;
    color?: string;
    variant?: string;
    onClick?: () => void;
    children?: ReactNode;
    style?: CSSProperties;
    [k: string]: any;
  }
>(function TextButton({ size = 'medium', color, variant, onClick, children, style, ...rest }, ref) {
  const fs = size === 'xsmall' ? 13 : size === 'small' ? 15 : size === 'medium' ? 17 : 20;
  return (
    <button
      type="button"
      {...(rest as object)}
      ref={ref}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0,
        border: 0,
        background: 'none',
        padding: 0,
        fontFamily: 'inherit',
        fontSize: fs,
        fontWeight: 500,
        lineHeight: 1.252,
        color: color ?? v('Grey600'),
        textDecoration: variant === 'underline' ? 'underline' : 'none',
        cursor: 'pointer',
        ...style,
      }}
    >
      {children}
      {variant === 'arrow' && <Chevron size={Math.round(fs * 1.25)} />}
    </button>
  );
});

/* ───────── ListRow ───────── */
export function ListRow({
  left,
  contents,
  right,
  onClick,
  withTouchEffect,
  withArrow,
  verticalPadding = 'medium',
  leftAlignment = 'center',
}: {
  left?: ReactNode;
  contents?: ReactNode;
  right?: ReactNode;
  onClick?: () => void;
  withTouchEffect?: boolean;
  withArrow?: boolean;
  verticalPadding?: string;
  leftAlignment?: string;
  [k: string]: any;
}) {
  const pv = verticalPadding === 'large' ? 16 : verticalPadding === 'small' ? 8 : 12;
  const align = leftAlignment === 'top' ? 'flex-start' : 'center';
  return (
    <li className="tds-mobile-list-row tds-shim-row" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      <div
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick}
        onKeyDown={(e) => onClick && (e.key === 'Enter' || e.key === ' ') && onClick()}
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: align,
          boxSizing: 'border-box',
          padding: `${pv}px 24px`,
          cursor: onClick ? 'pointer' : 'default',
          transition: 'transform 0.12s ease-out',
        }}
      >
        {withTouchEffect && <div className="tds-shim-touch" />}
        {left != null && <span style={{ position: 'relative', flexShrink: 0 }}>{left}</span>}
        <span style={{ position: 'relative', flex: 1, minWidth: 0, margin: left != null ? '0 0 0 12px' : 0 }}>{contents}</span>
        {right != null && (
          <span data-tds-mobile-component="ListRowRight" style={{ position: 'relative', flexShrink: 0, alignSelf: 'center', margin: '0 0 0 12px' }}>
            {right}
          </span>
        )}
        {withArrow && (
          <span style={{ position: 'relative', flexShrink: 0, marginLeft: 8, color: v('Grey400'), display: 'inline-flex' }}>
            <Chevron size={20} />
          </span>
        )}
      </div>
    </li>
  );
}

/* ───────── ProgressBar ───────── */
export function ProgressBar({ progress = 0, size = 'normal' }: { progress?: number; size?: string }) {
  const h = size === 'light' ? 4 : size === 'bold' ? 8 : 6;
  return (
    <div style={{ width: '100%', height: h, borderRadius: h, background: v('Grey100'), overflow: 'hidden' }}>
      <div
        style={{
          width: `${Math.max(0, Math.min(1, progress)) * 100}%`,
          height: '100%',
          borderRadius: h,
          background: v('Blue500'),
          transition: 'width 0.3s ease',
        }}
      />
    </div>
  );
}

/* ───────── ProgressStepper (compact) ───────── */
export function ProgressStep(_props: { title?: string; [k: string]: any }) {
  return null;
}
export function ProgressStepper({
  children,
  activeStepIndex = 0,
}: {
  children?: ReactNode;
  activeStepIndex?: number;
  [k: string]: any;
}) {
  const steps = React.Children.toArray(children).filter(isValidElement) as ReactElement<{ title?: string }>[];
  return (
    <div style={{ paddingTop: 4 }}>
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', padding: '0 24px' }}>
        {/* 진행 막대: 첫 단계 왼쪽 끝부터 마지막 단계 오른쪽 끝까지 */}
        <div style={{ position: 'absolute', top: 0, left: 24, right: 24, height: 8, borderRadius: 40, background: '#edeff2' }} />
        {steps.map((st, i) => (
          <div
            key={i}
            role="text"
            aria-current={i === activeStepIndex ? 'step' : undefined}
            style={{ position: 'relative', width: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '100%',
                background: i <= activeStepIndex ? v('Blue500') : 'rgba(253,253,254,0.89)',
                opacity: i <= activeStepIndex ? 1 : 0.2,
                boxShadow: i === activeStepIndex ? '0 0 0 4px rgba(49,130,246,0.22)' : undefined,
              }}
            />
            <div style={{ fontSize: 13, lineHeight: '19.5px', color: v('Grey900'), textAlign: 'center', wordBreak: 'keep-all', width: '100%' }}>
              {st.props.title}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────── Stepper (세로 단계, 기존 탭 전용) ───────── */
function StepperRoot({ children }: { children?: ReactNode }) {
  return <div style={{ display: 'flex', flexDirection: 'column' }}>{children}</div>;
}
StepperRoot.StepperRow = function StepperRow({
  left,
  center,
  hideLine,
}: {
  left?: ReactNode;
  center?: ReactNode;
  hideLine?: boolean;
}) {
  return (
    <div style={{ display: 'flex', gap: 12, paddingBottom: hideLine ? 0 : 20, position: 'relative' }}>
      <div style={{ flexShrink: 0 }}>{left}</div>
      <div style={{ minWidth: 0 }}>{center}</div>
    </div>
  );
};
StepperRoot.NumberIcon = function NumberIcon({ number }: { number: number }) {
  return (
    <span
      style={{
        width: 24,
        height: 24,
        borderRadius: '50%',
        background: v('Grey100'),
        color: v('Grey700'),
        fontSize: 12,
        fontWeight: 700,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {number}
    </span>
  );
};
StepperRoot.Texts = function Texts({ title, description }: { title?: string; description?: string; type?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 15, lineHeight: '22.5px', fontWeight: 600, color: v('Grey900') }}>{title}</span>
      <span style={{ fontSize: 13, lineHeight: '19.5px', color: v('Grey600') }}>{description}</span>
    </div>
  );
};
export const Stepper = StepperRoot;

/* ───────── TableRow ───────── */
export function TableRow({ left, right }: { left?: ReactNode; right?: ReactNode; align?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '12px 0' }}>
      <span style={{ fontSize: 13, lineHeight: '19.5px', color: v('Grey600') }}>{left}</span>
      <span style={{ fontSize: 13, lineHeight: '19.5px', color: v('Grey900'), textAlign: 'right' }}>{right}</span>
    </div>
  );
}

/* ───────── Checkbox.Line ───────── */
const CHECK_PATH =
  'm10.4099 17.8538c-.3393 0-.67866-.1131-.90488-.4524l-5.20306-5.2031c-.56556-.5655-.56556-1.3573 0-1.9228.56555-.56559 1.35732-.56559 1.92287 0l4.18507 4.185 7.4653-7.46523c.5655-.56555 1.3573-.56555 1.9228 0 .5656.56555.5656 1.35732 0 1.92287l-8.3701 8.37016c-.3393.4524-.6787.5655-1.018.5655z';
function CheckboxLine({
  checked,
  disabled,
  size = 24,
  onCheckedChange,
}: {
  checked?: boolean;
  disabled?: boolean;
  size?: number;
  onCheckedChange?: (v: boolean) => void;
}) {
  return (
    <label
      role="checkbox"
      aria-checked={!!checked}
      aria-disabled={!!disabled}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => !disabled && (e.key === ' ' || e.key === 'Enter') && (e.preventDefault(), onCheckedChange?.(!checked))}
      onClick={(e) => {
        e.preventDefault();
        if (!disabled) onCheckedChange?.(!checked);
      }}
      style={{ display: 'block', width: size, height: size, cursor: disabled ? 'not-allowed' : 'pointer' }}
    >
      <svg viewBox="0 0 24 24" style={{ width: size, height: size, display: 'block', pointerEvents: 'none' }}>
        <path
          d={CHECK_PATH}
          fill={checked ? v('Blue500') : v('Grey300')}
          style={{ opacity: disabled ? 0.4 : 1 }}
        />
      </svg>
    </label>
  );
}
export const Checkbox = { Line: CheckboxLine };

/* ───────── TextArea (box) ───────── */
export function TextArea({
  label,
  placeholder,
  minHeight = 96,
  maxLength,
  value,
  onChange,
}: {
  variant?: string;
  label?: string;
  labelOption?: string;
  placeholder?: string;
  minHeight?: number;
  maxLength?: number;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ padding: '16px 0' }}>
      {label && (
        <div style={{ padding: '0 20px', marginBottom: 5.5, fontSize: 13, lineHeight: '19.5px', color: v('Grey800') }}>{label}</div>
      )}
      <div style={{ padding: '0 20px' }}>
        <div
          style={{
            boxSizing: 'border-box',
            minHeight,
            padding: '14px 16px',
            borderRadius: 14,
            background: 'rgba(0,23,51,0.02)',
            border: `1px solid ${focus ? 'rgba(49,130,246,0.6)' : 'rgba(2,32,71,0.05)'}`,
            transition: 'border-color 0.15s',
          }}
        >
          <textarea
            className="tds-shim-textarea"
            value={value}
            onChange={onChange}
            maxLength={maxLength}
            placeholder={placeholder}
            onFocus={() => setFocus(true)}
            onBlur={() => setFocus(false)}
            style={{
              display: 'block',
              width: '100%',
              minHeight: minHeight - 32,
              boxSizing: 'border-box',
              border: 0,
              outline: 0,
              resize: 'none',
              padding: 0,
              background: 'transparent',
              fontFamily: 'inherit',
              fontSize: 17,
              lineHeight: '25.5px',
              color: v('Grey800'),
            }}
          />
        </div>
      </div>
    </div>
  );
}

/* ───────── Tooltip ───────── */
const mergeRefs =
  <T,>(...refs: (React.Ref<T> | undefined)[]) =>
  (node: T | null) =>
    refs.forEach((r) => (typeof r === 'function' ? r(node) : r && ((r as React.MutableRefObject<T | null>).current = node)));

export function Tooltip({
  children,
  message,
  placement = 'top',
  open,
  openOnHover,
}: {
  children: ReactElement;
  message?: ReactNode;
  placement?: 'top' | 'bottom';
  open?: boolean;
  openOnHover?: boolean;
  size?: string;
  [k: string]: any;
}) {
  const anchor = useRef<HTMLElement | null>(null);
  const bubble = useRef<HTMLDivElement | null>(null);
  const [hover, setHover] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number; ax: number } | null>(null);
  const visible = open ?? (openOnHover ? hover : false);

  useLayoutEffect(() => {
    if (!visible) return;
    const compute = () => {
      if (!anchor.current || !bubble.current) return;
      const a = anchor.current.getBoundingClientRect();
      const bw = bubble.current.getBoundingClientRect().width;
      const bh = bubble.current.getBoundingClientRect().height;
      const gap = 18;
      const cx = a.left + a.width / 2;
      // 사이드바처럼 말풍선을 --tt-shift 만큼 옮기는 경우(global.css), 옮긴 뒤의 왼쪽 시작점이
      // 짧은 말풍선(예: "변경 상세")의 시작점(12.5px)과 같아지도록 그만큼 미리 빼요.
      const shift = parseFloat(document.body.style.getPropertyValue('--tt-shift')) || 0;
      const minLeft = 12.5 - shift;
      let x = cx - bw / 2;
      x = Math.max(minLeft, Math.min(x, window.innerWidth - 12 - bw));
      const y = placement === 'bottom' ? a.bottom + gap : a.top - gap - bh;
      setPos({ x, y, ax: cx - x });
    };
    compute();
    // --tt-shift 는 말풍선이 뜬 직후에 정해져서, 한 프레임 뒤에 다시 계산해요.
    const id = requestAnimationFrame(compute);
    return () => cancelAnimationFrame(id);
  }, [visible, placement, message]);

  const child = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        ref: mergeRefs(anchor, (children as unknown as { ref?: React.Ref<HTMLElement> }).ref),
        onMouseEnter: (e: React.MouseEvent) => {
          setHover(true);
          (children.props as { onMouseEnter?: (e: React.MouseEvent) => void }).onMouseEnter?.(e);
        },
        onMouseLeave: (e: React.MouseEvent) => {
          setHover(false);
          (children.props as { onMouseLeave?: (e: React.MouseEvent) => void }).onMouseLeave?.(e);
        },
      })
    : children;

  return (
    <>
      {child}
      {visible &&
        createPortal(
          <div
            role="tooltip"
            style={{
              position: 'fixed',
              left: 0,
              top: 0,
              transform: `translate(${pos?.x ?? -9999}px, ${pos?.y ?? -9999}px)`,
              maxWidth: 'calc(100vw - 96px)',
              zIndex: 10000,
            }}
          >
            <div>
              <div
                ref={bubble}
                style={{
                  position: 'relative',
                  borderRadius: 12,
                  padding: '8px 12px',
                  minWidth: 58,
                  boxShadow: '0 16px 60px 0 rgba(0,29,58,0.18)',
                  background: v('FloatBackground'),
                }}
              >
                <span style={{ fontSize: 13, lineHeight: '19.5px', fontWeight: 600, color: v('Grey800') }}>{message}</span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{
                    position: 'absolute',
                    width: 24,
                    height: 24,
                    left: (pos?.ax ?? 0) - 12,
                    ...(placement === 'bottom'
                      ? { top: -24, transform: 'translate(0, 4px)' }
                      : { bottom: -24, transform: 'translate(0, -4px) rotate(180deg)' }),
                  }}
                >
                  <path d="M12 8.5c-.9 0-1.7.5-2.2 1.2L7 14h10l-2.8-4.3c-.5-.7-1.3-1.2-2.2-1.2z" fill="none" />
                  <path d="M6 20 10.6 12.6a1.6 1.6 0 0 1 2.8 0L18 20z" fill={v('FloatBackground')} />
                </svg>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

/* ───────── Toast ───────── */
export function Toast({
  open,
  text,
  onClose,
  duration = 3000,
}: {
  open?: boolean;
  text?: ReactNode;
  onClose?: () => void;
  position?: string;
  duration?: number;
}) {
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(t);
  }, [open, text, duration, onClose]);
  if (!open) return null;
  return createPortal(
    <div
      role="status"
      style={{
        position: 'fixed',
        left: 20,
        right: 20,
        bottom: 24,
        zIndex: 10001,
        display: 'flex',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          maxWidth: 520,
          padding: '14px 20px',
          borderRadius: 16,
          background: 'rgba(25,31,40,0.92)',
          color: '#fff',
          fontSize: 15,
          lineHeight: '22.5px',
          fontWeight: 500,
        }}
      >
        {text}
      </div>
    </div>,
    document.body
  );
}

/* ───────── ConfirmDialog ───────── */
function ConfirmDialogRoot({
  open,
  title,
  description,
  onClose,
  cancelButton,
  confirmButton,
}: {
  open?: boolean;
  title?: ReactNode;
  description?: ReactNode;
  onClose?: () => void;
  cancelButton?: ReactNode;
  confirmButton?: ReactNode;
}) {
  if (!open) return null;
  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10002,
        background: v('BackgroundDimmed'),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        role="dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ width: 'min(100%, 320px)', borderRadius: 24, background: v('Background'), padding: '28px 24px 20px' }}
      >
        <div style={{ fontSize: 20, lineHeight: '28px', fontWeight: 700, color: v('Grey900') }}>{title}</div>
        <div style={{ marginTop: 8, fontSize: 15, lineHeight: '22.5px', color: v('Grey600') }}>{description}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
          {cancelButton}
          {confirmButton}
        </div>
      </div>
    </div>,
    document.body
  );
}
ConfirmDialogRoot.CancelButton = function CancelButton({ children, onClick }: { children?: ReactNode; onClick?: () => void }) {
  return (
    <Button size="medium" color="light" variant="weak" display="block" onClick={onClick}>
      {children}
    </Button>
  );
};
ConfirmDialogRoot.ConfirmButton = function ConfirmButton({
  children,
  onClick,
  color,
}: {
  children?: ReactNode;
  onClick?: () => void;
  color?: string;
}) {
  return (
    <Button size="medium" color={color ?? 'primary'} display="block" onClick={onClick}>
      {children}
    </Button>
  );
};
export const ConfirmDialog = ConfirmDialogRoot;

/* ───────── Result ───────── */
function ResultRoot({ title, description, button }: { title?: ReactNode; description?: ReactNode; button?: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '24px 20px' }}>
      <div style={{ fontSize: 22, lineHeight: '31px', fontWeight: 700, color: v('Grey900') }}>{title}</div>
      {description && (
        <div style={{ marginTop: 8, fontSize: 15, lineHeight: '22.5px', color: v('Grey600'), whiteSpace: 'pre-line' }}>{description}</div>
      )}
      {button && <div style={{ marginTop: 24 }}>{button}</div>}
    </div>
  );
}
ResultRoot.Button = function ResultButton({ children, onClick }: { children?: ReactNode; onClick?: () => void }) {
  return (
    <Button size="medium" onClick={onClick}>
      {children}
    </Button>
  );
};
export const Result = ResultRoot;

/* ───────── SegmentedControl (상태 미리보기, 숨김 기능) ───────── */
function SegmentedControlRoot({
  value,
  onChange,
  children,
}: {
  value?: string;
  onChange?: (v: string) => void;
  children?: ReactNode;
  [k: string]: any;
}) {
  return (
    <div role="radiogroup" style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 12, background: v('Grey100') }}>
      {React.Children.map(children, (c) =>
        isValidElement(c) ? cloneElement(c as ReactElement<Record<string, unknown>>, { __selected: (c.props as { value?: string }).value === value, __onChange: onChange }) : c
      )}
    </div>
  );
}
SegmentedControlRoot.Item = function SegmentedControlItem({
  value,
  children,
  __selected,
  __onChange,
}: {
  value?: string;
  children?: ReactNode;
  __selected?: boolean;
  __onChange?: (v: string) => void;
  [k: string]: any;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={!!__selected}
      onClick={() => value && __onChange?.(value)}
      style={{
        flex: 1,
        border: 0,
        borderRadius: 9,
        padding: '6px 10px',
        background: __selected ? v('Background') : 'transparent',
        color: __selected ? v('Grey900') : v('Grey600'),
        fontFamily: 'inherit',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
};
export const SegmentedControl = SegmentedControlRoot;

/* ───────── Skeleton ───────── */
export function Skeleton(_props: { pattern?: string }) {
  const bar = (w: string, h = 16) => <div style={{ width: w, height: h, borderRadius: 8, background: v('Grey100'), marginBottom: 12 }} />;
  return (
    <div>
      {bar('40%', 24)}
      {bar('90%')}
      {bar('75%')}
      {bar('85%')}
    </div>
  );
}

/* ───────── SearchField (숨김 기능) ───────── */
export function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  [k: string]: any;
}) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={{
        width: '100%',
        boxSizing: 'border-box',
        height: 44,
        border: 0,
        borderRadius: 12,
        background: v('Grey100'),
        padding: '0 14px',
        fontFamily: 'inherit',
        fontSize: 15,
      }}
    />
  );
}
