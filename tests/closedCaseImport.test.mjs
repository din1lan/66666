import { test } from 'node:test'
import assert from 'node:assert/strict'
import { splitCaseNumbers, isExcludedFromReporting, buildClosedCaseRecord } from '../src/lib/closedCaseImport.js'
import { CLOSED_CASES_SEED } from '../src/data/closedCasesSeed.js'

test('splitCaseNumbers handles newline and 、-separated multi-case cells', () => {
  assert.deepEqual(splitCaseNumbers('113偵46598\n113偵61936'), ['113偵46598', '113偵61936'])
  assert.deepEqual(splitCaseNumbers('113偵52640、\n113偵52649'), ['113偵52640', '113偵52649'])
})

test('splitCaseNumbers returns an empty array for blank input', () => {
  assert.deepEqual(splitCaseNumbers(''), [])
  assert.deepEqual(splitCaseNumbers(null), [])
})

test('isExcludedFromReporting matches the two keywords used in the sheet', () => {
  assert.equal(isExcludedFromReporting('撰狀未委任，不報結'), true)
  assert.equal(isExcludedFromReporting('義務案件，不報事務所案件'), true)
  assert.equal(isExcludedFromReporting(''), false)
  assert.equal(isExcludedFromReporting('一般備註'), false)
})

test('buildClosedCaseRecord prefers 結案日期 over 結案日期(判決) when both could apply', () => {
  const rec = buildClosedCaseRecord({
    attorney: '陳律師',
    closedDateRaw: '114.03.06',
    closedDateJudgmentRaw: '',
    person: '王寶萱',
    cause: '損害賠償',
    caseNumberRaw: '113訴288',
    closingDocument: '士林地院民事判決',
    note: '',
  })
  assert.equal(rec.closedDateType, 'general')
  assert.equal(rec.closedDateISO, '2025-03-06')
  assert.equal(rec.excludeFromReporting, false)
})

test('buildClosedCaseRecord falls back to the judgment-date column and flags exclusions', () => {
  const rec = buildClosedCaseRecord({
    attorney: '陳律師',
    closedDateRaw: '',
    closedDateJudgmentRaw: '114.02.10',
    person: '林秀維等',
    cause: '認可收養',
    caseNumberRaw: '113司養聲336',
    closingDocument: '桃園地院民事裁定',
    note: '撰狀未委任，不報結',
  })
  assert.equal(rec.closedDateType, 'judgment')
  assert.equal(rec.closedDateISO, '2025-02-10')
  assert.equal(rec.excludeFromReporting, true)
  assert.deepEqual(rec.caseNumbers, ['113司養聲336'])
})

test('the imported seed data has 129 rows split across the four attorneys as parsed from the sheet', () => {
  assert.equal(CLOSED_CASES_SEED.length, 129)
  const counts = {}
  for (const row of CLOSED_CASES_SEED) counts[row.attorney] = (counts[row.attorney] || 0) + 1
  assert.deepEqual(counts, { 陳律師: 90, 林律師: 17, 王律師: 21, 程律師: 1 })
})

test('every seed row can be normalized without throwing', () => {
  for (const row of CLOSED_CASES_SEED) {
    assert.doesNotThrow(() => buildClosedCaseRecord(row))
  }
})
