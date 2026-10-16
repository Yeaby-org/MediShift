# CLAUDE.md

## 專案概述
MediShift（npm 名稱 `hospital-scheduler`）是醫院住院醫師 / PGY 的值班排班系統，純前端 SPA，沒有後端、沒有持久化：所有資料都存在 React state，重新整理就會回到 `INITIAL_STAFF` 預設資料。

## 常用指令
```bash
npm install
npm run dev       # Vite dev server（網址含 base path：/MediShift/）
npm run build     # 輸出到 dist/
npm run lint      # ESLint 9 flat config
npm run preview
```
目前沒有測試框架。`npm run lint` 原本就有 3 個 `no-unused-vars` 錯誤（Sidebar.jsx、StaffModal.jsx）和 1 個 exhaustive-deps 警告（App.jsx），不是新改動造成的。

## 技術棧
React 19 + Vite 8、Tailwind CSS 3（PostCSS）、date-fns 4、lucide-react（icons）、uuid，以及 `clsx` + `tailwind-merge`（包成 `src/lib/utils.js` 的 `cn()`）。語言是 JavaScript/JSX，不用 TypeScript。

## 架構
- **狀態集中在 `src/App.jsx`**：staffList、dailyRequirements、dailyReqOverrides、manualOverrides、baseSchedule、shortages 都在這裡，透過 props 傳給子元件（沒有 Context/Redux，只有 i18n 例外）。
- **排班演算法 `src/lib/scheduler.js`**：`generateSchedule(year, month, staffList, globalReq, dailyReqOverrides)` 回傳 `{ schedule, shortages }`。
  - `schedule` 的格式為 `{ 'yyyy-MM-dd': [staffId, ...] }`
  - 規則依序處理：offDays、不連續值班（前一天有班就排除）、availability（`Full Month` / `First Half` 1–15 日 / `Second Half`）、平日/假日上限（`maxWeekdays` / `maxWeekends`）
  - 排序：前天有值班（QOD）的人排到最後，其次按總班數公平分配，同分時隨機
  - 填人順序：`minSeniorR`（R2/R3）→ `minR`（任何 R*）→ `minPGY`（PGY*）→ 剩下的名額隨便補
  - 週末，或 override 設了 `isHoliday` 的日子，消耗的是 weekend 額度
- **兩層 override**：
  - `dailyReqOverrides[date]` 改寫某天的人力需求（`{ total, minR, minSeniorR, minPGY, isHoliday }`），在排班時生效
  - `manualOverrides[date]` 手動指定某天的人員，排班後才 merge 進結果；重新產生班表時會清空
- **切換月份會自動重新排班**（App.jsx 的 `useEffect`，依賴 `currentMonthDate`）。
- **職級字串**：`R1`/`R2`/`R3`/`PGY1`… 演算法用 `startsWith('R')` / `startsWith('PGY')` 判斷，新增職級時要注意這點。
- **元件 `src/components/`**：
  - `Sidebar`：人員清單、全域需求、搜尋、產生/清除班表
  - `CalendarView`：月曆、單日規則與人員編輯
  - `StaffAnalyticsView`：統計分頁
  - `StaffModal`：新增/編輯人員、多選休假日
  - `RuleModal`：批次設定多天規則

## i18n
`src/lib/i18n.jsx` 自己實作 Context，提供 `useTranslation()`，回傳 `{ t, lang, setLang }`。字典分 `en` / `zh` 兩組，key 用點分隔（如 `sidebar.generateBtn`）。**新增 UI 文字時，兩個語系都要加上同一個 key**；缺 key 時畫面會直接顯示 key 字串。預設語言是 `en`。

## 部署
推到 `main` 就會觸發 `.github/workflows/deploy.yml`，build 後部署到 GitHub Pages。`vite.config.js` 的 `base: '/MediShift/'` 必須和 repo 名稱一致，不要刪掉。

## 慣例
- 樣式一律用 Tailwind utility class；條件 class 用 `cn()` 組合。主色系是 indigo / slate。
- 日期字串一律用 date-fns 的 `format(date, 'yyyy-MM-dd')` 當 key。
- 註解中英混用，可以沿用既有風格。
