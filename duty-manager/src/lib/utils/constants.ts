export const SHIFT_LABELS: Record<string, string> = {
  duty: '당직',
  night_duty: '백당',
  duty_off: '당직오프',
  leave: '연차',
  research: '연구',
  conference: '학회',
};

export const SHIFT_COLORS: Record<string, { bg: string; text: string }> = {
  duty: { bg: 'bg-blue-100', text: 'text-blue-800' },
  night_duty: { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  duty_off: { bg: 'bg-fuchsia-100', text: 'text-fuchsia-800' },
  leave: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  research: { bg: 'bg-lime-100', text: 'text-lime-800' },
  conference: { bg: 'bg-purple-100', text: 'text-purple-800' },
};

export const OFF_DUTY_TYPES = ['duty_off', 'leave', 'research', 'conference'];

/** 부재 표시 정렬 순서: 학회 → 연차 → 당직오프 → 연구 */
export const OFF_DUTY_SORT_ORDER: Record<string, number> = {
  conference: 0,
  leave: 1,
  duty_off: 2,
  research: 3,
};

export const STATUS_LABELS: Record<string, string> = {
  assigned: '배정됨',
  confirmed: '확인됨',
  swap_requested: '교대요청',
};

export const NOTIFICATION_TYPE_LABELS: Record<string, string> = {
  assignment: '당직 배정',
  swap_request: '교대 요청',
  swap_result: '교대 결과',
  change: '일정 변경',
};

export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export const POSITION_OPTIONS = ['교수', '전공의'];

export const POSITION_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  교수: { bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500' },
  전공의: { bg: 'bg-amber-100', text: 'text-amber-800', dot: 'bg-amber-500' },
};
