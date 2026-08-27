import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { authService } from '../api/authService'
import { storeService } from '../api/storeService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [store, setStore] = useState(null)
  const [loading, setLoading] = useState(true)
  const [initialized, setInitialized] = useState(false)

  const loadMe = useCallback(async () => {
    try {
      const [userRes, storeRes] = await Promise.all([
        authService.getMe(),
        storeService.getMyStore(),
      ])
      setUser(userRes.data)
      setStore(storeRes.data)
    } catch (error) {
      console.error('Failed to load user', error)
      throw error
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setLoading(false)
      setInitialized(true)
      return
    }
    loadMe()
      .catch(() => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      })
      .finally(() => {
        setLoading(false)
        setInitialized(true)
      })
  }, [loadMe])

  const login = async (credentials) => {
    const { data } = await authService.login(credentials)
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
    await loadMe()
    return data
  }

  const register = async (storeData) => {
    const { data } = await authService.register(storeData)
    const loginData = await login({
      email: storeData.admin_email,
      password: storeData.admin_password,
    })
    return { store: data, ...loginData }
  }

  const logout = async () => {
    const refreshToken = localStorage.getItem('refresh_token')
    try {
      if (refreshToken) {
        await authService.logout(refreshToken)
      }
    } catch (error) {
      console.error('Logout error', error)
    } finally {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      setUser(null)
      setStore(null)
    }
  }

  const refreshStore = async () => {
    const { data } = await storeService.getMyStore()
    setStore(data)
    return data
  }

  return (
    <AuthContext.Provider value={{ user, store, loading, initialized, login, register, logout, loadMe, refreshStore }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
