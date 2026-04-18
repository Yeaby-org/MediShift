import { getDaysInMonth, format, isWeekend } from 'date-fns';

/**
 * 產生醫院班表
 * @param {number} year 
 * @param {number} month (0-11)
 * @param {Array} staffList - Array of { id, name, level, maxWeekdays, maxWeekends, offDays }
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

  let previousDayWorkers = new Set();
  let previousDayWorkers2DaysAgo = new Set();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateString = format(date, 'yyyy-MM-dd');
    const isWE = isWeekend(date) || Boolean(dailyReqOverrides[dateString]?.isHoliday);

    // Merge requirements for this day
    const req = dailyReqOverrides[dateString] || globalReq;

    // 1. Filter out who is off today, worked yesterday, hit quota, or out of availability boundary
    const availableStaff = staffList.filter(staff => {
      if (staff.offDays && staff.offDays.includes(dateString)) return false;
      if (previousDayWorkers.has(staff.id)) return false;
      
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
    // Penalty: If they worked N-2, push them to the very bottom
    availableStaff.sort((a, b) => {
      const aWorkedN2 = previousDayWorkers2DaysAgo.has(a.id);
      const bWorkedN2 = previousDayWorkers2DaysAgo.has(b.id);
      
      if (aWorkedN2 !== bWorkedN2) {
         return aWorkedN2 ? 1 : -1;
      }

      if (shiftCountsTotal[a.id] === shiftCountsTotal[b.id]) {
        return Math.random() - 0.5;
      }
      return shiftCountsTotal[a.id] - shiftCountsTotal[b.id];
    });

    const assignedToday = [];
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

    // 2.5 Fulfill minimum Senior R (R2/R3)
    for (let i = 0; i < (req.minSeniorR || 0); i++) {
       if (assignedToday.length >= req.total) break;
       assignByCondition(s => s.level === 'R2' || s.level === 'R3');
    }

    // 3. Fulfill minimum R
    // Note: Senior Rs assigned above count towards the general minR requirement
    let currentRCount = assignedToday.filter(id => staffList.find(s => s.id === id).level.startsWith('R')).length;
    for (let i = currentRCount; i < req.minR; i++) {
       if (assignedToday.length >= req.total) break;
       assignByCondition(s => s.level.startsWith('R'));
    }

    // 4. Fulfill minimum PGY
    let currentPGYCount = assignedToday.filter(id => staffList.find(s => s.id === id).level.startsWith('PGY')).length;
    for (let i = currentPGYCount; i < req.minPGY; i++) {
       if (assignedToday.length >= req.total) break;
       assignByCondition(s => s.level.startsWith('PGY'));
    }

    // 5. Fill remaining spots with anyone left
    while (assignedToday.length < req.total && remainingStaff.length > 0) {
       const staff = remainingStaff.shift();
       assignedToday.push(staff.id);
    }

    // Update counts
    assignedToday.forEach(id => {
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
