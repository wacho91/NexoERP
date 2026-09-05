import axios from 'axios'

// === LINK DE RENDER PEGADO DIRECTO ===
const API_BASE_URL = 'https://nexoerp-api.onrender.com/api/v1'
// ======================================

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Interceptor para agregar el token en cada petición
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export default apiClient