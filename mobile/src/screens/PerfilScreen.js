import { useEffect, useState } from 'react'
import { Alert, Image, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../auth/AuthContext'
import api from '../api/client'
import Card from '../components/Card'
import { colors, font, radius } from '../theme'
import {
  clearBiometricCredentials,
  getBiometricLabel,
  isBiometricAvailable,
  isBiometricEnabled,
  promptBiometric,
  saveBiometricCredentials,
} from '../api/biometric'

export default function PerfilScreen() {
  const { user, logout } = useAuth()
  const [bioSupported, setBioSupported] = useState(false)
  const [bioEnabled, setBioEnabled] = useState(false)
  const [bioLabel, setBioLabel] = useState('Biometria')
  const [askPwd, setAskPwd] = useState(false)
  const [pwd, setPwd] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    (async () => {
      const sup = await isBiometricAvailable()
      setBioSupported(sup)
      if (sup) {
        setBioLabel(await getBiometricLabel())
        setBioEnabled(await isBiometricEnabled())
      }
    })()
  }, [])

  async function toggleBio(value) {
    if (!value) {
      Alert.alert(`Desativar ${bioLabel}?`, 'A próxima entrada vai pedir email e palavra-passe.', [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desativar',
          style: 'destructive',
          onPress: async () => {
            await clearBiometricCredentials()
            setBioEnabled(false)
          },
        },
      ])
      return
    }
    setPwd('')
    setAskPwd(true)
  }

  async function confirmEnableBio() {
    if (!pwd) return
    setBusy(true)
    try {
      await api.post('/login', { email: user.email, password: pwd })
      const ok = await promptBiometric(`Ativar ${bioLabel}`)
      if (!ok) {
        setBusy(false)
        return
      }
      await saveBiometricCredentials(user.email, pwd)
      setBioEnabled(true)
      setAskPwd(false)
      setPwd('')
      Alert.alert('Sucesso', `${bioLabel} ativada para a tua conta.`)
    } catch (e) {
      Alert.alert('Erro', e.response?.data?.message || 'Palavra-passe inválida.')
    } finally {
      setBusy(false)
    }
  }

  async function doLogout() {
    Alert.alert('Terminar sessão', 'Tens a certeza?', [
      { text: 'Cancelar' },
      { text: 'Terminar', style: 'destructive', onPress: logout },
    ])
  }

  if (!user) return null
  const m = user.medico

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 14 }}>
      <Card style={{ alignItems: 'center', paddingVertical: 20 }}>
        <View style={{ width: 80, height: 80, borderRadius: 999, backgroundColor: colors.hgb[600], alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="person" size={40} color="white" />
        </View>
        <Text style={{ fontSize: font.xl, fontWeight: '700', marginTop: 10 }}>{user.name}</Text>
        <Text style={{ fontSize: font.sm, color: colors.slate[500] }}>{user.email}</Text>
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
          {user.roles?.map((r) => (
            <View key={r} style={{ backgroundColor: colors.hgb[100], paddingHorizontal: 10, paddingVertical: 2, borderRadius: 12 }}>
              <Text style={{ fontSize: font.xs, color: colors.hgb[700], textTransform: 'capitalize' }}>{r}</Text>
            </View>
          ))}
        </View>
      </Card>

      {m && (
        <Card>
          <Text style={{ fontSize: font.xs, color: colors.hgb[700], fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 }}>Médico associado</Text>
          <Field label="Nome" value={m.nome} />
          <Field label="Especialidade" value={m.especialidade} />
          <Field label="Nº Ordem" value={m.numero_ordem} mono />
          <Field label="Telefone" value={m.telefone} />

          {m.assinatura_url && (
            <>
              <Text style={{ fontSize: font.xs, color: colors.slate[500], marginTop: 10 }}>Assinatura</Text>
              <Image source={{ uri: m.assinatura_url }} style={{ height: 80, resizeMode: 'contain', backgroundColor: '#f8fafc', marginTop: 4, borderRadius: 6 }} />
            </>
          )}
          {m.carimbo_url && (
            <>
              <Text style={{ fontSize: font.xs, color: colors.slate[500], marginTop: 10 }}>Carimbo</Text>
              <Image source={{ uri: m.carimbo_url }} style={{ height: 80, resizeMode: 'contain', backgroundColor: '#f8fafc', marginTop: 4, borderRadius: 6 }} />
            </>
          )}
        </Card>
      )}

      <Card>
        <Text style={{ fontSize: font.xs, color: colors.hgb[700], fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 }}>Segurança</Text>
        {bioSupported ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Ionicons name="finger-print" size={22} color={colors.hgb[600]} />
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={{ fontSize: font.sm, fontWeight: '600', color: colors.slate[700] }}>Entrar com {bioLabel}</Text>
                  <Text style={{ fontSize: font.xs, color: colors.slate[500] }}>
                    {bioEnabled ? 'Ativada' : 'Guarda as tuas credenciais com segurança'}
                  </Text>
                </View>
              </View>
              <Switch
                value={bioEnabled}
                onValueChange={toggleBio}
                trackColor={{ true: colors.hgb[500], false: colors.slate[300] }}
                thumbColor={bioEnabled ? colors.hgb[600] : '#f4f4f4'}
              />
            </View>

            {askPwd && (
              <View style={{ marginTop: 12, backgroundColor: colors.slate[50], padding: 10, borderRadius: radius.md }}>
                <Text style={{ fontSize: font.xs, color: colors.slate[600], marginBottom: 6 }}>
                  Confirma a tua palavra-passe para ativar {bioLabel}:
                </Text>
                <TextInput
                  value={pwd}
                  onChangeText={setPwd}
                  secureTextEntry
                  placeholder="Palavra-passe"
                  style={{ borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, backgroundColor: 'white' }}
                />
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                  <TouchableOpacity
                    onPress={() => { setAskPwd(false); setPwd('') }}
                    style={{ flex: 1, padding: 10, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.slate[200] }}
                  >
                    <Text style={{ color: colors.slate[700], fontWeight: '600' }}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={confirmEnableBio}
                    disabled={!pwd || busy}
                    style={{ flex: 1, padding: 10, borderRadius: radius.md, alignItems: 'center', backgroundColor: colors.hgb[600], opacity: (!pwd || busy) ? 0.6 : 1 }}
                  >
                    <Text style={{ color: 'white', fontWeight: '600' }}>{busy ? '…' : 'Ativar'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        ) : (
          <Text style={{ fontSize: font.xs, color: colors.slate[500] }}>
            Este dispositivo não tem biometria configurada.
          </Text>
        )}
      </Card>

      <Card>
        <Text style={{ fontSize: font.xs, color: colors.hgb[700], fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 }}>Permissões</Text>
        <Text style={{ fontSize: font.xs, color: colors.slate[600] }}>
          {user.permissions?.length || 0} permissão(ões) atribuída(s)
        </Text>
      </Card>

      <TouchableOpacity
        onPress={doLogout}
        style={{ backgroundColor: colors.red[600], padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 8, flexDirection: 'row', justifyContent: 'center' }}
      >
        <Ionicons name="log-out-outline" size={20} color="white" />
        <Text style={{ color: 'white', fontWeight: '600', fontSize: font.md, marginLeft: 6 }}>Terminar sessão</Text>
      </TouchableOpacity>

      <Text style={{ textAlign: 'center', color: colors.slate[400], fontSize: font.xs, marginTop: 20 }}>
        HGB Mobile · Hospital Geral de Benguela
      </Text>
    </ScrollView>
  )
}

function Field({ label, value, mono }) {
  if (!value) return null
  return (
    <View style={{ marginVertical: 3 }}>
      <Text style={{ fontSize: font.xs, color: colors.slate[500] }}>{label}</Text>
      <Text style={{ fontSize: font.sm, fontFamily: mono ? 'monospace' : undefined }}>{value}</Text>
    </View>
  )
}
