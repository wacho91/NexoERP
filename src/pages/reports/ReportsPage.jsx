import { useMemo } from 'react'
import { useSales } from '../../hooks/useSales'
import { useProducts } from '../../hooks/useProducts'
import SalesTrendChart from './components/SalesTrendChart'
import TopProductsChart from './components/TopProductsChart'
import StockLevelsChart from './components/StockLevelsChart'
import Spinner from '../../components/ui/Spinner'

export default function ReportsPage() {
  const { sales, loading: loadingSales, error: errorSales } = useSales({ limit: 200 })
  const { products, loading: loadingProducts } = useProducts({ active: 'all', limit: 100 })

  // === Tendencia de ventas (Blindada) ===
  const salesTrend = useMemo(() => {
    if (!sales || sales.length === 0) return []
    
    const map = {}
    sales.forEach(sale => {
      // Extrae la fecha (YYYY-MM-DD) o usa 'Sin fecha'
      const dateStr = sale.created_at ? sale.created_at.split('T')[0] : 'Sin fecha'
      const total = parseFloat(sale.total) || 0
      map[dateStr] = (map[dateStr] || 0) + total
    })
    
    return Object.keys(map).map(date => ({ date, total: map[date] }))
  }, [sales])

  // === Productos más vendidos (Blindada) ===
  const topProducts = useMemo(() => {
    if (!sales || sales.length === 0) return []
    
    const map = {}
    sales.forEach(sale => {
      if (sale.sale_items && Array.isArray(sale.sale_items)) {
        sale.sale_items.forEach(item => {
          const name = item.product?.name || item.name || `Producto ${item.product_id?.slice(0, 4)}`
          const qty = item.quantity || 0
          map[name] = (map[name] || 0) + qty
        })
      }
    })
    
    return Object.keys(map).map(name => ({ name, quantity: map[name] }))
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

      {/* Si el hook de ventas da error, lo mostramos para saber qué pasa */}
      {errorSales ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">
          Error al cargar ventas: {errorSales}
        </div>
      ) : sales.length === 0 ? (
        <div className="p-8 text-center text-gray-500 bg-white rounded-xl border border-dashed">
          No hay ventas registradas para generar reportes. Haz una venta en el POS primero.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h3 className="text-sm font-semibold mb-4">Tendencia de ventas</h3>
            {salesTrend.length > 0 ? (
              <SalesTrendChart data={salesTrend} />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
                Formato de fecha no reconocido en las ventas
              </div>
            )}
          </div>
          
          <div className="card p-6">
            <h3 className="text-sm font-semibold mb-4">Productos más vendidos</h3>
            {topProducts.length > 0 ? (
              <TopProductsChart data={topProducts} />
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-gray-400 text-sm gap-2">
                <span>Las ventas no incluyen detalle de productos.</span>
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
      )}
    </div>
  )
}