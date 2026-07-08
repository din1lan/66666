import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildFileName, buildHearingNoticeDocType } from '../src/data/fileNaming.js'
import { combineCaseNumberDivision } from '../src/lib/caseNumber.js'

test('buildFileName matches the spec worked example: 出狀 + 親遞', () => {
  const name = buildFileName({
    rocDate: '115.04.30',
    direction: '出狀',
    serviceNote: '(親遞)',
    person: '王小明',
    cause: '損害賠償',
    docType: '民事答辯二狀',
    isTranscriptCopy: false,
    caseNumberDisplay: '115訴1玄',
  })
  assert.equal(name, '115.04.30出狀(親遞)-王小明-損害賠償-民事答辯二狀-115訴1玄')
})

test('buildFileName appends 繕本 to the doc type when the copy flag is set', () => {
  const name = buildFileName({
    rocDate: '115.04.22',
    direction: '收文',
    person: '王小明',
    cause: '損害賠償',
    docType: '民事二審答辯狀',
    isTranscriptCopy: true,
    caseNumberDisplay: '115訴1玄',
  })
  assert.equal(name, '115.04.22收文-王小明-損害賠償-民事二審答辯狀繕本-115訴1玄')
})

test('buildFileName omits the trailing separator when there is no case number', () => {
  const name = buildFileName({
    rocDate: '115.03.06',
    direction: '收文',
    person: '(無法判斷)',
    cause: '認可收養',
    docType: '桃園地院民事裁定',
    caseNumberDisplay: '',
  })
  assert.equal(name, '115.03.06收文-(無法判斷)-認可收養-桃園地院民事裁定')
})

test('buildHearingNoticeDocType matches the spec worked example', () => {
  // 115.05.01 下午2點 -> 0501-1400
  assert.equal(buildHearingNoticeDocType('臺北民庭', '2026-05-01', '14:00'), '臺北民庭開庭通知(0501-1400)')
})

test('buildFileName integrates with combineCaseNumberDivision for the case-number segment', () => {
  const caseNumberDisplay = combineCaseNumberDivision('114年度訴字第1號', '玄股')
  const name = buildFileName({
    rocDate: '115.02.10',
    direction: '收文',
    person: '林秀維等',
    cause: '認可收養',
    docType: '桃園地院民事裁定',
    caseNumberDisplay,
  })
  assert.equal(name, '115.02.10收文-林秀維等-認可收養-桃園地院民事裁定-114訴1玄')
})
