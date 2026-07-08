// 法院 / 檢察署全名 → 簡稱，依行政人員原本交給 Gemini 的規則：
//   臺灣臺北地方法院民事庭 → 臺北民庭
//   臺灣新竹地方檢察署 → 新竹地檢
//   臺灣高等法院高雄分院刑事庭 → 高雄高分院刑庭
//
// 這是最佳猜測的規則式轉換，涵蓋地方法院／地檢署／高等法院(分院) 三種最常見
// 型態。遇到不在規則內的機關名稱（如勞動部、工程會等），會直接回傳去掉
// 「臺灣」前綴後的原字串，交由使用者在表單裡手動修改 —— 不要假裝每個機關
// 名稱都能自動簡稱對。

const DIVISION_ABBREV = [
  ['民事庭', '民庭'],
  ['刑事庭', '刑庭'],
  ['行政庭', '行庭'],
  ['家事庭', '家事庭'],
  ['少年庭', '少年庭'],
  ['勞動法庭', '勞動庭'],
]

function abbreviateDivisionSuffix(rest) {
  if (!rest) return ''
  let s = rest
  for (const [full, short] of DIVISION_ABBREV) {
    s = s.split(full).join(short)
  }
  return s
}

export function abbreviateCourtName(raw) {
  if (!raw) return ''
  let s = String(raw).trim().replace(/^臺灣/, '')

  // OO地方檢察署 → OO地檢
  if (/地方檢察署$/.test(s)) {
    return s.replace('地方檢察署', '地檢')
  }

  // 高等法院OO分院(+庭別) → OO高分院(+庭別簡稱)
  const highBranch = s.match(/^高等法院(.+?)分院(.*)$/)
  if (highBranch) {
    const [, branch, rest] = highBranch
    return `${branch}高分院${abbreviateDivisionSuffix(rest)}`
  }

  // 高等法院本院(+庭別)
  const high = s.match(/^高等法院(.*)$/)
  if (high) {
    return `高等法院${abbreviateDivisionSuffix(high[1])}`
  }

  // OO地方法院(+庭別) → OO(+庭別簡稱)
  const district = s.match(/^(.+?)地方法院(.*)$/)
  if (district) {
    const [, city, rest] = district
    return `${city}${abbreviateDivisionSuffix(rest)}`
  }

  // 未辨識的型態（機關、部會等）：僅去掉「臺灣」前綴，其餘交由使用者手動修改。
  return s
}
