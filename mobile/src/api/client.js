import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Production URL is baked in by default. Override for local development
// via EXPO_PUBLIC_API_URL (e.g. `EXPO_PUBLIC_API_URL=http://192.168.1.50:8000/api npm start`
// for physical device, or `http://10.0.2.2:8000/api` for Android emulator).
export const API_BASE =
  process.env.EXPO_PUBLIC_API_URL || 'https://sig.hgbenguela.com/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: { Accept: 'application/json' },
})

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('hgb_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    if (err.response?.status === 401) {
      await AsyncStorage.removeItem('hgb_token')
    }
    return Promise.reject(err)
  }
)

export default api
