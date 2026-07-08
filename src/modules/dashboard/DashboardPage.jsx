import { useMemo } from 'react'
import { useCollection } from '../../hooks/useCollection.js'
import { todayLocalISO } from '../../lib/date.js'
import { isClosed } from '../../data/caseStatus.js'

function daysUntil(dateStr) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T00:00:00')
  return Math.round((target - today) / 86400000)
}

function startOfMonthMs() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime()
}

export default function DashboardPage() {
  const { docs: cases, loading: casesLoading } = useCollection('cases')
  const { docs: deadlines, loading: deadlinesLoading } = useCollection('deadlines')
  const { docs: billing, loading: billingLoading } = useCollection('billing')
  const { docs: clients, loading: clientsLoading } = useCollection('clients')

  const loading = casesLoading || deadlinesLoading || billingLoading || clientsLoading

  const stats = useMemo(() => {
    const openCases = cases.filter((c) => !isClosed(c.status)).length

    const dueThisWeek = deadlines.filter((d) => {
      if (!d.computedDeadline) return false
      const remain = daysUntil(d.computedDeadline)
      return remain >= 0 && remain <= 7
    }).length

    const receivedByCase = {}
    for (const b of billing) {
      if (b.type === 'fee' && b.paid) {
        receivedByCase[b.caseId] = (receivedByCase[b.caseId] || 0) + Number(b.amount || 0)
      }
    }
    const outstanding = cases.reduce((sum, c) => {
      const total = Number(c.contractTotal || 0)
      const received = receivedByCase[c.id] || 0
      return sum + Math.max(total - received, 0)
    }, 0)

    const monthStart = startOfMonthMs()
    const newClients = clients.filter((c) => {
      // Firestore serverTimestamp() resolves to a Timestamp with toMillis();
      // fall back gracefully if it hasn't synced back from the server yet.
      const ms = c.createdAt?.toMillis?.()
      return typeof ms === 'number' && ms >= monthStart
    }).length

    return { openCases, dueThisWeek, outstanding, newClients }
  }, [cases, deadlines, billing, clients])

  return (
    <div className="px-10 py-8 overflow-y-auto flex-1">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">首頁總覽</h1>
        <p className="text-slate-500 text-sm mt-1">
          {loading ? '載入中…' : `${todayLocalISO()} — 歡迎回來，這是今日的事務所概況`}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="進行中案件" value={stats.openCases} loading={loading} />
        <StatCard label="本週時效提醒" value={stats.dueThisWeek} loading={loading} tone={stats.dueThisWeek > 0 ? 'text-red-600' : undefined} />
        <StatCard
          label="未收律師費（估）"
          value={stats.outstanding ? `NT$ ${stats.outstanding.toLocaleString()}` : 'NT$ 0'}
          loading={loading}
        />
        <StatCard label="本月新增客戶" value={stats.newClients} loading={loading} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-lg border border-slate-200 p-5">
          <p className="text-sm font-medium text-slate-700 mb-3">案件進度圖表</p>
          <div className="placeholder-block h-64 rounded border border-slate-200 flex items-center justify-center text-xs text-slate-400">
            尚未實作（原型階段佔位，之後可用 recharts 依案件狀態/律師分佈畫圖）
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <p className="text-sm font-medium text-slate-700 mb-3">近期活動</p>
          <div className="placeholder-block h-64 rounded border border-slate-200 flex items-center justify-center text-xs text-slate-400 text-center px-4">
            尚未實作（原型階段佔位，之後可接稽核紀錄顯示「誰在何時做了什麼」）
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, loading, tone }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <p className="text-xs text-slate-500 mb-2">{label}</p>
      <p className={`text-2xl font-bold ${tone ?? 'text-navy-900'}`}>{loading ? '—' : value}</p>
    </div>
  )
}
