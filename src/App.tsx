import { useState } from 'react';
import { Badge, Paragraph, Result, SegmentedControl, Skeleton, TextButton, Toast, Tooltip } from '@toss/tds-mobile';
import { adaptive } from '@toss/tds-colors';
import { Answer, DecisionChange, INITIAL_CHANGES, sortChanges } from './data';
import { CLI_VIEWERS, CliViewer, applyAnswerToTasks, buildCliChanges } from './cliData';
import { useBoard } from './useBoard';
import { Inbox } from './Inbox';
import { Detail } from './Detail';
import {
  FilterTabs,
  IconAvatar,
  IconDetail,
  IconInbox,
  IconProject,
  IconSidebarToggle,
  SidebarHint,
} from './design';

/**
 * "화면 상태 미리보기"(정상/불러오는 중/빈 화면/연결 실패/오프라인) 표시 여부.
 * 개발 중에 상태별 화면을 확인하는 용도라 지금은 숨겨 두었어요.
 * 숨겨도 주소 뒤에 ?state=empty 처럼 붙이면 해당 화면을 볼 수 있어요.
 */
const SHOW_STATE_PREVIEW = false;

/** 사이드바 맨 위 프로젝트("A") 아이콘 표시 여부. 아직 쓰임새가 없어서 숨겨 뒀어요. */
const SHOW_PROJECT_ICON = false;

/**
 * 처음에 있던 "나에게 온 변경" / "변경 상세" 탭 2개(사이드바 맨 위 두 아이콘) 표시 여부.
 * 지금은 CLI 탭 3개만 보여주려고 숨겨 두었어요. 다시 보여주려면 true로 바꾸면 돼요. (코드와 데이터는 그대로 남아 있어요)
 */
const SHOW_LEGACY_TABS = false;

type Screen = 'ok' | 'loading' | 'empty' | 'error' | 'offline';
type Nav = 'inbox' | 'detail' | 'cliInbox' | 'cliDetail' | 'cliEmpty';

const initialScreen = (): Screen => {
  const s = new URLSearchParams(window.location.search).get('state');
  return s === 'loading' || s === 'empty' || s === 'error' || s === 'offline' ? s : 'ok';
};

/* ───────── 왼쪽 아이콘 사이드바 ───────── */
function SideNav({
  nav,
  onNav,
  pendingCount,
  selected,
  cliPendingCount,
  cliSelected,
  cliViewerLabel,
}: {
  nav: Nav;
  onNav: (n: Nav) => void;
  pendingCount: number;
  selected?: DecisionChange;
  cliPendingCount: number;
  cliSelected?: DecisionChange;
  cliViewerLabel: string;
}) {
  const [expanded, setExpanded] = useState(false);

  const allItems: {
    key: string;
    label: string;
    desc: string;
    icon: (active: boolean) => React.ReactNode;
    active: boolean;
    onClick?: () => void;
    badge?: number;
    /** 아이콘 모서리에 붙는 작은 꼬리표 (예: CLI) */
    tag?: string;
    /** 앞에 구분선을 넣어 그룹을 나눠요 */
    separatorBefore?: boolean;
  }[] = [
    {
      key: 'project',
      label: 'order-app',
      desc: '프로젝트',
      icon: (a) => <IconProject active={a} />,
      active: true,
    },
    {
      key: 'inbox',
      label: '나에게 온 변경',
      desc: '내게 영향을 주는 변경 목록',
      icon: (a) => <IconInbox active={a} />,
      active: nav === 'inbox',
      onClick: () => onNav('inbox'),
      badge: pendingCount,
    },
    {
      key: 'detail',
      label: '변경 상세',
      desc: selected ? `#${selected.issueNo} ${selected.title}` : '선택한 변경이 없어요',
      icon: (a) => <IconDetail active={a} />,
      active: nav === 'detail',
      onClick: () => onNav('detail'),
    },
    // 아래 두 개는 위 두 화면을 그대로 복제한 탭이고, CLI 시험 문서의 데이터를 보여줘요.
    {
      key: 'cliInbox',
      label: '나에게 온 변경',
      desc: `${cliViewerLabel}에게 온 변경 목록`,
      icon: (a) => <IconInbox active={a} />,
      active: nav === 'cliInbox',
      onClick: () => onNav('cliInbox'),
      badge: cliPendingCount,
      separatorBefore: true,
    },
    {
      key: 'cliDetail',
      label: '변경 상세',
      desc: cliSelected ? `#${cliSelected.issueNo} ${cliSelected.title}` : '선택한 변경이 없어요',
      icon: (a) => <IconDetail active={a} />,
      active: nav === 'cliDetail',
      onClick: () => onNav('cliDetail'),
    },
    // CLI "나에게 온 변경"을 복제한 탭: 받은 변경이 하나도 없을 때의 빈 화면
    {
      key: 'cliEmpty',
      label: '나에게 온 변경',
      desc: '받은 변경이 없을 때의 빈 화면',
      icon: (a) => <IconInbox active={a} />,
      active: nav === 'cliEmpty',
      onClick: () => onNav('cliEmpty'),
      separatorBefore: true,
    },
  ];

  const items = allItems
    .filter((it) => SHOW_PROJECT_ICON || it.key !== 'project')
    .filter((it) => SHOW_LEGACY_TABS || (it.key !== 'inbox' && it.key !== 'detail'))
    // 맨 위에 오는 탭 앞에는 구분선을 넣지 않아요
    .map((it, i) => (i === 0 ? { ...it, separatorBefore: false } : it));

  return (
    <div
      style={{
        width: expanded ? 300 : 120,
        flexShrink: 0,
        padding: '26px 25px 29px',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'width 160ms ease-out',
        overflow: 'hidden',
      }}
    >
      <div>
        <button
          type="button"
          aria-label={expanded ? '사이드바 접기' : '사이드바 펼치기'}
          onClick={() => setExpanded((v) => !v)}
          style={{ border: 0, background: 'none', padding: 0, cursor: 'pointer', display: 'block', marginLeft: 1, lineHeight: 0 }}
        >
          <IconSidebarToggle />
        </button>

        <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 25 }}>
          {items.map((it) => {
            const clickable = !!it.onClick;
            const body = (
              <div
                role={clickable ? 'button' : undefined}
                tabIndex={clickable ? 0 : undefined}
                onClick={it.onClick}
                onKeyDown={(e) => clickable && (e.key === 'Enter' || e.key === ' ') && it.onClick?.()}
                style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: clickable ? 'pointer' : 'default' }}
              >
                {/* 사이드바 말풍선 기준값은 design.tsx의 SidebarHint에 있어요. 새 탭도 이렇게 감싸면 같은 말풍선이 나와요. */}
                <SidebarHint label={it.label} disabled={expanded}>
                  {it.icon(it.active)}
                  {it.tag && (
                    <div style={{ position: 'absolute', bottom: -5, right: -5 }}>
                      <Badge size="xsmall" color="elephant" variant="fill">
                        {it.tag}
                      </Badge>
                    </div>
                  )}
                  {!!it.badge && (
                    <div style={{ position: 'absolute', top: -6, right: -6 }}>
                      <Badge size="xsmall" color="red" variant="fill">
                        {it.badge}
                      </Badge>
                    </div>
                  )}
                </SidebarHint>
                <div
                    aria-hidden={!expanded}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                      minWidth: 0,
                      whiteSpace: 'nowrap',
                      opacity: expanded ? 1 : 0,
                      pointerEvents: expanded ? 'auto' : 'none',
                      transition: expanded ? 'opacity 140ms ease-out 90ms' : 'opacity 60ms ease-out',
                    }}
                  >
                    <Paragraph.Text typography="st11" fontWeight="bold" color={adaptive.grey900}>
                      {it.label}
                    </Paragraph.Text>
                    <Paragraph.Text typography="st12" color={adaptive.grey600}>
                      {it.desc}
                    </Paragraph.Text>
                  </div>
              </div>
            );
            // 펼쳐져도 같은 트리를 유지해서(다시 그리지 않아서) 깜빡이지 않게 하고, 설명은 접혀 있을 때만 말풍선으로 보여줘요.
            return (
              <div key={it.key}>
                {it.separatorBefore && <div style={{ width: 50, height: 1, background: adaptive.grey200, margin: '0 0 25px' }} />}
                {body}
              </div>
            );
          })}
        </div>
      </div>

      {/* 프로필 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <SidebarHint label="지은 · 디자이너" placement="top" disabled={expanded}>
          <IconAvatar />
        </SidebarHint>
        <div
          aria-hidden={!expanded}
          style={{
            whiteSpace: 'nowrap',
            opacity: expanded ? 1 : 0,
            transition: expanded ? 'opacity 140ms ease-out 90ms' : 'opacity 60ms ease-out',
          }}
        >
          <Paragraph.Text typography="st11" fontWeight="semibold" color={adaptive.grey800}>
            지은 · 디자이너
          </Paragraph.Text>
        </div>
      </div>
    </div>
  );
}

/* ───────── 연결 상태 (오른쪽 위) ───────── */
function ConnectionStatus({ screen }: { screen: Screen }) {
  const connected = screen === 'ok' || screen === 'empty' || screen === 'loading';
  return (
    <Tooltip
      size="small"
      placement="bottom"
      openOnHover
      message={connected ? '프로젝트와 연결되어 있어요.' : '최신 변경사항을 가져오지 못하고 있어요.'}
    >
      <Badge size="medium" color={connected ? 'green' : 'red'} variant="weak">
        {connected ? '● 프로젝트 연결됨 · 마지막 동기화 2분 전' : '● 연결 끊김 · 마지막 동기화 16:24'}
      </Badge>
    </Tooltip>
  );
}

/* ───────── App ───────── */
export function App() {
  const [nav, setNav] = useState<Nav>(SHOW_LEGACY_TABS ? 'inbox' : 'cliInbox');
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [toast, setToast] = useState<{ open: boolean; text: string }>({ open: false, text: '' });
  const [cliViewer, setCliViewer] = useState<CliViewer>('seojun');

  const showToast = (text: string) => setToast({ open: true, text });

  // 기존 "나에게 온 변경" / "변경 상세" 탭의 데이터
  const main = useBoard(INITIAL_CHANGES, {
    goDetail: () => setNav('detail'),
    goInbox: () => setNav('inbox'),
    toast: showToast,
  });

  // 복제 탭(CLI)의 데이터: 담당자마다 세션을 시작한 직후의 확인 대기를 따로 가져요.
  const cliOptions = (role: string) => ({
    goDetail: () => setNav('cliDetail'),
    goInbox: () => setNav('cliInbox'),
    toast: showToast,
    // 답하면 내 작업(역할)의 확인 대기에 답을 반영해요.
    ackExtra: (c: DecisionChange, answer?: Answer) =>
      answer ? { affectedTasks: applyAnswerToTasks(c, role, answer) } : {},
  });
  const cliMinho = useBoard(buildCliChanges('minho'), cliOptions('디자이너'));
  const cliSeojun = useBoard(buildCliChanges('seojun'), cliOptions('백엔드'));
  const cliHarin = useBoard(buildCliChanges('harin'), cliOptions('QA'));
  const cli = { minho: cliMinho, seojun: cliSeojun, harin: cliHarin }[cliViewer];
  const cliViewerInfo = CLI_VIEWERS.find((v) => v.value === cliViewer)!;

  const isCli = nav === 'cliInbox' || nav === 'cliDetail';
  const board = isCli ? cli : main;
  const { changes, doneTasks, selected } = board;
  const showInbox = nav === 'inbox' || nav === 'cliInbox';
  const backToInbox = () => setNav(isCli ? 'cliInbox' : 'inbox');

  const showEmpty = screen === 'empty' || (screen === 'ok' && changes.length === 0);

  const centered = (children: React.ReactNode) => (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</div>
  );

  const body =
    screen === 'error' ? (
      centered(
        <Result
          title="프로젝트와 연결할 수 없어요"
          description={'최신 변경사항을 확인하지 못하고 있어요.\n마지막으로 동기화된 시간: 16:24'}
          button={
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <Result.Button onClick={() => setScreen('ok')}>다시 연결</Result.Button>
              <TextButton size="medium" variant="underline" onClick={() => setScreen('offline')}>
                오프라인에서 확인
              </TextButton>
            </div>
          }
        />
      )
    ) : screen === 'loading' ? (
      <div style={{ padding: 36 }}>
        <Skeleton pattern="topList" />
      </div>
    ) : showEmpty ? (
      centered(
        <Result
          title="지금 확인할 변경사항이 없습니다."
          description={'새로운 변경이 감지되면 이곳에서 알려드릴게요.\n● 프로젝트 연결됨 · 마지막 동기화 2분 전'}
        />
      )
    ) : nav === 'cliEmpty' ? (
      <Inbox
        key="cli-empty"
        variant="cli"
        changes={[]}
        doneTasks={new Set()}
        onOpen={() => {}}
        onOpenIssue={() => {}}
        onToast={showToast}
      />
    ) : showInbox ? (
      <Inbox
        key={isCli ? `cli-${cliViewer}` : 'main'}
        variant={isCli ? 'cli' : 'default'}
        changes={changes}
        doneTasks={doneTasks}
        onOpen={board.open}
        onOpenIssue={board.openIssue}
        onToast={showToast}
      />
    ) : selected ? (
      <Detail
        key={`${isCli ? cliViewer : 'main'}-${selected.id}`}
        change={selected}
        total={changes.length}
        onAcknowledge={board.acknowledge}
        onReply={board.reply}
        onTaskToggle={board.toggleTask}
        doneTasks={doneTasks}
        onRollback={board.rollback}
        onNext={board.next}
        onOpenIssue={board.openIssue}
        onBack={backToInbox}
        variant={isCli ? 'cli' : 'default'}
        onAnswer={board.answerChange}
        peers={isCli ? sortChanges(changes) : undefined}
        onPeerSelect={board.open}
      />
    ) : (
      centered(
        <Result
          title="선택한 변경이 없어요"
          description="나에게 온 변경에서 확인할 변경을 선택해주세요."
          button={<Result.Button onClick={backToInbox}>나에게 온 변경 보기</Result.Button>}
        />
      )
    );

  return (
    <div
      className="soft-press"
      style={{ height: '100vh', display: 'flex', background: adaptive.grey50, overflow: 'hidden' }}
    >
      <SideNav
        nav={nav}
        onNav={setNav}
        pendingCount={main.pendingCount}
        selected={main.selected}
        cliPendingCount={cli.pendingCount}
        cliSelected={cli.selected}
        cliViewerLabel={cliViewerInfo.label}
      />

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* 오른쪽 위: 연결 상태 */}
        <div
          style={{
            height: 70,
            flexShrink: 0,
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 12,
            overflowX: 'auto',
          }}
        >
          {isCli && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, whiteSpace: 'nowrap', flexShrink: 0 }}>
              <Paragraph.Text typography="t7" color={adaptive.grey600}>
                CLI 시험 데이터 · 담당자
              </Paragraph.Text>
              <FilterTabs
                label="CLI 시험 담당자"
                value={cliViewer}
                onChange={setCliViewer}
                options={CLI_VIEWERS.map((v) => ({ value: v.value, label: `${v.label} · ${v.role}` }))}
              />
            </div>
          )}
          {/* 연결 상태는 기존 탭에만 보여줘요 */}
          {!isCli && nav !== 'cliEmpty' && (
            <div style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
              <ConnectionStatus screen={screen} />
            </div>
          )}
        </div>

        {/* 흰색 둥근 패널 */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            background: adaptive.background,
            borderTopLeftRadius: 20,
          }}
        >
          {screen === 'offline' && (
            <div style={{ background: adaptive.yellow50, padding: '10px 35px' }}>
              <Paragraph.Text typography="t7" color={adaptive.grey800}>
                오프라인에서 보고 있어요. 마지막으로 동기화된 시간(16:24)까지의 정보만 신뢰할 수 있어요.
              </Paragraph.Text>
            </div>
          )}
          {body}
        </div>

        {/* 화면 상태 미리보기 (개발용, 지금은 숨김) */}
        {SHOW_STATE_PREVIEW && (
          <div
            style={{
              padding: '8px 24px',
              background: adaptive.grey50,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Paragraph.Text typography="t7" color={adaptive.grey500}>
              화면 상태 미리보기
            </Paragraph.Text>
            <div style={{ width: 560 }}>
              <SegmentedControl size="small" alignment="fluid" value={screen} onChange={(v) => setScreen(v as Screen)}>
                <SegmentedControl.Item size="small" value="ok">정상</SegmentedControl.Item>
                <SegmentedControl.Item size="small" value="loading">불러오는 중</SegmentedControl.Item>
                <SegmentedControl.Item size="small" value="empty">빈 화면</SegmentedControl.Item>
                <SegmentedControl.Item size="small" value="error">연결 실패</SegmentedControl.Item>
                <SegmentedControl.Item size="small" value="offline">오프라인</SegmentedControl.Item>
              </SegmentedControl>
            </div>
          </div>
        )}
      </div>

      <Toast
        position="bottom"
        open={toast.open}
        text={toast.text}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </div>
  );
}
