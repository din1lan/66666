// Clickable "jump to source" badge. Points at a page number in the PDF pane
// (react-pdf renders real pages via canvas, so we can jump to the page, but
// — unlike a plain-text mockup — we can't reliably highlight one specific
// line inside a canvas-rendered page without a much heavier text-layer
// matching setup. Being honest about that limitation here rather than
// pretending line-level precision we don't actually have.)
export default function CiteTag({ page, onClick }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 text-[11px] text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5 hover:bg-blue-100 transition-colors whitespace-nowrap align-middle"
    >
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      卷宗 p.{page}
    </button>
  )
}
