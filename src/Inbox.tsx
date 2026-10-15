import { createContext, useContext, useMemo, useState } from 'react';
import {
  ListRow,
  Paragraph,
  ProgressBar,
  Result,
  SearchField,
  Tooltip,
} from '@toss/tds-mobile';
import { adaptive } from '@toss/tds-colors';
import { ANSWERED, AUTO_CLOSED_TITLE, REAPPLY_HINT, STANDALONE, TELL_YOU, TO_ANSWER } from './copy';
import { NotificationAccordion } from './NotificationAccordion';
import {
  DecisionChange,
  DecisionState,
  isAiChat,
  isAiFound,
  isAutoClosed,
  isNewDecision,
  formatWhen,
  isPending,
  needsReapplyHint,
  relTime,
  reviewStatus,
  sortChanges,
  PROGRESS_LABEL,
  taskProgress,
} from './data';
import { BlueFillChipWeight, Chip, ChipTone, FilterTabs, IconBellOff, IconClose, IconSparkle, ToggleSwitch } from './design';

/**
 * 검색 영역(SearchField) 표시 여부.
 * 지금은 필요 없어서 숨겨 두었어요. 다시 쓰려면 true로 바꾸면 돼요.
 */
const SHOW_SEARCH = false;

type Filter = 'all' | 'mine' | 'issue';

/**
 * CLI 탭 여부. CLI 탭은 "화면에 들어가는 데이터.md"에서 정한 표현(확인할 변경 상태 대기/답함/대체됨,
 * 출처, 새 결정 사항, 이슈 제목, 언제 표기 등)을 쓰고, 기존 탭은 지금처럼 보여줘요.
 */
const CliCtx = createContext(false);
const useCli = () => useContext(CliCtx);

/* ───────── CLI 탭 전용 조각 (화면에 들어가는 데이터.md) ───────── */

/** 확인할 변경 상태 칩: 대기 / 답함 / 대체됨 (자동 닫힘은 화면에 나오지 않아요) */
function ReviewStatusChip({ change }: { change: DecisionChange }) {
  const status = reviewStatus(change);
  // 대기 = 주황, 답함 = 파란 채움, 대체됨 = 회색. 목록 왼쪽 같은 칸에서 한눈에 구분돼요.
  const tone: ChipTone = status === '대기' ? 'orange' : status === '답함' ? (STANDALONE ? 'blueFill' : 'green') : 'gray';
  // 대체 버전: 좌우 여백은 13px로 고정이고, 칩 폭은 글자 수에 맞춰져요(대기·답함은 좁고 대체됨은 넓어요).
  return <Chip tone={tone}>{status}</Chip>;
}

/** 출처("AI 대화에서 바꿈" / "코드에서 바꿈")와, AI가 찾았을 때만 "PR에서 찾음" */
function CliSourceChips({ change }: { change: DecisionChange }) {
  return (
    <>
      {STANDALONE ? (
        // 출처 칩 (대체 버전): [AI 대화] [코드] [슬랙]. 모두 같은 모양이에요.
        change.source === 'code' ? (
          <Chip inline tone="ai">코드</Chip>
        ) : change.source === 'slack' ? (
          <Chip inline tone="ai">Slack</Chip>
        ) : change.source === 'pr' || change.foundByAi ? (
          <Chip inline tone="ai">PR에서 찾은 변경</Chip>
        ) : (
          <Chip inline tone="ai" icon={<IconSparkle />}>AI 대화</Chip>
        )
      ) : change.source === 'code' ? (
        <Chip inline tone="gray">코드에서 바꿈</Chip>
      ) : (
        <Chip inline tone="ai" icon={<IconSparkle />}>
          {STANDALONE ? 'AI 대화' : 'AI 대화에서 바꿈'}
        </Chip>
      )}
      {!STANDALONE && change.foundByAi && <Chip inline tone="gray">PR에서 찾음</Chip>}
    </>
  );
}

/** 목록 줄의 "(완료된 이슈)" 문구. 이슈 카드의 [완료] 칩으로 대신해서 숨겼어요. 다시 쓰려면 true. (대체 버전) */
const SHOW_DONE_ISSUE_TEXT = false;

/** 되돌림 줄의 "· 내가 v2에 답한 이력이 있어요" 안내. 일단 숨겼어요. 다시 쓰려면 true. (대체 버전) */
const SHOW_PREVIOUS_ANSWER_NOTE = false;

/** 대체 버전: 완료된 이슈의 [완료] 칩. 제목 옆 칩들 맨 끝에 붙어요 (변경 상세의 칩 순서와 같아요) */
function DoneIssueChip({ change }: { change: DecisionChange }) {
  const cli = useCli();
  if (!STANDALONE || !cli || change.issueStatus !== '완료') return null;
  return <Chip inline tone="green">완료</Chip>;
}

/** 이전 값이 없으면 "새 결정 사항", 이슈가 완료일 때만 "이슈 완료" */
function CliTags({ change }: { change: DecisionChange }) {
  return (
    <>
      {isNewDecision(change) && (
        <Chip inline tone={STANDALONE ? 'blue' : 'blueFill'}>
          {STANDALONE ? '신규' : '새 결정 사항'}
        </Chip>
      )}
      {change.isNewVersion && change.version && <Chip inline tone="blue">{`새 버전 v${change.version.to}`}</Chip>}
      {change.revertedTo && <Chip inline tone="purple">되돌림</Chip>}
      {!STANDALONE && change.issueStatus === '완료' && <Chip inline tone="green">이슈 완료</Chip>}
    </>
  );
}

/** #이슈번호 · 이슈 제목(길면 …) · 이름 · 언제 */
function CliMeta({ change }: { change: DecisionChange }) {
  const grey = adaptive.grey500;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: STANDALONE ? 8 : 4, minWidth: 0, color: grey }}>
      <Paragraph.Text typography="st12" color={grey}>
        {`#${change.issueNo}`}
      </Paragraph.Text>
      {change.issueTitle && (
        <div style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <Paragraph.Text typography="st12" color={grey}>
            {`${STANDALONE ? '' : '· '}${change.issueTitle}${STANDALONE && SHOW_DONE_ISSUE_TEXT && change.issueStatus === '완료' ? ' (완료된 이슈)' : ''}`}
          </Paragraph.Text>
        </div>
      )}
      <div style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
        <Paragraph.Text typography="st12" color={grey}>
          {STANDALONE ? `${change.author} ${formatWhen(change.timestamp)}` : `· ${change.author} · ${formatWhen(change.timestamp)}`}
        </Paragraph.Text>
      </div>
    </div>
  );
}

/** 왼쪽 칩 색 (디자인: 신규=파란 채움, 주의가 필요한 상태=주황, 그 외=회색) */
const KIND_TONE: Record<DecisionState, ChipTone> = {
  신규: 'blueFill',
  대체됨: 'orange',
  확정: 'green',
  '검토 중': 'gray',
  철회됨: 'red',
};

/* ───────── 공통 조각 ───────── */

/** AI가 PR에서 찾아낸 결정이라는 표시 (디자인의 "AI 대화에서 바꿈" 칩과 같은 모양) */
function AiChip({ change }: { change: DecisionChange }) {
  const cli = useCli();
  if (cli) return <CliSourceChips change={change} />;
  // CLI의 AI 대화에서 정해진 결정
  if (isAiChat(change)) {
    return (
      <Chip inline tone="ai" icon={<IconSparkle />}>
        AI 대화에서 바꿈
      </Chip>
    );
  }
  if (!isAiFound(change)) return null;
  return (
    <Tooltip
      size="small"
      openOnHover
      message={`PR #${change.pr?.number}에서 AI가 찾아낸 결정이에요. 실제 결정이 맞는지 확인해주세요.`}
    >
      <Chip inline tone="ai" icon={<IconSparkle />}>
        AI가 PR에서 찾음
      </Chip>
    </Tooltip>
  );
}

/** 결정 버전(v1 → v2)과 결정 종류 칩. CLI 데이터에만 있어요. */
function VersionKind({ change }: { change: DecisionChange }) {
  const cli = useCli();
  if (cli) return <CliTags change={change} />;
  const v = change.version;
  if (!v && !change.kindLabel) return null;
  return (
    <>
      {v && <Chip tone="gray">{v.from === null ? `v${v.to}` : `v${v.from} → v${v.to}`}</Chip>}
      {change.kindLabel && <Chip tone={change.kindLabel === '지속되는 제약 조건' ? 'green' : 'blue'}>{change.kindLabel}</Chip>}
    </>
  );
}

/** 왼쪽 칩 칸: 새로 생긴 결정이면 "신규", 아니면 결정 상태 */
function KindChip({ change }: { change: DecisionChange }) {
  const cli = useCli();
  if (cli) {
    return (
      <div style={{ width: 96, display: 'flex' }}>
        <ReviewStatusChip change={change} />
      </div>
    );
  }
  const label: DecisionState = isNewDecision(change) ? '신규' : change.decisionState;
  return (
    <div style={{ width: 96, display: 'flex' }}>
      <Chip tone={KIND_TONE[label]}>{label}</Chip>
    </div>
  );
}

/** 이전 값 → 지금 값 (이전 값이 없으면 "이전 값 없음") */
function ChangeLine({ change, muted }: { change: DecisionChange; muted?: boolean }) {
  const cli = useCli();
  const line = (
    <Paragraph.Text typography="t7" color={muted ? adaptive.grey500 : adaptive.grey700}>
      {STANDALONE ? (
        // 대체 버전: 이전 값만 아주 연한 회색으로 흐리게
        <>
          <span style={{ color: adaptive.grey400 }}>{change.before ?? (cli ? '새 결정 사항' : '이전 값 없음')}</span>
          {` → ${change.after}`}
        </>
      ) : (
        `${change.before ?? (cli ? '새 결정 사항' : '이전 값 없음')} → ${change.after}`
      )}
    </Paragraph.Text>
  );
  if (!change.revertedTo) return line;
  // 되돌림 칩은 제목 옆(CliTags)으로 옮겼어요. 여기서는 내가 이전에 답한 이력이 있으면 뒤에 한 줄로 알려줘요.
  return (
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '4px 8px' }}>
      {line}
      {change.previousAnswer && (!STANDALONE || SHOW_PREVIOUS_ANSWER_NOTE) && (
        <Paragraph.Text typography="t7" color={adaptive.grey500}>
          {`· 내가 v${change.revertedTo.from}에 답한 이력이 있어요`}
        </Paragraph.Text>
      )}
    </div>
  );
}

/** 이미 "관계있다"로 답했던 사람에게 붙이는 안내 (확정안 3 · 4) */
function ReapplyHint({ change }: { change: DecisionChange }) {
  if (!needsReapplyHint(change)) return null;
  return (
    <div style={{ marginTop: 2, alignSelf: 'flex-start', padding: '6px 10px', borderRadius: 8, background: adaptive.grey100 }}>
      <Paragraph.Text typography="st12" color={adaptive.grey700}>
        {REAPPLY_HINT}
      </Paragraph.Text>
    </div>
  );
}

/** 이슈 번호 · 누가(또는 어떤 PR에서) · 언제 */
function Meta({ change }: { change: DecisionChange }) {
  const cli = useCli();
  if (cli) return <CliMeta change={change} />;
  const who = isAiFound(change) ? `PR #${change.pr?.number}에서 AI가 찾음` : change.author;
  const key = change.decisionKey ? `${change.decisionKey} · ` : '';
  const processed = change.processed ? ` · 처리 ${change.processed.done}/${change.processed.total}` : '';
  return (
    <Paragraph.Text typography="st12" color={adaptive.grey500}>
      {`#${change.issueNo} · ${key}${who} · ${relTime(change.timestamp)}${processed}`}
    </Paragraph.Text>
  );
}

/** 카드 머리글: "답할 변경 2" (숫자는 파란색) */
function CardTitle({ children, count }: { children: string; count: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
      <Paragraph.Text typography="t6" fontWeight="bold" color={adaptive.grey900}>
        {children}
      </Paragraph.Text>
      <Paragraph.Text typography="t6" fontWeight="bold" color={adaptive.blue500}>
        {count}
      </Paragraph.Text>
    </div>
  );
}

/**
 * 나에게 온 변경이 하나도 없을 때의 빈 화면 (프로토타입 "Browser · A2 · 빈 화면" + GitHub의 "No pull requests found" 방식).
 * "답할 변경 0" / "답한 변경 0" 카드를 그대로 두고, 카드 안에 "아직 아무 알림도 없어요"라는 안내를 한글로 넣어요.
 */
function CliEmptyCards() {
  const card = (border: string, title: string, headline: string, hint: string) => (
    <div
      style={{
        marginTop: 18,
        border: `1px solid ${border}`,
        borderRadius: 14,
        background: adaptive.background,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '24px 20px 20px' }}>
        <CardTitle count={0}>{title}</CardTitle>
      </div>
      <div style={{ borderTop: `1px solid ${adaptive.grey100}`, padding: '28px 20px 32px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* 첫 줄: 14px 일반 굵기, "답할 변경" 제목과 같은 글자색(grey900). 둘째 줄: 이전 값 → 지금 값 줄과 같은 13px, 회색 700 */}
        <Paragraph.Text typography="st11" color={adaptive.grey900}>
          {headline}
        </Paragraph.Text>
        <Paragraph.Text typography="t7" color={adaptive.grey700}>
          {hint}
        </Paragraph.Text>
      </div>
    </div>
  );
  return (
    <>
      {card(adaptive.blue100, TO_ANSWER, `${STANDALONE ? "지금" : "아직"} ${TO_ANSWER}이 없어요`, `새로운 변경이 감지되면 이곳에서 ${TELL_YOU}`)}
      {card(adaptive.grey200, ANSWERED, `${STANDALONE ? "지금" : "아직"} ${ANSWERED}이 없어요`, '변경에 답하면 이곳에 모여요')}
    </>
  );
}

const rowLine = (first: boolean) => ({ borderTop: first ? 'none' : `1px solid ${adaptive.grey100}` });

/* ───────── 답할 변경 ───────── */
function PendingRow({ change, onOpen }: { change: DecisionChange; onOpen: (id: string) => void }) {
  const cli = useCli();
  const ai = isAiFound(change);
  return (
    <div style={rowLine(false)}>
      <ListRow
        border="none"
        withTouchEffect
        verticalPadding="large"
        leftAlignment="top"
        onClick={() => onOpen(change.id)}
        left={<KindChip change={change} />}
        contents={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minHeight: STANDALONE ? 26 : undefined }}>
              <Paragraph.Text typography="st11" fontWeight="bold" color={adaptive.grey900}>
                {change.title}
              </Paragraph.Text>
              {/* 제목 옆 칩들은 한 덩어리로 묶어서, 좁아져도 칩끼리는 같은 줄에 나란히 있어요 */}
              <div style={{ display: STANDALONE ? 'flex' : 'contents', alignItems: 'center', gap: 8, flexWrap: 'nowrap' }}>
                <VersionKind change={change} />
                <AiChip change={change} />
                <DoneIssueChip change={change} />
              </div>
            </div>
            <ChangeLine change={change} />
            {cli && <ReapplyHint change={change} />}
            <Meta change={change} />
          </div>
        }
        right={
          cli && STANDALONE ? (
            // 답해야 하는 변경이라는 걸 알리는 파란 버튼 (시안 2: 토스의 행동 버튼처럼 파랑 채움 + 흰 글자)
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                height: 32,
                padding: '0 14px',
                borderRadius: 9,
                background: '#3182F6',
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 500,
                whiteSpace: 'nowrap',
              }}
            >
              답하기 ›
            </span>
          ) : (
            <Paragraph.Text typography="t7" fontWeight="medium" color={adaptive.blue500}>
              {cli ? '답하기 ›' : ai ? '맞는지 확인 ›' : change.affectsMe ? '확인하기 ›' : '확인만 하기 ›'}
            </Paragraph.Text>
          )
        }
      />
    </div>
  );
}

/* ───────── 답한 변경 ───────── */
/** 대체 버전: 지금 보는 담당자의 역할(예: 백엔드). 답한 변경 카드에서 "내 작업"이 어디까지 갔는지 가려내는 데 써요 */
export const ViewerRoleContext = createContext<string | undefined>(undefined);

function DoneRow({
  change,
  first,
  doneTasks,
  onOpen,
}: {
  change: DecisionChange;
  first: boolean;
  doneTasks: Set<string>;
  onOpen: (id: string) => void;
}) {
  const cli = useCli();
  const total = change.processed?.total ?? change.affectedTasks.length;
  const done = change.affectedTasks.filter((t) => doneTasks.has(`${change.id}:${t.name}`)).length;
  const handled = change.processed ? change.processed.done : change.status === 'RESOLVED' ? total : done;

  const superseded = !!change.supersededBy;
  // 대체 버전: 진행 상태를 3단계(1 새 변경 · 2 확인 완료 · 3 작업 반영)로 미니 표시. 답한 카드는 2단계, "작업 반영했어요"를 누르면 3단계예요.
  const role = useContext(ViewerRoleContext);
  const myTask = role ? change.affectedTasks.find((t) => t.state === 'accepted' && (t.owner === role || t.name.startsWith(`${role} /`))) : undefined;
  const miniStep = myTask && ['applied', 'done'].includes(taskProgress(myTask)) ? 3 : 2;
  return (
    <div style={{ ...rowLine(first), background: first && !superseded ? adaptive.blue50 : undefined }}>
      <ListRow
        border="none"
        withTouchEffect
        verticalPadding="large"
        leftAlignment="top"
        onClick={() => onOpen(change.id)}
        left={cli && STANDALONE ? <KindChip change={change} /> : undefined}
        contents={
          // 대체됨은 내용만 흐리게 해요(왼쪽 칩은 그대로 또렷하게)
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0, opacity: superseded ? 0.55 : undefined }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minHeight: STANDALONE ? 26 : undefined }}>
              <Paragraph.Text typography="st11" fontWeight="bold" color={adaptive.grey900}>
                {change.title}
              </Paragraph.Text>
              {/* 제목 옆 칩들은 한 덩어리로 묶어서, 좁아져도 칩끼리는 같은 줄에 나란히 있어요 */}
              <div style={{ display: STANDALONE ? 'flex' : 'contents', alignItems: 'center', gap: 8, flexWrap: 'nowrap' }}>
                <VersionKind change={change} />
                <AiChip change={change} />
                <DoneIssueChip change={change} />
              </div>
              {cli && STANDALONE ? null : cli ? (
                <Chip tone={superseded ? 'gray' : 'green'}>{superseded ? '대체됨' : '답함'}</Chip>
              ) : (
                <Chip tone={isNewDecision(change) ? 'blueFill' : 'gray'}>
                  {isNewDecision(change) ? '신규' : change.decisionState}
                </Chip>
              )}
            </div>
            <ChangeLine change={change} />
            {superseded && (
              <Paragraph.Text typography="st12" color={adaptive.grey500}>
                {change.supersededBy!.version ? `새 버전 v${change.supersededBy!.version}으로 대체됐어요` : `새 버전 #${change.supersededBy!.issueNo}로 대체됐어요`}
              </Paragraph.Text>
            )}
            <Meta change={change} />
          </div>
        }
        right={
          superseded ? undefined : (
            <div style={{ width: 80, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <Paragraph.Text typography="t7" fontWeight="medium" color={adaptive.blue500}>
                {STANDALONE ? (cli ? `${miniStep}/3 ${miniStep === 3 ? PROGRESS_LABEL.applied : '확인 완료'}` : `작업 ${handled}/${total} 답함`) : `${handled}/${total} 처리`}
              </Paragraph.Text>
              <div style={{ width: 80 }}>
                <ProgressBar progress={STANDALONE && cli ? miniStep / 3 : total === 0 ? 0 : handled / total} size="light" />
              </div>
            </div>
          )
        }
      />
    </div>
  );
}

/* ───────── 자동으로 닫힌 변경 (답이 필요 없는 변경) ───────── */
/** 자동으로 닫힌 변경의 상태 칩 문구: CLI 탭은 "대체됨" */
function useCli_label() {
  return useCli() ? '대체됨' : '자동 닫힘';
}

function ClosedRow({
  change,
  first,
  onOpen,
  onOpenIssue,
}: {
  change: DecisionChange;
  first: boolean;
  onOpen: (id: string) => void;
  onOpenIssue: (issueNo: number) => void;
}) {
  return (
    <div style={rowLine(first)}>
      <ListRow
        border="none"
        withTouchEffect
        verticalPadding="large"
        leftAlignment="top"
        onClick={() => onOpen(change.id)}
        left={
          <div style={{ width: 96, display: 'flex' }}>
            <Chip tone="gray">{useCli_label()}</Chip>
          </div>
        }
        contents={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Paragraph.Text typography="st11" fontWeight="bold" color={adaptive.grey500}>
                {change.title}
              </Paragraph.Text>
              {/* 제목 옆 칩들은 한 덩어리로 묶어서, 좁아져도 칩끼리는 같은 줄에 나란히 있어요 */}
              <div style={{ display: STANDALONE ? 'flex' : 'contents', alignItems: 'center', gap: 8, flexWrap: 'nowrap' }}>
                <VersionKind change={change} />
                <AiChip change={change} />
                <DoneIssueChip change={change} />
              </div>
            </div>
            <ChangeLine change={change} muted />
            <Paragraph.Text typography="t7" color={adaptive.grey600}>
              {`새 버전(#${change.autoClosed?.byIssueNo})으로 대체되어 자동으로 닫혔어요. 답하지 않아도 돼요.`}
            </Paragraph.Text>
            <Meta change={change} />
          </div>
        }
        right={
          <div
            role="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenIssue(change.autoClosed!.byIssueNo);
            }}
          >
            <Paragraph.Text typography="t7" fontWeight="medium" color={adaptive.blue500}>
              {`새 버전 #${change.autoClosed?.byIssueNo} 보기 ›`}
            </Paragraph.Text>
          </div>
        }
      />
    </div>
  );
}

/* ───────── 브라우저 알림 안내 배너 ───────── */
function NotificationBanner({ on, onToggle, onClose }: { on: boolean; onToggle: (v: boolean) => void; onClose: () => void }) {
  return (
    <div
      style={{
        position: 'relative',
        marginTop: 22,
        padding: 30,
        borderRadius: 14,
        background: adaptive.blue50,
        display: 'flex',
        alignItems: 'center',
        gap: 20,
      }}
    >
      <IconBellOff />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        <Paragraph.Text typography="st10" fontWeight="bold" color={adaptive.grey900}>
          브라우저 알림이 차단되어 있어요
        </Paragraph.Text>
        <Paragraph.Text typography="t7" color={adaptive.grey700}>
          Chrome 설정에서 알림을 허용하면 변경 사항을 알림으로 받을 수 있어요.
        </Paragraph.Text>
      </div>
      <div style={{ alignSelf: 'flex-end' }}>
        <ToggleSwitch checked={on} onChange={onToggle} label="브라우저 알림" />
      </div>
      <button
        type="button"
        aria-label="알림 안내 닫기"
        onClick={onClose}
        style={{ position: 'absolute', top: 19, right: 21, border: 0, background: 'none', padding: 0, cursor: 'pointer' }}
      >
        <IconClose />
      </button>
    </div>
  );
}

/**
 * 이슈 별로 보기 (구성 B): 같은 이슈 번호의 버전들을 이슈 머리글 아래에 묶어서 보여줘요.
 * 위에서부터 지금 확인할 일이 있는 이슈 → 나머지 순서이고, 한 이슈 안에서는 최신 버전이 맨 위예요.
 */
function IssueGroups({
  items,
  doneTasks,
  onOpen,
  onOpenIssue,
}: {
  items: DecisionChange[];
  doneTasks: Set<string>;
  onOpen: (id: string) => void;
  onOpenIssue: (issueNo: number, version?: number) => void;
}) {
  const groups: DecisionChange[][] = [];
  const index = new Map<number, number>();
  items.forEach((c) => {
    const i = index.get(c.issueNo);
    if (i === undefined) {
      index.set(c.issueNo, groups.length);
      groups.push([c]);
    } else groups[i].push(c);
  });
  groups.forEach((g) => g.sort((a, b) => (b.version?.to ?? 0) - (a.version?.to ?? 0)));
  groups.sort((a, b) => Number(b.some(isPending)) - Number(a.some(isPending)) || b[0].timestamp - a[0].timestamp);

  return (
    <>
      {groups.map((g) => {
        const pending = g.some(isPending);
        const head = g[0];
        return (
          <div
            key={head.issueNo}
            style={{
              marginTop: 18,
              border: `1px solid ${pending ? adaptive.blue100 : adaptive.grey200}`,
              borderRadius: 14,
              background: adaptive.background,
              overflow: 'hidden',
            }}
          >
            {/* 머리글 여백은 "확인할 변경" 카드와 같아요 (위 24 · 아래 20) */}
            <div style={{ padding: '24px 20px 20px' }}>
              {/* 높이를 "확인할 변경 N"과 같은 23px로 고정해서, 이슈 제목(작은 글자)이 줄 높이를 키우지 않게 해요 */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0, height: 23 }}>
                <div style={{ flexShrink: 0 }}>
                  <Paragraph.Text typography="t6" fontWeight="bold" color={adaptive.grey900}>
                    {`이슈 #${head.issueNo}`}
                  </Paragraph.Text>
                </div>
                {head.issueTitle && (
                  <div style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <Paragraph.Text typography="t7" color={adaptive.grey600}>
                      {head.issueTitle}
                    </Paragraph.Text>
                  </div>
                )}
              </div>
            </div>
            {g.map((c) =>
              isAutoClosed(c) ? (
                <ClosedRow key={c.id} change={c} first={false} onOpen={onOpen} onOpenIssue={onOpenIssue} />
              ) : isPending(c) ? (
                <PendingRow key={c.id} change={c} onOpen={onOpen} />
              ) : (
                <DoneRow key={c.id} change={c} first={false} doneTasks={doneTasks} onOpen={onOpen} />
              )
            )}
          </div>
        );
      })}
    </>
  );
}

/* ───────── 나에게 온 변경 화면 ───────── */
export function Inbox({
  changes,
  doneTasks,
  onOpen,
  onOpenIssue,
  onToast,
  variant = 'default',
}: {
  variant?: 'default' | 'cli';
  changes: DecisionChange[];
  doneTasks: Set<string>;
  onOpen: (id: string) => void;
  onOpenIssue: (issueNo: number) => void;
  onToast: (text: string) => void;
}) {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [bannerOpen, setBannerOpen] = useState(true);
  const [notifyOn, setNotifyOn] = useState(false);

  // 확정안 2: 답 안 함 + 원래 값으로 돌아와 자동으로 닫힌 건은 목록 어디에도 보이지 않아요.
  const sorted = useMemo(() => sortChanges(changes).filter((c) => !c.hiddenClosed), [changes]);
  const hiddenCount = sorted.filter((c) => !c.affectsMe).length;

  const q = query.trim().toLowerCase().replace(/^#/, '');
  const visible = sorted.filter((c) => {
    const inFilter = filter === 'all' || filter === 'issue' || c.affectsMe;
    const inQuery = !q || c.title.toLowerCase().includes(q) || String(c.issueNo) === q;
    return inFilter && inQuery;
  });
  const pendingItems = visible.filter(isPending);
  const closedItems = visible.filter(isAutoClosed);
  const doneItems = visible.filter((c) => !isPending(c) && !isAutoClosed(c));

  /** 토글은 켜짐/꺼짐만 바꿔요. 배너는 × 를 눌러야 사라져요. */
  const toggleNotify = (v: boolean) => {
    setNotifyOn(v);
    onToast(v ? '브라우저 알림을 켰어요.' : '브라우저 알림을 껐어요.');
  };

  const cli = variant === 'cli';

  return (
    <CliCtx.Provider value={cli}>
    <BlueFillChipWeight.Provider value={cli ? 500 : undefined}>
    <div style={{ padding: '36px 35px 48px' }}>
      {/* 제목 + 필터 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Paragraph.Text typography="t3" fontWeight="bold" color={adaptive.grey900}>
            나에게 온 변경 목록
          </Paragraph.Text>
          <Paragraph.Text typography="t7" color={adaptive.grey600}>
            {STANDALONE ? '답한 변경은 7일 뒤에 목록에서 내려가요' : '최근 7일 동안 바뀐 결정 사항과 영향받는 작업이에요.'}
          </Paragraph.Text>
        </div>
        <FilterTabs
          label="변경 보기 범위"
          value={filter}
          onChange={setFilter}
          options={
            // 대체 버전(CLI 탭)은 "내 작업만 보기" 자리에 "이슈 별로 보기"를 둬요. 같은 이슈의 버전들을 묶어서 보여줘요.
            STANDALONE && cli
              ? [
                  { value: 'all', label: '전체' },
                  { value: 'issue', label: '이슈별' },
                ]
              : [
                  { value: 'all', label: '전체' },
                  { value: 'mine', label: '내 작업만 보기' },
                ]
          }
        />
      </div>

      {/* 브라우저 알림 안내 */}
      {bannerOpen && !(cli && changes.length === 0) && (
        // 대체 버전(STANDALONE)은 새 디자인(알림 꺼짐 → 설정 방법 펼침), 로컬(TDS)은 기존 배너를 써요.
        STANDALONE ? (
          <NotificationAccordion onClose={() => setBannerOpen(false)} />
        ) : (
          <NotificationBanner on={notifyOn} onToggle={toggleNotify} onClose={() => setBannerOpen(false)} />
        )
      )}

      {/* 검색 (지금은 숨김) */}
      {SHOW_SEARCH && (
        <div style={{ marginTop: 16 }}>
          <SearchField
            placeholder="결정 사항 제목이나 이슈 번호(#12)로 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onDeleteClick={() => setQuery('')}
          />
        </div>
      )}

      {cli && changes.length === 0 ? (
        <CliEmptyCards />
      ) : visible.length === 0 ? (
        <div style={{ padding: '64px 0' }}>
          <Result
            title="확인할 변경이 없어요"
            description={q ? '제목이나 이슈 번호(예: #12)를 다시 확인해주세요.' : `새로운 변경이 감지되면 ${TELL_YOU}.`}
          />
        </div>
      ) : STANDALONE && cli && filter === 'issue' ? (
        <IssueGroups items={visible} doneTasks={doneTasks} onOpen={onOpen} onOpenIssue={onOpenIssue} />
      ) : (
        <>
          {/* 답할 변경 */}
          {(pendingItems.length > 0 || (cli && doneItems.length > 0)) && (
            <div
              style={{
                marginTop: 18,
                border: `1px solid ${adaptive.blue100}`,
                borderRadius: 14,
                background: adaptive.background,
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '24px 20px 20px' }}>
                <CardTitle count={pendingItems.length}>{TO_ANSWER}</CardTitle>
              </div>
              {pendingItems.length === 0 && (
                // 답할 변경이 0개면 빈 화면을 보여줘요
                <div style={{ padding: '8px 0 32px' }}>
                  <Result title={`지금 ${TO_ANSWER}이 없어요`} description={`새로운 변경이 감지되면 이곳에서 ${TELL_YOU}.`} />
                </div>
              )}
              {pendingItems.map((c) => (
                <PendingRow key={c.id} change={c} onOpen={onOpen} />
              ))}
            </div>
          )}

          {/* 답한 변경 */}
          {(doneItems.length > 0 || (filter === 'mine' && hiddenCount > 0)) && (
            <div
              style={{
                marginTop: 18,
                border: `1px solid ${adaptive.grey200}`,
                borderRadius: 14,
                background: adaptive.background,
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '24px 20px 20px' }}>
                <CardTitle count={doneItems.length}>{ANSWERED}</CardTitle>
              </div>
              {doneItems.map((c, i) => (
                <DoneRow key={c.id} change={c} first={i === 0} doneTasks={doneTasks} onOpen={onOpen} />
              ))}
              {filter === 'mine' && hiddenCount > 0 && (
                <div style={{ background: adaptive.grey50 }}>
                  <ListRow
                    border="none"
                    withTouchEffect
                    verticalPadding="medium"
                    onClick={() => setFilter('all')}
                    contents={
                      <Paragraph.Text typography="t7" color={adaptive.grey600}>
                        {`내 작업과 관련 없는 변경 ${hiddenCount}개 · 확인할 일이 없어서 숨겨져 있어요`}
                      </Paragraph.Text>
                    }
                    withArrow
                  />
                </div>
              )}
            </div>
          )}

          {/* 자동으로 닫힌 변경 */}
          {closedItems.length > 0 && (
            <div
              style={{
                marginTop: 18,
                border: `1px dashed ${adaptive.grey300}`,
                borderRadius: 14,
                background: adaptive.grey50,
                overflow: 'hidden',
              }}
            >
              <div style={{ padding: '24px 20px 4px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <Paragraph.Text typography="t6" fontWeight="bold" color={adaptive.grey900}>
                    {AUTO_CLOSED_TITLE}
                  </Paragraph.Text>
                  <Paragraph.Text typography="t6" fontWeight="bold" color={adaptive.grey500}>
                    {closedItems.length}
                  </Paragraph.Text>
                </div>
                <Paragraph.Text typography="t7" color={adaptive.grey600}>
                  답하기 전에 결정이 또 바뀌어서 자동으로 닫힌 변경이에요. 답하지 않아도 돼요.
                </Paragraph.Text>
              </div>
              <div style={{ marginTop: 12 }}>
                {closedItems.map((c, i) => (
                  <ClosedRow key={c.id} change={c} first={i === 0} onOpen={onOpen} onOpenIssue={onOpenIssue} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
    </BlueFillChipWeight.Provider>
    </CliCtx.Provider>
  );
}
