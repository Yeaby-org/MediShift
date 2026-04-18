/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from 'react';

const dictionary = {
  en: {
    // App Header
    'app.previous': 'Previous',
    'app.next': 'Next',
    'app.calendar': 'Calendar',
    'app.analytics': 'Analytics',
    'app.shortages': 'Shortages',
    'app.fullyStaffed': 'Fully Staffed',

    // Sidebar
    'sidebar.searchPlaceholder': 'Search staff in schedule...',
    'sidebar.shifts': "'s Shifts",
    'sidebar.noShifts': 'No shifts assigned.',
    'sidebar.globalReq': 'Global Daily Requirements',
    'sidebar.defaultTotal': 'Default Daily Staffing',
    'sidebar.rulePlannerBtn': 'Custom Day Rules Planner',
    'sidebar.directory': 'Staff Directory',
    'sidebar.wd': 'WD',
    'sidebar.we': 'WE',
    'sidebar.off': 'Off',
    'sidebar.addStaffBtn': 'Add New Staff',
    'sidebar.generateBtn': 'Generate Schedule',
    'sidebar.clearBtn': 'Clear Schedule',

    // RuleModal
    'ruleModal.title': 'Custom Day Rules Planner',
    'ruleModal.selectDays': 'Select Days',
    'ruleModal.selectDaysDesc': 'Click to toggle dates for massive rule assignment.',
    'ruleModal.pickWeekends': 'Pick Weekends',
    'ruleModal.applyRules': 'Apply Rules',
    'ruleModal.daysSelected': 'days selected',
    'ruleModal.totalNeeds': 'Total Needs',
    'ruleModal.minSeniorR': 'Min (R2/R3)',
    'ruleModal.minR': 'Min Any R',
    'ruleModal.minPGY': 'Min PGY',
    'ruleModal.treatHoliday': '🌴 Treat as National Holiday (consumes weekend quota)',
    'ruleModal.applyBtn': 'Apply Rules to',
    'ruleModal.activeRules': 'Custom Active Rules',
    'ruleModal.noRules': 'No specific rules applied this month.',

    // CalendarView
    'cal.assigned': 'Assigned',
    'cal.day': 'Day',
    'cal.status': 'Status',
    'cal.shortage': 'Shortage',
    'cal.filled': 'Filled',
    'cal.dayReq': 'Day Requirements',
    'cal.overridden': 'OVERRIDDEN',
    'cal.total': 'Total',
    'cal.snrR': 'Snr R',
    'cal.anyR': 'Any R',
    'cal.pgy': 'PGY',
    'cal.markHoliday': 'Mark as Holiday (Weekend Quota)',
    'cal.cancel': 'Cancel',
    'cal.saveRules': 'Save Rules',
    'cal.manualTarget': 'Manual Staff Target',
    'cal.selected': 'Selected',
    'cal.done': 'Done',

    // StaffAnalyticsView
    'stat.title': 'Staff Analytics & Fairness Report',
    'stat.desc': 'Analyzing',
    'stat.membersFor': 'staff members for the month of',
    'stat.totalShifts': 'Total Shifts',
    'stat.weekdays': 'Weekdays',
    'stat.weekends': 'Weekends',
    'stat.qodIncidents': 'QOD Incidents (Fatigue)',
    'stat.noQod': 'No QOD Incidents',
    'stat.assignedDates': 'Assigned Dates',
    'stat.noShiftsAssigned': 'No shifts assigned.',
    'stat.reqOffDays': 'Requested Off-Days',

    // StaffModal
    'staff.newTitle': 'New Staff Member',
    'staff.editTitle': 'Edit Staff Profile',
    'staff.name': 'Full Name',
    'staff.role': 'Role / Seniority',
    'staff.avail': 'Availability Period',
    'staff.fullMonth': 'Full Month',
    'staff.firstHalf': 'First Half (Day 1-15)',
    'staff.secondHalf': 'Second Half (Day 16+)',
    'staff.quotas': 'Shift Quotas',
    'staff.maxWd': 'Max Weekdays',
    'staff.maxWe': 'Max Weekends',
    'staff.offDays': 'Pre-scheduled Off Days',
    'staff.noOff': 'No off days added.',
    'staff.cancel': 'Cancel',
    'staff.addStaff': 'Add Staff',
    'staff.saveChanges': 'Save Changes',
    'staff.clickToToggle': 'Click to toggle off-days for the current view month.'
  },
  zh: {
    // App Header
    'app.previous': '上個月',
    'app.next': '下個月',
    'app.calendar': '📅 醫院班表排班',
    'app.analytics': '📊 排班分析',
    'app.shortages': '名額短缺',
    'app.fullyStaffed': '人力達成',

    // Sidebar
    'sidebar.searchPlaceholder': '搜尋醫師排班...',
    'sidebar.shifts': ' 的班表',
    'sidebar.noShifts': '尚未排班。',
    'sidebar.globalReq': '全域標準排班需求 (預設值)',
    'sidebar.defaultTotal': '每日保底總人數',
    'sidebar.rulePlannerBtn': '特殊日人力規則批次設定',
    'sidebar.directory': '醫師名冊',
    'sidebar.wd': '平',
    'sidebar.we': '假',
    'sidebar.off': 'Off',
    'sidebar.addStaffBtn': '+ 新增醫師 (Staff)',
    'sidebar.generateBtn': '一鍵產生排班 (Generate)',
    'sidebar.clearBtn': '清除全部班表 (Clear)',

    // RuleModal
    'ruleModal.title': '特殊日規則批次設定計畫 (Rule Planner)',
    'ruleModal.selectDays': '選擇欲設定的日期',
    'ruleModal.selectDaysDesc': '點擊表格選取多天，然後在右方一次套用規則。',
    'ruleModal.pickWeekends': '一鍵全選週末',
    'ruleModal.applyRules': '人力設定與套用',
    'ruleModal.daysSelected': '天已選取',
    'ruleModal.totalNeeds': '總人數',
    'ruleModal.minSeniorR': '至少 (R2/R3)',
    'ruleModal.minR': '至少任意 R',
    'ruleModal.minPGY': '至少 PGY',
    'ruleModal.treatHoliday': '🌴 設為國定連假 (將扣除假日班額度)',
    'ruleModal.applyBtn': '套用這個規則到',
    'ruleModal.activeRules': '目前已生效的特殊日覆寫',
    'ruleModal.noRules': '目前尚無特殊日規則',

    // CalendarView
    'cal.assigned': '目前指派',
    'cal.day': '星期',
    'cal.status': '排班狀態',
    'cal.shortage': '缺人',
    'cal.filled': '滿班',
    'cal.dayReq': '單日人力需求覆寫',
    'cal.overridden': '已被覆寫',
    'cal.total': '總和',
    'cal.snrR': '資深R',
    'cal.anyR': '任何R',
    'cal.pgy': 'PGY',
    'cal.markHoliday': '將這天標為受薪假日 (扣除假日額度)',
    'cal.cancel': '取消',
    'cal.saveRules': '儲存規則',
    'cal.manualTarget': '手動綁定 / 拔除醫師',
    'cal.selected': '已選取',
    'cal.done': '完成',

    // StaffAnalyticsView
    'stat.title': '排班狀態分析',
    'stat.desc': '目前正在為本月分析共',
    'stat.membersFor': '位的醫師排班資料：',
    'stat.totalShifts': '總值班數',
    'stat.weekdays': '平日班',
    'stat.weekends': '假日班 / 連假',
    'stat.qodIncidents': '次 QOD (過勞警告)',
    'stat.noQod': '無 QOD 狀況',
    'stat.assignedDates': '排到班的日期',
    'stat.noShiftsAssigned': '這個月他完全沒班。',
    'stat.reqOffDays': '原本預約的 Off 假',

    // StaffModal
    'staff.newTitle': '新增醫師資料',
    'staff.editTitle': '編輯醫師資料',
    'staff.name': '姓名',
    'staff.role': '職位等級',
    'staff.avail': '本月可值班區間',
    'staff.fullMonth': '全月皆可 (Full Month)',
    'staff.firstHalf': '僅上半月可值班 (1-15號)',
    'staff.secondHalf': '僅下半月可值班 (16號起)',
    'staff.quotas': '排班額度限制',
    'staff.maxWd': '平日值班上限',
    'staff.maxWe': '假日值班上限',
    'staff.offDays': '預約休假 (Off Days)',
    'staff.noOff': '還沒點選任何假',
    'staff.cancel': '取消',
    'staff.addStaff': '新增人員',
    'staff.saveChanges': '儲存變更',
    'staff.clickToToggle': '點擊表格來快速勾選他想排開的 Off-day。'
  }
};

export const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState('en');

  const t = (key) => {
    return dictionary[lang][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}
