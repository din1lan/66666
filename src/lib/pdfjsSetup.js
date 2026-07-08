// Shared react-pdf/pdfjs worker setup. Import this once per component tree
// (side-effect only) instead of repeating the workerSrc assignment in every
// file that renders a <Document>/<Page> — react-pdf throws if the worker
// isn't configured before the first render.
import { pdfjs } from 'react-pdf'

pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()
