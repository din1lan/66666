import { useMemo, useState } from 'react'
import { addDoc, collection, doc, orderBy, serverTimestamp, updateDoc, where } from 'firebase/firestore'
import { db, auth } from '../../firebase.js'
import { useCollection } from '../../hooks/useCollection.js'
import { todayLocalISO } from '../../lib/date.js'
import { isClosed } from '../../data/caseStatus.js'

const TYPE_LABEL = {
  fee: '律師費',
  advance: '代墊款 / 裁判費',
  expense: '其他支出',
}

export default function BillingPage() {
  const { docs: cases } = useCollection('cases')
  const { docs: allBilling } = useCollection('billing')
  const [caseId, setCaseId] = useState('')

  const selectedCase = cases.find((c) => c.id === caseId) || null

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">財務與代墊款</h1>
        <p className="text-xs text-slate-400 mt-0.5">每一筆帳目都強制關聯到特定案號</p>
      </div>

      <FirmStats cases={cases} billing={allBilling} />

      <section className="bg-white rounded-lg border border-slate-200 p-5">
        <label className="text-xs text-slate-500 space-y-1 block max-w-md">
          <span>選擇案件以查看/記錄帳務</span>
          <select
            value={caseId}
            onChange={(e) => setCaseId(e.target.value)}
            className="w-full text-sm border rounded px-2 py-1.5"
          >
            <option value="">選擇案件…</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.caseNumber} {c.title ? `· ${c.title}` : ''}
              </option>
            ))}
          </select>
        </label>
      </section>

      {selectedCase ? (
        <CaseBilling caseDoc={selectedCase} />
      ) : (
        <div className="text-sm text-slate-400">請先選擇一個案件</div>
      )}
    </div>
  )
}

function FirmStats({ cases, billing }) {
  const stats = useMemo(() => {
    const now = new Date()
    const monthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    const advanceThisMonth = billing
      .filter((b) => b.type === 'advance' && (b.date || '').startsWith(monthPrefix))
      .reduce((sum, b) => sum + Number(b.amount || 0), 0)

    const receivedByCase = {}
    for (const b of billing) {
      if (b.type === 'fee' && b.paid) {
        receivedByCase[b.caseId] = (receivedByCase[b.caseId] || 0) + Number(b.amount || 0)
      }
    }

    let outstanding = 0
    let closedCollected = 0
    for (const c of cases) {
      const received = receivedByCase[c.id] || 0
      if (isClosed(c.status)) {
        closedCollected += received
      } else {
        outstanding += Math.max(Number(c.contractTotal || 0) - received, 0)
      }
    }

    return { advanceThisMonth, outstanding, closedCollected }
  }, [cases, billing])

  return (
    <div className="grid grid-cols-3 gap-4">
      <StatCard label="本月代墊款總額" value={stats.advanceThisMonth} />
      <StatCard label="待收款項（未結案）" value={stats.outstanding} tone="text-red-700" />
      <StatCard label="已結案已收款" value={stats.closedCollected} tone="text-emerald-700" />
    </div>
  )
}

function StatCard({ label, value, tone }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <p className="text-xs text-slate-500 mb-2">{label}</p>
      <p className={`text-2xl font-bold ${tone ?? 'text-navy-900'}`}>NT$ {Number(value || 0).toLocaleString()}</p>
    </div>
  )
}

function CaseBilling({ caseDoc }) {
  const { docs: entries } = useCollection('billing', [where('caseId', '==', caseDoc.id), orderBy('date', 'desc')])

  const [contractTotal, setContractTotal] = useState(caseDoc.contractTotal ?? '')
  const [savingContract, setSavingContract] = useState(false)

  const feeEntries = entries.filter((e) => e.type === 'fee')
  const advanceEntries = entries.filter((e) => e.type === 'advance')

  const received = feeEntries.filter((e) => e.paid).reduce((sum, e) => sum + Number(e.amount || 0), 0)
  const total = Number(caseDoc.contractTotal || 0)
  const outstanding = Math.max(total - received, 0)

  const advanceTotal = advanceEntries.reduce((sum, e) => sum + Number(e.amount || 0), 0)

  async function saveContractTotal(e) {
    e.preventDefault()
    setSavingContract(true)
    try {
      await updateDoc(doc(db, 'cases', caseDoc.id), { contractTotal: Number(contractTotal || 0) })
    } finally {
      setSavingContract(false)
    }
  }

  return (
    <>
      <section className="bg-white rounded-lg border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 mb-3">律師費概況 — {caseDoc.caseNumber}</h3>
        <form onSubmit={saveContractTotal} className="flex items-end gap-2 mb-4">
          <label className="text-xs text-slate-500 space-y-1">
            <span>簽約總額 (NT$)</span>
            <input
              type="number"
              className="text-sm border rounded px-2 py-1.5 w-40"
              value={contractTotal}
              onChange={(e) => setContractTotal(e.target.value)}
            />
          </label>
          <button
            disabled={savingContract}
            className="text-xs px-3 py-1.5 rounded bg-slate-700 text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {savingContract ? '儲存中…' : '更新簽約總額'}
          </button>
        </form>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <Stat label="簽約總額" value={total} />
          <Stat label="已收期款" value={received} tone="text-emerald-700" />
          <Stat label="未收尾款" value={outstanding} tone="text-red-700" />
        </div>
      </section>

      <EntryForm caseId={caseDoc.id} />

      <section className="bg-white rounded-lg border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 mb-3">帳務明細</h3>
        {entries.length === 0 ? (
          <div className="text-sm text-slate-300">尚無帳務紀錄</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-400 border-b">
                <th className="text-left py-1.5 font-normal">日期</th>
                <th className="text-left py-1.5 font-normal">類型</th>
                <th className="text-left py-1.5 font-normal">說明</th>
                <th className="text-right py-1.5 font-normal">金額</th>
                <th className="text-left py-1.5 font-normal">已收/已付</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className="border-b last:border-0">
                  <td className="py-2">{e.date}</td>
                  <td className="py-2">{TYPE_LABEL[e.type] ?? e.type}</td>
                  <td className="py-2">{e.description}</td>
                  <td className="py-2 text-right">NT$ {Number(e.amount || 0).toLocaleString()}</td>
                  <td className="py-2">{e.paid ? '是' : '否'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <AdvanceSummary caseDoc={caseDoc} advanceEntries={advanceEntries} advanceTotal={advanceTotal} />
    </>
  )
}

function Stat({ label, value, tone }) {
  return (
    <div className="border rounded p-3">
      <div className="text-xs text-slate-400">{label}</div>
      <div className={`text-lg font-semibold ${tone ?? 'text-slate-800'}`}>
        NT$ {Number(value || 0).toLocaleString()}
      </div>
    </div>
  )
}

function EntryForm({ caseId }) {
  const [form, setForm] = useState({
    type: 'fee',
    description: '',
    amount: '',
    date: todayLocalISO(),
    paid: false,
  })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.amount) return
    setSaving(true)
    try {
      await addDoc(collection(db, 'billing'), {
        caseId,
        type: form.type,
        description: form.description,
        amount: Number(form.amount),
        date: form.date,
        paid: form.type === 'fee' ? form.paid : true, // advances/expenses are recorded as already outlaid
        createdBy: auth.currentUser?.uid ?? null,
        createdAt: serverTimestamp(),
      })
      setForm((f) => ({ ...f, description: '', amount: '' }))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
      <h3 className="font-semibold text-slate-800">一鍵記錄帳目</h3>
      <div className="grid grid-cols-4 gap-3">
        <label className="text-xs text-slate-500 space-y-1">
          <span>類型</span>
          <select
            value={form.type}
            onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
            className="w-full text-sm border rounded px-2 py-1.5"
          >
            <option value="fee">律師費（期款）</option>
            <option value="advance">代墊款 / 裁判費 / 郵資</option>
            <option value="expense">其他支出</option>
          </select>
        </label>
        <label className="text-xs text-slate-500 space-y-1 col-span-2">
          <span>說明</span>
          <input
            required
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="例如：第一期款 / 裁判費 / 存證信函郵資"
            className="w-full text-sm border rounded px-2 py-1.5"
          />
        </label>
        <label className="text-xs text-slate-500 space-y-1">
          <span>金額 (NT$)</span>
          <input
            required
            type="number"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            className="w-full text-sm border rounded px-2 py-1.5"
          />
        </label>
        <label className="text-xs text-slate-500 space-y-1">
          <span>日期</span>
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className="w-full text-sm border rounded px-2 py-1.5"
          />
        </label>
        {form.type === 'fee' && (
          <label className="text-xs text-slate-500 flex items-center gap-2 mt-4">
            <input
              type="checkbox"
              checked={form.paid}
              onChange={(e) => setForm((f) => ({ ...f, paid: e.target.checked }))}
            />
            <span>已收款</span>
          </label>
        )}
      </div>
      <button
        disabled={saving}
        className="text-sm px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {saving ? '儲存中…' : '記錄'}
      </button>
    </form>
  )
}

function AdvanceSummary({ caseDoc, advanceEntries, advanceTotal }) {
  return (
    <section className="bg-white rounded-lg border border-slate-200 p-5 print:border-0">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-800">代墊款明細清單（結案時可列印給客戶）</h3>
        <button
          onClick={() => window.print()}
          className="text-xs px-2 py-1 rounded bg-slate-700 text-white hover:bg-slate-800"
        >
          列印 / 匯出 PDF
        </button>
      </div>
      <div className="text-sm">
        <div className="mb-2 text-slate-500">案號：{caseDoc.caseNumber}</div>
        {advanceEntries.length === 0 ? (
          <div className="text-slate-300">尚無代墊款紀錄</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-xs text-slate-400 border-b">
                <th className="text-left py-1.5 font-normal">日期</th>
                <th className="text-left py-1.5 font-normal">項目</th>
                <th className="text-right py-1.5 font-normal">金額</th>
              </tr>
            </thead>
            <tbody>
              {advanceEntries.map((e) => (
                <tr key={e.id} className="border-b last:border-0">
                  <td className="py-1.5">{e.date}</td>
                  <td className="py-1.5">{e.description}</td>
                  <td className="py-1.5 text-right">NT$ {Number(e.amount || 0).toLocaleString()}</td>
                </tr>
              ))}
              <tr>
                <td colSpan={2} className="py-2 font-semibold text-right pr-4">
                  合計
                </td>
                <td className="py-2 text-right font-semibold">NT$ {advanceTotal.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}
