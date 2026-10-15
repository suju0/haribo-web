import { useMemo, useState } from 'react';
import { Answer, DecisionChange, PROGRESS_LABEL, TaskProgress, isPending, sortChanges } from './data';
import { STANDALONE } from './copy';

/**
 * 변경 목록 + 선택한 변경 + 답하기 동작을 한 묶음("보드")으로 관리해요.
 * 기존 "나에게 온 변경" 탭과 CLI 시험 데이터 탭이 같은 동작을 각자의 데이터로 쓰게 하려고 분리했어요.
 */
export function useBoard(
  initial: DecisionChange[],
  options: {
    /** 목록에서 변경을 열었을 때 상세 화면으로 이동 */
    goDetail: () => void;
    /** 상세에서 목록으로 이동 */
    goInbox: () => void;
    toast: (text: string) => void;
    /** "확인했습니다"를 눌렀을 때 변경에 더 반영할 값 (예: 내 작업을 수락으로 표시) */
    ackExtra?: (change: DecisionChange, answer?: Answer) => Partial<DecisionChange>;
  }
) {
  const { goDetail, goInbox, toast, ackExtra } = options;
  const [changes, setChanges] = useState<DecisionChange[]>(initial);
  const [selectedId, setSelectedId] = useState<string>(() => sortChanges(initial)[0]?.id ?? '');
  const [doneTasks, setDoneTasks] = useState<Set<string>>(new Set());

  const sorted = useMemo(() => sortChanges(changes), [changes]);
  const pendingCount = changes.filter(isPending).length;
  const selected = changes.find((c) => c.id === selectedId);

  const update = (id: string, patch: Partial<DecisionChange>) =>
    setChanges((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  /** 열어보면 NEW → VIEWED (MD §14) */
  const select = (id: string) => {
    setSelectedId(id);
    setChanges((prev) => prev.map((c) => (c.id === id && c.status === 'NEW' ? { ...c, status: 'VIEWED' } : c)));
  };

  /** 목록에서 변경을 열면 상세 화면으로 이동 */
  const open = (id: string) => {
    select(id);
    goDetail();
  };

  /** 같은 이슈의 여러 버전(#3 v2, #3 v3)은 버전 번호로 골라요 */
  const openIssue = (issueNo: number, version?: number) => {
    const target = changes.find((c) => c.issueNo === issueNo && (version === undefined || c.version?.to === version));
    if (target) open(target.id);
  };

  const acknowledge = () => {
    if (!selected) return;
    update(selected.id, {
      status: 'ACKNOWLEDGED',
      responses: [...selected.responses, { kind: 'ack', text: '확인했습니다.', at: '방금' }],
      ...(ackExtra ? ackExtra(selected) : {}),
    });
    toast('확인했어요. 상태가 확인 완료로 바뀌었어요.');
  };

  /** CLI 탭의 답하기: 관계있다/관계없다 → 알았다/몰랐다 또는 관계없는 이유 */
  const answerChange = (input: Omit<Answer, 'at'>) => {
    if (!selected) return;
    const answer: Answer = { ...input, at: Date.now() };
    const summary =
      answer.relation === '관계있다' ? `관계있다 · ${answer.awareness}` : `관계없다 · ${answer.reason ?? ''}`;
    const extra = ackExtra ? ackExtra(selected, answer) : {};
    const editing = !!selected.answer;
    // 답을 고칠 때는 작업 표의 완료 상태에 맞춰 변경 상태를 다시 계산해요.
    let status: DecisionChange['status'] = 'ACKNOWLEDGED';
    if (editing) {
      const shown = (extra.affectedTasks ?? selected.affectedTasks).filter((t) => t.state !== 'auto-closed');
      const done = shown.filter((t) => t.completed).length;
      status = shown.length > 0 && done === shown.length ? 'RESOLVED' : done > 0 ? 'ACTIONED' : 'ACKNOWLEDGED';
    }
    update(selected.id, {
      status,
      answer,
      responses: [...selected.responses, { kind: 'ack', text: summary, at: '방금' }],
      ...extra,
    });
    toast(editing ? '답을 바꿨어요.' : STANDALONE ? '답변을 완료했어요.' : '답했어요. 확인할 변경 상태가 답함으로 바뀌었어요.');
  };

  /** 대체 버전: 내 작업(역할)의 진행 상태를 바꿔요 (확인 완료 → 작업 반영 → 처리 완료) */
  const setProgress = (role: string, progress: TaskProgress) => {
    if (!selected) return;
    const tasks = selected.affectedTasks.map((t) =>
      t.state === 'accepted' && (t.owner === role || t.name.startsWith(`${role} /`)) ? { ...t, progress, workDone: progress === 'done' } : t
    );
    update(selected.id, { affectedTasks: tasks });
    toast(`상태를 바꿨어요 · ${PROGRESS_LABEL[progress]}`);
  };

  const reply = (kind: 'question' | 'request', text: string) => {
    if (!selected) return;
    update(selected.id, { responses: [...selected.responses, { kind, text, at: '방금' }] });
    toast(kind === 'question' ? '질문을 보냈어요.' : '수정 요청을 보냈어요.');
  };

  const toggleTask = (name: string, checked: boolean) => {
    if (!selected) return;
    // CLI 작업(담당자 답이 있는 작업): 체크 = 완료된 작업. 작업의 completed 값을 바로 바꿔서 칩과 체크가 항상 같이 움직여요.
    if (selected.affectedTasks.find((t) => t.name === name)?.state) {
      const tasks = selected.affectedTasks.map((t) => (t.name === name ? { ...t, completed: checked } : t));
      const shown = tasks.filter((t) => t.state !== 'auto-closed');
      const done = shown.filter((t) => t.completed).length;
      const status = done === shown.length ? 'RESOLVED' : done > 0 ? 'ACTIONED' : 'ACKNOWLEDGED';
      update(selected.id, { affectedTasks: tasks, status });
      return;
    }
    const next = new Set(doneTasks);
    const key = `${selected.id}:${name}`;
    if (checked) next.add(key);
    else next.delete(key);
    setDoneTasks(next);
    // 자동 닫힘 작업은 화면에 나오지 않아서 처리 완료 계산에서 뺐어요. (기존 탭 데이터에는 해당 없음)
    const shown = selected.affectedTasks.filter((t) => t.state !== 'auto-closed');
    const done = shown.filter((t) => next.has(`${selected.id}:${t.name}`)).length;
    const status = done === shown.length ? 'RESOLVED' : done > 0 ? 'ACTIONED' : 'ACKNOWLEDGED';
    update(selected.id, { status });
  };

  const rollback = () => {
    if (!selected) return;
    update(selected.id, { rolledBack: true, processing: true });
    toast('되돌리는 중이에요. 관련 작업과 Agent Context를 함께 업데이트해요.');
    window.setTimeout(() => {
      update(selected.id, {
        processing: false,
        status: 'RESOLVED',
        after: selected.before ?? '결정 없음',
        before: selected.after,
      });
      toast('이전 상태로 되돌렸어요.');
    }, 1500);
  };

  const next = () => {
    const nextItem = sorted.find((c) => isPending(c) && c.id !== selectedId);
    if (nextItem) select(nextItem.id);
    else goInbox();
  };

  return {
    changes,
    pendingCount,
    selected,
    doneTasks,
    open,
    openIssue,
    acknowledge,
    answerChange,
    setProgress,
    reply,
    toggleTask,
    rollback,
    next,
  };
}
