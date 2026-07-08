import { useState } from 'react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '../../firebase.js'

export default function ClientList({ clients, selectedId, onSelect }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', idNumber: '', phone: '', email: '' })
  const [saving, setSaving] = useState(false)

  async function handleAdd(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const ref = await addDoc(collection(db, 'clients'), {
        ...form,
        createdBy: auth.currentUser?.uid ?? null,
        createdAt: serverTimestamp(),
      })
      setForm({ name: '', idNumber: '', phone: '', email: '' })
      setShowForm(false)
      onSelect(ref.id)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="w-72 shrink-0 border-r border-slate-200 bg-white flex flex-col h-full">
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <h2 className="font-semibold text-slate-800">客戶清單</h2>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-xs px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
        >
          {showForm ? '取消' : '+ 新增客戶'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="px-4 py-3 border-b border-slate-200 space-y-2 bg-slate-50">
          <input
            required
            placeholder="姓名 / 公司名稱"
            className="w-full text-sm border rounded px-2 py-1"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <input
            placeholder="身分證字號 / 統一編號"
            className="w-full text-sm border rounded px-2 py-1"
            value={form.idNumber}
            onChange={(e) => setForm((f) => ({ ...f, idNumber: e.target.value }))}
          />
          <input
            placeholder="聯絡電話"
            className="w-full text-sm border rounded px-2 py-1"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <input
            placeholder="Email"
            className="w-full text-sm border rounded px-2 py-1"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <button
            disabled={saving}
            className="w-full text-sm py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? '儲存中…' : '儲存客戶'}
          </button>
        </form>
      )}

      <div className="flex-1 overflow-y-auto">
        {clients.length === 0 && (
          <div className="p-4 text-sm text-slate-400">尚無客戶資料，點右上角新增。</div>
        )}
        {clients.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`w-full text-left px-4 py-3 border-b border-slate-100 hover:bg-slate-50 ${
              selectedId === c.id ? 'bg-indigo-50 border-l-2 border-l-indigo-500' : ''
            }`}
          >
            <div className="font-medium text-slate-800 text-sm">{c.name}</div>
            <div className="text-xs text-slate-400 mt-0.5">{c.idNumber || '未填身分證/統編'}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
