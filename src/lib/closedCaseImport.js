import { rocToISO } from './rocDate.js'

// 把 closedCasesSeed.js 裡的一筆原始 Google Sheet 資料，正規化成 Firestore
// closedCases collection 要存的欄位。純函式、不接觸 Firestore，方便測試，也
// 讓「新增結案登記」表單（往後的新資料）跟「匯入歷史資料」（一次性的舊資料）
// 共用同一套正規化規則，兩種來源進到資料庫後欄位形狀一致。
const EXCLUDE_KEYWORDS = ['不報結', '不報事務所案件']

export function splitCaseNumbers(raw) {
  if (!raw) return []
  return raw
    .split(/[\n、,，]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

export function isExcludedFromReporting(note) {
  if (!note) return false
  return EXCLUDE_KEYWORDS.some((kw) => note.includes(kw))
}

export function buildClosedCaseRecord(seedRow) {
  const {
    attorney,
    closedDateRaw,
    closedDateJudgmentRaw,
    person,
    cause,
    caseNumberRaw,
    closingDocument,
    note,
  } = seedRow

  // 「結案日期」欄跟「結案日期(判決)」欄在原始 Sheet 裡是互斥的（一列只會
  // 填其中一欄），優先採用「結案日期」，因為判決類文件通常在判決確定後才
  // 真正結案，「結案日期(判決)」欄位語意上更接近宣判日而非結案日 —— 這是
  // 沿用 Sheet 兩欄並存設計時的推斷，不是行政人員明確交代的規則，匯入後如
  // 果事務所覺得順序反了，改 closedDateType 判斷就好，資料本身兩欄都有保留。
  const closedDateRawEffective = closedDateRaw || closedDateJudgmentRaw
  const closedDateType = closedDateRaw ? 'general' : closedDateJudgmentRaw ? 'judgment' : null

  return {
    attorney: attorney ?? null,
    closedDateRaw: closedDateRawEffective,
    closedDateISO: rocToISO(closedDateRawEffective),
    closedDateType,
    person: person ?? '',
    cause: cause ?? '',
    caseNumberRaw: caseNumberRaw ?? '',
    caseNumbers: splitCaseNumbers(caseNumberRaw),
    closingDocument: closingDocument ?? '',
    note: note ?? '',
    excludeFromReporting: isExcludedFromReporting(note),
  }
}
