/** Decision Change (MD §9) */
export type Status = 'NEW' | 'VIEWED' | 'ACKNOWLEDGED' | 'ACTIONED' | 'RESOLVED';
export type Importance = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type Certainty = 'confirmed' | 'inferred'; // MD §19.5 확정 vs 추론
/** 결정 사항 자체의 상태 (내가 답했는지와는 별개) */
export type DecisionState = '확정' | '대체됨' | '검토 중' | '철회됨' | '신규';
/** 결정 사항을 누가 찾아냈는지: 사람이 바꾼 것 / PR에서 AI가 찾아낸 것 */
/** human: 사람이 바꿈 · pr-ai: PR에서 AI가 찾아냄 · ai-chat: CLI의 AI 대화에서 정해짐 */
export type Source = 'human' | 'pr-ai' | 'ai-chat' | 'code' | 'slack';

/** 영향받는 작업 하나에 대한 담당자의 답 (CLI 시험 데이터에서 써요) */
export type TaskState = 'pending' | 'accepted' | 'rejected' | 'auto-closed';

export interface AffectedTask {
  name: string;
  action: string;
  certainty: Certainty;
  /** 작업 번호(T-21) · 담당(백엔드). 없으면 목업 값을 만들어 써요 */
  no?: string;
  owner?: string;
  /** 담당자의 답. 없으면 변경 전체의 확인 여부로 보여줘요 */
  state?: TaskState;
  /** 수락했을 때 "이 변경을 미리 알고 있었나요?"에 대한 답 */
  awareness?: '몰랐음' | '이미 알고 있었음';
  /** 이미 완료된 작업이면 true (확인 대기 때문에 다시 열 수도 있어요) */
  completed?: boolean;
  /** 대체 버전: 담당자가 이 변경에 답한 뒤 실제 작업까지 끝냈으면 true (처리 상태 "작업 완료") */
  workDone?: boolean;
  /** 대체 버전: 내가 답한 뒤 작업이 어디까지 갔는지 (없으면 확인 완료) */
  progress?: TaskProgress;
}

/** 작업 진행 상태: 확인 완료(답한 직후 기본) → 작업 반영 → 처리 완료 */
export type TaskProgress = 'ack' | 'applied' | 'done';
export const PROGRESS_ORDER: TaskProgress[] = ['ack', 'applied', 'done'];
export const PROGRESS_LABEL: Record<TaskProgress, string> = { ack: '확인 완료', applied: '작업 반영', done: '처리 완료' };
export const taskProgress = (t: AffectedTask): TaskProgress => t.progress ?? (t.workDone ? 'done' : 'ack');

/** 답하기: 관계있다/관계없다 → (관계있다면) 알았다/몰랐다, (관계없다면) 이유 */
export interface Answer {
  relation: '관계있다' | '관계없다';
  awareness?: '알았다' | '몰랐다';
  reason?: string;
  at: number;
}

export interface Response {
  kind: 'ack' | 'question' | 'request';
  text: string;
  at: string;
}

export interface DecisionChange {
  id: string;
  issueNo: number;
  timestamp: number;
  author: string;
  title: string;
  summary: string;
  /** 이전 값. 새로 생긴 결정이면 null */
  before: string | null;
  after: string;
  reason: string;
  importance: Importance;
  decisionState: DecisionState;
  /** 기본은 사람이 바꾼 결정(human) */
  source?: Source;
  /** CLI 탭: AI가 PR에서 찾아낸 결정인지 (예일 때만 "PR에서 찾음" 표시) */
  foundByAi?: boolean;
  /** CLI 탭: 이슈 제목(길면 줄여서 보여줘요)과 이슈 상태(완료일 때만 표시) */
  issueTitle?: string;
  issueStatus?: '진행 중' | '완료';
  /** CLI 탭: 담당자가 한 답 (관계 → 알았나 / 관계없는 이유) */
  answer?: Answer;
  /** 결정 키 (예: SPEC-ORDER-DELIVERY-STATUS) */
  decisionKey?: string;
  /** 결정 버전 (v1 → v2). from이 null이면 처음 정해진 결정 */
  version?: { from: number | null; to: number };
  /** 결정 종류 (예: 지속되는 제약 조건 / 사양 변경) */
  kindLabel?: string;
  /** 이 결정 버전의 처리 현황 (예: 2/4) */
  processed?: { done: number; total: number };
  /** 근거 한 줄 (예: Figma 프레임, 디자이너 대화) */
  evidence?: string;
  /** source가 pr-ai일 때: AI가 결정을 찾아낸 PR */
  pr?: { number: number; title: string };
  /** 답하기 전에 결정이 또 바뀌어서 자동으로 닫힌 경우: 어떤 새 버전으로 대체됐는지 */
  autoClosed?: { byIssueNo: number; at: string };
  /**
   * 대체 버전 전용(확정안 1): 답 안 함 + 값이 또 바뀜 → 이전 건은 "대체됨"으로 확인한 변경 목록에 흐리게 남고,
   * 최신 1건만 새로 알려요. (autoClosed 는 "기존 자동 닫힘" 카드에 그대로 쓰여요)
   */
  supersededBy?: { issueNo: number; version?: number };
  /** 대체 버전 전용(확정안 2): 답 안 함 + 원래 값으로 돌아옴 → 자동으로 닫히고 목록 어디에도 보이지 않아요 */
  hiddenClosed?: boolean;
  /** 대체 버전 전용(확정안 3 · 4): 같은 결정의 이전 버전에 이미 답했던 사람에게 새로 알리는 건 */
  isNewVersion?: boolean;
  /** 대체 버전 전용(확정안 4): 이미 답한 뒤 값이 원래 값으로 되돌려진 건. version은 되돌아간 버전, from은 직전 버전 */
  revertedTo?: { version: number; from: number };
  /** 대체 버전 전용: 같은 결정의 이전 버전에 내가 한 답 */
  previousAnswer?: Answer;
  /** 나(현재 사용자)의 작업에 영향이 있는 변경인지 */
  affectsMe: boolean;
  status: Status;
  processing?: boolean;
  affectedTasks: AffectedTask[];
  affectedAgents: { name: string; upToDate: boolean }[];
  relatedFiles: string[];
  relatedCode: string[];
  recommendedAction: string;
  rollbackAvailable: boolean;
  rolledBack?: boolean;
  changedAt: string;
  responses: Response[];
}

const NOW = Date.now();
const min = 60_000;

export const INITIAL_CHANGES: DecisionChange[] = [
  {
    id: 'DC-0147',
    issueNo: 14,
    timestamp: NOW - 8 * min,
    author: 'AI',
    source: 'pr-ai',
    pr: { number: 38, title: '결제 완료 알림을 묶어서 보내기' },
    title: '결제 완료 알림은 1분 안에 보낸다',
    summary: 'PR에서 알림 발송 방식이 바뀐 것을 AI가 찾아냈어요. 실제 결정인지 확인이 필요해요.',
    before: '주문 직후 바로 보냄',
    after: '주문 후 1분 안에 보냄',
    reason: 'PR #38의 코드 변경에서 AI가 찾아낸 결정이에요. 결정을 내린 근거 문서는 찾지 못했어요.',
    importance: 'HIGH',
    decisionState: '대체됨',
    affectsMe: true,
    status: 'NEW',
    affectedTasks: [
      { name: 'Content / Payment Push Copy', action: '"바로" 표현 수정 필요', certainty: 'inferred' },
      { name: 'Design / Notification Card', action: '발송 시점 안내 문구 확인 필요', certainty: 'inferred' },
    ],
    affectedAgents: [{ name: 'Content Agent', upToDate: false }],
    relatedFiles: [],
    relatedCode: ['src/notifications/payment.ts'],
    recommendedAction: 'PR #38의 내용이 맞는 결정인지 확인해주세요.',
    rollbackAvailable: false,
    changedAt: '2026.10.10',
    responses: [],
  },
  {
    id: 'DC-0148',
    issueNo: 15,
    timestamp: NOW - 22 * min,
    author: 'PO',
    title: '상품 이미지는 최대 10장까지 등록한다',
    summary: '지금까지 정해진 기준이 없던 상품 이미지 개수를 새로 정했습니다.',
    before: null,
    after: '상품당 이미지 최대 10장',
    reason: '이미지가 너무 많으면 상세 화면이 느려져서 기준을 새로 정했어요.',
    importance: 'MEDIUM',
    decisionState: '신규',
    affectsMe: true,
    status: 'NEW',
    affectedTasks: [{ name: 'Design / Product Image Upload', action: '개수 제한 안내 추가 필요', certainty: 'confirmed' }],
    affectedAgents: [{ name: 'Design Agent', upToDate: false }],
    relatedFiles: ['docs/PRD.md'],
    relatedCode: [],
    recommendedAction: '이미지 업로드 화면에 개수 제한을 안내해주세요.',
    rollbackAvailable: true,
    changedAt: '2026.10.10',
    responses: [],
  },
  {
    id: 'DC-0145',
    issueNo: 12,
    timestamp: NOW - 16 * min,
    author: 'PO',
    title: '앱 알림 제목은 32자 이하로 쓴다',
    summary: '푸시 알림 제목이 일부 기기에서 잘려 핵심 내용이 보이지 않아 글자 수 기준을 줄였습니다.',
    before: '공백 포함 40자 이하',
    after: '공백 포함 32자 이하',
    reason: '일부 기기에서 40자 제목이 말줄임 처리되어 핵심 내용이 보이지 않는 문제를 줄이기 위해서예요.',
    importance: 'HIGH',
    decisionState: '대체됨',
    affectsMe: true,
    status: 'NEW',
    affectedTasks: [
      { name: 'Content / Push Copy', action: '32자를 넘는 제목 수정 필요', certainty: 'confirmed' },
      { name: 'Design / Notification Card', action: '제목 줄 수 확인 필요', certainty: 'inferred' },
    ],
    affectedAgents: [
      { name: 'Content Agent', upToDate: false },
      { name: 'Design Agent', upToDate: true },
    ],
    relatedFiles: ['docs/PRD.md', 'docs/ux-writing.md'],
    relatedCode: ['src/notifications/title.ts'],
    recommendedAction: '현재 작업 중인 Push Copy 제목이 32자 이하인지 확인해주세요.',
    rollbackAvailable: true,
    changedAt: '2026.10.10',
    responses: [],
  },
  {
    id: 'DC-0142',
    issueNo: 9,
    timestamp: NOW - 10 * min,
    author: 'PO',
    title: '쿠폰 영역이 MVP에서 제외되었습니다',
    summary: '핵심 구매 흐름에 집중하기 위해 쿠폰 기능을 제외하기로 결정했습니다.',
    before: '쿠폰 영역을 홈 화면에 제공',
    after: '쿠폰 영역을 MVP에서 제외',
    reason: '초기 버전에서는 핵심 구매 흐름에 집중하기 위해 쿠폰 기능을 제외하기로 결정했습니다.',
    importance: 'CRITICAL',
    decisionState: '대체됨',
    affectsMe: true,
    status: 'NEW',
    affectedTasks: [
      { name: 'Design / Coupon Banner', action: '작업 중단 필요', certainty: 'inferred' },
      { name: 'Design / Home UI', action: '레이아웃 수정 필요', certainty: 'confirmed' },
      { name: 'Content / Promotion Copy', action: '삭제 필요', certainty: 'confirmed' },
    ],
    affectedAgents: [
      { name: 'Design Agent', upToDate: false },
      { name: 'Development Agent', upToDate: false },
      { name: 'Content Agent', upToDate: true },
    ],
    relatedFiles: ['docs/PRD.md', 'design/home.fig'],
    relatedCode: ['src/features/coupon/CouponBanner.tsx', 'api/coupon.ts'],
    recommendedAction: '현재 작업 중인 Coupon Banner를 확인해주세요.',
    rollbackAvailable: true,
    changedAt: '2026.10.10',
    responses: [],
  },
  {
    id: 'DC-0141',
    issueNo: 11,
    timestamp: NOW - 55 * min,
    author: 'PO',
    title: '결제 단계가 3단계에서 2단계로 줄었습니다',
    summary: '주문서 확인 단계를 결제 단계에 합쳐 이탈을 줄이기로 했습니다.',
    before: '주문서 → 결제수단 → 결제 확인 (3단계)',
    after: '주문서 → 결제 (2단계)',
    reason: '결제 단계가 길어 이탈이 많다는 데이터를 반영했습니다.',
    importance: 'HIGH',
    decisionState: '대체됨',
    affectsMe: true,
    status: 'VIEWED',
    affectedTasks: [
      { name: 'Design / Payment Flow', action: '화면 1개 삭제 필요', certainty: 'confirmed' },
      { name: 'Development / Order API', action: '단계 검증 로직 수정 필요', certainty: 'inferred' },
    ],
    affectedAgents: [{ name: 'Design Agent', upToDate: false }],
    relatedFiles: ['docs/PRD.md'],
    relatedCode: ['src/features/payment/Steps.tsx'],
    recommendedAction: 'Payment Flow 화면 구성을 확인해주세요.',
    rollbackAvailable: true,
    changedAt: '2026.10.10',
    responses: [],
  },
  {
    id: 'DC-0143',
    issueNo: 13,
    timestamp: NOW - 2 * 60 * min,
    author: '개발자',
    title: '상품 리뷰 목록은 20개씩 불러온다',
    summary: '리뷰 목록을 한 번에 불러오는 개수를 정했습니다. 디자인 작업에는 영향이 없어요.',
    before: '리뷰 전체를 한 번에 불러옴',
    after: '리뷰 20개씩 나눠서 불러옴',
    reason: '리뷰가 많은 상품에서 화면이 느려지는 문제를 줄이기 위해서예요.',
    importance: 'LOW',
    decisionState: '검토 중',
    affectsMe: false,
    status: 'VIEWED',
    affectedTasks: [{ name: 'Development / Review API', action: '페이지네이션 적용 필요', certainty: 'confirmed' }],
    affectedAgents: [{ name: 'Development Agent', upToDate: false }],
    relatedFiles: [],
    relatedCode: ['api/review.ts'],
    recommendedAction: '디자인 작업에는 변경이 필요하지 않아요. 확인만 해주세요.',
    rollbackAvailable: false,
    changedAt: '2026.10.10',
    responses: [],
  },
  {
    id: 'DC-0139',
    issueNo: 10,
    timestamp: NOW - 3 * 60 * min,
    author: '개발자',
    title: '홈 화면 구조가 변경되었습니다',
    summary: '추천 상품 영역이 상단으로 올라오고 배너 영역이 하단으로 이동했어요.',
    before: '배너 → 추천 상품',
    after: '추천 상품 → 배너',
    reason: '추천 상품의 클릭률이 더 높아 노출 순서를 바꿨습니다.',
    importance: 'MEDIUM',
    decisionState: '확정',
    affectsMe: true,
    status: 'ACKNOWLEDGED',
    affectedTasks: [{ name: 'Design / Home UI', action: '섹션 순서 반영 필요', certainty: 'confirmed' }],
    affectedAgents: [{ name: 'Design Agent', upToDate: true }],
    relatedFiles: ['design/home.fig'],
    relatedCode: ['src/pages/Home.tsx'],
    recommendedAction: '반영이 끝나면 알려주세요.',
    rollbackAvailable: false,
    changedAt: '2026.10.10',
    responses: [{ kind: 'ack', text: '확인했습니다. 홈 섹션 순서를 반영하겠습니다.', at: '오늘 오후 1:20' }],
  },
  {
    id: 'DC-0132',
    issueNo: 6,
    timestamp: NOW - 40 * min,
    author: 'PO',
    title: '앱 알림 제목은 36자 이하로 쓴다',
    summary: '답하기 전에 같은 결정이 또 바뀌어서 #12로 대체되었어요.',
    before: '공백 포함 40자 이하',
    after: '공백 포함 36자 이하',
    reason: '알림 제목이 잘리는 문제를 줄이려고 한 번 줄였지만, 곧 더 짧게 다시 정해졌어요.',
    importance: 'HIGH',
    decisionState: '대체됨',
    affectsMe: true,
    status: 'NEW',
    autoClosed: { byIssueNo: 12, at: '16분 전' },
    affectedTasks: [{ name: 'Content / Push Copy', action: '#12 기준으로 수정 필요', certainty: 'confirmed' }],
    affectedAgents: [{ name: 'Content Agent', upToDate: false }],
    relatedFiles: ['docs/ux-writing.md'],
    relatedCode: [],
    recommendedAction: '이 변경에는 답하지 않아도 돼요. 새 버전(#12)을 확인해주세요.',
    rollbackAvailable: false,
    changedAt: '2026.10.10',
    responses: [],
  },
  {
    id: 'DC-0136',
    issueNo: 8,
    timestamp: NOW - 26 * 60 * min,
    author: 'PO',
    title: '배송비 안내 문구가 삭제되었습니다',
    summary: '무료 배송 기준 안내가 상품 상세에서 제거되었어요.',
    before: '상품 상세에 무료 배송 기준 안내',
    after: '안내 문구 없음',
    reason: '배송 정책이 확정되기 전까지 노출하지 않기로 했습니다.',
    importance: 'HIGH',
    decisionState: '대체됨',
    affectsMe: true,
    status: 'RESOLVED',
    affectedTasks: [{ name: 'Content / Shipping Copy', action: '삭제 완료', certainty: 'confirmed' }],
    affectedAgents: [{ name: 'Content Agent', upToDate: true }],
    relatedFiles: ['docs/PRD.md'],
    relatedCode: [],
    recommendedAction: '추가로 확인할 작업이 없어요.',
    rollbackAvailable: false,
    changedAt: '2026.10.09',
    responses: [{ kind: 'ack', text: '확인했습니다.', at: '어제 오후 4:02' }],
  },
];

/** MD §11 권장: 미확인 우선 + 같은 상태에서는 최신순 */
/** 자동으로 닫힌 변경은 답할 필요가 없어서 확인 대기에 들어가지 않는다 */
export const isPending = (c: DecisionChange) =>
  !c.autoClosed && !c.supersededBy && !c.hiddenClosed && (c.status === 'NEW' || c.status === 'VIEWED');
export const isAutoClosed = (c: DecisionChange) => !!c.autoClosed;
export const isNewDecision = (c: DecisionChange) => c.before === null;
export const isAiFound = (c: DecisionChange) => c.source === 'pr-ai';
export const isAiChat = (c: DecisionChange) => c.source === 'ai-chat';
const rank = (c: DecisionChange) => (isPending(c) ? 0 : isAutoClosed(c) ? 2 : 1);
export const sortChanges = (list: DecisionChange[]) =>
  [...list].sort((a, b) => rank(a) - rank(b) || b.timestamp - a.timestamp);

export const relTime = (ts: number) => {
  const m = Math.max(1, Math.round((Date.now() - ts) / min));
  if (m < 60) return `${m}분 전`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h}시간 전` : `${Math.round(h / 24)}일 전`;
};

export const STATUS_FLOW: Status[] = ['NEW', 'VIEWED', 'ACKNOWLEDGED', 'ACTIONED', 'RESOLVED'];
/** 대체 버전 CLI 탭: 현재 상태는 최대 3단계 (새 변경 → 확인 완료 → 작업 반영) */
export const STATUS_FLOW_SIMPLE: Status[] = ['NEW', 'ACKNOWLEDGED', 'ACTIONED'];
export const STATUS_LABEL: Record<Status, string> = {
  NEW: '새 변경',
  VIEWED: '열어봄',
  ACKNOWLEDGED: '확인 완료',
  ACTIONED: '작업 반영',
  RESOLVED: '처리 완료',
};
export const STATUS_DESC: Record<Status, string> = {
  NEW: '아직 확인하지 않은 변경이에요.',
  VIEWED: '변경 내용을 열어본 상태예요.',
  ACKNOWLEDGED: '담당자가 변경사항을 확인했다고 답한 상태예요.',
  ACTIONED: '실제 작업에 반영한 상태예요.',
  RESOLVED: '관련 작업이 모두 처리되었어요.',
};
export const IMPORTANCE_LABEL: Record<Importance, string> = {
  LOW: '낮음',
  MEDIUM: '보통',
  HIGH: '높음',
  CRITICAL: '매우 높음',
};

/* 영향받는 작업 표시용 도우미 (작업 번호·담당은 목업 데이터에서 만들어 써요) */
const OWNER: Record<string, string> = { Design: '디자이너', Development: '개발자', Content: '콘텐츠' };
export const taskArea = (t: AffectedTask) => t.name.split(' / ')[0];
export const taskTitle = (t: AffectedTask) => t.name.split(' / ')[1] ?? t.name;
export const taskOwner = (t: AffectedTask) => t.owner ?? OWNER[taskArea(t)] ?? taskArea(t);
export const taskNo = (c: DecisionChange, index: number) => c.affectedTasks[index]?.no ?? `T-${c.issueNo * 3 + index}`;

/** 확인할 변경 상태: 대기 / 답함 / 대체됨 만 화면에 보여요 (자동 닫힘은 화면에 나오지 않아요) */
export type ReviewStatus = '대기' | '답함' | '대체됨';
export const reviewStatus = (c: DecisionChange): ReviewStatus =>
  c.autoClosed || c.supersededBy ? '대체됨' : isPending(c) ? '대기' : '답함';

/** "이미 이전 버전을 반영했다면 최신 버전으로 작업해 주세요" 안내: 새 버전이거나 되돌림이면 붙이고, 이전 버전에 "관계없다"로 답한 사람은 뺀다 */
export const needsReapplyHint = (c: DecisionChange) => c.previousAnswer?.relation === '관계있다';

/** 언제: 오늘이면 "오후 2:13", 아니면 "10월 13일 오후 2:13" */
export const formatWhen = (ts: number, now = Date.now()) => {
  const d = new Date(ts);
  const time = d.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit', hour12: true });
  const sameDay = new Date(now).toDateString() === d.toDateString();
  return sameDay ? time : `${d.getMonth() + 1}월 ${d.getDate()}일 ${time}`;
};
