// Local-date helpers.
//
// Never use `Date#toISOString().slice(0, 10)` to get a "YYYY-MM-DD" string
// for anything date-only (deadlines, "today", case-opened dates). That method
// converts to UTC first, which silently shifts the date by one day for any
// timezone ahead of UTC (e.g. Asia/Taipei, UTC+8) during that timezone's
// early-morning hours. Use formatLocalISO()/todayLocalISO() instead, which
// read the local calendar date directly.
export function formatLocalISO(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayLocalISO() {
  return formatLocalISO(new Date())
}
