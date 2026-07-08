import { test } from 'node:test'
import assert from 'node:assert/strict'
import { abbreviateCourtName } from '../src/lib/courtAbbrev.js'

test('abbreviates a district court + division (the worked example in the spec)', () => {
  assert.equal(abbreviateCourtName('臺灣臺北地方法院民事庭'), '臺北民庭')
  assert.equal(abbreviateCourtName('臺灣臺北地方法院刑事庭'), '臺北刑庭')
})

test('abbreviates a prosecutors office (the worked example in the spec)', () => {
  assert.equal(abbreviateCourtName('臺灣新竹地方檢察署'), '新竹地檢')
})

test('abbreviates a high court branch + division (the worked example in the spec)', () => {
  assert.equal(abbreviateCourtName('臺灣高等法院高雄分院刑事庭'), '高雄高分院刑庭')
})

test('unrecognized agency names fall back to input with 臺灣 prefix stripped', () => {
  assert.equal(abbreviateCourtName('勞動部'), '勞動部')
  assert.equal(abbreviateCourtName(''), '')
})
