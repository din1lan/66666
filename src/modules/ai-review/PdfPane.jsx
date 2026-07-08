import { useEffect, useState } from 'react'
import { Document, Page } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import '../../lib/pdfjsSetup.js'

// Inline (non-modal) PDF viewer for the split-pane AI review layout.
//
// Honesty note: react-pdf renders pages as canvas, not individual DOM nodes
// per paragraph. That means citation clicks can reliably jump to the right
// PAGE (`jumpToPage` prop, bumped from outside), but — unlike the flat-text
// mockup this was based on — we can't highlight one specific line inside the
// page without a much heavier text-layer search/overlay implementation. The
// brief highlight ring on the whole pane is the honest version of that
// feedback: "we jumped, verify the passage yourself on this page."
export default function PdfPane({ file, jumpToPage }) {
  const [numPages, setNumPages] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [error, setError] = useState(null)
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    setPageNumber(1)
    setError(null)
  }, [file?.url])

  useEffect(() => {
    if (jumpToPage == null) return
    const target = Math.round(jumpToPage)
    setPageNumber(numPages ? Math.min(Math.max(target, 1), numPages) : target)
    setFlash(true)
    const t = setTimeout(() => setFlash(false), 1200)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jumpToPage])

  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-slate-400 bg-slate-100">
        請先在上方選擇案件與卷宗檔案
      </div>
    )
  }

  return (
    <div className="flex-1 bg-slate-100 p-4 overflow-hidden flex flex-col min-h-0">
      <div
        className={`h-full bg-white rounded-lg border shadow-sm flex flex-col overflow-hidden transition-shadow ${
          flash ? 'border-blue-400 ring-2 ring-blue-300' : 'border-slate-300'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-2 bg-slate-700 text-slate-200 text-xs flex-shrink-0">
          <span className="truncate">{file.fileName}</span>
          <div className="flex items-center gap-3 flex-shrink-0">
            <span>
              第 {pageNumber} / {numPages ?? '…'} 頁
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-auto flex justify-center py-4 min-h-0">
          {error ? (
            <div className="text-sm text-red-600 self-start mt-8 px-4">無法載入 PDF：{error.message}</div>
          ) : (
            <Document
              file={file.url}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              onLoadError={(err) => setError(err)}
              loading={<div className="text-sm text-slate-400 mt-8">載入中…</div>}
            >
              <Page pageNumber={pageNumber} width={640} />
            </Document>
          )}
        </div>

        {numPages && (
          <div className="flex items-center justify-center gap-3 px-4 py-2 border-t text-sm flex-shrink-0">
            <button
              disabled={pageNumber <= 1}
              onClick={() => setPageNumber((p) => p - 1)}
              className="px-2 py-1 rounded hover:bg-slate-100 disabled:opacity-30"
            >
              ← 上一頁
            </button>
            <button
              disabled={pageNumber >= numPages}
              onClick={() => setPageNumber((p) => p + 1)}
              className="px-2 py-1 rounded hover:bg-slate-100 disabled:opacity-30"
            >
              下一頁 →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
