export default function ProductGrid({ products, onAdd }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {products.map((product) => (
        <button
          key={product.id}
          onClick={() => onAdd(product)}
          className="bg-white rounded-xl border border-gray-200 p-4 text-left hover:shadow-md transition"
          disabled={product.stock_quantity <= 0}
        >
          <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M4 6h16M4 6v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2z" />
              </svg>
            )}
          </div>
          <div className="text-sm font-medium text-gray-900 truncate">{product.name}</div>
          <div className="text-xs text-gray-500">Stock: {product.stock_quantity}</div>
          <div className="text-sm font-bold text-teal-600 mt-1">
            {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(product.price)}
          </div>
        </button>
      ))}
      {products.length === 0 && (
        <div className="col-span-full text-center py-8 text-gray-500">No hay productos disponibles</div>
      )}
    </div>
  )
}
