import React, { createContext, useContext, useState, useCallback } from 'react'
import api, { clearGuestToken, getGuestAccessToken } from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(() => {
    try { return JSON.parse(localStorage.getItem('llcms_user')) } catch { return null }
  })
  const [loading, setLoading] = useState(false)

  const login = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const { data } = await api.post('/login', { email, password })
      clearGuestToken()
      localStorage.setItem('llcms_token', data.token)
      localStorage.setItem('llcms_token_expires_at', data.expires_at)
      localStorage.setItem('llcms_user', JSON.stringify(data.user))
      setUser(data.user)
      return data.user
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    try { await api.post('/logout') } catch {}
    localStorage.removeItem('llcms_token')
    localStorage.removeItem('llcms_token_expires_at')
    localStorage.removeItem('llcms_user')
    setUser(null)
    try { await getGuestAccessToken() } catch {}
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
