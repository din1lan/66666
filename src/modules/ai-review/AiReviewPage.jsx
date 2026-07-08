import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { orderBy, where } from 'firebase/firestore'
import { useCollection } from '../../hooks/useCollection.js'
import ConsentGate from './ConsentGate.jsx'
import PdfPane from './PdfPane.jsx'
import SourceTag from '../../components/SourceTag.jsx'
import CiteTag from '../../components/CiteTag.jsx'
import VerifyModal from '../../components/VerifyModal.jsx'

export default function AiReviewPage() {
  const [params, setParams] = useSearchParams()
  const { docs: cases } = useCollection('cases')
  const caseId = params.get('caseId') || ''
  const fileId = params.get('fileId') || ''

  const { docs: files } = useCollection('files', caseId ? [where('caseId', '==', caseId), orderBy('uploadedAt', 'desc')] : [])
  const selectedCase = cases.find((c) => c.id === caseId) || null
  const selectedFile = files.find((f) => f.id === fileId) || null

  function setCaseId(id) {
    setParams(id ? { caseId: id } : {})
  }
  function setFileId(id) {
    setParams(caseId ? { caseId, fileId: id } : {})
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-200 bg-white flex-shrink-0">
        <h1 className="text-base font-bold text-slate-900 flex-shrink-0">AI 閱卷與策略分析</h1>
        <select
          value={caseId}
          onChange={(e) => setCaseId(e.target.value)}
          className="text-xs border rounded px-2 py-1"
        >
          <option value="">選擇案件…</option>
          {cases.map((c) => (
            <option key={c.id} value={c.id}>
              {c.caseNumber} {c.title ? `· ${c.title}` : ''}
            </option>
          ))}
        </select>
        <select
          value={fileId}
          onChange={(e) => setFileId(e.target.value)}
          disabled={!caseId}
          className="text-xs border rounded px-2 py-1 disabled:opacity-40"
        >
          <option value="">選擇卷宗檔案…</option>
          {files.map((f) => (
            <option key={f.id} value={f.id}>
              {f.fileName}
            </option>
          ))}
        </select>
        {caseId && files.length === 0 && (
          <span className="text-xs text-slate-400">此案件尚無上傳檔案，請先到「線上卷宗與 AI 分析」上傳</span>
        )}
      </div>

      <ConsentGate>
        <SplitPane caseDoc={selectedCase} file={selectedFile} />
      </ConsentGate>
    </div>
  )
}

function SplitPane({ caseDoc, file }) {
  const containerRef = useRef(null)
  const [leftPct, setLeftPct] = useState(50)
  const draggingRef = useRef(false)
  const [jumpToPage, setJumpToPage] = useState(null)
  const [verifyContent, setVerifyContent] = useState(null)

  useEffect(() => {
    function onMove(e) {
      if (!draggingRef.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      let pct = ((e.clientX - rect.left) / rect.width) * 100
      pct = Math.min(75, Math.max(25, pct))
      setLeftPct(pct)
    }
    function onUp() {
      draggingRef.current = false
      document.body.classList.remove('resizing')
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  function cite(page) {
    return () => setJumpToPage((p) => (p === page ? page + 0.0001 : page)) // force effect re-fire even for same page
  }

  return (
    <div ref={containerRef} className="flex flex-1 min-h-0">
      <div className="flex flex-col bg-white overflow-hidden min-h-0" style={{ width: `${leftPct}%` }}>
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">卷宗預覽</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {caseDoc ? `${caseDoc.caseNumber}${caseDoc.title ? '｜' + caseDoc.title : ''}` : '尚未選擇案件'}
            </p>
          </div>
        </div>
        <PdfPane file={file} jumpToPage={jumpToPage} />
      </div>

      <div
        className="w-1.5 cursor-col-resize bg-slate-200 hover:bg-blue-500 flex-shrink-0 relative"
        onMouseDown={() => {
          draggingRef.current = true
          document.body.classList.add('resizing')
        }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-8 bg-slate-400 rounded" />
      </div>

      <div className="flex flex-col bg-slate-50 overflow-hidden min-h-0" style={{ width: `${100 - leftPct}%` }}>
        <AnalysisHeader file={file} />
        <AnalysisPanels cite={cite} onVerify={setVerifyContent} />
        <ChatBox />
      </div>

      <VerifyModal content={verifyContent} onClose={() => setVerifyContent(null)} />
    </div>
  )
}

function AnalysisHeader({ file }) {
  return (
    <div className="px-6 py-4 border-b border-slate-200 flex-shrink-0 bg-white">
      <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
        AI 策略分析
      </h2>
      <p className="text-xs text-slate-500 mt-0.5">分析基準：{file ? file.fileName : '（尚未選擇卷宗）'}</p>

      <div className="mt-3 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01M5.07 19H19a2 2 0 001.75-2.96L13.75 4a2 2 0 00-3.5 0L3.25 16A2 2 0 005 19z"
          />
        </svg>
        <span>
          下方三個分析面板為<b>靜態示範內容</b>（尚未串接真實 AI 模型讀取你上傳的卷宗），用於展示畫面設計與來源分級互動方式。
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2 bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
        <span className="text-xs text-slate-500 font-medium">來源分級：</span>
        <SourceTag kind="verified" />
        <SourceTag kind="inferred" />
        <SourceTag kind="generated" />
      </div>
    </div>
  )
}

function Accordion({ title, children, defaultOpen }) {
  const [open, setOpen] = useState(!!defaultOpen)
  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition-colors"
      >
        <span className="font-semibold text-sm text-slate-900">{title}</span>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-5 pb-5 text-sm leading-6 text-slate-600 border-t border-slate-100 pt-4">{children}</div>}
    </div>
  )
}

function AnalysisPanels({ cite, onVerify }) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      <Accordion title="【案件現況與爭點摘要】" defaultOpen>
        <p className="mb-2">
          <span className="font-medium text-slate-800">案件性質：</span>侵權行為損害賠償（示範案例：車禍事件）。{' '}
          <SourceTag kind="generated" label="待核·法條" onClick={() => onVerify('民法第184、191-2、193、195條')} />
        </p>
        <p className="mb-2">
          <span className="font-medium text-slate-800">請求金額：</span>合計新臺幣120萬元。 <SourceTag kind="verified" />
          <CiteTag page={2} onClick={cite(2)} />
        </p>
        <p className="font-medium text-slate-800 mb-1">主要爭點：</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            肇事責任比例之認定 <SourceTag kind="inferred" /> <CiteTag page={3} onClick={cite(3)} />
          </li>
          <li>
            薪資損失是否有相當證明 <SourceTag kind="verified" /> <CiteTag page={2} onClick={cite(2)} />
          </li>
          <li>
            慰撫金是否過高，與實務行情之比較 <SourceTag kind="inferred" />
          </li>
          <li>
            與有過失、過失相抵之適用{' '}
            <SourceTag kind="generated" label="待核·法條" onClick={() => onVerify('民法第217條')} />
          </li>
        </ul>
      </Accordion>

      <Accordion title="【我方優劣勢評估】">
        <p className="font-medium text-emerald-700 mb-1">我方有利之點：</p>
        <ul className="list-disc pl-5 space-y-1.5 mb-3">
          <li>
            初步分析研判表載有對造未依規定讓車情事 <SourceTag kind="verified" /> <CiteTag page={3} onClick={cite(3)} />
          </li>
          <li>
            薪資損失部分舉證顯有不足 <SourceTag kind="verified" /> <CiteTag page={2} onClick={cite(2)} />
          </li>
        </ul>
        <p className="font-medium text-rose-700 mb-1">我方不利之點：</p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            對造有超速紀錄，基本肇事責任難以完全免除 <SourceTag kind="inferred" /> <CiteTag page={1} onClick={cite(1)} />
          </li>
          <li>
            傷勢有客觀診斷及單據佐證 <SourceTag kind="verified" /> <CiteTag page={2} onClick={cite(2)} />
          </li>
        </ul>
      </Accordion>

      <Accordion title="【後續開庭建議說法】">
        <div className="mb-3 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01M5.07 19H19a2 2 0 001.75-2.96L13.75 4a2 2 0 00-3.5 0L3.25 16A2 2 0 005 19z"
            />
          </svg>
          <span>
            本面板<b>整體屬「推論／生成」性質</b>，不可直接引用。所有法條、金額區間、實務行情均須律師本人查證。
          </span>
        </div>
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            <span className="font-medium text-slate-800">程序上：</span>聲請調閱事故現場資料及送鑑定委員會鑑定肇責比例。{' '}
            <SourceTag kind="inferred" />
          </li>
          <li>
            <span className="font-medium text-slate-800">實體抗辯：</span>主張與有過失，請求減輕賠償金額。{' '}
            <SourceTag kind="generated" label="待核·法條" onClick={() => onVerify('民法第217條、民事訴訟法第277條')} />
          </li>
          <li>
            <span className="font-medium text-slate-800">和解評估：</span>視鑑定結果決定和解區間。 <SourceTag kind="inferred" />
          </li>
        </ol>
      </Accordion>
    </div>
  )
}

function ChatBox() {
  const [value, setValue] = useState('')
  const [notice, setNotice] = useState(false)

  function handleSend() {
    if (!value.trim()) return
    setNotice(true)
    setValue('')
  }

  return (
    <div className="border-t border-slate-200 bg-white p-4 flex-shrink-0">
      <div className="flex items-start gap-2 mb-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>
          AI 可能產生看似合理但錯誤的內容（幻覺），<b>尤其是法條、判例、金額</b>。本工具僅為輔助，不構成法律意見。
        </span>
      </div>
      {notice && (
        <div className="mb-2.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-md px-3 py-2">
          這是原型畫面，尚未串接真實的 AI 對話後端，所以送出後不會有實際回覆。
        </div>
      )}
      <div className="flex items-end gap-2">
        <div className="flex-1 border border-slate-300 rounded-lg focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-colors">
          <textarea
            rows={2}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="針對這份卷宗向 AI 提問，例如：原告的薪資損失主張有哪些可以攻擊的點？"
            className="w-full text-sm px-3 py-2.5 resize-none focus:outline-none rounded-lg placeholder:text-slate-400"
          />
        </div>
        <button
          onClick={handleSend}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-3 transition-colors flex-shrink-0"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  )
}
