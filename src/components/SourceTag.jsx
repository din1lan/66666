// Source-reliability badge used throughout the AI review module.
//   verified  — traceable to the source PDF text (still not a claim that the
//               AI's *interpretation* of it is correct, just that the text exists)
//   inferred  — a conclusion the AI drew, not text lifted from the document
//   generated — the highest-risk category: legal citations, case law, or
//               figures the AI produced from its own knowledge, NOT verified
//               against a real database. Clicking it should always force a
//               verification prompt — see VerifyModal.
const STYLES = {
  verified: 'text-emerald-700 bg-emerald-50 border-emerald-200',
  inferred: 'text-amber-700 bg-amber-50 border-amber-200',
  generated: 'text-rose-700 bg-rose-50 border-rose-200 cursor-pointer hover:bg-rose-100',
}

const LABELS = {
  verified: '原文',
  inferred: 'AI 推論',
  generated: '待核',
}

const ICONS = {
  verified: (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  inferred: (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v2m0 4h.01M5.07 19H19a2 2 0 001.75-2.96L13.75 4a2 2 0 00-3.5 0L3.25 16A2 2 0 005 19z"
      />
    </svg>
  ),
  generated: (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
}

export default function SourceTag({ kind, label, onClick }) {
  return (
    <span
      onClick={kind === 'generated' ? onClick : undefined}
      className={`inline-flex items-center gap-1 text-[11px] font-medium rounded px-1.5 py-0.5 border whitespace-nowrap align-middle ${STYLES[kind]}`}
    >
      {ICONS[kind]}
      {label ?? LABELS[kind]}
    </span>
  )
}
