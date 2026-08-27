import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSales } from '../../hooks/useSales'
import { useProducts } from '../../hooks/useProducts'
import KpiCard from './components/KpiCard'
import SalesChart from './components/SalesChart'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'

export default function DashboardPage() {
  const { store } = useAuth()
  const { sales, loading: loadingSales } = useSales({ limit: 100 })
  const { products, loading: loadingProducts } = useProducts({ active: 'all', limit: 100 })

  const metrics = useMemo(() => {
    if (!sales.length) return { totalRevenue: 0, totalSales: 0, avgTicket: 0, lowStockCount: 0 }

    const totalRevenue = sales.reduce((sum, s) => sum + parseFloat(s.total), 0)
    const totalSales = sales.length
    const avgTicket = totalRevenue / totalSales
    const lowStockCount = products.filter((p) => p.stock_quantity <= p.min_stock).length

    return { totalRevenue, totalSales, avgTicket, lowStockCount }
  }, [sales, products])

  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return date.toISOString().split('T')[0]
    })

    return last7Days.map((date) => ({
      date,
      total: sales
        .filter((s) => s.created_at.startsWith(date))
        .reduce((sum, s) => sum + parseFloat(s.total), 0),
    }))
  }, [sales])

  const isLoading = loadingSales || loadingProducts

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Dashboard</h2>
        <p className="text-sm text-gray-500">Bienvenido de nuevo, {store?.name}</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <KpiCard title="Ventas totales" value={metrics.totalRevenue} type="currency" icon="money" />
            <KpiCard title="Número de ventas" value={metrics.totalSales} type="number" icon="sales" />
            <KpiCard title="Ticket promedio" value={metrics.avgTicket} type="currency" icon="ticket" />
            <KpiCard title="Productos con stock bajo" value={metrics.lowStockCount} type="number" icon="warning" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 card p-6">
              <h3 className="text-sm font-semibold mb-4">Ventas últimos 7 días</h3>
              <SalesChart data={chartData} />
            </div>
            <div className="card p-6">
              <h3 className="text-sm font-semibold mb-4">Productos con stock bajo</h3>
              {metrics.lowStockCount === 0 ? (
                <EmptyState title="Sin alertas" description="Todo el inventario está en niveles óptimos" />
              ) : (
                <div className="space-y-3">
                  {products.filter((p) => p.stock_quantity <= p.min_stock).slice(0, 5).map((p) => (
                    <Link key={p.id} to={`/inventory/${p.id}`} className="flex items-center justify-between p-3 bg-red-50 rounded-lg hover:bg-red-100 transition">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{p.name}</div>
                        <div className="text-xs text-gray-500">Stock: {p.stock_quantity} / mín: {p.min_stock}</div>
                      </div>
                      <span className="text-red-600 text-xs font-medium">Ajustar</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
