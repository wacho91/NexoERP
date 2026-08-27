import Button from '../../../components/ui/Button'

export default function CartPanel({ cart, totals, onUpdateQuantity, onRemove, onClear, onCheckout }) {
  return (
    <div className="card p-4 sticky top-20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Carrito</h3>
        {cart.length > 0 && (
          <button onClick={onClear} className="text-xs text-red-600 hover:text-red-700">Vaciar</button>
        )}
      </div>

      {cart.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>El carrito está vacío</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-80 overflow-y-auto mb-4">
          {cart.map((item) => (
            <div key={item.product_id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{item.name}</div>
                <div className="text-xs text-gray-500">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(item.price)} c/u</div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onUpdateQuantity(item.product_id, item.quantity - 1)}
                  className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-bold"
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                <button
                  onClick={() => onUpdateQuantity(item.product_id, item.quantity + 1)}
                  disabled={item.quantity >= item.stock}
                  className="w-6 h-6 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 text-sm font-bold disabled:opacity-50"
                >
                  +
                </button>
              </div>
              <button onClick={() => onRemove(item.product_id)} className="text-gray-400 hover:text-red-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(totals.subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total</span>
          <span className="font-bold text-lg text-teal-600">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(totals.total)}</span>
        </div>
        <Button className="w-full" size="lg" onClick={onCheckout} disabled={cart.length === 0}>
          Cobrar
        </Button>
      </div>
    </div>
  )
}
