import type { Answer, AffectedTask, DecisionChange, TaskState } from './data';

/**
 * CLI 동작 시험 데이터
 * 출처: AX-PJ3/HARIBO · docs/CLI-동작-시험.md (2026-10-09 시험)
 *
 * 시험은 장면 3개를 순서대로 이어서 진행했고, 앞 장면에서 저장한 결정이 다음 장면의 "확인 대기"가 돼요.
 *   1) order-design · 민호(디자이너) · T-22      → 첫 메시지를 보낸 직후의 확인 대기 1건
 *   2) order-api    · 서준(백엔드)   · T-21, T-31 → 민호가 저장한 SPEC v2를 포함해 확인 대기 3건(작업 기준)
 *   3) order-qa     · 하린(QA)       · T-30       → 이미 완료된 T-30이 확인 대기라서 "다시 열기"까지 이어짐
 * 그래서 담당자마다 "세션을 시작한 직후" 보이는 확인 대기를 그 시점 상태로 만들었어요.
 *
 * 문서에 없는 값(예: 이전 값의 문장, 일부 작업 이름, 이슈 번호)은 화면을 채우려고 만든 임시 값이에요.
 */

export type CliViewer = 'minho' | 'seojun' | 'harin';

export const CLI_VIEWERS: { value: CliViewer; label: string; role: string; workspace: string }[] = [
  { value: 'minho', label: '민호', role: '디자이너', workspace: 'order-design' },
  { value: 'seojun', label: '서준', role: '백엔드', workspace: 'order-api' },
  { value: 'harin', label: '하린', role: 'QA', workspace: 'order-qa' },
];

const kst = (iso: string) => new Date(`${iso}+09:00`).getTime();

/** 작업을 만드는 도우미 */
const task = (
  no: string,
  role: string,
  title: string,
  action: string,
  state: TaskState,
  extra: Partial<AffectedTask> = {}
): AffectedTask => ({
  no,
  name: `${role} / ${title}`,
  action,
  certainty: 'confirmed',
  state,
  ...extra,
});

/* ───────── 결정 1: RULE-PAYMENT-AMOUNT-SERVER v1 (지속되는 제약 조건) ───────── */
function rulePayment(viewer: CliViewer): DecisionChange {
  // T-22(민호)는 서준·하린 시점에서는 이미 "영향 없음 (거절)"로 답한 뒤예요.
  const t22: TaskState = viewer === 'minho' ? 'pending' : 'rejected';
  // T-21·T-31(서준)은 하린 시점에서는 이미 처리된 뒤예요.
  const seojunDone: TaskState = viewer === 'harin' ? 'accepted' : 'pending';

  const tasks: AffectedTask[] = [
    task('T-22', '디자이너', '주문 내역 화면 디자인', '결제 금액 표시가 서버 값을 쓰는지 확인 필요', t22),
    task('T-21', '백엔드', '주문 API', '결제 금액을 서버에서만 계산하도록 확인 필요', seojunDone),
    task('T-31', '백엔드', '환불 API', '환불 금액도 서버 계산 값을 쓰는지 확인 필요', seojunDone),
    task('T-30', 'QA', '배송 테스트 케이스', '완료된 작업이에요. 결제 금액 케이스를 다시 볼지 확인 필요', 'pending', { completed: true }),
  ];
  // 자동 닫힘은 화면에 나오지 않으므로 처리 현황에서도 뺐어요.
  const shown = tasks.filter((t) => t.state !== 'auto-closed');
  const done = shown.filter((t) => t.state !== 'pending').length;

  return {
    id: 'CLI-RULE-PAYMENT-AMOUNT-SERVER',
    issueNo: 1,
    timestamp: kst('2026-10-06T10:12:00'),
    author: '지은',
    source: 'ai-chat',
    decisionKey: 'RULE-PAYMENT-AMOUNT-SERVER',
    issueTitle: '결제 금액을 어디에서 계산할지 정하기',
    issueStatus: '진행 중',
    version: { from: null, to: 1 },
    kindLabel: '지속되는 제약 조건',
    processed: { done, total: shown.length },
    evidence: 'CLI의 AI 대화에서 정해진 제약 조건',
    title: '결제 금액은 서버에서만 계산한다',
    summary: '지속되는 제약 조건으로 새로 정해져서, 이후 모든 작업에서 지켜야 해요.',
    before: null,
    after: '결제 금액은 서버에서만 계산한다',
    reason: '지속되는 제약 조건으로 저장돼서, 담당자가 작업을 시작할 때마다 작업 맥락에 함께 들어가요.',
    importance: 'HIGH',
    decisionState: '신규',
    affectsMe: true,
    status: 'NEW',
    affectedTasks: tasks,
    affectedAgents: [
      { name: 'order-design CLI', upToDate: viewer !== 'minho' },
      { name: 'order-api CLI', upToDate: viewer === 'harin' },
      { name: 'order-qa CLI', upToDate: false },
    ],
    relatedFiles: [],
    relatedCode: [],
    recommendedAction: '내 작업이 이 제약 조건에 영향을 받는지 답해주세요.',
    rollbackAvailable: false,
    changedAt: '2026.10.06',
    responses: [],
  };
}

/* ───────── 결정 2: SPEC-ORDER-DELIVERY-STATUS v1 → v2 (민호가 CLI 대화에서 정함) ───────── */
function specDeliveryStatus(viewer: CliViewer): DecisionChange | null {
  if (viewer === 'minho') return null; // 민호의 첫 세션에서는 아직 정하기 전이에요.

  // T-22(민호)는 결정한 사람의 작업이라 자동으로 닫혀요.
  // T-21(서준)은 하린 시점에서는 "수락 · 몰랐음"으로 처리된 뒤예요.
  const t21: TaskState = viewer === 'harin' ? 'accepted' : 'pending';

  const tasks: AffectedTask[] = [
    task('T-21', '백엔드', '주문 API', '배송 상태를 2단계로 내려주도록 수정 필요', t21, viewer === 'harin' ? { awareness: '몰랐음' } : {}),
    task('T-22', '디자이너', '주문 내역 화면 디자인', '결정한 사람의 작업이라 자동으로 닫혔어요', 'auto-closed'),
    task('T-24', '프론트엔드', '주문 내역 화면', '배송 상태 표시를 2단계로 수정 필요', 'pending'),
    task('T-30', 'QA', '배송 테스트 케이스', '완료된 작업이에요. 새 기준으로 테스트 케이스를 다시 봐야 해요', 'pending', { completed: true }),
  ];
  // 자동 닫힘은 화면에 나오지 않으므로 처리 현황에서도 뺐어요.
  const shown = tasks.filter((t) => t.state !== 'auto-closed');
  const done = shown.filter((t) => t.state !== 'pending').length;

  return {
    id: 'CLI-SPEC-ORDER-DELIVERY-STATUS',
    issueNo: 2,
    timestamp: kst('2026-10-09T19:37:00'),
    author: '민호',
    source: 'ai-chat',
    decisionKey: 'SPEC-ORDER-DELIVERY-STATUS',
    issueTitle: '주문 내역 화면에서 배송 상태를 몇 단계로 보여줄지 정하기',
    issueStatus: '진행 중',
    version: { from: 1, to: 2 },
    kindLabel: '사양 변경',
    processed: { done, total: shown.length },
    evidence: 'Figma 프레임 「주문 내역 · 배송 상태」, 디자이너 대화',
    title: '배송 상태는 2단계로 정리한다',
    summary: '민호가 CLI 대화에서 배송 상태를 2단계로 정하고, Figma 프레임을 고친 뒤 결정으로 저장했어요.',
    before: '이전 배송 상태 기준 (v1)',
    after: '배송 상태 2단계 (v2)',
    reason: '디자이너가 대화에서 배송 상태를 2단계로 정하고 주문 내역 화면의 Figma 프레임을 고쳐서, 결정(v2)으로 저장했어요.',
    importance: 'HIGH',
    decisionState: '대체됨',
    affectsMe: true,
    status: 'NEW',
    affectedTasks: tasks,
    affectedAgents: [
      { name: 'order-api CLI', upToDate: viewer === 'harin' },
      { name: 'order-qa CLI', upToDate: false },
    ],
    relatedFiles: ['Figma 「주문 내역 · 배송 상태」'],
    relatedCode: [],
    recommendedAction: '내 작업이 새 배송 상태 기준에 영향을 받는지 답해주세요.',
    rollbackAvailable: true,
    changedAt: '2026.10.09',
    responses: [],
  };
}

/** 담당자가 세션을 시작한 직후 보이는 변경 목록 */
export function buildCliChanges(viewer: CliViewer): DecisionChange[] {
  const spec = specDeliveryStatus(viewer);
  return spec ? [spec, rulePayment(viewer)] : [rulePayment(viewer)];
}

/**
 * 담당자가 답하면 그 담당자(역할)의 확인 대기 작업에 답을 반영해요.
 * 관계있다 → 수락 (알았다/몰랐다도 같이 기록) · 관계없다 → 영향 없음(거절)
 */
export function applyAnswerToTasks(change: DecisionChange, role: string, answer: Answer): AffectedTask[] {
  return change.affectedTasks.map((t) => {
    const mine = t.owner === role || t.name.startsWith(`${role} /`);
    // 답을 처음 할 때는 확인 대기(pending)만, 답을 고칠 때는 이미 답한 작업(accepted / rejected)도 새 답으로 바꿔요.
    if (!mine || (t.state !== 'pending' && t.state !== 'accepted' && t.state !== 'rejected')) return t;
    if (answer.relation === '관계없다') return { ...t, state: 'rejected' as const, awareness: undefined, completed: false };
    return {
      ...t,
      state: 'accepted' as const,
      awareness: answer.awareness === '알았다' ? ('이미 알고 있었음' as const) : ('몰랐음' as const),
    };
  });
}
