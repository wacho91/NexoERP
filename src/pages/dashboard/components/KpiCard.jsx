export default function KpiCard({ title, value, type = 'number', icon = 'money' }) {
  const icons = {
    money: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    sales: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z',
    ticket: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z',
    warning: 'M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
  }

  const formatValue = (v) => {
    if (type === 'currency') {
      return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v)
    }
    return new Intl.NumberFormat('es-MX').format(v)
  }

  return (
    <div className="card p-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icons[icon]} />
          </svg>
        </div>
        <div>
          <div className="text-xs text-gray-500 font-medium uppercase tracking-wider">{title}</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{formatValue(value)}</div>
        </div>
      </div>
    </div>
  )
}
