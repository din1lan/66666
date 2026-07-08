import { useMemo, useState } from 'react'

const ATTORNEY_COLORS = [
  'bg-sky-100 text-sky-800 border-sky-300',
  'bg-emerald-100 text-emerald-800 border-emerald-300',
  'bg-violet-100 text-violet-800 border-violet-300',
  'bg-amber-100 text-amber-800 border-amber-300',
  'bg-rose-100 text-rose-800 border-rose-300',
]

function colorForAttorney(name, palette) {
  if (!name) return 'bg-slate-100 text-slate-600 border-slate-300'
  if (!palette.has(name)) {
    palette.set(name, ATTORNEY_COLORS[palette.size % ATTORNEY_COLORS.length])
  }
  return palette.get(name)
}

function daysUntil(dateStr) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr + 'T00:00:00')
  return Math.round((target - today) / 86400000)
}

export default function CalendarView({ deadlines, caseLookup }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() } // month: 0-11
  })

  const palette = useMemo(() => new Map(), [])

  const byDate = useMemo(() => {
    const map = {}
    for (const d of deadlines) {
      if (!d.computedDeadline) continue
      map[d.computedDeadline] = map[d.computedDeadline] || []
      map[d.computedDeadline].push(d)
    }
    return map
  }, [deadlines])

  const { year, month } = cursor
  const firstOfMonth = new Date(year, month, 1)
  const startWeekday = firstOfMonth.getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let day = 1; day <= daysInMonth; day++) cells.push(day)

  function fmt(day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <button
          className="text-sm px-2 py-1 rounded hover:bg-slate-100"
          onClick={() => setCursor((c) => (c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 }))}
        >
          ← 上月
        </button>
        <div className="font-semibold text-slate-800">
          {year} 年 {month + 1} 月
        </div>
        <button
          className="text-sm px-2 py-1 rounded hover:bg-slate-100"
          onClick={() => setCursor((c) => (c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 }))}
        >
          下月 →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-xs text-center text-slate-400 mb-1">
        {['日', '一', '二', '三', '四', '五', '六'].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (day === null) return <div key={idx} className="h-20" />
          const dateStr = fmt(day)
          const items = byDate[dateStr] || []
          const urgent = items.some((it) => daysUntil(it.computedDeadline) <= 3)
          return (
            <div
              key={idx}
              className={`h-20 border rounded p-1 overflow-hidden text-left ${
                urgent ? 'border-red-400 bg-red-50' : 'border-slate-100'
              }`}
            >
              <div className={`text-[11px] ${urgent ? 'text-red-600 font-semibold' : 'text-slate-400'}`}>{day}</div>
              <div className="space-y-0.5 mt-0.5">
                {items.slice(0, 2).map((it) => (
                  <div
                    key={it.id}
                    title={it.displayTitle || `${caseLookup[it.caseId]?.caseNumber ?? ''} · ${it.eventType}`}
                    className={`truncate text-[10px] px-1 rounded border ${colorForAttorney(it.attorney, palette)}`}
                  >
                    {it.displayTitle
                      ? it.displayTitle
                      : `${it.attorney || '未指定'} · ${caseLookup[it.caseId]?.caseNumber ?? '案件'}`}
                  </div>
                ))}
                {items.length > 2 && <div className="text-[10px] text-slate-400">+{items.length - 2} 更多</div>}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-500">
        <span className="inline-block w-3 h-3 rounded bg-red-50 border border-red-400" /> 3 天內到期（遞狀死線）
      </div>
    </div>
  )
}
