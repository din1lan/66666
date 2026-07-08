import { useMemo, useState } from 'react'
import { addDoc, collection, doc, orderBy, serverTimestamp, updateDoc } from 'firebase/firestore'
import { db } from '../../firebase.js'
import { useCollection } from '../../hooks/useCollection.js'
import { CASE_STATUSES, CASE_STATUS_BADGE } from '../../data/caseStatus.js'
import DeadlineForm from '../deadlines/DeadlineForm.jsx'
import CalendarView from '../deadlines/CalendarView.jsx'
import ActionDeadlineForm from '../deadlines/ActionDeadlineForm.jsx'
import HearingForm from '../hearings/HearingForm.jsx'
import HearingsCalendarView from '../hearings/HearingsCalendarView.jsx'

function daysUntil(dateStr) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T00:00:00')
  return Math.round((target - today) / 86400000)
}

const AVATAR_COLORS = ['bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-700', 'bg-violet-100 text-violet-700', 'bg-rose-100 text-rose-700']

export default function CasesPage() {
  const { docs: cases } = useCollection('cases', [orderBy('createdAt', 'desc')])
  const { docs: clients } = useCollection('clients')
  const { docs: deadlines } = useCollection('deadlines', [orderBy('computedDeadline', 'asc')])
  const { docs: hearings } = useCollection('hearings', [orderBy('date', 'asc')])
  const [selectedLawyer, setSelectedLawyer] = useState('all')
  const [showForm, setShowForm] = useState(false)

  const clientLookup = Object.fromEntries(clients.map((c) => [c.id, c]))

  const lawyerColor = useMemo(() => {
    const map = new Map()
    return (name) => {
      if (!name) return 'bg-slate-100 text-slate-500'
      if (!map.has(name)) map.set(name, AVATAR_COLORS[map.size % AVATAR_COLORS.length])
      return map.get(name)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const lawyers = useMemo(() => {
    const counts = new Map()
    for (const c of cases) {
      const name = c.leadAttorney?.trim()
      if (!name) continue
      counts.set(name, (counts.get(name) || 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [cases])

  const nearestDeadlineByCase = useMemo(() => {
    const map = {}
    for (const d of deadlines) {
      if (!d.computedDeadline) continue
      const remain = daysUntil(d.computedDeadline)
      if (!map[d.caseId] || remain < map[d.caseId]) map[d.caseId] = remain
    }
    return map
  }, [deadlines])

  const filteredCases =
    selectedLawyer === 'all' ? cases : cases.filter((c) => (c.leadAttorney?.trim() || '') === selectedLawyer)

  return (
    <div className="flex-1 overflow-y-auto px-10 py-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">案件與時效</h1>
          <p className="text-slate-500 text-sm mt-1">依承辦律師分類管理案件，避免案件混雜</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 bg-navy-900 hover:bg-navy-800 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {showForm ? '取消新增' : '新增案件'}
        </button>
      </div>

      {showForm && <NewCaseForm clients={clients} onDone={() => setShowForm(false)} />}

      <div className="flex gap-5">
        <div className="w-64 flex-shrink-0">
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200">
              <span className="text-sm font-semibold text-slate-700">承辦律師</span>
            </div>
            <div className="p-2 space-y-1">
              <FolderButton
                active={selectedLawyer === 'all'}
                label="全部案件"
                count={cases.length}
                onClick={() => setSelectedLawyer('all')}
              />
              <div className="pt-1 pb-0.5 px-3">
                <p className="text-xs text-slate-400">個別律師</p>
              </div>
              {lawyers.length === 0 && <div className="px-3 py-2 text-xs text-slate-300">尚無案件填寫承辦律師</div>}
              {lawyers.map(([name, count]) => (
                <FolderButton
                  key={name}
                  active={selectedLawyer === name}
                  label={name}
                  count={count}
                  avatarClass={lawyerColor(name)}
                  onClick={() => setSelectedLawyer(name)}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">
                {selectedLawyer === 'all' ? '全部案件' : `${selectedLawyer} 的案件`}
              </span>
              <span className="text-xs text-slate-400">共 {filteredCases.length} 件</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 border-b border-slate-100 bg-slate-50">
                  <th className="px-5 py-2.5 font-medium">案號</th>
                  <th className="px-5 py-2.5 font-medium">案件名稱</th>
                  <th className="px-5 py-2.5 font-medium">客戶</th>
                  <th className="px-5 py-2.5 font-medium">承辦律師</th>
                  <th className="px-5 py-2.5 font-medium">狀態</th>
                  <th className="px-5 py-2.5 font-medium">時效倒數</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCases.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-6 text-center text-slate-300 text-sm">
                      沒有符合的案件
                    </td>
                  </tr>
                )}
                {filteredCases.map((c) => {
                  const remain = nearestDeadlineByCase[c.id]
                  return (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 text-slate-600 font-mono text-xs">{c.caseNumber}</td>
                      <td className="px-5 py-3 text-slate-800">{c.title || '—'}</td>
                      <td className="px-5 py-3 text-slate-600">{clientLookup[c.clientId]?.name ?? '—'}</td>
                      <td className="px-5 py-3 text-xs">
                        {c.leadAttorney ? (
                          <span className="inline-flex items-center gap-1.5">
                            <span className={`w-5 h-5 rounded-full ${lawyerColor(c.leadAttorney)} text-[10px] font-medium flex items-center justify-center`}>
                              {c.leadAttorney.charAt(0)}
                            </span>
                            {c.leadAttorney}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <StatusSelect caseId={c.id} status={c.status} />
                      </td>
                      <td className="px-5 py-3">
                        {remain === undefined ? (
                          <span className="text-slate-300 text-xs">無登記時效</span>
                        ) : (
                          <DeadlineBadge remain={remain} />
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4 items-start">
            <CalendarView deadlines={deadlines} caseLookup={Object.fromEntries(cases.map((c) => [c.id, c]))} />
            <div className="space-y-4">
              <DeadlineForm cases={cases} />
              <ActionDeadlineForm cases={cases} />
            </div>
          </div>

          <DeadlineList cases={cases} deadlines={deadlines} />

          <div className="mt-8 mb-3">
            <h2 className="text-lg font-bold text-slate-900">開庭行事曆</h2>
            <p className="text-slate-500 text-sm mt-1">依律師/法院/當事人/案由/案號自動組合行事曆標題，未填時間則登記為整日</p>
          </div>
          <div className="grid grid-cols-2 gap-4 items-start">
            <HearingsCalendarView hearings={hearings} caseLookup={Object.fromEntries(cases.map((c) => [c.id, c]))} />
            <HearingForm cases={cases} />
          </div>
          <HearingList hearings={hearings} />
        </div>
      </div>
    </div>
  )
}

function FolderButton({ active, label, count, avatarClass, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-left transition-colors ${
        active ? 'bg-navy-800 text-white' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      <span className="flex items-center gap-2.5">
        {avatarClass ? (
          <span className={`w-6 h-6 rounded-full ${avatarClass} text-xs font-medium flex items-center justify-center flex-shrink-0`}>
            {label.charAt(0)}
          </span>
        ) : (
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM9 4v16" />
          </svg>
        )}
        <span className="text-sm font-medium">{label}</span>
      </span>
      <span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>{count}</span>
    </button>
  )
}

function DeadlineBadge({ remain }) {
  const color = remain < 0 ? 'text-red-700 font-semibold' : remain <= 7 ? 'text-red-600 font-semibold' : remain <= 14 ? 'text-amber-600' : 'text-slate-500'
  const dot = remain <= 7 ? <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5 align-middle" /> : null
  return (
    <span className={color}>
      {dot}
      {remain < 0 ? `已逾期 ${-remain} 日` : `尚餘 ${remain} 日`}
    </span>
  )
}

function StatusSelect({ caseId, status }) {
  async function handleChange(e) {
    await updateDoc(doc(db, 'cases', caseId), { status: e.target.value })
  }
  const current = status || CASE_STATUSES[0]
  return (
    <select
      value={current}
      onChange={handleChange}
      className={`text-xs px-2 py-0.5 rounded-full border-0 ${CASE_STATUS_BADGE[current] ?? 'bg-slate-100 text-slate-600'}`}
    >
      {CASE_STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  )
}

function NewCaseForm({ clients, onDone }) {
  const [form, setForm] = useState({ clientId: '', caseNumber: '', title: '', court: '', leadAttorney: '' })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.clientId || !form.caseNumber.trim()) return
    setSaving(true)
    try {
      await addDoc(collection(db, 'cases'), {
        clientId: form.clientId,
        caseNumber: form.caseNumber,
        title: form.title,
        court: form.court,
        leadAttorney: form.leadAttorney,
        status: CASE_STATUSES[0],
        openedAt: new Date().toISOString().slice(0, 10),
        createdAt: serverTimestamp(),
      })
      onDone()
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 p-5 mb-5 grid grid-cols-3 gap-3">
      <label className="text-xs text-slate-500 space-y-1">
        <span>客戶</span>
        <select
          required
          value={form.clientId}
          onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
          className="w-full text-sm border rounded px-2 py-1.5"
        >
          <option value="">選擇客戶…</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs text-slate-500 space-y-1">
        <span>案號</span>
        <input
          required
          value={form.caseNumber}
          onChange={(e) => setForm((f) => ({ ...f, caseNumber: e.target.value }))}
          placeholder="113年度訴字第123號"
          className="w-full text-sm border rounded px-2 py-1.5"
        />
      </label>
      <label className="text-xs text-slate-500 space-y-1">
        <span>案由 / 案件名稱</span>
        <input
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          className="w-full text-sm border rounded px-2 py-1.5"
        />
      </label>
      <label className="text-xs text-slate-500 space-y-1">
        <span>承辦法院</span>
        <input
          value={form.court}
          onChange={(e) => setForm((f) => ({ ...f, court: e.target.value }))}
          className="w-full text-sm border rounded px-2 py-1.5"
        />
      </label>
      <label className="text-xs text-slate-500 space-y-1">
        <span>主辦律師</span>
        <input
          value={form.leadAttorney}
          onChange={(e) => setForm((f) => ({ ...f, leadAttorney: e.target.value }))}
          className="w-full text-sm border rounded px-2 py-1.5"
        />
      </label>
      <div className="flex items-end">
        <button
          disabled={saving}
          className="w-full text-sm py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? '儲存中…' : '儲存案件'}
        </button>
      </div>
    </form>
  )
}

function DeadlineList({ cases, deadlines }) {
  const caseLookup = Object.fromEntries(cases.map((c) => [c.id, c]))

  async function handleConfirm(id) {
    await updateDoc(doc(db, 'deadlines', id), {
      status: 'confirmed',
      confirmedAt: serverTimestamp(),
    })
  }

  return (
    <section className="bg-white rounded-lg border border-slate-200 p-5 mt-4">
      <h3 className="font-semibold text-slate-800 mb-3">時效清單</h3>
      {deadlines.length === 0 ? (
        <div className="text-sm text-slate-300">尚無時效紀錄</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-400 border-b">
              <th className="text-left py-1.5 font-normal">案件</th>
              <th className="text-left py-1.5 font-normal">事件</th>
              <th className="text-left py-1.5 font-normal">計算期限</th>
              <th className="text-left py-1.5 font-normal">狀態</th>
              <th className="text-left py-1.5 font-normal"></th>
            </tr>
          </thead>
          <tbody>
            {deadlines.map((d) => {
              const remain = d.computedDeadline ? daysUntil(d.computedDeadline) : null
              return (
                <tr key={d.id} className={`border-b last:border-0 ${remain !== null && remain <= 3 ? 'bg-red-50' : ''}`}>
                  <td className="py-2">{caseLookup[d.caseId]?.caseNumber ?? d.caseNumberDisplay ?? '（未關聯案件）'}</td>
                  <td className="py-2">
                    {d.kind === 'reminder' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 mr-1.5">提前提醒</span>
                    )}
                    {d.displayTitle || d.eventType}
                  </td>
                  <td className="py-2 font-medium">{d.computedDeadline}</td>
                  <td className="py-2">
                    {d.status === 'confirmed' ? (
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-700">已確認</span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700">草稿 · 待確認</span>
                    )}
                  </td>
                  <td className="py-2">
                    {d.status !== 'confirmed' && (
                      <button
                        onClick={() => handleConfirm(d.id)}
                        className="text-xs px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                      >
                        律師確認
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </section>
  )
}

function HearingList({ hearings }) {
  const upcoming = [...hearings]
    .filter((h) => h.date)
    .sort((a, b) => (a.date === b.date ? (a.time || '').localeCompare(b.time || '') : a.date.localeCompare(b.date)))

  return (
    <section className="bg-white rounded-lg border border-slate-200 p-5 mt-4">
      <h3 className="font-semibold text-slate-800 mb-3">開庭清單</h3>
      {upcoming.length === 0 ? (
        <div className="text-sm text-slate-300">尚無開庭紀錄</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-400 border-b">
              <th className="text-left py-1.5 font-normal">日期</th>
              <th className="text-left py-1.5 font-normal">時間</th>
              <th className="text-left py-1.5 font-normal">行事曆標題</th>
              <th className="text-left py-1.5 font-normal">地點</th>
            </tr>
          </thead>
          <tbody>
            {upcoming.map((h) => (
              <tr key={h.id} className="border-b last:border-0">
                <td className="py-2 font-medium">{h.date}</td>
                <td className="py-2">{h.time || '整日'}</td>
                <td className="py-2">{h.title}</td>
                <td className="py-2 text-slate-500">{h.location || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
