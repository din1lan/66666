import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ensureSignedIn } from './firebase.js'
import Layout from './components/Layout.jsx'
import DashboardPage from './modules/dashboard/DashboardPage.jsx'
import ClientsPage from './modules/crm/ClientsPage.jsx'
import CasesPage from './modules/cases/CasesPage.jsx'
import ClosedCasesPage from './modules/closed-cases/ClosedCasesPage.jsx'
import BillingPage from './modules/billing/BillingPage.jsx'
import FilesPage from './modules/files/FilesPage.jsx'
import AiReviewPage from './modules/ai-review/AiReviewPage.jsx'

function App() {
  const [ready, setReady] = useState(false)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    ensureSignedIn()
      .then(() => setReady(true))
      .catch((err) => setAuthError(err))
  }, [])

  if (authError) {
    return (
      <div className="h-screen flex items-center justify-center text-sm text-red-600 px-6 text-center">
        無法連線至 Firebase Auth Emulator（{authError.message}）。
        <br />
        請確認已執行 <code>firebase emulators:start</code>。
      </div>
    )
  }

  if (!ready) {
    return <div className="h-screen flex items-center justify-center text-sm text-slate-400">連線中…</div>
  }

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/cases" element={<CasesPage />} />
        <Route path="/closed-cases" element={<ClosedCasesPage />} />
        <Route path="/crm" element={<ClientsPage />} />
        <Route path="/files" element={<FilesPage />} />
        <Route path="/billing" element={<BillingPage />} />
        <Route path="/ai-review" element={<AiReviewPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}

export default App
