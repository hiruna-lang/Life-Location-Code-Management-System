import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
})

// Attach token from localStorage
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('llcms_token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

// Redirect to login on 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('llcms_token')
      localStorage.removeItem('llcms_user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api
