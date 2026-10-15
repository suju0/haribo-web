/**
 * 브라우저 알림이 차단된 상태의 안내 창 (대체 버전 전용).
 * 디자인: "Browser Notification_denied.svg"(접힘) → "Browser Notification_arcordian.svg"(펼침)
 *
 * "설정 변경 방법 보기"를 누르면 같은 창이 아래로 펼쳐지면서 3단계 설정 방법이 나와요.
 * 다시 누르면 접혀요. ×는 접힘·펼침과 상관없이 알림 창 전체를 닫아요.
 */
import { useId, useLayoutEffect, useRef, useState } from 'react';
import { Paragraph } from '@toss/tds-mobile';
import { adaptive } from '@toss/tds-colors';
import { IconBellOff, IconClose } from './design';
// 3단계 그림은 디자인 파일(3단계_1 · 2 · 3.svg)을 벡터 그대로 써요. 그림 아래 글자는 그림이 아니라 진짜 텍스트예요.
import step1 from './assets/notify-step-1.svg';
import step2 from './assets/notify-step-2.svg';
import step3 from './assets/notify-step-3.svg';

/**
 * 펼쳤을 때 머리글의 [허용] [차단] 버튼 표시 여부. 디자인에서 빠져서 숨겨 뒀어요. 다시 보여주려면 true로 바꾸면 돼요.
 */
const SHOW_ALLOW_BLOCK_BUTTONS = false;

/** 펼치는 데 걸리는 시간(ms). global.css 의 .notify-panel transition 과 같아야 해요. */
const NOTIFY_OPEN_MS = 420;

/** 3단계: 그림(240 × 100)과 그 아래 글자. 글자는 디자인(Browser Notification_arcordian.svg)의 문구예요. */
const STEPS = [
  { img: step1, title: '사이트 정보 아이콘을 클릭', lines: ['브라우저에서 주소창 왼쪽의', '자물쇠 또는 사이트 정보 아이콘을 클릭해요'] },
  { img: step2, title: '알림 권한을 허용으로 변경하세요', lines: ['사이트 설정 메뉴에서', '알림 항목을 찾아 허용으로 변경해요'] },
  { img: step3, title: '이제 알림을 받을 수 있어요', lines: ['설정 변경 후 이 화면으로 돌아와', '권한을 다시 확인해 주세요'] },
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
        fontWeight: 500,
        lineHeight: 1,
        whiteSpace: 'nowrap',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

export function NotificationAccordion({ onClose }: { onClose: () => void }) {
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
        {/* × 는 알림 창 전체를 닫아요. 접혀 있을 때도 펼쳤을 때도 같은 자리에 있어요. */}
        <button
          type="button"
          aria-label="알림 안내 닫기"
          onClick={onClose}
          style={{ position: 'absolute', top: 19, right: 21, border: 0, background: 'none', padding: 0, cursor: 'pointer' }}
        >
          <IconClose />
        </button>
      </div>

      {/* 펼침 영역: 높이가 0 → 내용 높이로 부드럽게 늘어나요 */}
      <div ref={panelRef} id={panelId} className="notify-panel" data-open={open} aria-hidden={!open}>
        <div className="notify-guide">
          {/*
            그림 3개(벡터 그대로)와 그 아래 글자를 칸별로 보여줘요.
            첫 칸은 위 알림 아이콘과 같은 왼쪽 30px에서 시작하고, 마지막 칸은 오른쪽 30px에서 끝나요.
            창이 좁아지면 칸 사이 간격만 줄고, 칸이 겹칠 정도로 좁아지면(global.css) 세로로 쌓여요.
          */}
          <div className="notify-guide-cols">
            {STEPS.map((st) => (
              <div key={st.title} className="notify-guide-box">
                <img src={st.img} alt="" draggable={false} width={240} height={100} style={{ display: 'block', flexShrink: 0 }} />
                {/* 글자 크기는 알림 창 머리글과 같아요: 제목 = "알림이 꺼져 있어요"(t6 굵게), 설명 = 아래 서브 타이틀(st12, grey700) */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, marginTop: 20, textAlign: 'center' }}>
                  <Paragraph.Text typography="t6" fontWeight="bold" color={adaptive.grey900} style={{ lineHeight: '22px' }}>
                    {st.title}
                  </Paragraph.Text>
                  <Paragraph.Text typography="st12" color={adaptive.grey700} style={{ lineHeight: '20px' }}>
                    {st.lines.map((ln, i) => (
                      <span key={ln} style={{ display: 'block' }}>
                        {ln}
                      </span>
                    ))}
                  </Paragraph.Text>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
