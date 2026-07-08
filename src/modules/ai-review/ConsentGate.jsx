import { useEffect, useState } from 'react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '../../firebase.js'

const CHECKS = [
  'AI 輸出可能包含幻覺（hallucination），包括不存在的法條、錯誤的判例與虛構的數據，且外觀與正確內容無異。',
  '標示為「原文」者僅代表可溯源至卷宗，不代表 AI 對該段的解讀正確；標示為「推論」「待核」者更須自行判斷。',
  '本工具不構成法律意見，一切分析結果須由本人查證後，方得用於書狀、庭訊或對當事人之建議，相關執業責任由本人承擔。',
]

// Unlike the original mockup (which re-showed this every page visit and only
// mentioned recording consent server-side as a future TODO), this writes the
// consent record to Firestore (`aiConsent/{uid}`) immediately — giving the
// audit trail this module needs from day one instead of leaving it as a
// known gap. Still worth re-confirming per major version bump of the
// disclosures above (bump CONSENT_VERSION if you change the checklist).
const CONSENT_VERSION = 1

export default function ConsentGate({ children }) {
  const [status, setStatus] = useState('checking') // checking | needed | granted
  const [checks, setChecks] = useState(CHECKS.map(() => false))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const uid = auth.currentUser?.uid
    if (!uid) return
    getDoc(doc(db, 'aiConsent', uid)).then((snap) => {
      const data = snap.data()
      if (data && data.version === CONSENT_VERSION) {
        setStatus('granted')
      } else {
        setStatus('needed')
      }
    })
  }, [])

  async function confirm() {
    const uid = auth.currentUser?.uid
    if (!uid) return
    setSaving(true)
    try {
      await setDoc(doc(db, 'aiConsent', uid), {
        version: CONSENT_VERSION,
        confirmedAt: serverTimestamp(),
      })
      setStatus('granted')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'checking') {
    return <div className="flex-1 flex items-center justify-center text-sm text-slate-400">確認使用權限中…</div>
  }

  if (status === 'granted') {
    return children
  }

  const allChecked = checks.every(Boolean)

  return (
    <div className="flex-1 flex items-center justify-center bg-navy-950/70 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">使用前須知｜AI 輔助分析</h3>
          <p className="text-xs text-slate-500 mt-1">本聲明依律師專業責任及生成式 AI 使用風險而設，僅需確認一次</p>
        </div>
        <div className="px-6 py-5 text-sm text-slate-600 leading-6 space-y-3 max-h-72 overflow-y-auto">
          <p>本模組使用生成式 AI 協助分析卷宗。使用前請確認您已理解：</p>
          <div className="space-y-2">
            {CHECKS.map((text, i) => (
              <label key={i} className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1 w-4 h-4 accent-blue-600 flex-shrink-0"
                  checked={checks[i]}
                  onChange={(e) =>
                    setChecks((cs) => cs.map((c, idx) => (idx === i ? e.target.checked : c)))
                  }
                />
                <span>{text}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-400">原型展示，非供實際執業使用</span>
          <button
            disabled={!allChecked || saving}
            onClick={confirm}
            className={`px-5 py-2 text-white text-sm font-medium rounded-md transition-colors ${
              allChecked ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer' : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            {saving ? '記錄中…' : allChecked ? '進入 AI 分析' : '請勾選全部項目'}
          </button>
        </div>
      </div>
    </div>
  )
}
