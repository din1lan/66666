import { test } from 'node:test'
import assert from 'node:assert/strict'
import { rocToISO } from '../src/lib/rocDate.js'

test('rocToISO converts a plain ROC date', () => {
  assert.equal(rocToISO('114.02.10'), '2025-02-10')
  assert.equal(rocToISO('115.05.08'), '2026-05-08')
})

test('rocToISO takes the first date when a cell has multiple newline-separated dates', () => {
  assert.equal(rocToISO('114.08.22\n114.09.19(同案)'), '2025-08-22')
})

test('rocToISO returns null for blank or unparseable input', () => {
  assert.equal(rocToISO(''), null)
  assert.equal(rocToISO(null), null)
  assert.equal(rocToISO('(無資料)'), null)
})
