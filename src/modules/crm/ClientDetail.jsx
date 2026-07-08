import { useState } from 'react'
import { where, addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '../../firebase.js'
import { todayLocalISO } from '../../lib/date.js'
import { useCollection } from '../../hooks/useCollection.js'
import { isClosed } from '../../data/caseStatus.js'

export default function ClientDetail({ client }) {
  const { docs: cases } = useCollection('cases', [where('clientId', '==', client.id)])
  const { docs: notes } = useCollection('clientNotes', [where('clientId', '==', client.id)])

  const sortedNotes = [...notes].sort((a, b) => (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0))
  const openCases = cases.filter((c) => !isClosed(c.status))
  const closedCases = cases.filter((c) => isClosed(c.status))

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <section className="bg-white rounded-lg border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 mb-3">客戶基本資訊</h3>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <Field label="姓名 / 名稱" value={client.name} />
          <Field label="身分證字號 / 統編" value={client.idNumber} />
          <Field label="聯絡電話" value={client.phone} />
          <Field label="Email" value={client.email} />
          <Field label="地址" value={client.address} span2 />
        </dl>
      </section>

      <CaseSection clientId={client.id} openCases={openCases} closedCases={closedCases} />

      <NoteSection clientId={client.id} notes={sortedNotes} />
    </div>
  )
}

function Field({ label, value, span2 }) {
  return (
    <div className={span2 ? 'col-span-2' : ''}>
      <dt className="text-slate-400 text-xs">{label}</dt>
      <dd className="text-slate-800">{value || '—'}</dd>
    </div>
  )
}

function CaseSection({ clientId, openCases, closedCases }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ caseNumber: '', title: '', court: '', leadAttorney: '' })
  const [saving, setSaving] = useState(false)

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.caseNumber.trim()) return
    setSaving(true)
    try {
      await addDoc(collection(db, 'cases'), {
        ...form,
        clientId,
        status: '進行中',
        openedAt: todayLocalISO(),
        createdAt: serverTimestamp(),
      })
      setForm({ caseNumber: '', title: '', court: '', leadAttorney: '' })
      setShowForm(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="bg-white rounded-lg border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-800">案件列表</h3>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-xs px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
        >
          {showForm ? '取消' : '+ 新增案件'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="mb-4 grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded">
          <input
            required
            placeholder="案號 (例如 113年度訴字第123號)"
            className="text-sm border rounded px-2 py-1 col-span-2"
            value={form.caseNumber}
            onChange={(e) => setForm((f) => ({ ...f, caseNumber: e.target.value }))}
          />
          <input
            placeholder="案由 / 案件標題"
            className="text-sm border rounded px-2 py-1 col-span-2"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <input
            placeholder="承辦法院"
            className="text-sm border rounded px-2 py-1"
            value={form.court}
            onChange={(e) => setForm((f) => ({ ...f, court: e.target.value }))}
          />
          <input
            placeholder="主辦律師"
            className="text-sm border rounded px-2 py-1"
            value={form.leadAttorney}
            onChange={(e) => setForm((f) => ({ ...f, leadAttorney: e.target.value }))}
          />
          <button
            disabled={saving}
            className="col-span-2 text-sm py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? '儲存中…' : '儲存案件'}
          </button>
        </form>
      )}

      <CaseGroup title={`進行中 (${openCases.length})`} cases={openCases} />
      <CaseGroup title={`已結案 (${closedCases.length})`} cases={closedCases} muted />
    </section>
  )
}

function CaseGroup({ title, cases, muted }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="text-xs text-slate-500 mb-1">{title}</div>
      {cases.length === 0 ? (
        <div className="text-xs text-slate-300">無</div>
      ) : (
        <ul className="space-y-1">
          {cases.map((c) => (
            <li
              key={c.id}
              className={`text-sm border rounded px-3 py-2 flex items-center justify-between ${
                muted ? 'bg-slate-50 text-slate-500' : 'bg-white'
              }`}
            >
              <span>
                <span className="font-medium">{c.caseNumber}</span>
                {c.title ? ` · ${c.title}` : ''}
              </span>
              <span className="text-xs text-slate-400">{c.leadAttorney || ''}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function NoteSection({ clientId, notes }) {
  const [content, setContent] = useState('')
  const [author, setAuthor] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleAdd(e) {
    e.preventDefault()
    if (!content.trim()) return
    setSaving(true)
    try {
      await addDoc(collection(db, 'clientNotes'), {
        clientId,
        author: author || '未署名',
        content,
        createdAtMs: Date.now(),
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid ?? null,
      })
      setContent('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="bg-white rounded-lg border border-slate-200 p-5">
      <h3 className="font-semibold text-slate-800 mb-3">諮詢紀錄 / 往來備忘錄</h3>
      <form onSubmit={handleAdd} className="mb-4 space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <input
            placeholder="記錄人"
            className="text-sm border rounded px-2 py-1 col-span-1"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          />
          <input
            placeholder="備忘內容…"
            className="text-sm border rounded px-2 py-1 col-span-2"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>
        <button
          disabled={saving}
          className="text-sm px-3 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? '儲存中…' : '新增備忘'}
        </button>
      </form>

      {notes.length === 0 ? (
        <div className="text-sm text-slate-300">尚無紀錄</div>
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => (
            <li key={n.id} className="text-sm border-l-2 border-indigo-200 pl-3">
              <div className="text-slate-700">{n.content}</div>
              <div className="text-xs text-slate-400 mt-0.5">
                {n.author} · {n.createdAtMs ? new Date(n.createdAtMs).toLocaleString('zh-TW') : ''}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
