// ============================================================================
// 「末日提醒」計算邏輯 — 狀態：DRAFT_UNVERIFIED，比照 deadlineRules.js 尚未經律師覆核
// ============================================================================
// 對應行政人員原本交給 Gemini 的規則，用於兩種情境（皆登記於行事曆「宥維工作」）：
//   1. 公文載明「請於 X 日內完成某動作」（如繳費、陳報）。
//   2. 書狀/裁判內的「教示條款」載明救濟期間（如上訴、抗告）。
//
// 計算方式：
//   - 以收文「隔日」為第一天起算（= 收文日 + N 曆日，恰好等於既有的
//     computeDeadlineDate(triggerDate, N)，兩者共用同一支函式）。
//   - 若算出的末日落在非工作日（週六日，未來可再加國定假日 — 見
//     taiwanHolidays.js 的 DRAFT_INCOMPLETE 狀態），順延至「前一個工作日」。
//   - 另外自動加開一筆「提前提醒」行事曆，依限期天數對應提醒天數分級表往前推。
//
// 原始規格曾有內部矛盾：使用者原始範例中「20 日教示期間」出現兩種算法 ——
// 分級表本身寫「14~20日：提前5日」，但範例文字卻寫「上訴限期為20日內，故以
// ...向前推20日」（提前20日，等於直接用限期天數本身）。
//
// 2026-07-08，丁一朗已確認：採「分級表」版本（14~20日 → 提前5日），原始範例
// 文字「提前20日」屬於誤植，不採用。分級表邏輯自此視為事務所已確認的正式規則
// ，不再是待澄清的草稿狀態；如果日後事務所想調整任何一級的天數，直接改下面
// REMINDER_TIERS 的數字即可，記得同步更新這裡的狀態說明與 README。
export const REMINDER_TIERS_STATUS = 'CONFIRMED_2026-07-08_BY_FIRM'

// 分級表：periodDays 落在 [min, max]（含端點）時，提前 advanceDays 天提醒。
// 21日~2個月 以 60 天當上限、3個月~5個月 以 61~150 天、6個月以上 以 151 天起
// 換算（1個月 ≈ 30 天），因為原規格用「月」描述這幾個分界，但所有實際案例
// 都是以「日」為單位輸入 —— 這個月→日的換算本身就是近似值，不是精確法律定義。
export const REMINDER_TIERS = [
  { min: 0, max: 3, advanceDays: 0, label: '3日以下：無需提前提醒' },
  { min: 4, max: 5, advanceDays: 2, label: '3~5日：提前2日提醒' },
  { min: 6, max: 13, advanceDays: 3, label: '6~13日：提前3日提醒' },
  { min: 14, max: 20, advanceDays: 5, label: '14~20日：提前5日提醒' },
  { min: 21, max: 60, advanceDays: 7, label: '21日~2個月：提前7日提醒' },
  { min: 61, max: 150, advanceDays: 14, label: '3個月~5個月：提前14日提醒' },
  { min: 151, max: Infinity, advanceDays: 30, label: '6個月以上：提前1個月提醒' },
]

export function getAdvanceReminderDays(periodDays) {
  const tier = REMINDER_TIERS.find((t) => periodDays >= t.min && periodDays <= t.max)
  return tier ? tier.advanceDays : 0
}

function addDaysISO(dateISO, days) {
  const d = new Date(dateISO + 'T00:00:00')
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

// naiveDeadline = triggerDate + periodDays（收文隔日起算第一天，符合現有
// computeDeadlineDate 的曆日加總邏輯，兩處共用同一種計算方式）。
// finalDeadline = naiveDeadline，若落在非工作日則順延至前一個工作日。
export function computeActionDeadline(triggerDateISO, periodDays, { previousBusinessDay, isBusinessDay } = {}) {
  const naiveDeadline = addDaysISO(triggerDateISO, periodDays)
  if (!isBusinessDay || !previousBusinessDay) {
    return { naiveDeadline, finalDeadline: naiveDeadline, rolledForward: false }
  }
  const finalDeadline = isBusinessDay(naiveDeadline) ? naiveDeadline : previousBusinessDay(naiveDeadline)
  return { naiveDeadline, finalDeadline, rolledForward: finalDeadline !== naiveDeadline }
}

// 提醒日 = 最終末日（順延後）往前推 advanceDays 天。advanceDays = 0 時代表
// 「無需提前提醒」，回傳 null（不產生提醒事件）。
export function computeReminderDate(finalDeadlineISO, periodDays) {
  const advanceDays = getAdvanceReminderDays(periodDays)
  if (advanceDays <= 0) return null
  return { reminderDate: addDaysISO(finalDeadlineISO, -advanceDays), advanceDays }
}

function shortMD(dateISO) {
  const [, m, d] = dateISO.split('-')
  return `${Number(m)}/${Number(d)}`
}

// 主要末日事件標題：「當事人+動作+末日-案號」（案號可省略）。
export function buildDeadlineTitle({ person, action, caseNumberDisplay }) {
  const base = `${person ?? ''}${action ?? ''}末日`
  return caseNumberDisplay ? `${base}-${caseNumberDisplay}` : base
}

// 提前提醒事件標題：「到期日(M/D)+末日行事曆標題」。
export function buildReminderTitle({ finalDeadline, mainTitle }) {
  return `${shortMD(finalDeadline)}${mainTitle}`
}
