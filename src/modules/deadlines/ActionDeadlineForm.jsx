import { useMemo, useState } from 'react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '../../firebase.js'
import {
  REMINDER_TIERS_STATUS,
  computeActionDeadline,
  computeReminderDate,
  getAdvanceReminderDays,
  buildDeadlineTitle,
  buildReminderTitle,
} from '../../data/actionDeadline.js'
import { isBusinessDay, previousBusinessDay, HOLIDAYS_STATUS } from '../../lib/taiwanHolidays.js'
import { combineCaseNumberDivision } from '../../lib/caseNumber.js'

const EVENT_KINDS = [
  { id: 'agency_action', label: '公文限期動作（如繳費、陳報）', actionPlaceholder: '例：補繳裁判費' },
  { id: 'relief_period', label: '教示條款救濟期間（如上訴、抗告）', actionPlaceholder: '例：上訴' },
]

export default function ActionDeadlineForm({ cases }) {
  const [caseId, setCaseId] = useState('')
  const [eventKind, setEventKind] = useState(EVENT_KINDS[0].id)
  const [person, setPerson] = useState('')
  const [action, setAction] = useState('')
  const [triggerDate, setTriggerDate] = useState('')
  const [periodDays, setPeriodDays] = useState('')
  const [attorney, setAttorney] = useState('')
  const [caseNumberRaw, setCaseNumberRaw] = useState('')
  const [divisionRaw, setDivisionRaw] = useState('')
  const [advanceOverride, setAdvanceOverride] = useState('') // '' = 使用自動分級表
  const [saving, setSaving] = useState(false)

  const selectedCase = cases.find((c) => c.id === caseId)
  const caseNumberDisplay = useMemo(
    () => combineCaseNumberDivision(caseNumberRaw || selectedCase?.caseNumber || '', divisionRaw),
    [caseNumberRaw, divisionRaw, selectedCase],
  )

  const days = Number(periodDays)
  const validDays = periodDays !== '' && Number.isFinite(days) && days >= 0

  const preview = useMemo(() => {
    if (!triggerDate || !validDays) return null
    const { naiveDeadline, finalDeadline, rolledForward } = computeActionDeadline(triggerDate, days, {
      isBusinessDay,
      previousBusinessDay,
    })
    const autoAdvanceDays = getAdvanceReminderDays(days)
    const advanceDays = advanceOverride !== '' ? Number(advanceOverride) : autoAdvanceDays
    const mainTitle = buildDeadlineTitle({ person, action, caseNumberDisplay })
    let reminder = null
    if (advanceDays > 0) {
      const r = computeReminderDate(finalDeadline, days)
      // 若使用者覆寫了提醒天數，改用覆寫值重新往前推算提醒日
      const reminderDate =
        advanceOverride !== ''
          ? (() => {
              const d = new Date(finalDeadline + 'T00:00:00')
              d.setDate(d.getDate() - advanceDays)
              return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
            })()
          : r?.reminderDate
      reminder = { reminderDate, reminderTitle: buildReminderTitle({ finalDeadline, mainTitle }) }
    }
    return { naiveDeadline, finalDeadline, rolledForward, autoAdvanceDays, advanceDays, mainTitle, reminder }
  }, [triggerDate, validDays, days, person, action, caseNumberDisplay, advanceOverride])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!triggerDate || !validDays || !person.trim() || !action.trim() || !preview) return
    setSaving(true)
    try {
      const kind = eventKind
      const ruleBasis = eventKind === 'relief_period' ? '教示條款' : '公文指定期限'
      const base = {
        caseId: caseId || null,
        person,
        action,
        eventType: action,
        ruleId: eventKind === 'relief_period' ? 'custom_relief' : 'custom_action',
        ruleBasis,
        rulesTableStatus: REMINDER_TIERS_STATUS,
        holidaysStatus: HOLIDAYS_STATUS,
        triggerDate,
        periodDays: days,
        naiveDeadline: preview.naiveDeadline,
        rolledForward: preview.rolledForward,
        caseNumberDisplay,
        attorney,
        status: 'draft',
        confirmedBy: null,
        confirmedAt: null,
        createdBy: auth.currentUser?.uid ?? null,
        createdAt: serverTimestamp(),
      }

      const mainRef = await addDoc(collection(db, 'deadlines'), {
        ...base,
        kind,
        computedDeadline: preview.finalDeadline,
        displayTitle: preview.mainTitle,
      })

      if (preview.reminder?.reminderDate) {
        await addDoc(collection(db, 'deadlines'), {
          ...base,
          kind: 'reminder',
          eventType: `提醒：${action}`,
          computedDeadline: preview.reminder.reminderDate,
          displayTitle: preview.reminder.reminderTitle,
          linkedDeadlineId: mainRef.id,
          advanceDays: preview.advanceDays,
        })
      }

      setPerson('')
      setAction('')
      setTriggerDate('')
      setPeriodDays('')
      setCaseNumberRaw('')
      setDivisionRaw('')
      setAdvanceOverride('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
      <h3 className="font-semibold text-slate-800">新增末日提醒（公文限期 / 教示條款）</h3>
      <p className="text-xs text-slate-400">
        自動依「收文隔日起算」計算末日，遇非工作日自動順延至前一個工作日，並自動加開一筆提前提醒。
      </p>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs text-slate-500 space-y-1 col-span-2">
          <span>類型</span>
          <select value={eventKind} onChange={(e) => setEventKind(e.target.value)} className="w-full text-sm border rounded px-2 py-1.5">
            {EVENT_KINDS.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs text-slate-500 space-y-1">
          <span>案件（可留空，僅供關聯）</span>
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
          <span>當事人</span>
          <input
            required
            value={person}
            onChange={(e) => setPerson(e.target.value)}
            placeholder="王小明"
            className="w-full text-sm border rounded px-2 py-1.5"
          />
        </label>

        <label className="text-xs text-slate-500 space-y-1">
          <span>動作 / 救濟行為</span>
          <input
            required
            value={action}
            onChange={(e) => setAction(e.target.value)}
            placeholder={EVENT_KINDS.find((k) => k.id === eventKind)?.actionPlaceholder}
            className="w-full text-sm border rounded px-2 py-1.5"
          />
        </label>

        <label className="text-xs text-slate-500 space-y-1">
          <span>收文日期</span>
          <input
            required
            type="date"
            value={triggerDate}
            onChange={(e) => setTriggerDate(e.target.value)}
            className="w-full text-sm border rounded px-2 py-1.5"
          />
        </label>

        <label className="text-xs text-slate-500 space-y-1">
          <span>限期天數（依文件所載天數）</span>
          <input
            required
            type="number"
            min="0"
            value={periodDays}
            onChange={(e) => setPeriodDays(e.target.value)}
            placeholder="例：5"
            className="w-full text-sm border rounded px-2 py-1.5"
          />
        </label>

        <label className="text-xs text-slate-500 space-y-1">
          <span>案號（選填）</span>
          <input
            value={caseNumberRaw}
            onChange={(e) => setCaseNumberRaw(e.target.value)}
            placeholder="115訴1（或完整案號自動簡寫）"
            className="w-full text-sm border rounded px-2 py-1.5"
          />
        </label>

        <label className="text-xs text-slate-500 space-y-1">
          <span>股別（選填）</span>
          <input
            value={divisionRaw}
            onChange={(e) => setDivisionRaw(e.target.value)}
            placeholder="玄股"
            className="w-full text-sm border rounded px-2 py-1.5"
          />
        </label>

        <label className="text-xs text-slate-500 space-y-1">
          <span>主辦律師（選填）</span>
          <input
            value={attorney}
            onChange={(e) => setAttorney(e.target.value)}
            className="w-full text-sm border rounded px-2 py-1.5"
          />
        </label>

        <label className="text-xs text-slate-500 space-y-1">
          <span>提前提醒天數（留空 = 依分級表自動計算）</span>
          <input
            type="number"
            min="0"
            value={advanceOverride}
            onChange={(e) => setAdvanceOverride(e.target.value)}
            placeholder={preview ? `自動：${preview.autoAdvanceDays} 天` : '自動計算'}
            className="w-full text-sm border rounded px-2 py-1.5"
          />
        </label>
      </div>

      <div className="text-xs bg-emerald-50 border border-emerald-200 rounded p-3 text-emerald-900 space-y-1">
        <div className="font-medium">✓ 提前提醒天數表狀態「{REMINDER_TIERS_STATUS}」</div>
        <div>
          14~20 日限期採分級表版本（提前 5 天），2026-07-08 已由事務所確認；原始範例文字中的「提前 20 天」認定為誤植，不採用。
        </div>
      </div>

      <div className="text-xs bg-amber-50 border border-amber-200 rounded p-3 text-amber-900 space-y-1">
        <div className="font-medium">⚠️ 假日表狀態「{HOLIDAYS_STATUS}」，仍有一件事要注意：</div>
        <div>
          國定假日表目前只填了 2026 年（見 taiwanHolidays.js，來源：行政院人事總處115年辦公日曆表），2026 以外年度仍是空白，跨年度計算時遇到平日國定假日不會自動順延，需人工核對；每年年初務必請事務所人員補上當年度假日。
        </div>
      </div>

      {preview && (
        <div className="text-sm bg-slate-50 border border-slate-200 rounded p-3 space-y-1">
          <div>
            試算末日：<span className="font-semibold text-slate-800">{preview.finalDeadline}</span>
            {preview.rolledForward && (
              <span className="text-xs text-amber-600 ml-2">（原始 {preview.naiveDeadline} 為非工作日，已順延）</span>
            )}
          </div>
          <div className="text-slate-700">末日行事曆標題：「{preview.mainTitle}」</div>
          {preview.reminder?.reminderDate ? (
            <div className="text-slate-700">
              提前提醒：{preview.reminder.reminderDate}（提前 {preview.advanceDays} 天）「{preview.reminder.reminderTitle}」
            </div>
          ) : (
            <div className="text-slate-400">此限期天數無需提前提醒</div>
          )}
        </div>
      )}

      <button
        disabled={saving || !triggerDate || !validDays || !person.trim() || !action.trim()}
        className="text-sm px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {saving ? '儲存中…' : '儲存為草稿（末日 + 提醒各一筆）'}
      </button>
    </form>
  )
}
