/**
 * 브라우저 알림이 차단된 상태의 안내 창 (대체 버전 전용).
 * 디자인: "Browser Notification_denied.svg"(접힘) → "Browser Notification_arcordian.svg"(펼침)
 *
 * "설정 변경 방법 보기"를 누르면 같은 창이 아래로 펼쳐지면서 3단계 설정 방법이 나와요.
 * 다시 누르거나 ×를 누르면 접혀요.
 */
import { useId, useLayoutEffect, useRef, useState } from 'react';
import { Paragraph } from '@toss/tds-mobile';
import { adaptive } from '@toss/tds-colors';
import { IconBellOff, IconClose } from './design';
import step1 from './assets/notify-step1.png';
import step2 from './assets/notify-step2.png';
import step3 from './assets/notify-step3.png';

/**
 * 펼쳤을 때 머리글의 [허용] [차단] 버튼 표시 여부. 디자인에서 빠져서 숨겨 뒀어요. 다시 보여주려면 true로 바꾸면 돼요.
 */
const SHOW_ALLOW_BLOCK_BUTTONS = false;

/** 펼쳐지는 영역의 배경 */
const PANEL_BG = '#FFFFFF';

/** 펼치는 데 걸리는 시간(ms). global.css 의 .notify-panel transition 과 같아야 해요. */
const NOTIFY_OPEN_MS = 420;

const STEPS = [
  {
    title: '사이트 정보 아이콘을 클릭',
    lines: ['브라우저에서 주소창 왼쪽의', '자물쇠 또는 사이트 정보 아이콘을 클릭합니다'],
    img: step1,
    imgWidth: 240,
    imgTop: 0,
    ratio: '240 / 100',
  },
  {
    title: '알림 권한을 허용으로 변경하세요',
    lines: ['사이트 설정 메뉴에서', '알림 항목을 찾아 허용으로 변경합니다'],
    img: step2,
    imgWidth: 210,
    imgTop: 0,
    ratio: '210 / 100',
  },
  {
    title: '이제 알림을 받을 수 있어요',
    lines: ['설정 변경 후 이 화면으로 돌아와', '권한을 다시 확인해 주세요'],
    img: step3,
    imgWidth: 193,
    imgTop: 40,
    ratio: '193 / 32',
  },
];

/** 파란색 작은 버튼 (높이 30, 모서리 10) */
function SmallButton({ children, onClick, width, ...rest }: { children: string; onClick?: () => void; width?: number; [k: string]: unknown }) {
  return (
    <button
      type="button"
      onClick={onClick}
      {...rest}
      style={{
        height: 30,
        width,
        padding: width ? 0 : '0 12px',
        border: 0,
        borderRadius: 10,
        background: adaptive.blue500,
        color: '#fff',
        fontFamily: 'inherit',
        fontSize: 12,
        fontWeight: 600,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

export function NotificationAccordion() {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const firstRun = useRef(true);

  // 높이를 0 ↔ 내용 높이(px)로 바꿔서 펼치고, 다 펼쳐지면 auto로 돌려놔요(창 크기가 바뀌어도 맞게).
  useLayoutEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    let done: ReturnType<typeof setTimeout> | undefined;
    if (open) {
      el.style.height = `${el.scrollHeight}px`;
      // transitionend 가 안 오는 경우(움직임 줄이기 설정 등)에도 auto로 돌려놔요.
      done = setTimeout(() => {
        if (panelRef.current) panelRef.current.style.height = 'auto';
      }, NOTIFY_OPEN_MS + 60);
    } else {
      el.style.height = `${el.getBoundingClientRect().height}px`; // auto → 현재 px
      void el.offsetHeight; // 강제로 한 번 그려서 여기서부터 줄어들게
      el.style.height = '0px';
    }
    return () => {
      if (done) clearTimeout(done);
    };
  }, [open]);

  return (
    <div className="notify-accordion" style={{
        position: 'relative',
        marginTop: 22,
        borderRadius: 14,
        background: '#F0F6FF',
        overflow: 'hidden',
        // 펼쳤을 때만 "확인할 변경" 카드와 같은 파란 테두리(1px, blue100). outline은 안쪽 내용 위에 그려져서 흰 영역에도 보여요.
        outline: `1px solid ${open ? adaptive.blue100 : 'transparent'}`,
        outlineOffset: -1,
        transition: 'outline-color 240ms ease-out',
      }}
    >
      {/* 머리글: 접힘 / 펼침에 따라 문구와 버튼이 바뀌어요 */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 20, padding: 30 }}>
        <IconBellOff />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1, minWidth: 0 }}>
          <Paragraph.Text typography="t6" fontWeight="bold" color={adaptive.grey900} style={{ lineHeight: '22px' }}>
            알림이 꺼져 있어요
          </Paragraph.Text>
          <Paragraph.Text typography="st12" color={adaptive.grey700} style={{ lineHeight: '20px' }}>
            브라우저 설정에서 알림이 차단된 상태예요. 알림을 받으려면 브라우저 설정에서 권한을 허용해 주세요.
          </Paragraph.Text>
        </div>
        <div style={{ alignSelf: 'flex-end', display: 'flex', gap: 10, flexShrink: 0 }}>
          {open && SHOW_ALLOW_BLOCK_BUTTONS && (
            <>
              <span className="notify-fade" style={{ display: 'flex' }}>
                <SmallButton width={43}>허용</SmallButton>
              </span>
              <span className="notify-fade" style={{ display: 'flex' }}>
                <SmallButton width={43}>차단</SmallButton>
              </span>
            </>
          )}
          <SmallButton onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls={panelId}>
            설정 변경 방법 보기
          </SmallButton>
        </div>
        {open && (
          <button
            type="button"
            aria-label="설정 방법 접기"
            className="notify-fade-only"
            onClick={() => setOpen(false)}
            style={{ position: 'absolute', top: 19, right: 21, border: 0, background: 'none', padding: 0, cursor: 'pointer' }}
          >
            <IconClose />
          </button>
        )}
      </div>

      {/* 펼침 영역: 높이가 0 → 내용 높이로 부드럽게 늘어나요 */}
      <div ref={panelRef} id={panelId} className="notify-panel" data-open={open} aria-hidden={!open} style={{ background: PANEL_BG }}>
        <div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
              gap: 30,
              padding: '0 30px 36px',
            }}
          >
            {STEPS.map((s) => (
              <div
                key={s.title}
                style={{ padding: '22px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              >
                <div style={{ width: '100%', height: 100, display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
                  <img
                    src={s.img}
                    alt=""
                    draggable={false}
                    style={{ width: `min(${s.imgWidth}px, 100%)`, aspectRatio: s.ratio, display: 'block', marginTop: s.imgTop, borderRadius: s.imgTop ? 0 : 15 }}
                  />
                </div>
                <div style={{ marginTop: 34, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 2 }}>
                  <Paragraph.Text typography="t6" fontWeight="bold" color={adaptive.grey900} style={{ lineHeight: '24px' }}>
                    {s.title}
                  </Paragraph.Text>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {s.lines.map((l) => (
                      <span key={l} style={{ fontSize: 12, lineHeight: '20px', color: adaptive.grey700 }}>
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
