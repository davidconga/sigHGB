import { useEffect, useRef, useState } from 'react'
import { Alert, Image, Keyboard, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../auth/AuthContext'
import { colors, font, radius } from '../theme'
import {
  getBiometricLabel,
  isBiometricAvailable,
  isBiometricEnabled,
  saveBiometricCredentials,
} from '../api/biometric'

export default function LoginScreen() {
  const { login, loginWithBiometric } = useAuth()
  const [email, setEmail] = useState('admin@hgb.ao')
  const [password, setPassword] = useState('admin123')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [bioReady, setBioReady] = useState(false)
  const [bioLabel, setBioLabel] = useState('Biometria')
  const autoPromptDone = useRef(false)

  useEffect(() => {
    (async () => {
      const available = await isBiometricAvailable()
      const enabled = await isBiometricEnabled()
      if (available && enabled) {
        setBioLabel(await getBiometricLabel())
        setBioReady(true)
        if (!autoPromptDone.current) {
          autoPromptDone.current = true
          triggerBiometric().catch(() => {})
        }
      }
    })()
  }, [])

  async function triggerBiometric() {
    setErr('')
    try {
      await loginWithBiometric()
    } catch (e) {
      if (e.code === 'BIO_CANCELLED' || e.code === 'NO_CREDENTIALS') return
      setErr(e.response?.data?.message || 'Falha na autenticação biométrica.')
    }
  }

  async function offerSaveBiometric(savedEmail, savedPassword) {
    const available = await isBiometricAvailable()
    const enabled = await isBiometricEnabled()
    if (!available || enabled) return
    const label = await getBiometricLabel()
    Alert.alert(
      `Ativar ${label}?`,
      'Da próxima vez podes entrar sem digitar a palavra-passe.',
      [
        { text: 'Agora não', style: 'cancel' },
        {
          text: 'Ativar',
          onPress: async () => {
            try { await saveBiometricCredentials(savedEmail, savedPassword) } catch {}
          },
        },
      ]
    )
  }

  async function submit() {
    Keyboard.dismiss()
    setErr(''); setLoading(true)
    try {
      await login(email, password)
      offerSaveBiometric(email, password)
    } catch (e) {
      setErr(e.response?.data?.message || 'Credenciais inválidas ou servidor indisponível.')
    } finally { setLoading(false) }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.hgb[900], justifyContent: 'center', padding: 20 }}
    >
      <View style={{ alignItems: 'center', marginBottom: 30 }}>
        <View style={{ backgroundColor: 'white', borderRadius: 999, padding: 12, marginBottom: 16 }}>
          <Image source={require('../../assets/icon.png')} style={{ width: 80, height: 80 }} />
        </View>
        <Text style={{ color: 'white', fontSize: font.xl, fontWeight: '700', letterSpacing: 0.5 }}>HGB</Text>
        <Text style={{ color: colors.hgb[100], fontSize: font.sm }}>Sistema Integrado de Gestão</Text>
      </View>

      <View style={{ backgroundColor: 'white', borderRadius: radius.lg, padding: 18 }}>
        <Text style={{ fontSize: font.sm, color: colors.slate[600], marginBottom: 6 }}>Email</Text>
        <TextInput
          style={inputStyle}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Text style={{ fontSize: font.sm, color: colors.slate[600], marginBottom: 6, marginTop: 12 }}>Palavra-passe</Text>
        <TextInput
          style={inputStyle}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {!!err && (
          <View style={{ backgroundColor: colors.red[100], padding: 10, borderRadius: radius.md, marginTop: 12 }}>
            <Text style={{ color: colors.red[700], fontSize: font.sm }}>{err}</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={submit}
          disabled={loading}
          style={{ backgroundColor: colors.hgb[600], borderRadius: radius.md, padding: 14, marginTop: 18, alignItems: 'center', opacity: loading ? 0.6 : 1 }}
        >
          <Text style={{ color: 'white', fontSize: font.md, fontWeight: '600' }}>
            {loading ? 'A entrar…' : 'Entrar'}
          </Text>
        </TouchableOpacity>

        {bioReady && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 14 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.slate[200] }} />
              <Text style={{ marginHorizontal: 10, color: colors.slate[400], fontSize: font.xs }}>ou</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.slate[200] }} />
            </View>
            <TouchableOpacity
              onPress={triggerBiometric}
              style={{
                borderWidth: 1.5,
                borderColor: colors.hgb[600],
                borderRadius: radius.md,
                padding: 12,
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="finger-print" size={22} color={colors.hgb[600]} />
              <Text style={{ color: colors.hgb[600], fontSize: font.md, fontWeight: '600', marginLeft: 8 }}>
                Entrar com {bioLabel}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}

const inputStyle = {
  borderWidth: 1,
  borderColor: '#cbd5e1',
  borderRadius: 8,
  paddingHorizontal: 12,
  paddingVertical: 10,
  fontSize: 15,
  color: '#0f172a',
}
