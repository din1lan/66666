import { useState } from 'react'
import { orderBy } from 'firebase/firestore'
import { useCollection } from '../../hooks/useCollection.js'
import ClientList from './ClientList.jsx'
import ClientDetail from './ClientDetail.jsx'

export default function ClientsPage() {
  const { docs: clients, loading } = useCollection('clients', [orderBy('createdAt', 'desc')])
  const [selectedId, setSelectedId] = useState(null)

  const selected = clients.find((c) => c.id === selectedId) || null

  return (
    <div className="flex h-full">
      <ClientList clients={clients} selectedId={selectedId} onSelect={setSelectedId} />
      <div className="flex-1 flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 bg-white">
          <h1 className="text-lg font-semibold text-slate-800">客戶與案件管理</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {loading ? '載入中…' : `共 ${clients.length} 位客戶`}
          </p>
        </div>
        {selected ? (
          <ClientDetail client={selected} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
            從左側選擇一位客戶，或新增客戶
          </div>
        )}
      </div>
    </div>
  )
}
