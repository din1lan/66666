// Regression test for the statutory deadline calculator.
//
// This function previously used toISOString().slice(0,10), which silently
// returned the WRONG DATE (off by one day) whenever the code ran in a
// timezone ahead of UTC (e.g. Asia/Taipei, UTC+8) — which is exactly where
// this app is meant to run. For a law firm appeal-deadline calculator, an
// off-by-one-day bug is not cosmetic. Keep this test passing.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeDeadlineDate, DEADLINE_RULES, findRule } from '../src/data/deadlineRules.js'

test('computeDeadlineDate adds calendar days without UTC drift', () => {
  assert.equal(computeDeadlineDate('2026-01-01', 20), '2026-01-21')
  assert.equal(computeDeadlineDate('2026-02-15', 10), '2026-02-25')
})

test('computeDeadlineDate crosses a year boundary correctly', () => {
  assert.equal(computeDeadlineDate('2026-12-20', 20), '2027-01-09')
})

test('computeDeadlineDate crosses a month boundary correctly', () => {
  assert.equal(computeDeadlineDate('2026-02-10', 20), '2026-03-02')
})

test('every rule has the fields the UI / audit trail depend on', () => {
  for (const rule of DEADLINE_RULES) {
    assert.ok(rule.id, 'rule missing id')
    assert.ok(rule.version, `rule ${rule.id} missing version`)
    assert.ok(rule.basis, `rule ${rule.id} missing legal basis citation`)
    assert.equal(typeof rule.days, 'number', `rule ${rule.id}.days must be a number`)
  }
})

test('findRule returns null for an unknown id instead of throwing', () => {
  assert.equal(findRule('does_not_exist'), null)
})
