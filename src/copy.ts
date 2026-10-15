/**
 * 화면에 보이는 문구 중 "대체 버전(아티팩트 · GitHub Pages)"에서만 다르게 쓰는 것들.
 * 로컬 개발(진짜 TDS)은 기존 문구를 그대로 쓰고, 배포용 빌드(STANDALONE)만 바뀐 문구를 써요.
 */
declare const __STANDALONE__: boolean;

export const STANDALONE = typeof __STANDALONE__ !== 'undefined' && __STANDALONE__;

/** "답할 변경" 카드 이름 */
export const TO_ANSWER = STANDALONE ? '확인할 변경' : '답할 변경';
/** "답한 변경" 카드 이름 */
export const ANSWERED = STANDALONE ? '확인한 변경' : '답한 변경';

/** 점선 카드 이름. 앞으로 "자동으로 닫혔지만 보여줘야 하는" 상황에 쓰려고 카드는 그대로 두고 이름만 바꿨어요. */
export const AUTO_CLOSED_TITLE = STANDALONE ? '기존 자동 닫힘' : '자동으로 닫힌 변경';

/** 이미 "관계있다"로 답한 뒤 새 알림이 왔을 때 붙이는 안내 */
export const REAPPLY_HINT = STANDALONE ? '이전 결정 사항으로 작업 중이었다면 최신 결정 사항을 반영해주세요' : '이미 반영했다면 다시 작업해 주세요';

/** 상세를 보는 중에 원래 값으로 돌아와서 자동으로 닫혔을 때 띄우는 한 줄 */
export const AUTO_CLOSED_NOTICE = '원래대로 돌아와서 답하지 않아도 돼요';

/** 답해야 하는 변경을 강조하는 주황(시안 1) */
export const ANSWER_COLOR = '#F76707';

/** 변경 상세: 아직 답하지 않은 변경 제목 아래에 띄우는 강조 문구 */
export const ANSWER_NEEDED = '내 답이 필요한 변경이에요. 아래에서 답해주세요';
