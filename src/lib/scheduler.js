import { getDaysInMonth, format, isWeekend, addDays, differenceInDays, parseISO } from 'date-fns';

const DATE_FMT = 'yyyy-MM-dd';

// Seeded PRNG (mulberry32) so the same seed always reproduces the same candidates
function createRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const isWeekendOrHoliday =(date, dateString, dailyReqOverrides) =>
  isWeekend(date) || Boolean(dailyReqOverrides[dateString]?.isHoliday);

/**
 * 找出完整的「週四值班 → 五六日 OFF」區段 (四天都要在本月)
 * 值班是過夜班，週四值完班週五才會 OFF，接著六日才是三天連假
 * @param {Array} dates - 本月日期字串
 * @returns {Array} [{ thu, off: ['fri', 'sat', 'sun'] }, ...]
 */
function getWeekendBlocks(dates) {
  const dateSet = new Set(dates);
  const shift = (d, n) => format(addDays(parseISO(d), n), DATE_FMT);
  return dates
    .filter(d => parseISO(d).getDay() === 4)
    .map(thu => ({ thu, off: [shift(thu, 1), shift(thu, 2), shift(thu, 3)] }))
    .filter(block => block.off.every(d => dateSet.has(d)));
}

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
 * @param {Array} staffList - Array of { id, name, level, maxWeekdays, maxWeekends, offDays, fixedDays, minWeekendBreaks }
 * @param {Object} globalReq - { total, minR, minPGY }
 * @param {Object} dailyReqOverrides - { 'YYYY-MM-DD': { total, minR, minPGY, isHoliday, noDuty } }
 * @param {Function} random - () => [0, 1), defaults to Math.random
 * @returns { schedule, shortages }
 */
export function generateSchedule(year, month, staffList, globalReq, dailyReqOverrides = {}, random = Math.random) {
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

  // 0.5 五六日連假: 替有設定的醫師隨機選幾個週末，週四優先排他、週三和五六日避開他
  // (優先選週四已指定值班、或五六日本來就請假的週末)
  const breakWantDuty = {};
  const breakAvoid = {};
  const wantsBreaks = staffList.filter(staff => staff.minWeekendBreaks > 0);
  if (wantsBreaks.length > 0) {
    const monthDates = Array.from({ length: daysInMonth }, (_, i) => format(new Date(year, month, i + 1), DATE_FMT));
    const blocks = getWeekendBlocks(monthDates);
    wantsBreaks.forEach(staff => {
      const pinned = new Set(staff.fixedDays || []);
      const off = new Set(staff.offDays || []);
      const picks = blocks
        .filter(block => !off.has(block.thu) && !block.off.some(d => pinned.has(d)))
        .map(block => ({
          block,
          thuPinned: pinned.has(block.thu) ? 1 : 0,
          overlap: block.off.filter(d => off.has(d)).length,
          r: random(),
        }))
        .sort((a, b) => b.thuPinned - a.thuPinned || b.overlap - a.overlap || a.r - b.r)
        .slice(0, staff.minWeekendBreaks);
      breakWantDuty[staff.id] = new Set(picks.map(p => p.block.thu));
      // 週三值班的話週四會被「不連續」規則擋掉，所以週三也避開
      breakAvoid[staff.id] = new Set(picks.flatMap(p => [format(addDays(parseISO(p.block.thu), -1), DATE_FMT), ...p.block.off]));
    });
  }

  let previousDayWorkers = new Set();
  let previousDayWorkers2DaysAgo = new Set();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateString = format(date, DATE_FMT);
    const isWE = isWeekendOrHoliday(date, dateString, dailyReqOverrides);

    // Merge requirements for this day (不值班日：需求歸零，只留指定的人)
    const override = dailyReqOverrides[dateString];
    const req = override?.noDuty
      ? { total: 0, minR: 0, minSeniorR: 0, minPGY: 0 }
      : override || globalReq;

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

    // 2. Sort available staff by reserved weekend break, QOD penalty, then total shifts fairness
    // Reserved breaks go last (寧可 QOD 也先保住連假); QOD risk = worked N-2 or pinned on N+2
    const hasQodRisk = (id) => previousDayWorkers2DaysAgo.has(id) || pinnedIn2Days.has(id);
    // -1: 連假前的週四想排他, +1: 連假要避開他, 0: 其他
    const breakRank = (id) => (breakWantDuty[id]?.has(dateString) ? -1 : breakAvoid[id]?.has(dateString) ? 1 : 0);
    availableStaff.sort((a, b) => {
      if (breakRank(a.id) !== breakRank(b.id)) {
         return breakRank(a.id) - breakRank(b.id);
      }

      const aRisk = hasQodRisk(a.id);
      const bRisk = hasQodRisk(b.id);

      if (aRisk !== bRisk) {
         return aRisk ? 1 : -1;
      }

      if (shiftCountsTotal[a.id] === shiftCountsTotal[b.id]) {
        return random() - 0.5;
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
 * @returns {Object} { 'YYYY-MM-DD': [{ staffId, type: 'offDay' | 'noDuty' | 'consecutive' | 'availability' | 'quota' }] }
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
      if (dailyReqOverrides[dateStr]?.noDuty) add(dateStr, staff.id, 'noDuty');
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
 * 計算每位醫師的值班統計 (平日 / 假日 / QOD / 五六日連假)
 * @returns {Array} staffList 順序的 [{ ...staff, dates, wdCount, weCount, qodCount, weekendBreaks }]
 */
export function computeStaffStats(schedule, staffList, dailyReqOverrides = {}) {
  const stats = staffList.map(staff => ({
    ...staff,
    dates: [],
    wdCount: 0,
    weCount: 0,
    qodCount: 0,
    weekendBreaks: 0,
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

  // Detect QODs (Work -> Rest -> Work) and full Fri–Sun breaks
  const blocks = getWeekendBlocks(Object.keys(schedule).sort());
  stats.forEach(p => {
    p.dates.sort(); // String sort works for YYYY-MM-DD
    for (let i = 1; i < p.dates.length; i++) {
      if (differenceInDays(parseISO(p.dates[i]), parseISO(p.dates[i - 1])) === 2) p.qodCount++;
    }
    p.weekendBreaks = blocks.filter(block => p.dates.includes(block.thu) && !block.off.some(d => p.dates.includes(d))).length;
  });

  return stats;
}

/**
 * 比較兩份班表，找出每天換上 / 換下的人
 * @returns {Object} { 'YYYY-MM-DD': { added: [staffId], removed: [staffId] } } (只含有差異的日期)
 */
export function diffSchedules(base, target) {
  const diff = {};
  new Set([...Object.keys(base), ...Object.keys(target)]).forEach(date => {
    const before = base[date] || [];
    const after = target[date] || [];
    const added = after.filter(id => !before.includes(id));
    const removed = before.filter(id => !after.includes(id));
    if (added.length || removed.length) diff[date] = { added, removed };
  });
  return diff;
}

const spread = (values) => (values.length ? Math.max(...values) - Math.min(...values) : 0);

/**
 * 一次跑很多組排班，去重後依品質排序
 * 排序優先序：缺人天數 → 連假不足 → QOD 次數 → 總班數差距 → 假日班差距
 * @returns {Array} [{ schedule, shortages, score: { shortageDays, breakShortfall, qodTotal, shiftSpread, weekendSpread } }]
 */
export function generateCandidates(year, month, staffList, globalReq, dailyReqOverrides = {}, { runs = 50, keep = 10, seed } = {}) {
  const seen = new Set();
  const candidates = [];
  const random = seed === undefined ? Math.random : createRandom(seed);

  for (let i = 0; i < runs; i++) {
    const result = generateSchedule(year, month, staffList, globalReq, dailyReqOverrides, random);
    const key = JSON.stringify(Object.values(result.schedule).map(ids => [...ids].sort()));
    if (seen.has(key)) continue;
    seen.add(key);

    const stats = computeStaffStats(result.schedule, staffList, dailyReqOverrides);
    candidates.push({
      ...result,
      score: {
        shortageDays: result.shortages.length,
        breakShortfall: stats.reduce((sum, s) => sum + Math.max(0, (s.minWeekendBreaks || 0) - s.weekendBreaks), 0),
        qodTotal: stats.reduce((sum, s) => sum + s.qodCount, 0),
        shiftSpread: spread(stats.map(s => s.wdCount + s.weCount)),
        weekendSpread: spread(stats.map(s => s.weCount)),
      },
    });
  }

  const order = ['shortageDays', 'breakShortfall', 'qodTotal', 'shiftSpread', 'weekendSpread'];
  candidates.sort((a, b) => {
    for (const k of order) {
      if (a.score[k] !== b.score[k]) return a.score[k] - b.score[k];
    }
    return 0;
  });

  return candidates.slice(0, keep);
}
