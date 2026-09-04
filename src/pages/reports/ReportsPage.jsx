import { useSales } from '../../hooks/useSales'
import { useProducts } from '../../hooks/useProducts'
import Spinner from '../../components/ui/Spinner'

export default function ReportsPage() {
  const { sales, loading: loadingSales } = useSales({ limit: 200 })
  const { products, loading: loadingProducts } = useProducts({ active: 'all', limit: 100 })

  const isLoading = loadingSales || loadingProducts

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold">Reportes (Modo Diagnóstico)</h2>
        <p className="text-sm text-gray-500">Revisando datos crudos...</p>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold mb-4">Ventas encontradas: {sales?.length || 0}</h3>
        <div className="space-y-2 text-sm font-mono">
          {sales && sales.length > 0 ? (
            sales.map(s => (
              <div key={s.id} className="border-b border-gray-100 dark:border-gray-700 pb-2">
                <span className="font-bold text-indigo-600">Venta #{s.number}</span> | 
                Total: ${s.total} | 
                Fecha: {s.created_at} | 
                Items: {s.sale_items?.length || 0}
              </div>
            ))
          ) : (
            <p className="text-gray-500">No llegaron ventas desde el backend.</p>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold mb-4">Productos encontrados: {products?.length || 0}</h3>
      </div>
    </div>
  )
}