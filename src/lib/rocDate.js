// 民國年日期字串（如 "114.02.10"）→ 西元 ISO 日期（"2025-02-10"）。
// Google Sheet 匯入的資料裡，有些儲存格塞了不只一個日期（換行分隔，通常是
// 「同案」註記，如 "114.08.22\n114.09.19(同案)"），這裡只取「第一個」看起來
// 像民國年日期的片段來排序用，原始字串仍完整保留在 closedDateRaw 供人工核對。
const ROC_DATE_RE = /(\d{2,3})\.(\d{1,2})\.(\d{1,2})/

export function rocToISO(raw) {
  if (!raw) return null
  const match = raw.match(ROC_DATE_RE)
  if (!match) return null
  const [, rocYear, month, day] = match
  const gregorianYear = Number(rocYear) + 1911
  const m = String(month).padStart(2, '0')
  const d = String(day).padStart(2, '0')
  return `${gregorianYear}-${m}-${d}`
}
