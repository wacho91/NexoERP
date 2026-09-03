import { useState, useMemo, useEffect } from 'react'
import { saleService } from '../../api/saleService'
import { useToast } from '../../context/ToastContext'
import { useAuth } from '../../context/AuthContext'
import ProductGrid from './components/ProductGrid'
import CartPanel from './components/CartPanel'
import CheckoutModal from './components/CheckoutModal'
import Spinner from '../../components/ui/Spinner'
import Input from '../../components/ui/Input'

export default function PosPage() {
  const { user } = useAuth()
  const { addToast } = useToast()
  
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  const loadProducts = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('nexoerp_access_token') || localStorage.getItem('access_token')
      const res = await fetch('http://localhost:8000/api/v1/products?skip=0&limit=100', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setProducts(data)
    } catch (error) {
      console.error("Error cargando productos en POS:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])
  
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState([])
  const [showCheckout, setShowCheckout] = useState(false)

  const filteredProducts = useMemo(() => {
    if (!search) return products
    return products.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
    )
  }, [products, search])

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === product.id)
      if (existing) {
        return prev.map((i) =>
          i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { product_id: product.id, name: product.name, price: parseFloat(product.price), quantity: 1, stock: product.stock_quantity }]
    })
  }

  const updateQuantity = (productId, quantity) => {
    setCart((prev) =>
      prev.map((i) => (i.product_id === productId ? { ...i, quantity: Math.max(1, quantity) } : i))
    )
  }

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((i) => i.product_id !== productId))
  }

  const clearCart = () => setCart([])

  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0)
    return { subtotal, total: subtotal }
  }, [cart])

  const handleCheckoutSuccess = () => {
    setShowCheckout(false)
    clearCart()
    loadProducts()
    addToast('Venta completada', 'success')
  }

  // === LOADER PREMIUM AQUÍ ===
  if (loading) return <Spinner fullContent />

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Punto de Venta</h2>
        <p className="text-sm text-gray-500">Atendiendo como: {user?.full_name}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Input placeholder="Buscar producto..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <ProductGrid products={filteredProducts} onAdd={addToCart} />
        </div>
        <div>
          <CartPanel
            cart={cart}
            totals={totals}
            onUpdateQuantity={updateQuantity}
            onRemove={removeFromCart}
            onClear={clearCart}
            onCheckout={() => setShowCheckout(true)}
          />
        </div>
      </div>

      <CheckoutModal
        open={showCheckout}
        cart={cart}
        totals={totals}
        onClose={() => setShowCheckout(false)}
        onSuccess={handleCheckoutSuccess}
      />
    </div>
  )
}