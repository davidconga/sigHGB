import { createContext, useContext, useEffect, useState } from 'react'
import api from '../api/client'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('hgb_token')
    if (!token) { setLoading(false); return }
    api.get('/me')
      .then((r) => setUser(r.data))
      .catch(() => localStorage.removeItem('hgb_token'))
      .finally(() => setLoading(false))
  }, [])

  async function login(email, password) {
    const { data } = await api.post('/login', { email, password })
    localStorage.setItem('hgb_token', data.token)
    setUser(data.user)
    return data.user
  }

  async function logout() {
    try { await api.post('/logout') } catch (_) {}
    localStorage.removeItem('hgb_token')
    setUser(null)
  }

  return (
    <AuthCtx.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)

export function useCan() {
  const { user } = useAuth()
  return (permission) => {
    if (!user) return false
    if (user.roles?.includes('admin')) return true
    return user.permissions?.includes(permission) ?? false
  }
}

export function useHasRole() {
  const { user } = useAuth()
  return (role) => user?.roles?.includes(role) ?? false
}
