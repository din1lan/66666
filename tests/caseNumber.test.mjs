import { test } from 'node:test'
import assert from 'node:assert/strict'
import { abbreviateCaseNumber, abbreviateDivision, combineCaseNumberDivision } from '../src/lib/caseNumber.js'

test('abbreviateCaseNumber strips 年度/字/第/號', () => {
  assert.equal(abbreviateCaseNumber('114年度訴字第1號'), '114訴1')
  assert.equal(abbreviateCaseNumber('113年度家親聲字第655號'), '113家親聲655')
})

test('abbreviateCaseNumber passes through already-short input unchanged', () => {
  assert.equal(abbreviateCaseNumber('114訴1'), '114訴1')
})

test('abbreviateCaseNumber returns empty string for empty input', () => {
  assert.equal(abbreviateCaseNumber(''), '')
  assert.equal(abbreviateCaseNumber(null), '')
})

test('abbreviateDivision strips single-char case-type prefix and trailing 股', () => {
  assert.equal(abbreviateDivision('民團股'), '團')
  assert.equal(abbreviateDivision('刑茂股'), '茂')
  assert.equal(abbreviateDivision('玄股'), '玄')
})

test('abbreviateDivision returns empty string when field is blank', () => {
  assert.equal(abbreviateDivision(''), '')
})

test('combineCaseNumberDivision concatenates with no separator', () => {
  assert.equal(combineCaseNumberDivision('114年度訴字第1號', '玄股'), '114訴1玄')
  assert.equal(combineCaseNumberDivision('114年度訴字第1號', ''), '114訴1')
})
