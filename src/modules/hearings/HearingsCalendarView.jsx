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

// 開庭行事曆：與 deadlines/CalendarView.jsx 視覺風格一致，但資料來源是
// hearings collection，且每格顯示時間（無時間則標「整日」）。刻意做成獨立
// 元件而不是共用同一個 CalendarView，因為開庭通知的欄位（時間、地點）與
// 末日提醒（純日期）差異夠大，硬共用反而會讓兩邊都變難讀。
export default function HearingsCalendarView({ hearings, caseLookup }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return { year: d.getFullYear(), month: d.getMonth() }
  })

  const palette = useMemo(() => new Map(), [])

  const byDate = useMemo(() => {
    const map = {}
    for (const h of hearings) {
      if (!h.date) continue
      map[h.date] = map[h.date] || []
      map[h.date].push(h)
    }
    for (const list of Object.values(map)) {
      list.sort((a, b) => (a.time || '').localeCompare(b.time || ''))
    }
    return map
  }, [hearings])

  const { year, month } = cursor
  const firstOfMonth = new Date(year, month, 1)
  const startWeekday = firstOfMonth.getDay()
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
          {year} 年 {month + 1} 月 · 開庭行事曆
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
          return (
            <div key={idx} className="h-20 border rounded p-1 overflow-hidden text-left border-slate-100">
              <div className="text-[11px] text-slate-400">{day}</div>
              <div className="space-y-0.5 mt-0.5">
                {items.slice(0, 2).map((it) => (
                  <div
                    key={it.id}
                    title={`${it.title}${caseLookup?.[it.caseId]?.caseNumber ? ` (${caseLookup[it.caseId].caseNumber})` : ''}`}
                    className={`truncate text-[10px] px-1 rounded border ${colorForAttorney(it.attorneyLabel, palette)}`}
                  >
                    {it.time || '整日'} {it.attorneyLabel}
                  </div>
                ))}
                {items.length > 2 && <div className="text-[10px] text-slate-400">+{items.length - 2} 更多</div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
