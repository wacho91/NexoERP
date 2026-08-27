import Table from '../../../components/ui/Table'
import Badge from '../../../components/ui/Badge'
import Button from '../../../components/ui/Button'

export default function ProductTable({ products, onEdit, onDelete, onStockAdjust, onRowClick }) {
  const columns = [
    { key: 'name', label: 'Producto', render: (row) => (
      <div className="flex items-center gap-3">
        {row.image_url ? (
          <img src={row.image_url} alt={row.name} className="w-10 h-10 rounded-lg object-cover" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 6h16M4 6v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2z" />
            </svg>
          </div>
        )}
        <div>
          <div className="font-medium text-gray-900">{row.name}</div>
          {row.sku && <div className="text-xs text-gray-500">SKU: {row.sku}</div>}
        </div>
      </div>
    )},
    { key: 'category', label: 'Categoría', render: (row) => row.category ? <Badge>{row.category}</Badge> : '—' },
    { key: 'price', label: 'Precio', render: (row) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(row.price) },
    { key: 'stock_quantity', label: 'Stock', render: (row) => (
      <span className={row.stock_quantity <= row.min_stock ? 'text-red-600 font-semibold' : 'text-gray-900'}>
        {row.stock_quantity}
        {row.stock_quantity <= row.min_stock && ' ⚠'}
      </span>
    )},
    { key: 'active', label: 'Estado', render: (row) => row.active ? <Badge color="green">Activo</Badge> : <Badge color="red">Inactivo</Badge> },
    { key: 'actions', label: 'Acciones', render: (row) => (
      <div className="flex gap-2">
        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onEdit(row) }}>Editar</Button>
        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); onStockAdjust(row) }}>Stock</Button>
        <Button size="sm" variant="danger" onClick={(e) => { e.stopPropagation(); onDelete(row) }}>Eliminar</Button>
      </div>
    )},
  ]

  return (
    <Table
      columns={columns}
      data={products}
      onRowClick={onRowClick}
    />
  )
}
