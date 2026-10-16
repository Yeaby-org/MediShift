import { getDaysInMonth, format, isWeekend, addDays, differenceInDays, parseISO } from 'date-fns';

const DATE_FMT = 'yyyy-MM-dd';

const isWeekendOrHoliday = (date, dateString, dailyReqOverrides) =>
  isWeekend(date) || Boolean(dailyReqOverrides[dateString]?.isHoliday);

/**
 * 收集本月的指定值班 (fixedDays)
 * @returns {Object} { 'YYYY-MM-DD': [staffId, ...] }
 */
function collectPins(year, month, staffList) {
  const monthPrefix = format(new Date(year, month, 1), 'yyyy-MM');
  const pinsByDate = {};
  staffList.forEach(staff => {
    (staff.fixedDays || []).forEach(dateStr => {
      if (!dateStr.startsWith(monthPrefix)) return;
      if (!pinsByDate[dateStr]) pinsByDate[dateStr] = [];
      pinsByDate[dateStr].push(staff.id);
    });
  });
  return pinsByDate;
}

/**
 * 產生醫院班表
 * @param {number} year
 * @param {number} month (0-11)
 * @param {Array} staffList - Array of { id, name, level, maxWeekdays, maxWeekends, offDays, fixedDays }
 * @param {Object} globalReq - { total, minR, minPGY }
 * @param {Object} dailyReqOverrides - { 'YYYY-MM-DD': { total, minR, minPGY } }
 * @returns { schedule, shortages }
 */
export function generateSchedule(year, month, staffList, globalReq, dailyReqOverrides = {}) {
  const daysInMonth = getDaysInMonth(new Date(year, month));
  const schedule = {};
  const shortages = [];

  // Track shifts
  const shiftCountsWD = {};
  const shiftCountsWE = {};
  const shiftCountsTotal = {};

  staffList.forEach(staff => {
    shiftCountsWD[staff.id] = 0;
    shiftCountsWE[staff.id] = 0;
    shiftCountsTotal[staff.id] = 0;
  });

  // 0. 指定值班 (Pins): 先把額度預扣起來，演算法才不會把他們的額度用光
  const pinsByDate = collectPins(year, month, staffList);
  Object.entries(pinsByDate).forEach(([dateStr, ids]) => {
    const isWE = isWeekendOrHoliday(parseISO(dateStr), dateStr, dailyReqOverrides);
    ids.forEach(id => {
      shiftCountsTotal[id]++;
      if (isWE) shiftCountsWE[id]++;
      else shiftCountsWD[id]++;
    });
  });

  let previousDayWorkers = new Set();
  let previousDayWorkers2DaysAgo = new Set();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateString = format(date, DATE_FMT);
    const isWE = isWeekendOrHoliday(date, dateString, dailyReqOverrides);

    // Merge requirements for this day
    const req = dailyReqOverrides[dateString] || globalReq;

    const pinnedToday = pinsByDate[dateString] || [];
    const pinnedTomorrow = new Set(pinsByDate[format(addDays(date, 1), DATE_FMT)] || []);
    const pinnedIn2Days = new Set(pinsByDate[format(addDays(date, 2), DATE_FMT)] || []);

    // 1. Filter out who is pinned, off today, worked yesterday, pinned tomorrow, hit quota, or out of availability boundary
    const availableStaff = staffList.filter(staff => {
      if (pinnedToday.includes(staff.id)) return false;
      if (staff.offDays && staff.offDays.includes(dateString)) return false;
      if (previousDayWorkers.has(staff.id)) return false;
      if (pinnedTomorrow.has(staff.id)) return false;

      if (staff.availability === 'First Half' && day > 15) return false;
      if (staff.availability === 'Second Half' && day <= 15) return false;

      if (isWE) {
        if (shiftCountsWE[staff.id] >= staff.maxWeekends) return false;
      } else {
        if (shiftCountsWD[staff.id] >= staff.maxWeekdays) return false;
      }
      return true;
    });

    // 2. Sort available staff by QOD penalty, then total shifts fairness
    // Penalty: If they worked N-2 (or are pinned on N+2), push them to the very bottom
    const hasQodRisk = (id) => previousDayWorkers2DaysAgo.has(id) || pinnedIn2Days.has(id);
    availableStaff.sort((a, b) => {
      const aRisk = hasQodRisk(a.id);
      const bRisk = hasQodRisk(b.id);

      if (aRisk !== bRisk) {
         return aRisk ? 1 : -1;
      }

      if (shiftCountsTotal[a.id] === shiftCountsTotal[b.id]) {
        return Math.random() - 0.5;
      }
      return shiftCountsTotal[a.id] - shiftCountsTotal[b.id];
    });

    // Pinned staff are always on duty (already counted above)
    const assignedToday = [...pinnedToday];
    const remainingStaff = [...availableStaff];

    // Helper: Find and assign by condition
    const assignByCondition = (conditionFunc) => {
      const idx = remainingStaff.findIndex(conditionFunc);
      if (idx !== -1) {
        const staff = remainingStaff[idx];
        assignedToday.push(staff.id);
        remainingStaff.splice(idx, 1);
        return true;
      }
      return false;
    };

    const levelOf = (id) => staffList.find(s => s.id === id).level;

    // 2.5 Fulfill minimum Senior R (R2/R3)
    let currentSeniorCount = assignedToday.filter(id => ['R2', 'R3'].includes(levelOf(id))).length;
    for (let i = currentSeniorCount; i < (req.minSeniorR || 0); i++) {
       if (assignedToday.length >= req.total) break;
       assignByCondition(s => s.level === 'R2' || s.level === 'R3');
    }

    // 3. Fulfill minimum R
    // Note: Senior Rs assigned above count towards the general minR requirement
    let currentRCount = assignedToday.filter(id => levelOf(id).startsWith('R')).length;
    for (let i = currentRCount; i < req.minR; i++) {
       if (assignedToday.length >= req.total) break;
       assignByCondition(s => s.level.startsWith('R'));
    }

    // 4. Fulfill minimum PGY
    let currentPGYCount = assignedToday.filter(id => levelOf(id).startsWith('PGY')).length;
    for (let i = currentPGYCount; i < req.minPGY; i++) {
       if (assignedToday.length >= req.total) break;
       assignByCondition(s => s.level.startsWith('PGY'));
    }

    // 5. Fill remaining spots with anyone left
    while (assignedToday.length < req.total && remainingStaff.length > 0) {
       const staff = remainingStaff.shift();
       assignedToday.push(staff.id);
    }

    // Update counts (pinned staff were pre-counted)
    assignedToday.forEach(id => {
      if (pinnedToday.includes(id)) return;
      shiftCountsTotal[id]++;
      if (isWE) shiftCountsWE[id]++;
      else shiftCountsWD[id]++;
    });

    schedule[dateString] = assignedToday;
    previousDayWorkers2DaysAgo = previousDayWorkers;
    previousDayWorkers = new Set(assignedToday);

    // 6. Check shortages
    if (assignedToday.length < req.total) {
      shortages.push(dateString);
    }
  }

  return { schedule, shortages };
}

/**
 * 找出指定值班與規則衝突的地方 (指定優先，只做警告)
 * @returns {Object} { 'YYYY-MM-DD': [{ staffId, type: 'offDay' | 'consecutive' | 'availability' | 'quota' }] }
 */
export function findPinConflicts(year, month, staffList, dailyReqOverrides = {}) {
  const pinsByDate = collectPins(year, month, staffList);
  const conflicts = {};
  const add = (dateStr, staffId, type) => {
    if (!conflicts[dateStr]) conflicts[dateStr] = [];
    conflicts[dateStr].push({ staffId, type });
  };

  staffList.forEach(staff => {
    const pinned = Object.keys(pinsByDate).filter(d => pinsByDate[d].includes(staff.id)).sort();
    let wd = 0;
    let we = 0;

    pinned.forEach(dateStr => {
      const date = parseISO(dateStr);
      const day = date.getDate();

      if (staff.offDays?.includes(dateStr)) add(dateStr, staff.id, 'offDay');
      if (pinned.includes(format(addDays(date, -1), DATE_FMT))) add(dateStr, staff.id, 'consecutive');
      if ((staff.availability === 'First Half' && day > 15) || (staff.availability === 'Second Half' && day <= 15)) {
        add(dateStr, staff.id, 'availability');
      }

      if (isWeekendOrHoliday(date, dateStr, dailyReqOverrides)) {
        if (++we > staff.maxWeekends) add(dateStr, staff.id, 'quota');
      } else {
        if (++wd > staff.maxWeekdays) add(dateStr, staff.id, 'quota');
      }
    });
  });

  return conflicts;
}

/**
 * 計算每位醫師的值班統計 (平日 / 假日 / QOD)
 * @returns {Array} staffList 順序的 [{ ...staff, dates, wdCount, weCount, qodCount }]
 */
export function computeStaffStats(schedule, staffList, dailyReqOverrides = {}) {
  const stats = staffList.map(staff => ({
    ...staff,
    dates: [],
    wdCount: 0,
    weCount: 0,
    qodCount: 0,
  }));
  const byId = Object.fromEntries(stats.map(s => [s.id, s]));

  Object.entries(schedule).forEach(([dateStr, staffIds]) => {
    const isWE = isWeekendOrHoliday(parseISO(dateStr), dateStr, dailyReqOverrides);
    staffIds.forEach(id => {
      const p = byId[id];
      if (!p) return;
      p.dates.push(dateStr);
      if (isWE) p.weCount++;
      else p.wdCount++;
    });
  });

  // Detect QODs (Work -> Rest -> Work)
  stats.forEach(p => {
    p.dates.sort(); // String sort works for YYYY-MM-DD
    for (let i = 1; i < p.dates.length; i++) {
      if (differenceInDays(parseISO(p.dates[i]), parseISO(p.dates[i - 1])) === 2) p.qodCount++;
    }
  });

  return stats;
}

const spread = (values) => (values.length ? Math.max(...values) - Math.min(...values) : 0);

/**
 * 一次跑很多組排班，去重後依品質排序
 * 排序優先序：缺人天數 → QOD 次數 → 總班數差距 → 假日班差距
 * @returns {Array} [{ schedule, shortages, score: { shortageDays, qodTotal, shiftSpread, weekendSpread } }]
 */
export function generateCandidates(year, month, staffList, globalReq, dailyReqOverrides = {}, { runs = 50, keep = 10 } = {}) {
  const seen = new Set();
  const candidates = [];

  for (let i = 0; i < runs; i++) {
    const result = generateSchedule(year, month, staffList, globalReq, dailyReqOverrides);
    const key = JSON.stringify(Object.values(result.schedule).map(ids => [...ids].sort()));
    if (seen.has(key)) continue;
    seen.add(key);

    const stats = computeStaffStats(result.schedule, staffList, dailyReqOverrides);
    candidates.push({
      ...result,
      score: {
        shortageDays: result.shortages.length,
        qodTotal: stats.reduce((sum, s) => sum + s.qodCount, 0),
        shiftSpread: spread(stats.map(s => s.wdCount + s.weCount)),
        weekendSpread: spread(stats.map(s => s.weCount)),
      },
    });
  }

  const order = ['shortageDays', 'qodTotal', 'shiftSpread', 'weekendSpread'];
  candidates.sort((a, b) => {
    for (const k of order) {
      if (a.score[k] !== b.score[k]) return a.score[k] - b.score[k];
    }
    return 0;
  });

  return candidates.slice(0, keep);
}
