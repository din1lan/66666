import { test } from 'node:test'
import assert from 'node:assert/strict'
import { isWeekend, isBusinessDay, previousBusinessDay } from '../src/lib/taiwanHolidays.js'

// Verified against `date -d <date> +%A` — 2026-08-08 is a Saturday, 2026-08-09
// a Sunday, 2026-08-07 the preceding Friday (business day).
test('isWeekend correctly identifies Saturday and Sunday', () => {
  assert.equal(isWeekend('2026-08-08'), true)
  assert.equal(isWeekend('2026-08-09'), true)
  assert.equal(isWeekend('2026-08-07'), false)
})

test('isBusinessDay is false on weekends (no extra holidays configured yet)', () => {
  assert.equal(isBusinessDay('2026-08-08'), false)
  assert.equal(isBusinessDay('2026-08-07'), true)
})

test('previousBusinessDay returns the same date if already a business day', () => {
  assert.equal(previousBusinessDay('2026-08-07'), '2026-08-07')
})

test('previousBusinessDay walks back over a single weekend day', () => {
  assert.equal(previousBusinessDay('2026-08-08'), '2026-08-07') // Sat -> Fri
})

test('previousBusinessDay walks back over a full Sat+Sun weekend', () => {
  assert.equal(previousBusinessDay('2026-08-09'), '2026-08-07') // Sun -> Fri
})

// 115年（2026）國定假日已從行政院人事總處公告的辦公日曆表填入 HOLIDAYS，
// 這裡驗證幾個「平日國定假日」（不是週六日，只能靠 HOLIDAYS 陣列才擋得住）
// 確實被視為非工作日 —— 這正是填表前系統會漏掉的情況。
test('isBusinessDay is false on a weekday national holiday (教師節 2026-09-28, Monday)', () => {
  assert.equal(isBusinessDay('2026-09-28'), false)
})

test('isBusinessDay is true the business day right after a holiday block ends', () => {
  assert.equal(isBusinessDay('2026-09-29'), true) // 中秋/教師節連假結束隔天，Tuesday
})

test('previousBusinessDay rolls back over a 4-day 中秋/教師節 holiday block (9/25 Fri ~ 9/28 Mon) to the preceding Thursday', () => {
  assert.equal(previousBusinessDay('2026-09-28'), '2026-09-24')
})
