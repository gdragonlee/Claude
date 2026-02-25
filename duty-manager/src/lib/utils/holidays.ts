/**
 * 대한민국 공휴일 (관공서의 공휴일에 관한 규정 기준)
 * 음력 공휴일은 연도별 양력 변환 테이블 사용 (2024-2030)
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
const LUNAR_HOLIDAYS: Record<number, Holiday[]> = {
  2024: [
    { date: '02-09', name: '설날 연휴' },
    { date: '02-10', name: '설날' },
    { date: '02-11', name: '설날 연휴' },
    { date: '02-12', name: '대체공휴일(설날)' },
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
    { date: '10-08', name: '대체공휴일(추석)' },
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
    { date: '02-09', name: '대체공휴일(설날)' },
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

/**
 * 해당 연도의 모든 공휴일을 Map<'YYYY-MM-DD', 공휴일이름>으로 반환
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
      // 같은 날에 두 공휴일이 겹치면 (예: 어린이날 + 부처님오신날) 둘 다 표시
      map.set(key, existing ? `${existing} / ${h.name}` : h.name);
    }
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
