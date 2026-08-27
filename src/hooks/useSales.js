import { useState, useEffect, useCallback } from 'react'
import { saleService } from '../api/saleService'

export function useSales({ limit = 100, offset = 0 } = {}) {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadSales = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await saleService.getSales({ limit, offset })
      setSales(data)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cargar ventas')
    } finally {
      setLoading(false)
    }
  }, [limit, offset])

  useEffect(() => {
    loadSales()
  }, [loadSales])

  return { sales, loading, error, reload: loadSales }
}
