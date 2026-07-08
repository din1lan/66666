// Forces a stop-and-check moment whenever the user clicks a "待核" (generated,
// unverified) tag — legal citations or figures the AI produced from its own
// knowledge rather than from the document. Links out to the two official
// Taiwan legal databases so verification is one click away, not a separate
// search the user has to remember to do later.
export default function VerifyModal({ content, onClose }) {
  if (!content) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-rose-600 px-6 py-4 flex items-center gap-3">
          <svg className="w-6 h-6 text-white flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-white font-bold text-base">此內容由 AI 生成，尚未核實</h3>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-slate-600 leading-6 mb-3">
            以下法條／數據為 AI 依語言模型生成，<b className="text-rose-600">並非查詢自官方法規資料庫</b>。AI
            有可能引用不存在的條號、錯置條文內容或編造判例。
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-md px-4 py-3 text-sm font-medium text-slate-800 mb-4">
            {content}
          </div>
          <p className="text-sm text-slate-600 leading-6 mb-4">請務必至下列官方來源逐一核對後，再決定是否採用：</p>
          <div className="space-y-2">
            <a
              href="https://law.moj.gov.tw/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-4 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm"
            >
              <span className="text-slate-700">全國法規資料庫</span>
              <ExternalIcon />
            </a>
            <a
              href="https://judgment.judicial.gov.tw/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-4 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors text-sm"
            >
              <span className="text-slate-700">司法院裁判書查詢系統</span>
              <ExternalIcon />
            </a>
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white text-sm font-medium rounded-md transition-colors">
            我了解，將自行核對
          </button>
        </div>
      </div>
    </div>
  )
}

function ExternalIcon() {
  return (
    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  )
}
