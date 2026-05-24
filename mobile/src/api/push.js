import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import api from './client'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

/**
 * Pede permissão, obtém o Expo push token, e regista-o no backend
 * para que o utilizador autenticado receba notificações.
 */
export async function registerPushToken() {
  if (!Device.isDevice) {
    console.log('Push notifications só funcionam em dispositivo real')
    return null
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'HGB Notificações',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1f5fa6',
    })
  }

  const { status: existing } = await Notifications.getPermissionsAsync()
  let status = existing
  if (existing !== 'granted') {
    const req = await Notifications.requestPermissionsAsync()
    status = req.status
  }
  if (status !== 'granted') return null

  let token
  try {
    const { data } = await Notifications.getExpoPushTokenAsync()
    token = data
  } catch (e) {
    console.warn('Erro ao obter Expo push token', e?.message)
    return null
  }

  if (!token) return null

  try {
    await api.post('/devices/register', {
      push_token: token,
      platform: Platform.OS,
      device_name: Device.deviceName || Device.modelName || Platform.OS,
    })
    await AsyncStorage.setItem('hgb_push_token', token)
  } catch (e) {
    console.warn('Falha a registar token no backend', e?.response?.status)
  }
  return token
}

export async function unregisterPushToken() {
  const token = await AsyncStorage.getItem('hgb_push_token')
  if (!token) return
  try { await api.post('/devices/unregister', { push_token: token }) } catch {}
  await AsyncStorage.removeItem('hgb_push_token')
}
