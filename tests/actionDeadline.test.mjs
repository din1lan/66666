import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  getAdvanceReminderDays,
  computeActionDeadline,
  computeReminderDate,
  buildDeadlineTitle,
  buildReminderTitle,
} from '../src/data/actionDeadline.js'
import { isBusinessDay, previousBusinessDay } from '../src/lib/taiwanHolidays.js'

test('getAdvanceReminderDays follows the tier table from the spec', () => {
  assert.equal(getAdvanceReminderDays(3), 0)
  assert.equal(getAdvanceReminderDays(4), 2)
  assert.equal(getAdvanceReminderDays(5), 2)
  assert.equal(getAdvanceReminderDays(6), 3)
  assert.equal(getAdvanceReminderDays(13), 3)
  assert.equal(getAdvanceReminderDays(14), 5)
  assert.equal(getAdvanceReminderDays(20), 5)
  assert.equal(getAdvanceReminderDays(21), 7)
  assert.equal(getAdvanceReminderDays(60), 7)
  assert.equal(getAdvanceReminderDays(61), 14)
  assert.equal(getAdvanceReminderDays(150), 14)
  assert.equal(getAdvanceReminderDays(151), 30)
})

// 2026-08-03 is a Monday (verified via `date -d 2026-08-03 +%A`).
// Monday + 5 days = 2026-08-08, a Saturday -> must roll back to Friday 08-07.
test('computeActionDeadline rolls a Saturday deadline back to the preceding Friday', () => {
  const r = computeActionDeadline('2026-08-03', 5, { isBusinessDay, previousBusinessDay })
  assert.equal(r.naiveDeadline, '2026-08-08')
  assert.equal(r.finalDeadline, '2026-08-07')
  assert.equal(r.rolledForward, true)
})

// Monday + 6 days = 2026-08-09, a Sunday -> rolls back over the whole weekend to Friday.
test('computeActionDeadline rolls a Sunday deadline back over the whole weekend', () => {
  const r = computeActionDeadline('2026-08-03', 6, { isBusinessDay, previousBusinessDay })
  assert.equal(r.naiveDeadline, '2026-08-09')
  assert.equal(r.finalDeadline, '2026-08-07')
  assert.equal(r.rolledForward, true)
})

// Monday + 3 days = 2026-08-06, a Thursday -> business day already, no rollforward.
test('computeActionDeadline leaves a business-day deadline untouched', () => {
  const r = computeActionDeadline('2026-08-03', 3, { isBusinessDay, previousBusinessDay })
  assert.equal(r.naiveDeadline, '2026-08-06')
  assert.equal(r.finalDeadline, '2026-08-06')
  assert.equal(r.rolledForward, false)
})

test('computeActionDeadline without holiday helpers falls back to the naive date', () => {
  const r = computeActionDeadline('2026-08-03', 5)
  assert.equal(r.finalDeadline, r.naiveDeadline)
  assert.equal(r.rolledForward, false)
})

test('computeReminderDate subtracts the tiered advance days from the final deadline', () => {
  // 5-day period -> tier advance = 2 days; final deadline 2026-08-07 -> reminder 2026-08-05.
  const r = computeReminderDate('2026-08-07', 5)
  assert.deepEqual(r, { reminderDate: '2026-08-05', advanceDays: 2 })
})

test('computeReminderDate returns null when the tier says no reminder is needed', () => {
  assert.equal(computeReminderDate('2026-08-06', 3), null)
})

test('buildDeadlineTitle matches the spec example: 王小明補繳裁判費末日-115訴1', () => {
  const title = buildDeadlineTitle({ person: '王小明', action: '補繳裁判費', caseNumberDisplay: '115訴1' })
  assert.equal(title, '王小明補繳裁判費末日-115訴1')
})

test('buildDeadlineTitle omits the case-number segment when there is none', () => {
  const title = buildDeadlineTitle({ person: '王小明', action: '補繳裁判費', caseNumberDisplay: '' })
  assert.equal(title, '王小明補繳裁判費末日')
})

test('buildReminderTitle matches the spec example: 5/5王小明補繳裁判費末日-115訴1', () => {
  const mainTitle = buildDeadlineTitle({ person: '王小明', action: '補繳裁判費', caseNumberDisplay: '115訴1' })
  const reminderTitle = buildReminderTitle({ finalDeadline: '2026-05-05', mainTitle })
  assert.equal(reminderTitle, '5/5王小明補繳裁判費末日-115訴1')
})
