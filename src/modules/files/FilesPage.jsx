import { useState } from 'react'
import { orderBy, where } from 'firebase/firestore'
import { useNavigate } from 'react-router-dom'
import { useCollection } from '../../hooks/useCollection.js'
import UploadDropzone from './UploadDropzone.jsx'
import PdfViewer from './PdfViewer.jsx'
import FileNamingForm from './FileNamingForm.jsx'

export default function FilesPage() {
  const navigate = useNavigate()
  const { docs: cases } = useCollection('cases')
  const [caseId, setCaseId] = useState('')
  const [viewing, setViewing] = useState(null)
  const [namingFile, setNamingFile] = useState(null)

  const { docs: files } = useCollection(
    'files',
    caseId ? [where('caseId', '==', caseId), orderBy('uploadedAt', 'desc')] : [],
  )

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">檔案管理與線上閱卷</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          PDF 卷宗依案件歸檔，點擊檔案可直接在網頁內閱覽，無需下載
        </p>
      </div>

      <section className="bg-white rounded-lg border border-slate-200 p-5">
        <label className="text-xs text-slate-500 space-y-1 block max-w-md">
          <span>選擇案件</span>
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

      {caseId ? (
        <>
          <UploadDropzone caseId={caseId} />

          <section className="bg-white rounded-lg border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-3">卷宗檔案（{files.length}）</h3>
            {files.length === 0 ? (
              <div className="text-sm text-slate-300">此案件尚無上傳檔案</div>
            ) : (
              <ul className="divide-y">
                {files.map((f) => (
                  <li key={f.id} className="py-2 space-y-1">
                    <div className="flex items-center justify-between gap-3">
                      <button
                        onClick={() => setViewing(f)}
                        className="text-sm text-indigo-700 hover:underline flex items-center gap-2 min-w-0 truncate"
                      >
                        📄 {f.fileName}
                      </button>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-xs text-slate-400">
                          {f.size ? `${(f.size / 1024).toFixed(0)} KB` : ''}
                        </span>
                        <button
                          onClick={() => setNamingFile(namingFile?.id === f.id ? null : f)}
                          className="text-xs px-2 py-1 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                        >
                          {namingFile?.id === f.id ? '收合檔名工具' : '產生檔名'}
                        </button>
                        <button
                          onClick={() => navigate(`/ai-review?caseId=${caseId}&fileId=${f.id}`)}
                          className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100"
                        >
                          傳送至 AI 分析 →
                        </button>
                      </div>
                    </div>
                    {f.suggestedFileName && (
                      <div className="text-xs text-slate-500 pl-6">
                        建議檔名：<span className="font-mono text-slate-700">{f.suggestedFileName}</span>
                      </div>
                    )}
                    {namingFile?.id === f.id && (
                      <div className="pt-2">
                        <FileNamingForm file={f} onClose={() => setNamingFile(null)} />
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : (
        <div className="text-sm text-slate-400">請先選擇一個案件</div>
      )}

      {viewing && <PdfViewer file={viewing} onClose={() => setViewing(null)} />}
    </div>
  )
}
