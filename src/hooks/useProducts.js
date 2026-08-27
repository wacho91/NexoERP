import { useState, useEffect, useCallback } from 'react'
import { productService } from '../api/productService'

export function useProducts({ search = '', category = '', active = true, limit = 50, offset = 0 } = {}) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = { limit, offset }
      if (search) params.search = search
      if (category) params.category = category
      if (active !== 'all') params.active = active === 'true'

      const { data } = await productService.getProducts(params)
      setProducts(data)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cargar productos')
    } finally {
      setLoading(false)
    }
  }, [search, category, active, limit, offset])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  return { products, loading, error, reload: loadProducts }
}
