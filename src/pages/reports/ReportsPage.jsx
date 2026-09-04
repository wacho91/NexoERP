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

  // === Tendencia de ventas blindada (Agrupa por fechas reales de la BD) ===
  const salesTrend = useMemo(() => {
    if (!sales || sales.length === 0) return []
    
    // Agrupamos las ventas por su fecha real (YYYY-MM-DD)
    const grouped = sales.reduce((acc, sale) => {
      const date = sale.created_at?.slice(0, 10) // Toma solo la fecha, ignora la hora
      if (!date) return acc
      acc[date] = (acc[date] || 0) + parseFloat(sale.total)
      return acc
    }, {})

    // Ordenamos las fechas y tomamos las últimas 7 que tengan ventas
    const sortedDates = Object.keys(grouped).sort()
    const lastDates = sortedDates.slice(-7)

    return lastDates.map(date => ({
      date,
      total: grouped[date]
    }))
  }, [sales])

  // === Productos más vendidos blindado ===
  const topProducts = useMemo(() => {
    if (!sales || sales.length === 0) return []
    
    const productsMap = new Map()
    sales.forEach((sale) => {
      // Verificamos que la venta sí traiga los items
      if (sale.sale_items && Array.isArray(sale.sale_items)) {
        sale.sale_items.forEach((item) => {
          const name = item.product?.name || `Producto ${item.product_id?.slice(0, 4)}`
          const current = productsMap.get(name) || 0
          productsMap.set(name, current + item.quantity)
        })
      }
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
          {salesTrend.length > 0 ? (
            <SalesTrendChart data={salesTrend} />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
              No hay datos de ventas suficientes
            </div>
          )}
        </div>
        
        <div className="card p-6">
          <h3 className="text-sm font-semibold mb-4">Productos más vendidos</h3>
          {topProducts.length > 0 ? (
            <TopProductsChart data={topProducts} />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
              No hay datos de productos vendidos
            </div>
          )}
        </div>
        
        <div className="card p-6 lg:col-span-2">
          <h3 className="text-sm font-semibold mb-4">Niveles de stock</h3>
          {stockLevels.length > 0 ? (
            <StockLevelsChart data={stockLevels} />
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
              No hay productos en el inventario
            </div>
          )}
        </div>
      </div>
    </div>
  )
}