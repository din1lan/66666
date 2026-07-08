import { useMemo, useState } from 'react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '../../firebase.js'
import { DEADLINE_RULES, RULES_STATUS, computeDeadlineDate } from '../../data/deadlineRules.js'

export default function DeadlineForm({ cases }) {
  const [caseId, setCaseId] = useState('')
  const [ruleId, setRuleId] = useState(DEADLINE_RULES[0]?.id ?? '')
  const [triggerDate, setTriggerDate] = useState('')
  const [attorney, setAttorney] = useState('')
  const [saving, setSaving] = useState(false)

  const rule = DEADLINE_RULES.find((r) => r.id === ruleId)
  const preview = useMemo(() => {
    if (!rule || !triggerDate) return null
    return computeDeadlineDate(triggerDate, rule.days)
  }, [rule, triggerDate])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!caseId || !rule || !triggerDate) return
    setSaving(true)
    try {
      await addDoc(collection(db, 'deadlines'), {
        caseId,
        eventType: rule.eventType,
        ruleId: rule.id,
        ruleVersion: rule.version,
        ruleBasis: rule.basis,
        rulesTableStatus: RULES_STATUS, // frozen at creation time for audit
        triggerDate,
        computedDeadline: preview,
        attorney,
        status: 'draft', // must be explicitly confirmed by a human before it counts
        confirmedBy: null,
        confirmedAt: null,
        createdBy: auth.currentUser?.uid ?? null,
        createdAt: serverTimestamp(),
      })
      setCaseId('')
      setTriggerDate('')
      setAttorney('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
      <h3 className="font-semibold text-slate-800">新增時效</h3>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs text-slate-500 space-y-1">
          <span>案件</span>
          <select
            required
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

        <label className="text-xs text-slate-500 space-y-1">
          <span>事件類型</span>
          <select
            value={ruleId}
            onChange={(e) => setRuleId(e.target.value)}
            className="w-full text-sm border rounded px-2 py-1.5"
          >
            {DEADLINE_RULES.map((r) => (
              <option key={r.id} value={r.id}>
                {r.eventType}（{r.days}日）
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs text-slate-500 space-y-1">
          <span>送達 / 觸發日期</span>
          <input
            required
            type="date"
            value={triggerDate}
            onChange={(e) => setTriggerDate(e.target.value)}
            className="w-full text-sm border rounded px-2 py-1.5"
          />
        </label>

        <label className="text-xs text-slate-500 space-y-1">
          <span>主辦律師</span>
          <input
            value={attorney}
            onChange={(e) => setAttorney(e.target.value)}
            placeholder="律師姓名"
            className="w-full text-sm border rounded px-2 py-1.5"
          />
        </label>
      </div>

      {rule && (
        <div className="text-xs bg-amber-50 border border-amber-200 rounded p-3 text-amber-900 space-y-1">
          <div>依據：{rule.basis}</div>
          <div>{rule.notes}</div>
          <div className="font-medium">
            ⚠️ 此規則表狀態為「{RULES_STATUS}」，尚未經律師覆核；在途期間與例假日順延均未計算，僅供草稿參考。
          </div>
        </div>
      )}

      {preview && (
        <div className="text-sm">
          試算期限：<span className="font-semibold text-slate-800">{preview}</span>
          <span className="text-xs text-slate-400 ml-2">
            （儲存後仍為草稿，需在時效清單中按「確認」才生效）
          </span>
        </div>
      )}

      <button
        disabled={saving || !caseId || !triggerDate}
        className="text-sm px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {saving ? '儲存中…' : '儲存為草稿'}
      </button>
    </form>
  )
}
