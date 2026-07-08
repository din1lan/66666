import { useState } from 'react'
import { Document, Page } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import '../../lib/pdfjsSetup.js'

export default function PdfViewer({ file, onClose }) {
  const [numPages, setNumPages] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [error, setError] = useState(null)

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl w-[min(900px,92vw)] h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="font-medium text-slate-800 truncate">{file.fileName}</div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-lg leading-none">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-auto bg-slate-100 flex justify-center py-4">
          {error ? (
            <div className="text-sm text-red-600 self-start mt-8">
              無法載入 PDF：{error.message}
            </div>
          ) : (
            <Document
              file={file.url}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
              onLoadError={(err) => setError(err)}
              loading={<div className="text-sm text-slate-400 mt-8">載入中…</div>}
            >
              <Page pageNumber={pageNumber} width={800} />
            </Document>
          )}
        </div>

        {numPages && (
          <div className="flex items-center justify-center gap-3 px-4 py-2 border-t text-sm">
            <button
              disabled={pageNumber <= 1}
              onClick={() => setPageNumber((p) => p - 1)}
              className="px-2 py-1 rounded hover:bg-slate-100 disabled:opacity-30"
            >
              ← 上一頁
            </button>
            <span>
              {pageNumber} / {numPages}
            </span>
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
