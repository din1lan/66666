import { useMemo, useState } from 'react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '../../firebase.js'
import { ATTORNEYS, calendarLabelFor } from '../../data/attorneys.js'
import { abbreviateCourtName } from '../../lib/courtAbbrev.js'
import { combineCaseNumberDivision } from '../../lib/caseNumber.js'

export default function HearingForm({ cases }) {
  const [caseId, setCaseId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [attorney, setAttorney] = useState(ATTORNEYS[0]?.fullName ?? '')
  const [courtNameRaw, setCourtNameRaw] = useState('')
  const [courtAbbrevOverride, setCourtAbbrevOverride] = useState('')
  const [person, setPerson] = useState('')
  const [cause, setCause] = useState('')
  const [caseNumberRaw, setCaseNumberRaw] = useState('')
  const [divisionRaw, setDivisionRaw] = useState('')
  const [location, setLocation] = useState('')
  const [saving, setSaving] = useState(false)

  const selectedCase = cases.find((c) => c.id === caseId)

  const suggestedCourtAbbrev = useMemo(() => abbreviateCourtName(courtNameRaw), [courtNameRaw])
  const courtAbbrev = courtAbbrevOverride || suggestedCourtAbbrev

  const caseNumberDisplay = useMemo(
    () => combineCaseNumberDivision(caseNumberRaw || selectedCase?.caseNumber || '', divisionRaw),
    [caseNumberRaw, divisionRaw, selectedCase],
  )

  const title = useMemo(() => {
    // calendarLabelFor() already returns the full "姓氏+律師" form (e.g. "陳律師"),
    // so do NOT append another "律師" here — that produced a "陳律師律師" duplication
    // bug in every hearing title until this was caught during a later review pass.
    const label = calendarLabelFor(attorney)
    const parts = [label, courtAbbrev, person, cause, caseNumberDisplay].filter(Boolean)
    const body = parts.join('-')
    return time ? `${time} ${body}` : body
  }, [attorney, courtAbbrev, person, cause, caseNumberDisplay, time])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!date || !attorney || !person.trim()) return
    setSaving(true)
    try {
      await addDoc(collection(db, 'hearings'), {
        caseId: caseId || null,
        date,
        time: time || null,
        allDay: !time,
        attorney,
        attorneyLabel: calendarLabelFor(attorney),
        courtNameRaw,
        courtAbbrev,
        person,
        cause,
        caseNumberDisplay,
        location,
        title,
        createdBy: auth.currentUser?.uid ?? null,
        createdAt: serverTimestamp(),
      })
      setDate('')
      setTime('')
      setCourtNameRaw('')
      setCourtAbbrevOverride('')
      setPerson('')
      setCause('')
      setCaseNumberRaw('')
      setDivisionRaw('')
      setLocation('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
      <h3 className="font-semibold text-slate-800">新增開庭通知</h3>
      <p className="text-xs text-slate-400">
        機關全名輸入後會自動嘗試簡稱（地院/地檢/高分院），若判斷不對可在下方欄位直接覆寫。
      </p>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs text-slate-500 space-y-1">
          <span>案件（可留空）</span>
          <select value={caseId} onChange={(e) => setCaseId(e.target.value)} className="w-full text-sm border rounded px-2 py-1.5">
            <option value="">不關聯案件…</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.caseNumber} {c.title ? `· ${c.title}` : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs text-slate-500 space-y-1">
          <span>承辦律師</span>
          <select value={attorney} onChange={(e) => setAttorney(e.target.value)} className="w-full text-sm border rounded px-2 py-1.5">
            {ATTORNEYS.map((a) => (
              <option key={a.fullName} value={a.fullName}>
                {a.fullName}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs text-slate-500 space-y-1">
          <span>開庭日期</span>
          <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full text-sm border rounded px-2 py-1.5" />
        </label>

        <label className="text-xs text-slate-500 space-y-1">
          <span>開庭時間（留空 = 整日）</span>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full text-sm border rounded px-2 py-1.5" />
        </label>

        <label className="text-xs text-slate-500 space-y-1">
          <span>法院 / 機關全名</span>
          <input
            value={courtNameRaw}
            onChange={(e) => setCourtNameRaw(e.target.value)}
            placeholder="臺灣臺北地方法院民事庭"
            className="w-full text-sm border rounded px-2 py-1.5"
          />
        </label>

        <label className="text-xs text-slate-500 space-y-1">
          <span>機關簡稱（自動建議「{suggestedCourtAbbrev || '—'}」，可覆寫）</span>
          <input
            value={courtAbbrevOverride}
            onChange={(e) => setCourtAbbrevOverride(e.target.value)}
            placeholder={suggestedCourtAbbrev || '例：新北民庭、勞動部'}
            className="w-full text-sm border rounded px-2 py-1.5"
          />
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
          <span>案號</span>
          <input
            value={caseNumberRaw}
            onChange={(e) => setCaseNumberRaw(e.target.value)}
            placeholder="114年度訴字第1號"
            className="w-full text-sm border rounded px-2 py-1.5"
          />
        </label>

        <label className="text-xs text-slate-500 space-y-1">
          <span>股別</span>
          <input value={divisionRaw} onChange={(e) => setDivisionRaw(e.target.value)} placeholder="玄股" className="w-full text-sm border rounded px-2 py-1.5" />
        </label>

        <label className="text-xs text-slate-500 space-y-1 col-span-2">
          <span>地點（僅樓層/室，不含機關名稱）</span>
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="3樓305室" className="w-full text-sm border rounded px-2 py-1.5" />
        </label>
      </div>

      <div className="text-sm bg-slate-50 border border-slate-200 rounded p-3">
        行事曆標題預覽：<span className="font-medium text-slate-800">{title || '（請填寫欄位）'}</span>
        {!time && <span className="text-xs text-slate-400 ml-2">（未填時間 → 登記為整日行程）</span>}
      </div>

      <button
        disabled={saving || !date || !attorney || !person.trim()}
        className="text-sm px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {saving ? '儲存中…' : '儲存開庭通知'}
      </button>
    </form>
  )
}
