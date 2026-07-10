import { useMemo, useState } from 'react'
import { addDoc, collection, doc, getDoc, orderBy, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore'
import { db, auth } from '../../firebase.js'
import { useCollection } from '../../hooks/useCollection.js'
import { ATTORNEYS } from '../../data/attorneys.js'
import { CLOSED_CASES_SEED } from '../../data/closedCasesSeed.js'
import { buildClosedCaseRecord } from '../../lib/closedCaseImport.js'

const IMPORT_MARKER_ID = 'closedCasesImport'
// calendarLabel（如「陳律師」）跟 closedCasesSeed.js 匯入時保留的 attorney
// 欄位值恰好是同一種格式，兩邊可以直接比對，不需要再轉換。
const ATTORNEY_TABS = ['全部', ...ATTORNEYS.map((a) => a.calendarLabel)]

export default function ClosedCasesPage() {
  const { docs: closedCases } = useCollection('closedCases', [orderBy('closedDateISO', 'desc')])
  const [tab, setTab] = useState('全部')
  const [showForm, setShowForm] = useState(false)
  const [importState, setImportState] = useState('unknown') // 'unknown' | 'checking' | 'not-imported' | 'imported' | 'importing'
  const [search, setSearch] = useState('')

  const byAttorney = tab === '全部' ? closedCases : closedCases.filter((c) => c.attorney === tab)

  const filtered = useMemo(() => {
    const q = search.trim()
    if (!q) return byAttorney
    return byAttorney.filter((c) => {
      const gregorianYear = c.closedDateISO ? c.closedDateISO.slice(0, 4) : ''
      const rocYear = gregorianYear ? String(Number(gregorianYear) - 1911) : ''
      const haystack = [c.person, ...(c.caseNumbers ?? []), gregorianYear, rocYear, c.cause].filter(Boolean).join(' ')
      return haystack.toLowerCase().includes(q.toLowerCase())
    })
  }, [byAttorney, search])

  const countsByAttorney = useMemo(() => {
    const map = {}
    for (const c of closedCases) map[c.attorney] = (map[c.attorney] || 0) + 1
    return map
  }, [closedCases])

  const reportableCount = filtered.filter((c) => !c.excludeFromReporting).length

  async function checkImportState() {
    setImportState('checking')
    const snap = await getDoc(doc(db, '_meta', IMPORT_MARKER_ID))
    setImportState(snap.exists() ? 'imported' : 'not-imported')
  }

  async function handleImport() {
    setImportState('importing')
    // Firestore 單一 batch 最多 500 筆寫入，129 筆遠低於上限，但保留分批邏輯
    // 以防未來種子資料變多。
    const chunks = []
    for (let i = 0; i < CLOSED_CASES_SEED.length; i += 400) chunks.push(CLOSED_CASES_SEED.slice(i, i + 400))

    for (const chunk of chunks) {
      const batch = writeBatch(db)
      for (const seedRow of chunk) {
        const record = buildClosedCaseRecord(seedRow)
        const ref = doc(collection(db, 'closedCases'))
        batch.set(ref, {
          ...record,
          source: 'sheet-import-2026-07-08',
          createdBy: auth.currentUser?.uid ?? null,
          createdAt: serverTimestamp(),
        })
      }
      await batch.commit()
    }

    await setDoc(doc(db, '_meta', IMPORT_MARKER_ID), {
      importedAt: serverTimestamp(),
      count: CLOSED_CASES_SEED.length,
      importedBy: auth.currentUser?.uid ?? null,
    })
    setImportState('imported')
  }

  return (
    <div className="flex-1 overflow-y-auto px-10 py-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">結案案件表</h1>
          <p className="text-slate-500 text-sm mt-1">
            取代原本的 Google Sheet「結案簡表」，往後新結案請直接在這裡登記，不用再改 Google Sheet
          </p>
        </div>
        <div className="flex gap-2">
          {importState === 'unknown' && (
            <button onClick={checkImportState} className="text-sm px-4 py-2 rounded border border-slate-300 text-slate-700 hover:bg-slate-50">
              檢查是否已匯入歷史資料
            </button>
          )}
          {importState === 'checking' && <span className="text-sm text-slate-400 self-center">檢查中…</span>}
          {importState === 'not-imported' && (
            <button onClick={handleImport} className="text-sm px-4 py-2 rounded bg-amber-600 text-white hover:bg-amber-700">
              匯入歷史資料（{CLOSED_CASES_SEED.length} 筆，僅需執行一次）
            </button>
          )}
          {importState === 'importing' && <span className="text-sm text-amber-600 self-center">匯入中，請勿關閉頁面…</span>}
          {importState === 'imported' && <span className="text-sm text-emerald-600 self-center">✓ 歷史資料已匯入</span>}
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-2 bg-navy-900 hover:bg-navy-800 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            {showForm ? '取消新增' : '+ 新增結案登記'}
          </button>
        </div>
      </div>

      {showForm && <NewClosedCaseForm onDone={() => setShowForm(false)} />}

      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜尋人名、案號或年份（民國年或西元年皆可，如「115」或「2026」）"
          className="w-full max-w-lg text-sm border border-slate-200 rounded-md px-3 py-2 placeholder:text-slate-400"
        />
        {search.trim() && (
          <p className="text-xs text-slate-400 mt-1">符合「{search.trim()}」的結果：{filtered.length} 筆</p>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        {ATTORNEY_TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-sm px-3 py-1.5 rounded-full border ${
              tab === t ? 'bg-navy-900 text-white border-navy-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {t}
            {t !== '全部' && countsByAttorney[t] ? ` (${countsByAttorney[t]})` : ''}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">
            {tab === '全部' ? '全部結案紀錄' : `${tab}結案紀錄`}
          </span>
          <span className="text-xs text-slate-400">
            共 {filtered.length} 筆（計入事務所結案統計 {reportableCount} 筆，其餘因備註排除）
          </span>
        </div>
        {filtered.length === 0 ? (
          <div className="px-5 py-8 text-center text-slate-300 text-sm">尚無資料</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-100 bg-slate-50">
                <th className="px-5 py-2.5 font-medium">結案日期</th>
                <th className="px-5 py-2.5 font-medium">當事人</th>
                <th className="px-5 py-2.5 font-medium">案由</th>
                <th className="px-5 py-2.5 font-medium">案號</th>
                <th className="px-5 py-2.5 font-medium">結案文件</th>
                <th className="px-5 py-2.5 font-medium">備註</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => (
                <tr key={c.id} className={`hover:bg-slate-50 ${c.excludeFromReporting ? 'text-slate-400' : ''}`}>
                  <td className="px-5 py-3 text-xs font-mono">
                    {c.closedDateISO ?? c.closedDateRaw ?? '—'}
                    {c.closedDateType === 'judgment' && <span className="text-[10px] text-slate-400 ml-1">(判決)</span>}
                  </td>
                  <td className="px-5 py-3">{c.person || '—'}</td>
                  <td className="px-5 py-3">{c.cause || '—'}</td>
                  <td className="px-5 py-3 text-xs font-mono">{(c.caseNumbers ?? []).join('、') || '—'}</td>
                  <td className="px-5 py-3">{c.closingDocument || '—'}</td>
                  <td className="px-5 py-3 text-xs">
                    {c.excludeFromReporting && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 mr-1.5">不計入結案</span>
                    )}
                    {c.note}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function NewClosedCaseForm({ onDone }) {
  const [attorney, setAttorney] = useState(ATTORNEYS[0]?.calendarLabel ?? '')
  const [dateType, setDateType] = useState('general') // 'general' | 'judgment'
  const [dateValue, setDateValue] = useState('')
  const [person, setPerson] = useState('')
  const [cause, setCause] = useState('')
  const [caseNumberRaw, setCaseNumberRaw] = useState('')
  const [closingDocument, setClosingDocument] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const seedShape = {
        attorney,
        closedDateRaw: dateType === 'general' ? dateValue : '',
        closedDateJudgmentRaw: dateType === 'judgment' ? dateValue : '',
        person,
        cause,
        caseNumberRaw,
        closingDocument,
        note,
      }
      const record = buildClosedCaseRecord(seedShape)
      await addDoc(collection(db, 'closedCases'), {
        ...record,
        source: 'manual',
        createdBy: auth.currentUser?.uid ?? null,
        createdAt: serverTimestamp(),
      })
      onDone?.()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 p-5 mb-5 grid grid-cols-3 gap-3">
      <label className="text-xs text-slate-500 space-y-1">
        <span>承辦律師</span>
        <select value={attorney} onChange={(e) => setAttorney(e.target.value)} className="w-full text-sm border rounded px-2 py-1.5">
          {ATTORNEYS.map((a) => (
            <option key={a.fullName} value={a.calendarLabel}>
              {a.calendarLabel}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs text-slate-500 space-y-1">
        <span>日期類型</span>
        <select value={dateType} onChange={(e) => setDateType(e.target.value)} className="w-full text-sm border rounded px-2 py-1.5">
          <option value="general">結案日期</option>
          <option value="judgment">結案日期（判決）</option>
        </select>
      </label>
      <label className="text-xs text-slate-500 space-y-1">
        <span>日期（民國年 YYY.MM.DD）</span>
        <input required value={dateValue} onChange={(e) => setDateValue(e.target.value)} placeholder="115.06.01" className="w-full text-sm border rounded px-2 py-1.5" />
      </label>
      <label className="text-xs text-slate-500 space-y-1">
        <span>當事人</span>
        <input required value={person} onChange={(e) => setPerson(e.target.value)} className="w-full text-sm border rounded px-2 py-1.5" />
      </label>
      <label className="text-xs text-slate-500 space-y-1">
        <span>案由</span>
        <input value={cause} onChange={(e) => setCause(e.target.value)} className="w-full text-sm border rounded px-2 py-1.5" />
      </label>
      <label className="text-xs text-slate-500 space-y-1">
        <span>案號（可用換行分隔多個）</span>
        <input value={caseNumberRaw} onChange={(e) => setCaseNumberRaw(e.target.value)} className="w-full text-sm border rounded px-2 py-1.5" />
      </label>
      <label className="text-xs text-slate-500 space-y-1">
        <span>結案文件</span>
        <input value={closingDocument} onChange={(e) => setClosingDocument(e.target.value)} placeholder="臺北地院民事判決" className="w-full text-sm border rounded px-2 py-1.5" />
      </label>
      <label className="text-xs text-slate-500 space-y-1 col-span-2">
        <span>備註（含「不報結」「不報事務所案件」等字樣會自動排除出結案統計）</span>
        <input value={note} onChange={(e) => setNote(e.target.value)} className="w-full text-sm border rounded px-2 py-1.5" />
      </label>
      <div className="flex items-end">
        <button disabled={saving} className="w-full text-sm py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
          {saving ? '儲存中…' : '儲存結案登記'}
        </button>
      </div>
    </form>
  )
}
