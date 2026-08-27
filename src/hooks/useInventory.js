import { useState, useEffect, useCallback } from 'react'
import { inventoryService } from '../api/inventoryService'

export function useInventory({ productId, movementType } = {}) {
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadMovements = useCallback(async () => {
    setLoading(true)
    try {
      const params = { limit: 100 }
      if (productId) params.product_id = productId
      if (movementType) params.movement_type = movementType
      const { data } = await inventoryService.getInventoryMovements(params)
      setMovements(data)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cargar movimientos')
    } finally {
      setLoading(false)
    }
  }, [productId, movementType])

  useEffect(() => {
    loadMovements()
  }, [loadMovements])

  return { movements, loading, error, reload: loadMovements }
}
