import { NavLink } from 'react-router-dom'

const MAIN_ITEMS = [
  {
    to: '/dashboard',
    label: '首頁總覽',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    ),
  },
  {
    to: '/cases',
    label: '案件與時效',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    ),
  },
  {
    to: '/closed-cases',
    label: '結案案件表',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
  },
  {
    to: '/crm',
    label: '客戶資料 (CRM)',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 100-8 4 4 0 000 8zm6 3c0 1.1-2.69 2-6 2s-6-.9-6-2 2.69-2 6-2 6 .9 6 2z" />
    ),
  },
  {
    to: '/files',
    label: '線上卷宗與 AI 分析',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    ),
  },
  {
    to: '/billing',
    label: '財務與代墊款',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.66 0-3 .9-3 2s1.34 2 3 2 3 .9 3 2-1.34 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V6m0 2v8m0 0v2m0-2c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
  },
]

const TOOL_ITEMS = [
  {
    to: '/ai-review',
    label: 'AI 閱卷與策略分析',
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
      />
    ),
  },
]

function NavItem({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-6 py-3 text-left transition-colors hover:bg-white/5 ${
          isActive ? 'bg-white/8 border-l-2 border-blue-400 text-white' : 'text-slate-300 border-l-2 border-transparent'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <svg
            className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            {icon}
          </svg>
          <span className="text-sm font-medium">{label}</span>
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar() {
  return (
    <aside className="w-64 bg-navy-900 text-slate-300 flex flex-col flex-shrink-0 h-full">
      <div className="flex items-center gap-3 px-6 py-6 border-b border-white/10">
        <div className="w-9 h-9 rounded-md bg-blue-600 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M4.5 8.5L12 3l7.5 5.5M6 8.5v9a1 1 0 001 1h10a1 1 0 001-1v-9" />
          </svg>
        </div>
        <div>
          <p className="text-white font-semibold text-sm leading-tight">法律事務所</p>
          <p className="text-slate-400 text-xs leading-tight">案件管理系統</p>
        </div>
      </div>

      <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
        {MAIN_ITEMS.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}

        <div className="px-6 pt-4 pb-1">
          <p className="text-xs uppercase tracking-wider text-slate-500">智慧工具</p>
        </div>
        {TOOL_ITEMS.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      <div className="px-6 py-3 text-[11px] leading-relaxed text-slate-500 border-t border-white/10">
        原型階段：資料庫規則僅要求「已登入」，尚未做案件層級的權限區隔（利益衝突迴避）。正式上線前必須補上。
      </div>

      <div className="px-6 py-4 border-t border-white/10 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-xs font-medium text-white">陳</div>
        <div className="leading-tight">
          <p className="text-sm text-white">陳律師</p>
          <p className="text-xs text-slate-400">主持律師（原型帳號）</p>
        </div>
      </div>
    </aside>
  )
}
