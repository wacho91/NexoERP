import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProducts } from '../../hooks/useProducts'
import { useDebounce } from '../../hooks/useDebounce'
import { productService } from '../../api/productService'
import { useToast } from '../../context/ToastContext'
import ProductTable from './components/ProductTable'
import ProductForm from './components/ProductForm'
import StockAdjustModal from './components/StockAdjustModal'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'

export default function InventoryPage() {
  const navigate = useNavigate()
  const { addToast } = useToast()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [active, setActive] = useState('all')
  const debouncedSearch = useDebounce(search, 300)
  const { products, loading, error, reload } = useProducts({ search: debouncedSearch, category, active, limit: 100 })
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [productForStock, setProductForStock] = useState(null)

  // === LÓGICA DE PAGINACIÓN ===
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentProducts = products.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(products.length / itemsPerPage)
  // ============================

  const handleEdit = (product) => {
    setEditingProduct(product)
    setShowForm(true)
  }

  const handleDelete = async (product) => {
    if (window.confirm(`¿Eliminar (desactivar) el producto "${product.name}"?`)) {
      try {
        await productService.deleteProduct(product.id)
        addToast('Producto desactivado', 'success')
        reload()
      } catch (err) {
        addToast(err.response?.data?.detail || 'Error al eliminar producto', 'error')
      }
    }
  }

  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Inventario</h2>
          <p className="text-sm text-gray-500">Gestiona tus productos y niveles de stock</p>
        </div>
        <Button onClick={() => { setEditingProduct(null); setShowForm(true) }}>
          Nuevo producto
        </Button>
      </div>

      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Input placeholder="Buscar por nombre, SKU..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }} />
          <select className="input" value={category} onChange={(e) => { setCategory(e.target.value); setCurrentPage(1) }}>
            <option value="">Todas las categorías</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="input" value={active} onChange={(e) => { setActive(e.target.value); setCurrentPage(1) }}>
            <option value="all">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
        </div>
      </div>

      {loading ? (
        <Spinner fullContent />
      ) : error ? (
        <div className="text-red-600 p-4 bg-red-50 rounded-lg">{error}</div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <ProductTable
              products={currentProducts}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onStockAdjust={setProductForStock}
              onRowClick={(p) => navigate(`/inventory/${p.id}`)}
            />
          </div>
          
          {/* === BOTONES DE PAGINACIÓN === */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-6">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 text-sm font-semibold border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                ← Anterior
              </button>
              <span className="text-sm font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-lg">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-sm font-semibold border border-gray-200 dark:border-gray-700 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}

      <Modal open={showForm} title={editingProduct ? 'Editar producto' : 'Nuevo producto'} onClose={() => setShowForm(false)} size="lg">
        <ProductForm
          initialData={editingProduct}
          onSuccess={() => {
            setShowForm(false)
            reload()
          }}
          onCancel={() => setShowForm(false)}
        />
      </Modal>

      <Modal open={!!productForStock} title={`Ajustar stock: ${productForStock?.name}`} onClose={() => setProductForStock(null)}>
        <StockAdjustModal
          product={productForStock}
          onSuccess={() => {
            setProductForStock(null)
            reload()
          }}
          onCancel={() => setProductForStock(null)}
        />
      </Modal>
    </div>
  )
}