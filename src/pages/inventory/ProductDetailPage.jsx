import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { productService } from '../../api/productService'
import { useInventory } from '../../hooks/useInventory'
import Spinner from '../../components/ui/Spinner'
import Badge from '../../components/ui/Badge'
import Table from '../../components/ui/Table'
import Button from '../../components/ui/Button'

export default function ProductDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { movements, loading: loadingMovements } = useInventory({ productId: id })

  useEffect(() => {
    productService.getProduct(id)
      .then(({ data }) => setProduct(data))
      .catch((err) => setError(err.response?.data?.detail || 'Error al cargar producto'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>
  if (error) return <div className="text-red-600">{error}</div>
  if (!product) return null

  const movementColumns = [
    { key: 'created_at', label: 'Fecha', render: (row) => new Date(row.created_at).toLocaleString('es-MX') },
    { key: 'type', label: 'Tipo', render: (row) => (
      <Badge color={row.type === 'sale' ? 'red' : row.type === 'purchase' ? 'green' : row.type === 'adjustment' ? 'yellow' : 'blue'}>
        {row.type}
      </Badge>
    )},
    { key: 'quantity', label: 'Cantidad', render: (row) => <span className={row.quantity < 0 ? 'text-red-600' : 'text-green-600'}>{row.quantity > 0 ? `+${row.quantity}` : row.quantity}</span> },
    { key: 'stock_before', label: 'Stock antes' },
    { key: 'stock_after', label: 'Stock después' },
    { key: 'reason', label: 'Motivo', render: (row) => row.reason || '—' },
  ]

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => navigate('/inventory')}>
        ← Volver al inventario
      </Button>

      <div className="card p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-40 h-40 rounded-xl object-cover" />
          ) : (
            <div className="w-40 h-40 rounded-xl bg-gray-200 flex items-center justify-center text-gray-500">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 6h16M4 6v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2z" />
              </svg>
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">{product.name}</h2>
              {product.active ? <Badge color="green">Activo</Badge> : <Badge color="red">Inactivo</Badge>}
            </div>
            {product.sku && <p className="text-sm text-gray-500">SKU: {product.sku}</p>}
            {product.barcode && <p className="text-sm text-gray-500">Código: {product.barcode}</p>}
            {product.category && <p className="text-sm text-gray-500 mt-1">Categoría: {product.category}</p>}
            <p className="text-sm text-gray-500 mt-1">{product.description}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              <div>
                <div className="text-xs text-gray-500">Precio</div>
                <div className="text-lg font-bold">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(product.price)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Costo</div>
                <div className="text-lg font-bold">{product.cost ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(product.cost) : '—'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Stock</div>
                <div className={`text-lg font-bold ${product.stock_quantity <= product.min_stock ? 'text-red-600' : ''}`}>{product.stock_quantity}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Stock mínimo</div>
                <div className="text-lg font-bold">{product.min_stock}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold mb-4">Movimientos de inventario</h3>
        {loadingMovements ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : (
          <Table columns={movementColumns} data={movements} />
        )}
      </div>
    </div>
  )
}
