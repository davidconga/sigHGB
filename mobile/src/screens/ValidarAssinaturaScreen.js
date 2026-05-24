import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import api from '../api/client'
import { useAuth } from '../auth/AuthContext'
import Card from '../components/Card'
import { colors, font } from '../theme'

export default function ValidarAssinaturaScreen({ route, navigation }) {
  const { tipo, id, documento } = route.params
  const { user } = useAuth()
  const [numeroOrdem, setNumeroOrdem] = useState(user?.medico?.numero_ordem || '')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const userIsAttributed = user?.medico_id === documento?.medico_id
  const docHasMedico = documento?.medico_id != null

  async function submit() {
    setSaving(true); setErr('')
    try {
      await api.post(`/${tipo}/${id}/validar`, { numero_ordem: numeroOrdem, password })
      Alert.alert('Sucesso', 'Documento validado e assinado.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ])
    } catch (e) {
      setErr(e.response?.data?.message || 'Não foi possível validar.')
    } finally { setSaving(false) }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: 14 }}>
        <Card style={{ backgroundColor: '#fef3c7', borderColor: '#fcd34d' }}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Ionicons name="shield-checkmark" size={22} color="#b45309" />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: '#92400e', marginBottom: 4 }}>{documento?.numero}</Text>
              <Text style={{ fontSize: font.xs, color: '#92400e' }}>
                Ao validar, o estado muda para EMITIDO e é gerado código de verificação único.
              </Text>
            </View>
          </View>
        </Card>

        {!docHasMedico && (
          <Card style={{ backgroundColor: '#fee2e2', borderColor: '#fca5a5' }}>
            <Text style={{ color: colors.red[700] }}>Documento sem médico atribuído. Atribua antes de validar.</Text>
          </Card>
        )}

        {docHasMedico && !userIsAttributed && (
          <Card style={{ backgroundColor: '#fee2e2', borderColor: '#fca5a5' }}>
            <Text style={{ color: colors.red[700] }}>
              Este documento está atribuído a {documento?.medico?.nome || 'outro médico'}. Só esse médico pode assinar.
            </Text>
          </Card>
        )}

        {docHasMedico && userIsAttributed && (
          <Card>
            <Text style={{ fontSize: font.xs, color: colors.slate[500], marginBottom: 4 }}>Nº de Ordem dos Médicos</Text>
            <TextInput style={inputStyle} value={numeroOrdem} onChangeText={setNumeroOrdem} placeholder="Ex.: OMA-1234" />

            <Text style={{ fontSize: font.xs, color: colors.slate[500], marginTop: 12, marginBottom: 4 }}>Palavra-passe</Text>
            <TextInput style={inputStyle} value={password} onChangeText={setPassword} secureTextEntry placeholder="•••••••" />

            {!!err && (
              <View style={{ backgroundColor: colors.red[100], padding: 8, borderRadius: 6, marginTop: 10 }}>
                <Text style={{ color: colors.red[700], fontSize: font.xs }}>{err}</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={submit}
              disabled={saving || !password}
              style={{ backgroundColor: colors.emerald[600], padding: 14, borderRadius: 8, marginTop: 16, alignItems: 'center', opacity: (saving || !password) ? 0.5 : 1, flexDirection: 'row', justifyContent: 'center' }}
            >
              <Ionicons name="checkmark-circle" size={18} color="white" />
              <Text style={{ color: 'white', fontWeight: '600', marginLeft: 6 }}>
                {saving ? 'A validar…' : 'Validar e Assinar'}
              </Text>
            </TouchableOpacity>
          </Card>
        )}
      </ScrollView>
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
}
