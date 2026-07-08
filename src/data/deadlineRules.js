import { formatLocalISO } from '../lib/date.js'

// ============================================================================
// STATUTORY DEADLINE RULE TABLE  —  STATUS: DRAFT, PENDING LAWYER SIGN-OFF
// ============================================================================
// These rules were assembled from general research, NOT verified by a
// licensed attorney. Do NOT treat any computed date here as final without a
// human lawyer explicitly confirming it (see confirmedBy/confirmedAt on the
// deadline record). Do not remove RULES_STATUS below or silently mark rules
// as verified — that flag must only change after real legal review.
//
// Known gaps this table does NOT account for (must stay manual until someone
// with legal authority decides how to encode them):
//   - 在途期間 (in-transit/travel days added for parties outside the court's
//     jurisdiction) — depends on where the recipient was served, not just case type.
//   - 送達方式的推定送達日 (constructive service date nuances — mail vs.
//     public notice vs. personal service) — this table assumes triggerDate
//     IS already the legally-effective service date, which the user must
//     confirm themselves.
//   - Extensions already granted by the court (展延).
//   - Holidays/court recess extending a deadline to the next business day —
//     NOT applied here; the UI must display "business-day adjustment not
//     calculated, verify manually" alongside every computed date.
//
// Versioning: bump `version` and add a dated entry to CHANGELOG whenever a
// rule changes. Every deadline record stores which ruleId + version computed
// it, so historical deadlines remain auditable even after this table changes.

export const RULES_STATUS = 'DRAFT_UNVERIFIED' // flip to 'LAWYER_REVIEWED' only after real sign-off, and record who/when below.
export const RULES_REVIEWED_BY = null
export const RULES_REVIEWED_AT = null

export const CHANGELOG = [
  { version: '0.1.0', date: '2026-07-07', note: '初版草稿，來自一般性研究，尚未經律師覆核。' },
]

export const DEADLINE_RULES = [
  {
    id: 'civil_judgment_appeal',
    version: '0.1.0',
    label: '民事判決送達 → 上訴期間',
    eventType: '收到民事判決',
    days: 20,
    dayType: 'calendar',
    basis: '民事訴訟法 第440條（一般規定，特殊程序如小額訴訟另有規定，需人工確認）',
    notes: '不變期間；在途期間未計算，須人工確認送達地點是否有加計在途期間。',
  },
  {
    id: 'civil_ruling_appeal',
    version: '0.1.0',
    label: '民事裁定送達 → 抗告期間',
    eventType: '收到民事裁定',
    days: 10,
    dayType: 'calendar',
    basis: '民事訴訟法 第487條',
    notes: '不變期間；在途期間未計算。',
  },
  {
    id: 'criminal_judgment_appeal',
    version: '0.1.0',
    label: '刑事判決送達 → 上訴期間',
    eventType: '收到刑事判決',
    days: 20,
    dayType: 'calendar',
    basis: '刑事訴訟法 第349條',
    notes: '不變期間；在途期間未計算。',
  },
  {
    id: 'criminal_ruling_appeal',
    version: '0.1.0',
    label: '刑事裁定送達 → 抗告期間',
    eventType: '收到刑事裁定',
    days: 10,
    dayType: 'calendar',
    basis: '刑事訴訟法 第406條',
    notes: '不變期間；在途期間未計算。',
  },
  {
    id: 'administrative_judgment_appeal',
    version: '0.1.0',
    label: '行政訴訟判決送達 → 上訴期間',
    eventType: '收到行政訴訟判決',
    days: 20,
    dayType: 'calendar',
    basis: '行政訴訟法 第241條',
    notes: '不變期間；在途期間未計算。',
  },
  {
    id: 'payment_order_objection',
    version: '0.1.0',
    label: '支付命令送達 → 異議期間',
    eventType: '收到支付命令',
    days: 20,
    dayType: 'calendar',
    basis: '民事訴訟法 第516條',
    notes: '不變期間；逾期支付命令得為執行名義，風險高，務必優先處理。',
  },
]

export function findRule(ruleId) {
  return DEADLINE_RULES.find((r) => r.id === ruleId) || null
}

// Pure calendar-day addition. Deliberately does NOT apply business-day
// rollforward or in-transit days — see file header. Returns an ISO date string
// (YYYY-MM-DD).
//
// IMPORTANT: this builds the result from local getFullYear/getMonth/getDate,
// NOT toISOString(). toISOString() converts to UTC first, which silently
// shifts the date by one day in any timezone ahead of UTC (e.g. Asia/Taipei,
// UTC+8) whenever local midnight lands in the previous UTC day. For a
// statutory deadline calculator that's a real off-by-one-day bug, not a
// cosmetic one — caught by /tests/deadlineRules.test.mjs, keep that test
// passing if you touch this function.
export function computeDeadlineDate(triggerDateISO, days) {
  const d = new Date(triggerDateISO + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return formatLocalISO(d)
}
