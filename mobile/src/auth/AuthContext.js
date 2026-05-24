import { createContext, useContext, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import api from '../api/client'
import { registerPushToken, unregisterPushToken } from '../api/push'
import { clearBiometricCredentials, getBiometricCredentials, promptBiometric } from '../api/biometric'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const token = await AsyncStorage.getItem('hgb_token')
      if (!token) { setLoading(false); return }
      try {
        const { data } = await api.get('/me')
        setUser(data)
        registerPushToken().catch(() => {})
      } catch {
        await AsyncStorage.removeItem('hgb_token')
      } finally { setLoading(false) }
    })()
  }, [])

  async function login(email, password) {
    const { data } = await api.post('/login', { email, password })
    await AsyncStorage.setItem('hgb_token', data.token)
    setUser(data.user)
    registerPushToken().catch(() => {})
    return data.user
  }

  async function logout() {
    try { await unregisterPushToken() } catch {}
    try { await api.post('/logout') } catch {}
    await AsyncStorage.removeItem('hgb_token')
    setUser(null)
  }

  async function loginWithBiometric() {
    const creds = await getBiometricCredentials()
    if (!creds) {
      const err = new Error('Sem credenciais biométricas guardadas')
      err.code = 'NO_CREDENTIALS'
      throw err
    }
    const ok = await promptBiometric('Entrar no SIGHGB')
    if (!ok) {
      const err = new Error('Autenticação biométrica cancelada')
      err.code = 'BIO_CANCELLED'
      throw err
    }
    try {
      return await login(creds.email, creds.password)
    } catch (e) {
      if (e.response?.status === 401 || e.response?.status === 422) {
        await clearBiometricCredentials()
      }
      throw e
    }
  }

  return (
    <AuthCtx.Provider value={{ user, loading, login, logout, loginWithBiometric, setUser }}>
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
