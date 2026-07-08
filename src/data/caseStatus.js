export const CASE_STATUSES = ['進行中', '待開庭', '調解中', '上訴中', '已結案']

export const CASE_STATUS_BADGE = {
  進行中: 'bg-blue-50 text-blue-700',
  待開庭: 'bg-slate-100 text-slate-600',
  調解中: 'bg-purple-50 text-purple-700',
  上訴中: 'bg-amber-50 text-amber-700',
  已結案: 'bg-emerald-50 text-emerald-700',
}

export function isClosed(status) {
  return status === '已結案'
}
