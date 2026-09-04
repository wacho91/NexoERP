import { useState, useEffect, useMemo } from 'react'
import { useSales } from '../../hooks/useSales'
import SalesTrendChart from './components/SalesTrendChart'
import TopProductsChart from './components/TopProductsChart'
import StockLevelsChart from './components/StockLevelsChart'
import Spinner from '../../components/ui/Spinner'

export default function ReportsPage() {
  const { sales, loading: loadingSales } = useSales({ limit: 100 })
  
  // === CARGAR PRODUCTOS DIRECTO (SIN HOOK) ===
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const token = localStorage.getItem('nexoerp_access_token') || localStorage.getItem('access_token')
        const res = await fetch('http://localhost:8000/api/v1/products?skip=0&limit=100', {
          headers: { Authorization: `Bearer ${token}` }
        })
        const data = await res.json()
        setProducts(data)
      } catch (err) {
        console.error("Error cargando productos para reportes:", err)
      } finally {
        setLoadingProducts(false)
      }
    }
    loadProducts()
  }, [])
  // ============================================

  const salesTrend = useMemo(() => {
    if (!sales || sales.length === 0) return []
    const map = {}
    sales.forEach(sale => {
      const dateStr = sale.created_at ? sale.created_at.split('T')[0] : 'Sin fecha'
      const total = parseFloat(sale.total) || 0
      map[dateStr] = (map[dateStr] || 0) + total
    })
    return Object.keys(map).map(date => ({ date, total: map[date] }))
  }, [sales])

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
    </div>
  )
}