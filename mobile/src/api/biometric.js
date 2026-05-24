import * as LocalAuthentication from 'expo-local-authentication'
import * as SecureStore from 'expo-secure-store'

const KEY_EMAIL = 'hgb_bio_email'
const KEY_PASSWORD = 'hgb_bio_password'
const KEY_ENABLED = 'hgb_bio_enabled'

export async function isBiometricAvailable() {
  try {
    const hw = await LocalAuthentication.hasHardwareAsync()
    if (!hw) return false
    return await LocalAuthentication.isEnrolledAsync()
  } catch {
    return false
  }
}

export async function getBiometricLabel() {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync()
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return 'Face ID'
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return 'Impressão digital'
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) return 'Íris'
    return 'Biometria'
  } catch {
    return 'Biometria'
  }
}

export async function promptBiometric(reason = 'Confirma a tua identidade') {
  const res = await LocalAuthentication.authenticateAsync({
    promptMessage: reason,
    cancelLabel: 'Cancelar',
    disableDeviceFallback: false,
    fallbackLabel: 'Usar palavra-passe do dispositivo',
  })
  return res.success === true
}

export async function saveBiometricCredentials(email, password) {
  await SecureStore.setItemAsync(KEY_EMAIL, email)
  await SecureStore.setItemAsync(KEY_PASSWORD, password)
  await SecureStore.setItemAsync(KEY_ENABLED, '1')
}

export async function getBiometricCredentials() {
  const enabled = await SecureStore.getItemAsync(KEY_ENABLED)
  if (enabled !== '1') return null
  const email = await SecureStore.getItemAsync(KEY_EMAIL)
  const password = await SecureStore.getItemAsync(KEY_PASSWORD)
  if (!email || !password) return null
  return { email, password }
}

export async function isBiometricEnabled() {
  const enabled = await SecureStore.getItemAsync(KEY_ENABLED)
  return enabled === '1'
}

export async function clearBiometricCredentials() {
  await SecureStore.deleteItemAsync(KEY_EMAIL).catch(() => {})
  await SecureStore.deleteItemAsync(KEY_PASSWORD).catch(() => {})
  await SecureStore.deleteItemAsync(KEY_ENABLED).catch(() => {})
}
