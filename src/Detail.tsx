import { useLayoutEffect, useRef, useState } from 'react';
import {
  Button,
  Checkbox,
  ConfirmDialog,
  Paragraph,
  ProgressStep,
  ProgressStepper,
  Stepper,
  TableRow,
  TextArea,
  TextButton,
  Tooltip,
} from '@toss/tds-mobile';
import { adaptive } from '@toss/tds-colors';
import {
  Answer,
  DecisionChange,
  STATUS_DESC,
  STATUS_FLOW,
  STATUS_LABEL,
  isAiChat,
  isAiFound,
  isNewDecision,
  formatWhen,
  isPending,
  relTime,
  reviewStatus,
  taskNo,
  taskOwner,
  taskTitle,
} from './data';
import { ANSWER_COLOR, ANSWER_NEEDED, AUTO_CLOSED_NOTICE, REAPPLY_HINT, STANDALONE } from './copy';
import { BlueFillChipWeight, Chip, IconDecision, IconEdit, IconIssue, IconSparkle, IssueFilterChip } from './design';

type ReplyMode = 'none' | 'question' | 'request';

/**
 * CLI 탭의 "Agent Context" 영역 표시 여부.
 * 데이터 시트(화면에 들어가는 데이터.md, CLI-동작-시험.md)에 없는 항목이라 숨겨 두었어요. 다시 쓰려면 true로 바꾸면 돼요.
 * (기존 탭은 이 값과 상관없이 그대로 보여요)
 */
const SHOW_AGENT_CONTEXT_IN_CLI = false;

/**
 * CLI 탭의 "이전 결정 · 되돌릴 수 있는 변경" 영역(현재 결정 · 변경일 · 변경 전 표, 이전 결정 보기 / 이전 상태로 되돌리기 버튼) 표시 여부.
 * 일단 숨겨 두었어요. 다시 보여주려면 true로 바꾸면 돼요. (기존 탭은 이 값과 상관없이 그대로 보여요)
 */
const SHOW_ROLLBACK_IN_CLI = false;

/** 섹션 제목 (15px 굵게) + 선택 설명 (13px) */
/**
 * 같은 크기의 타이틀(15px 굵게) / 서브 타이틀(13px) 사이 간격은 모두 이 값으로 맞춰요. (예: "현재 상태" / "지금 해야 할 일")
 * 칩이 붙은 제목("대기", "AI 대화에서 바꿈" 등)과 그 아래 메타 줄은 이 규칙에서 제외예요.
 */
const TITLE_SUBTITLE_GAP = 6;

function SectionTitle({
  children,
  description,
  bottom = 12,
}: {
  children: string;
  description?: string;
  /** 이 블록 아래 여백(px) */
  bottom?: number;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: TITLE_SUBTITLE_GAP, margin: `32px 0 ${bottom}px` }}>
      <Paragraph.Text typography="t6" fontWeight="bold" color={adaptive.grey900}>
        {children}
      </Paragraph.Text>
      {description && (
        <Paragraph.Text typography="t7" color={adaptive.grey600}>
          {description}
        </Paragraph.Text>
      )}
    </div>
  );
}

/** 변경 전 / 변경 후 박스 */
function ValueBox({ label, value, after, tag }: { label: string; value: string; after?: boolean; tag?: React.ReactNode }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        padding: '22px 20px',
        borderRadius: 10,
        background: after ? adaptive.blue50 : adaptive.grey50,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      {tag ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Paragraph.Text typography="st12" color={after ? adaptive.blue700 : adaptive.grey600}>
            {label}
          </Paragraph.Text>
          {tag}
        </div>
      ) : (
        <Paragraph.Text typography="st12" color={after ? adaptive.blue700 : adaptive.grey600}>
          {label}
        </Paragraph.Text>
      )}
      <Paragraph.Text typography="st11" fontWeight="medium" color={adaptive.grey900}>
        {value}
      </Paragraph.Text>
    </div>
  );
}

/* ───────── CLI 탭 전용 조각 (화면에 들어가는 데이터.md) ───────── */

/** 이슈 → 결정 사항 카드: 이슈(결정이 필요한 과제)와 결정 사항(확정된 결과)을 한 카드에 보여줘요 */
function DecisionIssueCard({ change }: { change: DecisionChange }) {
  // 아이콘 · "이슈 | 결정이 필요한 과제" (한 줄) · 내용 (다음 줄)
  const row = (icon: React.ReactNode, label: string, desc: string, content: string, extra?: React.ReactNode, last?: boolean) => (
    <div
      style={{
        padding: '20px 0',
        borderBottom: last ? 'none' : `1px solid ${adaptive.grey100}`,
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
      }}
    >
      {icon}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', whiteSpace: 'nowrap' }}>
          <Paragraph.Text typography="t7" fontWeight="bold" color={adaptive.grey900}>
            {label}
          </Paragraph.Text>
          <Paragraph.Text typography="t7" color={adaptive.grey400}>
            |
          </Paragraph.Text>
          <Paragraph.Text typography="t7" color={adaptive.grey600}>
            {desc}
          </Paragraph.Text>
          {extra}
        </div>
        <Paragraph.Text typography="st10" fontWeight="medium" color={adaptive.grey900}>
          {content}
        </Paragraph.Text>
      </div>
    </div>
  );
  return (
    <div
      style={{
        marginTop: 20,
        border: `1px solid ${adaptive.grey200}`,
        borderRadius: 16,
        padding: '0 22px',
        background: adaptive.background,
      }}
    >
      {change.issueTitle &&
        row(
          <IconIssue />,
          '이슈',
          '결정이 필요한 과제',
          change.issueTitle,
          change.issueStatus === '완료' ? <Chip inline tone="green">이슈 완료</Chip> : undefined
        )}
      {row(<IconDecision />, '결정 사항', '확정된 결과', change.title, undefined, true)}
    </div>
  );
}

/** 이전 값이 없는 새 결정: 변경 전/후로 나누지 않고 파란 카드 하나로 보여줘요 */
function NewDecisionCard({ value }: { value: string }) {
  return (
    <div
      style={{
        flex: 1,
        padding: '22px 20px',
        borderRadius: 10,
        background: adaptive.blue50,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <Paragraph.Text typography="st12" color={adaptive.blue700}>
        새로 생긴 결정
      </Paragraph.Text>
      <Paragraph.Text typography="st11" fontWeight="medium" color={adaptive.grey900}>
        {value}
      </Paragraph.Text>
    </div>
  );
}

/** 답하기: 관계있다/관계없다 → (관계있다) 알았다/몰랐다 · (관계없다) 관계없는 이유 */
function RelationFlow({
  change,
  onAnswer,
  onNext,
}: {
  change: DecisionChange;
  onAnswer: (a: Omit<Answer, 'at'>) => void;
  /** 있으면 답변 박스 오른쪽 아래에 "다음 변경"을 보여줘요 */
  onNext?: () => void;
}) {
  const [relation, setRelation] = useState<'관계있다' | '관계없다' | null>(null);
  const [reason, setReason] = useState('');
  /** 이미 한 답을 고치는 중인지 */
  const [editing, setEditing] = useState(false);
  const answered = change.answer;

  const startEdit = () => {
    setRelation(answered?.relation ?? null);
    setReason(answered?.reason ?? '');
    setEditing(true);
  };
  const submit = (a: Omit<Answer, 'at'>) => {
    onAnswer(a);
    setEditing(false);
  };

  const question = (text: string) => (
    <div style={{ margin: '16px 0 8px' }}>
      <Paragraph.Text typography="t7" fontWeight="bold" color={adaptive.grey700}>
        {text}
      </Paragraph.Text>
    </div>
  );

  if (answered && !editing) {
    return (
      <div style={{ marginTop: 16, background: adaptive.grey50, borderRadius: 10, padding: '18px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {/* "새 결정 사항" / "AI 대화에서 바꿈" 칩과 같은 크기·색(파란 채움, 흰 글자) */}
          <Chip tone="blueFill">답함</Chip>
          <Chip tone="blueFill">{answered.relation}</Chip>
          {answered.awareness && <Chip tone="blueFill">{answered.awareness}</Chip>}
        </div>
        {answered.reason && (
          <div style={{ marginTop: 10 }}>
            <Paragraph.Text typography="t7" color={adaptive.grey800}>
              {answered.reason}
            </Paragraph.Text>
          </div>
        )}
        {/* 아래 줄: 왼쪽 "답한 시각", 오른쪽 "다음 변경". 둘 다 맨 아래 선에 맞추고, 오른쪽 여백은 박스 왼쪽 여백(20px)과 같아요. */}
        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }}>
          <Paragraph.Text typography="st12" color={adaptive.grey500}>
            {`답한 시각 ${formatWhen(answered.at)}`}
          </Paragraph.Text>
          {/* 오른쪽: 수정 · 다음 변경 › 를 나란히. 글자 크기는 둘 다 13px, 색은 각자 그대로(수정 파랑 / 다음 변경 진한 회색) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {/* 글자 "수정" 대신 연필 아이콘(파랑 20px). 스크린 리더에는 "답변 수정"으로 읽혀요. */}
            <button
              type="button"
              aria-label="답변 수정"
              onClick={startEdit}
              style={{ display: 'inline-flex', alignItems: 'center', border: 0, background: 'none', padding: 0, cursor: 'pointer', color: adaptive.blue500 }}
            >
              <IconEdit />
            </button>
            {onNext && (
              <>
                <span aria-hidden style={{ color: adaptive.grey400, fontSize: 13 }}>·</span>
                <TextButton size="medium" variant="arrow" onClick={onNext}>
                  <span style={{ fontSize: 13, fontWeight: 400, color: adaptive.grey900 }}>다음 변경</span>
                </TextButton>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {question('이 변경이 내 작업과 관계있나요?')}
      <div style={{ display: 'flex', gap: 8 }}>
        {(['관계있다', '관계없다'] as const).map((v) => (
          <Button
            key={v}
            size="large"
            display="block"
            // 선택된 버튼은 기존 파랑(fill) 그대로, 선택 안 된 버튼은 기존 light weak에 배경만 아주 살짝 진하게예요.
            color={relation === v ? 'primary' : 'light'}
            variant={relation === v ? 'fill' : 'weak'}
            style={relation === v ? FILL_CTA_STYLE : LIGHT_CTA_STYLE}
            onClick={() => setRelation(v)}
          >
            {v}
          </Button>
        ))}
      </div>

      {relation === '관계있다' && (
        <>
          {question('이 변경을 미리 알고 있었나요?')}
          <div style={{ display: 'flex', gap: 8 }}>
            {(['알았다', '몰랐다'] as const).map((v) => (
              <Button
                key={v}
                size="large"
                display="block"
                // 답을 고치는 중이면 지금 답이 파랑으로 보여요
                color={editing && answered?.awareness === v && answered.relation === '관계있다' ? 'primary' : 'light'}
                variant={editing && answered?.awareness === v && answered.relation === '관계있다' ? 'fill' : 'weak'}
                style={editing && answered?.awareness === v && answered.relation === '관계있다' ? FILL_CTA_STYLE : LIGHT_CTA_STYLE}
                onClick={() => submit({ relation: '관계있다', awareness: v })}
              >
                {v}
              </Button>
            ))}
          </div>
        </>
      )}

      {relation === '관계없다' && (
        <div style={{ marginTop: 16 }}>
          {/* TextArea는 좌우에 20px 바깥 여백이 있어서, 그만큼 당겨서 위 버튼 줄과 시작·끝을 맞춰요 */}
          <div style={{ margin: '0 -20px' }}>
          <TextArea
            variant="box"
            label="관계없는 이유"
            labelOption="sustain"
            placeholder="예: 터미널 화면만 다루는 작업이라 관계없음"
            minHeight={96}
            maxLength={100}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <Paragraph.Text typography="st12" color={adaptive.grey500}>
              {`${reason.length}/100`}
            </Paragraph.Text>
            <Button
              size="medium"
              disabled={!reason.trim()}
              onClick={() => submit({ relation: '관계없다', reason: reason.trim() })}
            >
              {editing ? '수정 완료' : '답하기'}
            </Button>
          </div>
        </div>
      )}

      {editing && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
          <TextButton size="medium" color={adaptive.grey600} onClick={() => setEditing(false)}>
            <span style={{ fontSize: 13 }}>수정 취소</span>
          </TextButton>
        </div>
      )}
    </div>
  );
}

/**
 * 상세 화면 맨 위 줄: "목록으로" + 이 담당자에게 온 변경을 `#번호` 배지로 보여줘요.
 * - 제목을 넣으면 길어서 잘리니 이슈 번호만 보여주고, 자세한 제목·상태는 마우스를 올리면 말풍선으로 나와요.
 * - 변경이 많아지면 줄바꿈하지 않고 한 줄 그대로 두고, 넘친 부분은 가로 스크롤로 볼 수 있어요.
 * - 빨간 점은 아직 답하지 않은 변경이에요.
 */
function PeerBar({
  peers,
  currentId,
  onSelect,
  onBack,
}: {
  peers: DecisionChange[];
  currentId: string;
  onSelect: (id: string) => void;
  onBack: () => void;
}) {
  // 같은 이슈 번호의 버전들은 칩 하나로 묶고, 버전은 아래 탭으로 오가요.
  const groups: DecisionChange[][] = [];
  const index = new Map<number, number>();
  peers.forEach((p) => {
    const i = index.get(p.issueNo);
    if (i === undefined) {
      index.set(p.issueNo, groups.length);
      groups.push([p]);
    } else groups[i].push(p);
  });
  groups.forEach((g) => g.sort((a, b) => (b.version?.to ?? 0) - (a.version?.to ?? 0)));
  const current = groups.find((g) => g.some((p) => p.id === currentId));
  const versions = current && current.length > 1 ? current : null;

  return (
    <>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: versions ? 12 : 20, minWidth: 0 }}>
      <div style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
        <TextButton size="xsmall" color={adaptive.blue500} onClick={onBack}>
          ‹ 목록으로
        </TextButton>
      </div>
      <div style={{ width: 1, height: 20, background: adaptive.grey200, flexShrink: 0 }} />
      <div
        role="tablist"
        aria-label="내게 온 변경"
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexWrap: 'nowrap',
          gap: 8,
          overflowX: 'auto',
          // 빨간 점이 배지 밖으로 나와 있어서, 스크롤 영역에서 잘리지 않게 위·오른쪽에 여백을 줘요.
          padding: '6px 8px 4px 0',
        }}
      >
        {groups.map((g) => {
          const head = g[0];
          const selected = g.some((p) => p.id === currentId);
          const pending = g.some((p) => isPending(p));
          // 칩을 누르면 지금 확인할 버전(없으면 최신 버전)을 열어요.
          const target = g.find((p) => isPending(p)) ?? head;
          return (
            <Tooltip key={head.issueNo} size="small" placement="bottom" openOnHover message={`${head.title} · ${reviewStatus(head)}`}>
              <button
                type="button"
                role="tab"
                aria-selected={selected}
                aria-label={`이슈 #${head.issueNo} ${head.title} (${reviewStatus(head)})`}
                onClick={() => !selected && onSelect(target.id)}
                style={{
                  position: 'relative',
                  flexShrink: 0,
                  display: 'inline-flex',
                  border: 0,
                  background: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  lineHeight: 0,
                }}
              >
                <IssueFilterChip active={selected}>{`이슈 #${head.issueNo}`}</IssueFilterChip>
                {pending && (
                  <span
                    aria-hidden
                    style={{
                      // 점 중심이 알약 칩의 우측 상단 곡선(반지름 17.75의 45° 지점)을 정확히 지나가게 놓아요.
                      // 그 지점은 칩의 위·오른쪽 끝에서 17.75 × (1 − cos45°) ≈ 5.2px 안쪽이고, 점 지름이 10px이라 0.2px씩 띄워요.
                      // 사이드바 알림 배지처럼 흰 테두리는 없어요.
                      position: 'absolute',
                      top: 0.2,
                      right: 0.2,
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      background: adaptive.red500,
                    }}
                  />
                )}
              </button>
            </Tooltip>
          );
        })}
      </div>
    </div>
    {/* 한 이슈에 버전이 여러 개면, 그 안에서 버전별로 페이지를 나눠서 볼 수 있어요 */}
    {versions && (
      <div role="tablist" aria-label="이 이슈의 버전" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <Paragraph.Text typography="st12" color={adaptive.grey500}>
          버전
        </Paragraph.Text>
        {versions.map((p) => {
          const active = p.id === currentId;
          return (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={`v${p.version?.to ?? ''} (${reviewStatus(p)})`}
              onClick={() => !active && onSelect(p.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                border: 0,
                cursor: 'pointer',
                padding: '6px 12px',
                borderRadius: 999,
                background: active ? adaptive.blue50 : adaptive.grey100,
                lineHeight: 1,
              }}
            >
              <Paragraph.Text typography="st12" fontWeight={active ? 'bold' : 'medium'} color={active ? adaptive.blue700 : adaptive.grey600}>
                {`v${p.version?.to ?? ''}`}
              </Paragraph.Text>
            </button>
          );
        })}
      </div>
    )}
    </>
  );
}

/**
 * 현재 상태 (간결형). 단계 설명은 현재 단계 이름 바로 아래에 서브 타이틀처럼 붙여서 보여줘요.
 * 단계 이름의 실제 위치를 재서 그 아래 가운데에 맞추고, 양 끝 단계에서는 화면 밖으로 나가지 않게 안쪽으로 밀어요.
 */
function StatusProgress({ currentIdx, description }: { currentIdx: number; description: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const descRef = useRef<HTMLSpanElement>(null);
  const [left, setLeft] = useState<number | null>(null);
  const label = STATUS_LABEL[STATUS_FLOW[currentIdx]];

  useLayoutEffect(() => {
    const measure = () => {
      const wrap = wrapRef.current;
      const desc = descRef.current;
      if (!wrap || !desc) return;
      // 단계 이름 글자 굵기: TDS 기본(현재 700 / 나머지 600)보다 두 단계 얇게 (현재 500 / 나머지 400)
      STATUS_FLOW.forEach((st) => {
        const el = [...wrap.querySelectorAll('*')].find(
          (e) => e.children.length === 0 && e.textContent?.trim() === STATUS_LABEL[st]
        ) as HTMLElement | undefined;
        if (el) el.style.fontWeight = st === STATUS_FLOW[currentIdx] ? '500' : '400';
      });
      const labelEl = [...wrap.querySelectorAll('*')].find((e) => e.children.length === 0 && e.textContent?.trim() === label);
      if (!labelEl) return;
      const w = wrap.getBoundingClientRect();
      const l = labelEl.getBoundingClientRect();
      const cx = l.left + l.width / 2 - w.left;
      const half = desc.offsetWidth / 2;
      setLeft(Math.max(0, Math.min(cx - half, w.width - desc.offsetWidth)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [currentIdx, label, description]);

  return (
    <div ref={wrapRef}>
      <ProgressStepper variant="compact" paddingTop="wide" activeStepIndex={currentIdx}>
        {STATUS_FLOW.map((st) => (
          <ProgressStep key={st} title={STATUS_LABEL[st]} />
        ))}
      </ProgressStepper>
      <div style={{ position: 'relative', height: 20, marginTop: 6 }}>
        <span
          ref={descRef}
          style={{
            position: 'absolute',
            top: 0,
            left: left ?? 0,
            whiteSpace: 'nowrap',
            visibility: left === null ? 'hidden' : 'visible',
          }}
        >
          <Paragraph.Text typography="st12" color={adaptive.grey600}>
            {description}
          </Paragraph.Text>
        </span>
      </div>
    </div>
  );
}

/** 아이콘형 단계 표시(variant="icon")는 지금은 숨겨 뒀어요. 다시 쓰려면 true로 바꾸면 돼요. */
const SHOW_ICON_STEPPER = false;

/**
 * "관계있나요 / 알았나요" 선택 버튼.
 * - 선택 안 된 버튼: 처음 모양(TDS light weak, 배경 rgba(222,222,255,0.19))에서 아주 살짝만 진하게(0.30), 글자는 흰색.
 * - 글자 크기는 위 질문(13px)보다 커 보이지 않게 TDS 기본(17px)에서 15px로 줄였어요. 선택된 버튼도 같은 크기예요.
 */
const CTA_FONT_SIZE = '15px';
const LIGHT_CTA_STYLE = {
  '--button-background-color': 'rgba(222, 222, 255, 0.30)',
  '--button-color': '#FFFFFF',
  '--button-font-size': CTA_FONT_SIZE,
} as React.CSSProperties;
const FILL_CTA_STYLE = { '--button-font-size': CTA_FONT_SIZE } as React.CSSProperties;

const COLS = '103px minmax(150px, 312px) minmax(80px, 172px) minmax(150px, 1fr)';
/**
 * CLI 탭 작업 표: 이름 칸이 남는 폭을 모두 채우고(1fr), 담당 · 처리 상태는 오른쪽으로 밀려나요.
 * 처리 상태 칸은 칩이 2개까지 한 줄에 놓이는 폭(172px)으로 고정하고, 3개째부터는 줄바꿈으로 아래에 내려가요.
 */
const COLS_CLI = '103px minmax(150px, 1fr) 100px 172px';

export function Detail({
  change,
  total,
  onAcknowledge,
  onReply,
  onTaskToggle,
  doneTasks,
  onRollback,
  onNext,
  onOpenIssue,
  onBack,
  onAnswer,
  variant = 'default',
  peers,
  onPeerSelect,
  autoClosedNotice,
}: {
  /** 대체 버전: 상세를 보는 중에 원래 값으로 돌아와 자동으로 닫혔을 때 한 줄 안내를 띄워요 */
  autoClosedNotice?: boolean;
  /** CLI 탭: 이 담당자에게 온 변경 목록 (상세 위쪽 탭으로 보여줘요) */
  peers?: DecisionChange[];
  onPeerSelect?: (id: string) => void;
  /** CLI 탭: 화면에 들어가는 데이터.md의 표현과 답하기 흐름을 써요 */
  variant?: 'default' | 'cli';
  onAnswer?: (a: Omit<Answer, 'at'>) => void;
  change: DecisionChange;
  total: number;
  onAcknowledge: () => void;
  onReply: (kind: 'question' | 'request', text: string) => void;
  onTaskToggle: (name: string, checked: boolean) => void;
  doneTasks: Set<string>;
  onRollback: () => void;
  onNext: () => void;
  onOpenIssue: (issueNo: number, version?: number) => void;
  onBack: () => void;
}) {
  const [mode, setMode] = useState<ReplyMode>('none');
  const [text, setText] = useState('');
  const [showPrev, setShowPrev] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const cli = variant === 'cli';

  const acked = !isPending(change);
  // 새 버전으로 대체된 건: 기존 자동 닫힘(autoClosed) 또는 확정안 1의 대체됨(supersededBy)
  const byIssueNo = change.autoClosed?.byIssueNo ?? change.supersededBy?.issueNo;
  const closed = byIssueNo !== undefined;
  // 확정안 2: 상세를 보던 중에 원래 값으로 돌아와 자동으로 닫힌 경우
  const showNotice = cli && !!(autoClosedNotice || change.hiddenClosed);
  const currentIdx = STATUS_FLOW.indexOf(change.status);
  const ai = isAiFound(change);
  const fresh = isNewDecision(change);

  const who = ai ? `PR #${change.pr?.number}에서 AI가 찾음` : change.author;
  const evidence = ai
    ? `PR #${change.pr?.number} 「${change.pr?.title}」`
    : change.evidence ?? ([...change.relatedFiles, ...change.relatedCode].join(', ') || '근거 없음');

  const submit = () => {
    if (mode === 'none' || !text.trim()) return;
    onReply(mode, text.trim());
    setText('');
    setMode('none');
  };

  return (
    <BlueFillChipWeight.Provider value={cli ? 500 : undefined}>
    <div style={{ padding: '36px 35px 56px' }}>
      {cli && peers && onPeerSelect && (
        <PeerBar peers={peers} currentId={change.id} onSelect={onPeerSelect} onBack={onBack} />
      )}

      {/* 확정안 2: 상세를 보는 중에 자동으로 닫히면 말없이 사라지지 않게 한 줄로 알려줘요 */}
      {showNotice && (
        <div
          role="status"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 20,
            padding: '12px 16px',
            borderRadius: 10,
            background: '#F0F6FF',
            border: `1px solid ${adaptive.blue100}`,
          }}
        >
          <Paragraph.Text typography="t7" fontWeight="medium" color={adaptive.grey800}>
            {AUTO_CLOSED_NOTICE}
          </Paragraph.Text>
          <TextButton size="xsmall" color={adaptive.blue500} onClick={onBack}>
            목록으로
          </TextButton>
        </div>
      )}

      {/* 제목 + 칩 + 목록으로 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minWidth: 0 }}>
          <Paragraph.Text typography="t5" fontWeight="bold" color={adaptive.grey900}>
            {cli ? change.title : (change.decisionKey ?? change.title)}
          </Paragraph.Text>
          {/* CLI 탭은 위 변경 목록에 이슈 칩이 있어서 제목 옆에는 따로 두지 않아요 */}
          {!cli && <Chip tone="gray">{`#${change.issueNo}`}</Chip>}
          {cli ? (
            <>
              {/* 대체 버전: 답해야 하는 변경은 "대기" 칩 대신 제목 아래의 주황 안내로 알려요 */}
              {!(STANDALONE && reviewStatus(change) === '대기') && (
                <Chip inline tone={reviewStatus(change) === '대기' ? 'orange' : reviewStatus(change) === '답함' ? 'green' : 'gray'}>
                  {reviewStatus(change)}
                </Chip>
              )}
              {fresh && (
                <Chip inline tone={STANDALONE ? 'blue' : 'blueFill'}>
                  새 결정 사항
                </Chip>
              )}
              {change.revertedTo && <Chip inline tone="purple">되돌림</Chip>}
              {change.isNewVersion && change.version && <Chip inline tone="blue">{`새 버전 v${change.version.to}`}</Chip>}
              {change.source === 'code' ? (
                <Chip inline tone="gray">코드에서 바꿈</Chip>
              ) : (
                <Chip inline tone="ai" icon={<IconSparkle />}>
                  AI 대화에서 바꿈
                </Chip>
              )}
              {change.foundByAi && <Chip inline tone="gray">PR에서 찾음</Chip>}
              {change.issueStatus === '완료' && <Chip inline tone="green">이슈 완료</Chip>}
            </>
          ) : (
            <>
          {change.version && (
            <Chip tone="gray">
              {change.version.from === null ? `v${change.version.to}` : `v${change.version.from} → v${change.version.to}`}
            </Chip>
          )}
          {change.kindLabel && (
            <Chip tone={change.kindLabel === '지속되는 제약 조건' ? 'green' : 'blue'}>{change.kindLabel}</Chip>
          )}
          {closed ? (
            <Chip tone="gray">자동 닫힘</Chip>
          ) : (
            <Chip tone={fresh ? 'blueFill' : 'orange'}>{fresh ? '신규' : change.decisionState}</Chip>
          )}
          {ai && (
            <Chip tone="ai" icon={<IconSparkle />}>
              AI가 PR에서 찾음
            </Chip>
          )}
          {isAiChat(change) && (
            <Chip tone="ai" icon={<IconSparkle />}>
              AI 대화에서 바꿈
            </Chip>
          )}
          {!closed && (
            <Chip tone={acked ? 'green' : 'orange'}>
              {change.processing ? '◐ 반영 중' : acked ? (change.status === 'ACKNOWLEDGED' ? '✓ 확인 완료' : '✓ 반영 완료') : '● 확인 필요'}
            </Chip>
          )}
            </>
          )}
        </div>
        {!(cli && peers) && (
          <div style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
            <TextButton size="xsmall" color={adaptive.blue500} onClick={onBack}>
              목록으로
            </TextButton>
          </div>
        )}
      </div>

      {/* 답해야 하는 변경: 제목 아래 주황 강조 (대체 버전 · CLI 탭) */}
      {STANDALONE && cli && reviewStatus(change) === '대기' && !showNotice && (
        <div style={{ marginTop: 12 }}>
          <div
            role="note"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 16px',
              borderRadius: 12,
              background: ANSWER_COLOR,
              color: '#FFFFFF',
            }}
          >
            <IconEdit size={16} />
            <span style={{ fontSize: 14, fontWeight: 500, lineHeight: '21px' }}>{ANSWER_NEEDED}</span>
          </div>
        </div>
      )}

      {/* 누가 · 언제 · 근거 */}
      <div style={{ marginTop: 14 }}>
        <Paragraph.Text typography="t7" color={adaptive.grey600}>
          {cli
            ? `${change.author} · ${formatWhen(change.timestamp)} · 근거: ${evidence}${change.decisionKey ? ` · 결정 사항 ID ${change.decisionKey}` : ''}`
            : `${who} · ${relTime(change.timestamp)} · ${change.changedAt} · 근거: ${evidence}`}
        </Paragraph.Text>
      </div>

      {/* 안내 박스: 자동 닫힘 / AI 출처 */}
      {closed && (
        <div style={{ background: adaptive.grey50, borderRadius: 10, padding: '18px 20px', marginTop: 20 }}>
          <Paragraph.Text typography="t6" fontWeight="bold" color={adaptive.grey800}>
            {change.supersededBy ? (change.supersededBy.version ? `새 버전(v${change.supersededBy.version})으로 대체됐어요` : `새 버전(#${byIssueNo})으로 대체됐어요`) :`새 버전(#${byIssueNo})으로 대체되어 자동으로 닫혔어요`}
          </Paragraph.Text>
          <div style={{ marginTop: 4 }}>
            <Paragraph.Text typography="t7" color={adaptive.grey600}>
              답하기 전에 결정이 또 바뀌었어요. 이 변경에는 답하지 않아도 되고, 새 버전을 확인해주세요.
            </Paragraph.Text>
          </div>
        </div>
      )}
      {ai && (
        <div style={{ background: adaptive.blue50, borderRadius: 10, padding: '18px 20px', marginTop: 20 }}>
          <Paragraph.Text typography="t6" fontWeight="bold" color={adaptive.grey800}>
            {`PR #${change.pr?.number}에서 AI가 찾아낸 결정이에요`}
          </Paragraph.Text>
          <div style={{ marginTop: 4 }}>
            <Paragraph.Text typography="t7" color={adaptive.grey600}>
              사람이 정한 결정이 아닐 수 있어요. 내용이 맞는지 확인해주세요.
            </Paragraph.Text>
          </div>
        </div>
      )}

      {/* 결정 사항 / 이슈 (CLI 탭) */}
      {cli && <DecisionIssueCard change={change} />}

      {/* 변경 전 / 변경 후 (이전 값이 없는 새 결정은 카드 하나만) */}
      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        {cli && fresh ? (
          <NewDecisionCard value={change.after} />
        ) : (
          <>
            <ValueBox label="변경 전" value={change.before ?? '이전 값이 없어요 · 새로 생긴 결정이에요'} />
            <ValueBox label="변경 후" value={change.after} after tag={change.revertedTo ? <Chip inline tone="purple">되돌림</Chip> : undefined} />
          </>
        )}
      </div>

      {/* 바뀐 이유 */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 20 }}>
        <div style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
          <Paragraph.Text typography="t7" color={adaptive.grey500}>
            바뀐 이유
          </Paragraph.Text>
        </div>
        <Paragraph.Text typography="t7" color={adaptive.grey800}>
          {change.reason}
        </Paragraph.Text>
      </div>

      {/* 영향받는 작업 표 */}
      <div
        style={{
          marginTop: 20,
          border: `1px solid ${adaptive.grey200}`,
          borderRadius: 10,
          overflowX: 'auto',
          background: adaptive.background,
        }}
      >
        <div style={{ minWidth: 640 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: cli ? COLS_CLI : COLS,
            alignItems: 'center',
            height: 40,
            padding: '0 12px',
            background: adaptive.grey50,
          }}
        >
          {['작업', '이름', '담당', '처리 상태'].map((h) => (
            <Paragraph.Text key={h} typography="t7" color={adaptive.grey600}>
              {h}
            </Paragraph.Text>
          ))}
        </div>
        {change.affectedTasks.map((t, i) => {
          if (cli && t.state === 'auto-closed') return null; // 자동 닫힘은 화면에 나오지 않아요
          // CLI 작업은 "완료된 작업"(completed)과 체크가 같은 값이에요. 완료된 작업은 파란 체크로 보이고,
          // 체크하면 "완료된 작업" 칩이 붙고, 체크를 풀면(다시 열기) 칩이 사라져요.
          const checked = t.state ? !!t.completed : doneTasks.has(`${change.id}:${t.name}`);
          return (
            <div
              key={t.name}
              style={{
                display: 'grid',
                gridTemplateColumns: cli ? COLS_CLI : COLS,
                alignItems: 'center',
                minHeight: 45,
                padding: '0 12px',
                borderTop: `1px solid ${adaptive.grey200}`,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {!closed && (
                  <Checkbox.Line
                    size={20}
                    checked={checked}
                    disabled={!acked}
                    onCheckedChange={(v) => onTaskToggle(t.name, v)}
                  />
                )}
                <Paragraph.Text typography="t7" fontWeight="bold" color={adaptive.grey900}>
                  {taskNo(change, i)}
                </Paragraph.Text>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', padding: '10px 0' }}>
                <Paragraph.Text typography="t7" color={adaptive.grey900}>
                  {taskTitle(t)}
                </Paragraph.Text>
                <Paragraph.Text typography="st12" color={adaptive.grey500}>
                  {t.action}
                </Paragraph.Text>
              </div>
              <Paragraph.Text typography="t7" color={adaptive.grey900}>
                {taskOwner(t)}
              </Paragraph.Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                {t.state ? (
                  // CLI 시험 데이터: 담당자가 실제로 한 답을 그대로 보여줘요.
                  <>
                    {t.state === 'pending' && <Chip tone="orange">{cli ? '대기' : '확인 대기'}</Chip>}
                    {t.state === 'accepted' && <Chip tone="blue">{cli ? '관계있다' : '수락'}</Chip>}
                    {t.state === 'rejected' && <Chip tone="gray">{cli ? '관계없다' : '영향 없음 (거절)'}</Chip>}
                    {t.state === 'auto-closed' && <Chip tone="gray">자동 닫힘</Chip>}
                    {t.awareness && (
                      <Chip tone={t.awareness === '몰랐음' ? 'orange' : 'gray'}>
                        {cli ? (t.awareness === '몰랐음' ? '몰랐다' : '알았다') : t.awareness}
                      </Chip>
                    )}
                    {t.completed && <Chip tone="gray">완료된 작업</Chip>}
                  </>
                ) : closed ? (
                  <Chip tone="gray">대기 안 함</Chip>
                ) : acked ? (
                  <>
                    <Chip tone="blue">수락</Chip>
                    {checked && <Chip tone="green">처리 완료</Chip>}
                  </>
                ) : (
                  <Chip tone="orange">확인 대기</Chip>
                )}
                {t.certainty === 'inferred' && (
                  <Tooltip size="small" openOnHover message="AI가 추론한 내용이에요. 실제 작업 상태를 확인해주세요.">
                    <Chip tone="gray">AI 추론</Chip>
                  </Tooltip>
                )}
              </div>
            </div>
          );
        })}
        </div>
      </div>
      {!acked && !closed && (
        <div style={{ marginTop: 8 }}>
          <Paragraph.Text typography="st12" color={adaptive.grey500}>
            {cli ? '먼저 이 변경에 답하면 작업 처리를 체크할 수 있어요.' : '먼저 변경 내용을 확인했다고 답하면 작업 처리를 체크할 수 있어요.'}
          </Paragraph.Text>
        </div>
      )}

      {/* Agent Context (CLI 탭에서는 SHOW_AGENT_CONTEXT_IN_CLI가 true일 때만 보여요) */}
      {(!cli || SHOW_AGENT_CONTEXT_IN_CLI) && (
        <>
          <SectionTitle>Agent Context</SectionTitle>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {change.affectedAgents.map((a) => (
              <Chip key={a.name} tone={a.upToDate ? 'green' : 'orange'}>
                {`${a.name} · ${a.upToDate ? '최신 상태' : 'Context outdated'}`}
              </Chip>
            ))}
          </div>
        </>
      )}

      {/* 지금 해야 할 일 + 답하기 */}
      {showNotice ? null : cli && change.answer ? (
        // 답한 뒤에는 "지금 해야 할 일" 대신 "내 답변"(아래 박스에 답함 · 관계 · 알았나 · 답한 시각)만 보여줘요.
        <SectionTitle bottom={0}>내 답변</SectionTitle>
      ) : cli ? (
        // "현재 상태"와 같은 타이틀 / 서브 타이틀(13px, grey600) 블록이라 간격도 같아요. 아래 여백은 0으로 두어 기존 간격(질문까지 16px)을 유지해요.
        <SectionTitle description={change.recommendedAction} bottom={0}>
          지금 해야 할 일
        </SectionTitle>
      ) : (
        <>
          <SectionTitle>지금 해야 할 일</SectionTitle>
          <Paragraph.Text typography="t6" fontWeight="semibold" color={adaptive.grey800}>
            {change.recommendedAction}
          </Paragraph.Text>
        </>
      )}

      {showNotice ? null : closed ? (
        <div style={{ marginTop: 16 }}>
          <Button size="large" display="block" onClick={() => onOpenIssue(byIssueNo!, change.supersededBy?.version)}>
            {change.supersededBy?.version ? `새 버전 v${change.supersededBy.version} 보러 가기` : `새 버전 #${byIssueNo} 보러 가기`}
          </Button>
        </div>
      ) : cli ? (
        <>
          {/* 확정안 3 · 4: 이전 버전에 "관계있다"로 답했던 사람에게만 붙여요 */}
          {change.previousAnswer?.relation === '관계있다' && !change.answer && (
            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: adaptive.grey100 }}>
              <Paragraph.Text typography="t7" color={adaptive.grey700}>
                {REAPPLY_HINT}
              </Paragraph.Text>
            </div>
          )}
          <RelationFlow
          key={change.id}
          change={change}
          onAnswer={(a) => onAnswer?.(a)}
          onNext={acked && total > 1 ? onNext : undefined}
          />
        </>
      ) : (
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <Button size="large" display="block" color="primary" disabled={acked} onClick={onAcknowledge}>
            {acked ? '확인했습니다 ✓' : '확인했습니다'}
          </Button>
          <Button
            size="large"
            display="block"
            color="light"
            variant="weak"
            onClick={() => setMode(mode === 'question' ? 'none' : 'question')}
          >
            질문하기
          </Button>
          <Button
            size="large"
            display="block"
            color="light"
            variant="weak"
            onClick={() => setMode(mode === 'request' ? 'none' : 'request')}
          >
            수정 요청
          </Button>
        </div>
      )}

      {mode !== 'none' && (
        <div style={{ marginTop: 12 }}>
          <TextArea
            variant="box"
            label={mode === 'question' ? '질문하기' : '수정 요청'}
            labelOption="sustain"
            placeholder={
              mode === 'question'
                ? '예: 이미 완료된 작업은 어떻게 하나요?'
                : '예: 작업이 거의 끝나서 기존 작업을 유지할지 확인이 필요해요.'
            }
            minHeight={96}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <Button size="medium" color="light" variant="weak" onClick={() => setMode('none')}>
              취소
            </Button>
            <Button size="medium" disabled={!text.trim()} onClick={submit}>
              보내기
            </Button>
          </div>
        </div>
      )}

      {!cli && change.responses.length > 0 && (
        <>
          <SectionTitle>내 답변</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {change.responses.map((r, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Paragraph.Text typography="t7" color={adaptive.grey900}>
                  {r.text}
                </Paragraph.Text>
                <Paragraph.Text typography="st12" color={adaptive.grey500}>
                  {`${r.kind === 'ack' ? '확인' : r.kind === 'question' ? '질문' : '수정 요청'} · ${r.at}`}
                </Paragraph.Text>
              </div>
            ))}
          </div>
        </>
      )}

      {!cli && acked && !closed && total > 1 && (
        <div style={{ marginTop: 12 }}>
          <TextButton size="medium" variant="arrow" onClick={onNext}>
            다음 변경
          </TextButton>
        </div>
      )}

      {/* 현재 상태 */}
      {!closed && (
        <>
          <SectionTitle description="변경이 어디까지 처리됐는지 단계별로 보여줘요." bottom={cli ? 20 : 12}>
            현재 상태
          </SectionTitle>
          {cli ? (
            <div>
              {SHOW_ICON_STEPPER && (
                <ProgressStepper variant="icon" checkForFinish paddingTop="wide" activeStepIndex={currentIdx}>
                  {STATUS_FLOW.map((st) => (
                    <ProgressStep key={st} title={STATUS_LABEL[st]} />
                  ))}
                </ProgressStepper>
              )}
              <StatusProgress currentIdx={currentIdx} description={STATUS_DESC[change.status]} />
            </div>
          ) : (
          <Stepper>
            {STATUS_FLOW.map((s, i) => (
              <Stepper.StepperRow
                key={s}
                left={<Stepper.NumberIcon number={(i + 1) as 1 | 2 | 3 | 4 | 5} />}
                center={
                  <Stepper.Texts
                    type="C"
                    title={i === currentIdx ? `${STATUS_LABEL[s]} (현재)` : STATUS_LABEL[s]}
                    description={STATUS_DESC[s]}
                  />
                }
                hideLine={i === STATUS_FLOW.length - 1}
              />
            ))}
          </Stepper>
          )}
        </>
      )}

      {/* 이전 결정 / 되돌리기 (CLI 탭에서는 SHOW_ROLLBACK_IN_CLI가 true일 때만 보여요) */}
      {(!cli || SHOW_ROLLBACK_IN_CLI) && (
        <>
      <SectionTitle>{change.rollbackAvailable ? '이전 결정 · 되돌릴 수 있는 변경' : '이전 결정 · 되돌릴 수 없는 변경'}</SectionTitle>
      <TableRow align="space-between" left="현재 결정" right={change.after} />
      <TableRow align="space-between" left="변경일" right={change.changedAt} />
      <TableRow align="space-between" left="변경 전" right={change.before ?? '없음 (새로 생긴 결정)'} />
      {showPrev && (
        <div style={{ marginTop: 8 }}>
          <Paragraph.Text typography="t7" color={adaptive.grey600}>
            {change.before === null
              ? '이전 결정은 없었어요. 되돌리면 이 결정이 사라지고 영향받는 작업이 이전 상태로 돌아가요.'
              : `이전 결정은 ‘${change.before}’이었어요. 되돌리면 관련 요구사항과 영향받는 작업이 다시 활성화돼요.`}
          </Paragraph.Text>
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <Button size="medium" color="light" variant="weak" onClick={() => setShowPrev((v) => !v)}>
          이전 결정 보기
        </Button>
        {change.rollbackAvailable && !change.rolledBack && !closed && (
          <Button size="medium" color="danger" variant="weak" onClick={() => setConfirmOpen(true)}>
            이전 상태로 되돌리기
          </Button>
        )}
      </div>
        </>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="이 변경을 되돌릴까요?"
        description="관련 요구사항과 영향받는 작업이 다시 활성화됩니다."
        onClose={() => setConfirmOpen(false)}
        cancelButton={<ConfirmDialog.CancelButton onClick={() => setConfirmOpen(false)}>취소</ConfirmDialog.CancelButton>}
        confirmButton={
          <ConfirmDialog.ConfirmButton
            color="danger"
            onClick={() => {
              setConfirmOpen(false);
              onRollback();
            }}
          >
            이전 상태로 되돌리기
          </ConfirmDialog.ConfirmButton>
        }
      />
    </div>
    </BlueFillChipWeight.Provider>
  );
}
