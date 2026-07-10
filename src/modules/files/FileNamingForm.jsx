import { useMemo, useState } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase.js'
import { buildFileName, buildHearingNoticeDocType, FILE_NAMING_STATUS, DOC_CATEGORIES } from '../../data/fileNaming.js'
import { combineCaseNumberDivision } from '../../lib/caseNumber.js'
import { abbreviateCourtName } from '../../lib/courtAbbrev.js'

const DIRECTIONS = ['出狀', '收文']

// 表單式檔名產生器：行政人員自己看完掃描檔、判斷好各欄位後在這裡填入，
// 系統只負責照規則組成正確格式的檔名字串 —— 不會讀取 PDF 內容本身。
// AI 自動讀檔（存底章/收文章辨識、狀頭文字擷取）是下一階段，目前刻意保持
// 「未啟用」狀態，見下方灰色按鈕與 README 的待辦事項。
export default function FileNamingForm({ file, onClose }) {
  const [rocDate, setRocDate] = useState('')
  const [direction, setDirection] = useState(DIRECTIONS[0])
  const [personalDelivery, setPersonalDelivery] = useState(false) // 出狀 + 首頁有收文章 = 親遞
  const [transcriptCopy, setTranscriptCopy] = useState(false) // 收文 + 書狀首頁有「繕本」字樣
  const [person, setPerson] = useState('')
  const [personUnknown, setPersonUnknown] = useState(false)
  const [cause, setCause] = useState('')
  const [isHearingNotice, setIsHearingNotice] = useState(false)
  const [courtNameRaw, setCourtNameRaw] = useState('')
  const [courtAbbrevOverride, setCourtAbbrevOverride] = useState('')
  const [hearingDate, setHearingDate] = useState('')
  const [hearingTime, setHearingTime] = useState('')
  const [docType, setDocType] = useState('')
  const [caseNumberRaw, setCaseNumberRaw] = useState('')
  const [divisionRaw, setDivisionRaw] = useState('')
  const [category, setCategory] = useState('')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  const suggestedCourtAbbrev = useMemo(() => abbreviateCourtName(courtNameRaw), [courtNameRaw])
  const courtAbbrev = courtAbbrevOverride || suggestedCourtAbbrev

  const caseNumberDisplay = useMemo(() => combineCaseNumberDivision(caseNumberRaw, divisionRaw), [caseNumberRaw, divisionRaw])

  const effectiveDocType = isHearingNotice ? buildHearingNoticeDocType(courtAbbrev, hearingDate, hearingTime) : docType

  const fileName = useMemo(
    () =>
      buildFileName({
        rocDate,
        direction,
        serviceNote: direction === '出狀' && personalDelivery ? '(親遞)' : '',
        person: personUnknown ? '(無法判斷)' : person,
        cause,
        docType: effectiveDocType,
        isTranscriptCopy: direction === '收文' && transcriptCopy,
        caseNumberDisplay,
      }),
    [rocDate, direction, personalDelivery, personUnknown, person, cause, effectiveDocType, transcriptCopy, caseNumberDisplay],
  )

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(fileName)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard API 可能在非 https/localhost 環境被瀏覽器擋下，安靜失敗即可，
      // 檔名仍顯示在畫面上可手動複製。
    }
  }

  async function handleSaveSuggestion() {
    if (!file?.id || !fileName) return
    setSaving(true)
    try {
      await updateDoc(doc(db, 'files', file.id), {
        suggestedFileName: fileName,
        suggestedFileNameStatus: FILE_NAMING_STATUS,
        category: category || null,
      })
      onClose?.()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800">產生檔名{file ? `：${file.fileName}` : ''}</h3>
        {onClose && (
          <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-600">
            關閉
          </button>
        )}
      </div>
      <p className="text-xs text-slate-400">
        照事務所檔名規則組成字串，不會讀取 PDF 內容、也不會自動改檔案名稱 —— 判讀完成後請自行在電腦上手動重新命名檔案。
      </p>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs text-slate-500 space-y-1">
          <span>日期（民國年 YYY.MM.DD）</span>
          <input value={rocDate} onChange={(e) => setRocDate(e.target.value)} placeholder="115.04.30" className="w-full text-sm border rounded px-2 py-1.5" />
        </label>

        <label className="text-xs text-slate-500 space-y-1">
          <span>出狀 / 收文</span>
          <select value={direction} onChange={(e) => setDirection(e.target.value)} className="w-full text-sm border rounded px-2 py-1.5">
            {DIRECTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>

        {direction === '出狀' && (
          <label className="text-xs text-slate-500 flex items-center gap-2 col-span-2">
            <input type="checkbox" checked={personalDelivery} onChange={(e) => setPersonalDelivery(e.target.checked)} />
            <span>首頁蓋有收文章（代表親自遞送，加註「(親遞)」）</span>
          </label>
        )}

        {direction === '收文' && (
          <label className="text-xs text-slate-500 flex items-center gap-2 col-span-2">
            <input type="checkbox" checked={transcriptCopy} onChange={(e) => setTranscriptCopy(e.target.checked)} />
            <span>書狀首頁有「繕本」字樣（對造寄予我方的書狀繕本，狀別後加註「繕本」）</span>
          </label>
        )}

        <label className="text-xs text-slate-500 space-y-1">
          <span>當事人姓名</span>
          <input
            disabled={personUnknown}
            value={person}
            onChange={(e) => setPerson(e.target.value)}
            className="w-full text-sm border rounded px-2 py-1.5 disabled:bg-slate-50"
          />
        </label>
        <label className="text-xs text-slate-500 flex items-end gap-2 pb-1.5">
          <input type="checkbox" checked={personUnknown} onChange={(e) => setPersonUnknown(e.target.checked)} />
          <span>無法判斷當事人</span>
        </label>

        <label className="text-xs text-slate-500 space-y-1 col-span-2">
          <span>案由（照書狀內文完整記載，勿自行簡寫）</span>
          <input value={cause} onChange={(e) => setCause(e.target.value)} className="w-full text-sm border rounded px-2 py-1.5" />
        </label>

        <label className="text-xs text-slate-500 flex items-center gap-2 col-span-2">
          <input
            type="checkbox"
            checked={isHearingNotice}
            onChange={(e) => {
              setIsHearingNotice(e.target.checked)
              if (e.target.checked && !category) setCategory('開庭')
            }}
          />
          <span>此文件為開庭通知</span>
        </label>

        <label className="text-xs text-slate-500 space-y-1 col-span-2">
          <span>文件分類</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full text-sm border rounded px-2 py-1.5">
            <option value="">請選擇分類…</option>
            {DOC_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        {isHearingNotice ? (
          <>
            <label className="text-xs text-slate-500 space-y-1">
              <span>法院/機關全名</span>
              <input value={courtNameRaw} onChange={(e) => setCourtNameRaw(e.target.value)} placeholder="臺灣臺北地方法院民事庭" className="w-full text-sm border rounded px-2 py-1.5" />
            </label>
            <label className="text-xs text-slate-500 space-y-1">
              <span>機關簡稱（自動建議「{suggestedCourtAbbrev || '—'}」，可覆寫）</span>
              <input value={courtAbbrevOverride} onChange={(e) => setCourtAbbrevOverride(e.target.value)} placeholder={suggestedCourtAbbrev} className="w-full text-sm border rounded px-2 py-1.5" />
            </label>
            <label className="text-xs text-slate-500 space-y-1">
              <span>開庭日期</span>
              <input type="date" value={hearingDate} onChange={(e) => setHearingDate(e.target.value)} className="w-full text-sm border rounded px-2 py-1.5" />
            </label>
            <label className="text-xs text-slate-500 space-y-1">
              <span>開庭時間</span>
              <input type="time" value={hearingTime} onChange={(e) => setHearingTime(e.target.value)} className="w-full text-sm border rounded px-2 py-1.5" />
            </label>
          </>
        ) : (
          <label className="text-xs text-slate-500 space-y-1 col-span-2">
            <span>狀別或公文名稱（文件標題）</span>
            <input value={docType} onChange={(e) => setDocType(e.target.value)} placeholder="民事答辯二狀 / 臺灣臺北地方法院刑事庭函" className="w-full text-sm border rounded px-2 py-1.5" />
          </label>
        )}

        <label className="text-xs text-slate-500 space-y-1">
          <span>案號（選填）</span>
          <input value={caseNumberRaw} onChange={(e) => setCaseNumberRaw(e.target.value)} placeholder="114年度訴字第1號" className="w-full text-sm border rounded px-2 py-1.5" />
        </label>
        <label className="text-xs text-slate-500 space-y-1">
          <span>股別（選填）</span>
          <input value={divisionRaw} onChange={(e) => setDivisionRaw(e.target.value)} placeholder="玄股" className="w-full text-sm border rounded px-2 py-1.5" />
        </label>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled
          title="尚未啟用：需事務所先確認 Anthropic API 預算並將 Firebase 升級至 Blaze 方案，才會實際呼叫 AI 讀取掃描檔內容"
          className="text-xs px-3 py-1.5 rounded border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
        >
          AI 建議（尚未啟用）
        </button>
        <span className="text-[11px] text-slate-400">上方欄位仍需人工判讀掃描檔後手動填入</span>
      </div>

      <div className="text-sm bg-slate-50 border border-slate-200 rounded p-3 break-all">
        建議檔名：<span className="font-medium text-slate-800">{fileName || '（請填寫欄位）'}</span>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleCopy}
          disabled={!fileName}
          className="text-sm px-4 py-2 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {copied ? '已複製' : '複製檔名'}
        </button>
        {file?.id && (
          <button
            type="button"
            onClick={handleSaveSuggestion}
            disabled={saving || !fileName}
            className="text-sm px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? '儲存中…' : '存成此檔案的建議檔名'}
          </button>
        )}
      </div>
    </div>
  )
}
