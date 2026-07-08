// Firm attorneys who can be lead/appearing counsel on our side. Used to
// populate the 「委任律師」 dropdown when creating a 開庭通知 calendar entry.
//
// calendarLabel is the "surname + 律師" short form used in calendar titles
// per the admin's naming convention (e.g. 陳愷閎律師 → 陳律師). If the firm
// adds/removes attorneys, update this list — nothing elsewhere hardcodes names.
export const ATTORNEYS = [
  { fullName: '程立全律師', calendarLabel: '程律師' },
  { fullName: '陳愷閎律師', calendarLabel: '陳律師' },
  { fullName: '林紫彤律師', calendarLabel: '林律師' },
  { fullName: '王雅楨律師', calendarLabel: '王律師' },
]

export function calendarLabelFor(fullName) {
  return ATTORNEYS.find((a) => a.fullName === fullName)?.calendarLabel ?? fullName ?? ''
}
