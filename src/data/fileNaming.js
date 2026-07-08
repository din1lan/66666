// ============================================================================
// 檔名產生規則 — 依行政人員原本交給 Gemini 的檔名規則整理（決定論版本，不讀檔）
// ============================================================================
// 這裡只做「把行政人員已經自己判讀好的欄位，照規則組成正確檔名字串」，
// 完全不會去讀掃描檔內容 —— 判讀掃描檔（存底章/收文章、狀頭文字等）需要
// AI 讀圖，那部分尚未啟用（見 functions/ 目錄的骨架與 README 的待辦事項）。
//
// 核心結構：日期+出狀或收文(送達方式)-當事人姓名-案由-狀別或公文名稱-案號簡寫股別
//   「+」：緊鄰、無空格、不顯示符號（例：115.04.30出狀）
//   「-」：分隔號，用以區分不同種類的資訊
//   結尾規範：狀別後若已無案號等後續資訊，狀別後方不加「-」
export const FILE_NAMING_STATUS = 'DRAFT_DETERMINISTIC_NO_AI'

function shortMDTime(dateISO, timeHHMM) {
  if (!dateISO) return ''
  const [, m, d] = dateISO.split('-')
  const time = (timeHHMM || '').replace(':', '')
  return `${m}${d}${time ? `-${time}` : ''}`
}

// 開庭通知的狀別/公文名稱段：法院簡稱 + 「開庭通知」+ (MMDD-HHMM)
// 例：臺北民庭開庭通知(0501-1400)
export function buildHearingNoticeDocType(courtAbbrev, dateISO, timeHHMM) {
  return `${courtAbbrev ?? ''}開庭通知(${shortMDTime(dateISO, timeHHMM)})`
}

// dateSegment：民國年日期 + 出狀/收文 + 選填的送達方式註記（如「(親遞)」）
// 例：115.04.30出狀(親遞)、115.04.22收文
function buildDateSegment({ rocDate, direction, serviceNote }) {
  if (!rocDate || !direction) return ''
  return `${rocDate}${direction}${serviceNote ?? ''}`
}

// docTypeSegment：狀別或公文名稱 + 選填的「繕本」註記
// 例：民事二審答辯狀繕本
function buildDocTypeSegment({ docType, isTranscriptCopy }) {
  if (!docType) return ''
  return `${docType}${isTranscriptCopy ? '繕本' : ''}`
}

// 主要組裝函式。person/cause 允許留空字串（呼叫端應在無法判斷當事人時傳入
// 「(無法判斷)」，這裡不代勞猜測），caseNumberDisplay 留空時，前方不會多出
// 一個「-」（符合「結尾規範」）。
export function buildFileName({
  rocDate,
  direction, // '出狀' | '收文'
  serviceNote, // 例：'(親遞)'，可留空
  person,
  cause,
  docType,
  isTranscriptCopy,
  caseNumberDisplay, // 已經是簡寫後的案號+股別字串，通常來自 combineCaseNumberDivision()
}) {
  const dateSegment = buildDateSegment({ rocDate, direction, serviceNote })
  const docTypeSegment = buildDocTypeSegment({ docType, isTranscriptCopy })
  const middleParts = [dateSegment, person, cause, docTypeSegment].filter((s) => s && s.trim())
  let name = middleParts.join('-')
  if (caseNumberDisplay) {
    name = name ? `${name}-${caseNumberDisplay}` : caseNumberDisplay
  }
  return name
}
