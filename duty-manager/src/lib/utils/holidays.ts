/**
 * 대한민국 공휴일 (관공서의 공휴일에 관한 규정 기준)
 * 음력 공휴일은 연도별 양력 변환 테이블 사용 (2024-2030)
 * 대체공휴일은 알고리즘으로 자동 계산
 */

interface Holiday {
  date: string; // MM-DD
  name: string;
}

// 고정 공휴일 (양력)
const FIXED_HOLIDAYS: Holiday[] = [
  { date: '01-01', name: '신정' },
  { date: '03-01', name: '삼일절' },
  { date: '05-05', name: '어린이날' },
  { date: '06-06', name: '현충일' },
  { date: '08-15', name: '광복절' },
  { date: '10-03', name: '개천절' },
  { date: '10-09', name: '한글날' },
  { date: '12-25', name: '성탄절' },
];

// 음력 공휴일의 양력 변환 테이블 (설날 전날~다음날, 추석 전날~다음날, 부처님오신날)
// 대체공휴일은 자동 계산되므로 수동 입력하지 않음
const LUNAR_HOLIDAYS: Record<number, Holiday[]> = {
  2024: [
    { date: '02-09', name: '설날 연휴' },
    { date: '02-10', name: '설날' },
    { date: '02-11', name: '설날 연휴' },
    { date: '05-15', name: '부처님오신날' },
    { date: '09-16', name: '추석 연휴' },
    { date: '09-17', name: '추석' },
    { date: '09-18', name: '추석 연휴' },
  ],
  2025: [
    { date: '01-28', name: '설날 연휴' },
    { date: '01-29', name: '설날' },
    { date: '01-30', name: '설날 연휴' },
    { date: '05-05', name: '부처님오신날' },
    { date: '10-05', name: '추석 연휴' },
    { date: '10-06', name: '추석' },
    { date: '10-07', name: '추석 연휴' },
  ],
  2026: [
    { date: '02-16', name: '설날 연휴' },
    { date: '02-17', name: '설날' },
    { date: '02-18', name: '설날 연휴' },
    { date: '05-24', name: '부처님오신날' },
    { date: '09-24', name: '추석 연휴' },
    { date: '09-25', name: '추석' },
    { date: '09-26', name: '추석 연휴' },
  ],
  2027: [
    { date: '02-06', name: '설날 연휴' },
    { date: '02-07', name: '설날' },
    { date: '02-08', name: '설날 연휴' },
    { date: '05-13', name: '부처님오신날' },
    { date: '09-14', name: '추석 연휴' },
    { date: '09-15', name: '추석' },
    { date: '09-16', name: '추석 연휴' },
  ],
  2028: [
    { date: '01-26', name: '설날 연휴' },
    { date: '01-27', name: '설날' },
    { date: '01-28', name: '설날 연휴' },
    { date: '05-02', name: '부처님오신날' },
    { date: '10-02', name: '추석 연휴' },
    { date: '10-03', name: '추석' },
    { date: '10-04', name: '추석 연휴' },
  ],
  2029: [
    { date: '02-12', name: '설날 연휴' },
    { date: '02-13', name: '설날' },
    { date: '02-14', name: '설날 연휴' },
    { date: '05-20', name: '부처님오신날' },
    { date: '09-21', name: '추석 연휴' },
    { date: '09-22', name: '추석' },
    { date: '09-23', name: '추석 연휴' },
  ],
  2030: [
    { date: '02-02', name: '설날 연휴' },
    { date: '02-03', name: '설날' },
    { date: '02-04', name: '설날 연휴' },
    { date: '05-09', name: '부처님오신날' },
    { date: '09-11', name: '추석 연휴' },
    { date: '09-12', name: '추석' },
    { date: '09-13', name: '추석 연휴' },
  ],
};

/** Date → YYYY-MM-DD */
function fmtDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** 다음 비공휴일 평일 찾기 */
function findNextAvailableWeekday(from: Date, occupied: Set<string>): Date {
  const d = new Date(from);
  do {
    d.setDate(d.getDate() + 1);
  } while (d.getDay() === 0 || d.getDay() === 6 || occupied.has(fmtDate(d)));
  return d;
}

/**
 * 대체공휴일 자동 계산
 * 관공서의 공휴일에 관한 규정 제3조 (2024.1.1~ 시행)
 * - 모든 공휴일이 토요일 또는 다른 공휴일(일요일 포함)과 겹치면 대체공휴일
 * - 같은 날짜에 복수 공휴일이 겹치면 초과분에 대체공휴일
 */
function computeSubstituteHolidays(year: number): { date: string; name: string }[] {
  // 1. 개별 공휴일 수집 (중복 날짜 허용)
  const allHolidays: { date: string; name: string }[] = [];

  for (const h of FIXED_HOLIDAYS) {
    allHolidays.push({ date: `${year}-${h.date}`, name: h.name });
  }

  const lunar = LUNAR_HOLIDAYS[year];
  if (lunar) {
    for (const h of lunar) {
      allHolidays.push({ date: `${year}-${h.date}`, name: h.name });
    }
  }

  // 날짜순 정렬
  allHolidays.sort((a, b) => a.date.localeCompare(b.date));

  // 점유 날짜 (공휴일 + 추가되는 대체공휴일)
  const occupiedDates = new Set(allHolidays.map((h) => h.date));

  const substitutes: { date: string; name: string }[] = [];

  // 2. 토/일요일 공휴일 → 대체공휴일
  for (const h of allHolidays) {
    const d = new Date(h.date + 'T00:00:00');
    const dayOfWeek = d.getDay();

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      const sub = findNextAvailableWeekday(d, occupiedDates);
      const subStr = fmtDate(sub);
      occupiedDates.add(subStr);
      substitutes.push({ date: subStr, name: `대체공휴일(${h.name})` });
    }
  }

  // 3. 같은 날짜에 복수 공휴일 겹침 (평일) → 초과분 대체공휴일
  const dateGroups = new Map<string, string[]>();
  for (const h of allHolidays) {
    const list = dateGroups.get(h.date) || [];
    list.push(h.name);
    dateGroups.set(h.date, list);
  }

  for (const [date, names] of dateGroups) {
    if (names.length <= 1) continue;
    const d = new Date(date + 'T00:00:00');
    if (d.getDay() === 0 || d.getDay() === 6) continue; // 주말은 위에서 처리됨

    for (let i = 1; i < names.length; i++) {
      const sub = findNextAvailableWeekday(d, occupiedDates);
      const subStr = fmtDate(sub);
      occupiedDates.add(subStr);
      substitutes.push({ date: subStr, name: `대체공휴일(${names[i]})` });
    }
  }

  return substitutes;
}

/**
 * 해당 연도의 모든 공휴일을 Map<'YYYY-MM-DD', 공휴일이름>으로 반환
 * (대체공휴일 포함)
 */
export function getHolidaysForYear(year: number): Map<string, string> {
  const map = new Map<string, string>();

  // 고정 공휴일
  for (const h of FIXED_HOLIDAYS) {
    map.set(`${year}-${h.date}`, h.name);
  }

  // 음력 공휴일
  const lunar = LUNAR_HOLIDAYS[year];
  if (lunar) {
    for (const h of lunar) {
      const key = `${year}-${h.date}`;
      const existing = map.get(key);
      map.set(key, existing ? `${existing} / ${h.name}` : h.name);
    }
  }

  // 대체공휴일 자동 계산
  const substitutes = computeSubstituteHolidays(year);
  for (const sub of substitutes) {
    const existing = map.get(sub.date);
    map.set(sub.date, existing ? `${existing} / ${sub.name}` : sub.name);
  }

  return map;
}

/**
 * 해당 월의 공휴일을 Map<'YYYY-MM-DD', 공휴일이름>으로 반환
 */
export function getHolidaysForMonth(year: number, month: number): Map<string, string> {
  const yearMap = getHolidaysForYear(year);
  const monthStr = String(month + 1).padStart(2, '0');
  const prefix = `${year}-${monthStr}`;
  const map = new Map<string, string>();

  for (const [date, name] of yearMap) {
    if (date.startsWith(prefix)) {
      map.set(date, name);
    }
  }

  return map;
}

/**
 * 특정 날짜가 공휴일인지 확인
 */
export function isHoliday(dateStr: string): boolean {
  const year = parseInt(dateStr.substring(0, 4));
  const map = getHolidaysForYear(year);
  return map.has(dateStr);
}

/**
 * 특정 날짜의 공휴일 이름 반환 (없으면 null)
 */
export function getHolidayName(dateStr: string): string | null {
  const year = parseInt(dateStr.substring(0, 4));
  const map = getHolidaysForYear(year);
  return map.get(dateStr) || null;
}
