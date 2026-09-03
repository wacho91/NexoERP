import { useMemo } from 'react'
import { useSales } from '../../hooks/useSales'
import { useProducts } from '../../hooks/useProducts'
import SalesTrendChart from './components/SalesTrendChart'
import TopProductsChart from './components/TopProductsChart'
import StockLevelsChart from './components/StockLevelsChart'
import Spinner from '../../components/ui/Spinner'

export default function ReportsPage() {
  const { sales, loading: loadingSales } = useSales({ limit: 200 })
  const { products, loading: loadingProducts } = useProducts({ active: 'all', limit: 100 })

  const salesTrend = useMemo(() => {
    const last14Days = Array.from({ length: 14 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (13 - i))
      return date.toISOString().split('T')[0]
    })
    return last14Days.map((date) => ({
      date,
      total: sales.filter((s) => s.created_at.startsWith(date)).reduce((sum, s) => sum + parseFloat(s.total), 0),
    }))
  }, [sales])

  const topProducts = useMemo(() => {
    const productsMap = new Map()
    sales.forEach((sale) => {
      sale.sale_items.forEach((item) => {
        const name = item.product?.name || item.product_id
        const current = productsMap.get(name) || 0
        productsMap.set(name, current + item.quantity)
      })
    })
    return [...productsMap.entries()]
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)
  }, [sales])

  const stockLevels = useMemo(() => {
    return products.slice(0, 10).map((p) => ({
      name: p.name.length > 20 ? p.name.slice(0, 20) + '...' : p.name,
      stock: p.stock_quantity,
      min: p.min_stock,
    }))
  }, [products])

  const isLoading = loadingSales || loadingProducts

  // === LOADER PREMIUM AQUÍ ===
  if (isLoading) return <Spinner fullContent />

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Reportes</h2>
        <p className="text-sm text-gray-500">Análisis de ventas e inventario</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="text-sm font-semibold mb-4">Tendencia de ventas</h3>
          <SalesTrendChart data={salesTrend} />
        </div>
        <div className="card p-6">
          <h3 className="text-sm font-semibold mb-4">Productos más vendidos</h3>
          <TopProductsChart data={topProducts} />
        </div>
        <div className="card p-6 lg:col-span-2">
          <h3 className="text-sm font-semibold mb-4">Niveles de stock</h3>
          <StockLevelsChart data={stockLevels} />
        </div>
      </div>
    </div>
  )
}