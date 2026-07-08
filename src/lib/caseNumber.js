// 案號 / 股別簡寫規則，依行政人員原本交給 Gemini 的檔名/行事曆規則整理：
//   案號簡寫：省略「年度」「字」「第」「號」。114年度訴字第1號 → 114訴1
//   股別簡寫：去掉股別欄位常見的民/刑/行/少/家 單字前綴與結尾的「股」字。
//     民團股（民事、團股）→ 團；刑茂股（刑事、茂股）→ 茂；玄股 → 玄
//   組合：案號 + 股別簡寫，緊鄰、無分隔符號（例：114訴1玄）。
//
// 這些是純字串規則，不需要 AI 判讀文件內容 —— 前提是使用者已經自己從文件上
// 看出正確的案號與股別文字，這裡只負責照規則轉成簡寫。

const CASE_NUMBER_TOKENS = ['年度', '字第', '字', '第', '號']

export function abbreviateCaseNumber(raw) {
  if (!raw) return ''
  let s = String(raw).trim()
  for (const token of CASE_NUMBER_TOKENS) {
    s = s.split(token).join('')
  }
  return s.trim()
}

const DIVISION_PREFIX = /^(民|刑|行|少|家)(?=.)/

export function abbreviateDivision(raw) {
  if (!raw) return ''
  let s = String(raw).trim()
  s = s.replace(/股$/, '')
  s = s.replace(DIVISION_PREFIX, '')
  return s.trim()
}

// 案號 + 股別 組合結果，供行事曆標題與末日提醒標題共用。
export function combineCaseNumberDivision(caseNumberRaw, divisionRaw) {
  const num = abbreviateCaseNumber(caseNumberRaw)
  const div = abbreviateDivision(divisionRaw)
  return `${num}${div}`
}
