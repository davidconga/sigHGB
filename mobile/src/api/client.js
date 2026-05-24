import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Em desenvolvimento, aponta para o IP da máquina onde corre `php artisan serve`
// (não funciona com localhost a partir do telemóvel/emulador físico).
// Para emulador Android: 10.0.2.2:8000. Para iPhone real: IP da rede local.
export const API_BASE = 'http://10.0.2.2:8000/api'

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
