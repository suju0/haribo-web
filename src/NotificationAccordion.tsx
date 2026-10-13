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
// 디자인 파일(Browser Notification_설정방법.svg)을 벡터 그대로 써요. 그림 3개와 문구가 한 파일에 들어 있어요.
import guideSvg from './assets/notify-guide.svg';

/**
 * 펼쳤을 때 머리글의 [허용] [차단] 버튼 표시 여부. 디자인에서 빠져서 숨겨 뒀어요. 다시 보여주려면 true로 바꾸면 돼요.
 */
const SHOW_ALLOW_BLOCK_BUTTONS = false;

/** 펼치는 데 걸리는 시간(ms). global.css 의 .notify-panel transition 과 같아야 해요. */
const NOTIFY_OPEN_MS = 420;

/** 디자인 파일(870 × 244) 안에서 3단계가 놓인 가로 위치(x)와 폭(w) */
const GUIDE_COLS = [
  { x: 20, w: 240 },
  { x: 324, w: 240 },
  { x: 630, w: 220 },
];

/** 그림 안의 글자는 벡터라서 읽히지 않아요. 같은 내용을 스크린 리더용으로 따로 둬요. */
const STEPS = [
  { title: '사이트 정보 아이콘을 클릭', lines: ['브라우저에서 주소창 왼쪽의', '자물쇠 또는 사이트 정보 아이콘을 클릭합니다'] },
  { title: '알림 권한을 허용으로 변경하세요', lines: ['사이트 설정 메뉴에서', '알림 항목을 찾아 허용으로 변경합니다'] },
  { title: '이제 알림을 받을 수 있어요', lines: ['설정 변경 후 이 화면으로 돌아와', '권한을 다시 확인해 주세요'] },
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
            디자인 파일(870 × 244) 한 장에서 3단계를 칸별로 잘라서 보여줘요(벡터 그대로).
            첫 칸은 위 알림 아이콘과 같은 왼쪽 30px에서 시작하고, 마지막 칸은 오른쪽 30px에서 끝나요.
            창이 좁아지면 칸 사이 간격만 줄고, 칸이 겹칠 정도로 좁아지면(global.css) 세로로 쌓여요.
          */}
          <div className="notify-guide-cols">
            {GUIDE_COLS.map((c) => (
              <div key={c.x} style={{ position: 'relative', flexShrink: 0, width: c.w, height: 244, overflow: 'hidden' }}>
                <img
                  src={guideSvg}
                  alt=""
                  draggable={false}
                  style={{ position: 'absolute', top: 0, left: -c.x, width: 870, height: 244, maxWidth: 'none' }}
                />
              </div>
            ))}
          </div>
          <ol className="sr-only">
            {STEPS.map((st) => (
              <li key={st.title}>{`${st.title}. ${st.lines.join(' ')}`}</li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
