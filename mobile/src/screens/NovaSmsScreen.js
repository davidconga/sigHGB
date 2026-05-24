import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator, Alert, FlatList, Keyboard, KeyboardAvoidingView,
  Platform, Pressable, Text, TextInput, TouchableOpacity, View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import api from '../api/client'
import { colors, font, radius } from '../theme'

const TABS = [
  { value: 'manual',      label: 'Manual',      Icon: 'keypad' },
  { value: 'paciente',    label: 'Paciente',    Icon: 'person' },
  { value: 'funcionario', label: 'Funcionário', Icon: 'briefcase' },
]

export default function NovaSmsScreen({ navigation }) {
  const [tab, setTab] = useState('manual')
  const [phone, setPhone] = useState('')
  const [body, setBody] = useState('')
  const [picked, setPicked] = useState(null)   // {id, nome, telefone, _kind}
  const [sending, setSending] = useState(false)

  async function send() {
    Keyboard.dismiss()
    const payload = { body }
    if (tab === 'manual') {
      if (!phone.trim()) return Alert.alert('Telefone obrigatório')
      payload.to = phone.trim()
    } else if (tab === 'paciente') {
      if (!picked) return Alert.alert('Escolhe um paciente')
      payload.paciente_id = picked.id
    } else if (tab === 'funcionario') {
      if (!picked) return Alert.alert('Escolhe um funcionário')
      payload.funcionario_id = picked.id
    }
    if (!body.trim()) return Alert.alert('Mensagem obrigatória')

    setSending(true)
    try {
      await api.post('/sms', payload)
      Alert.alert('SMS enviado', 'A mensagem foi colocada na fila de envio.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ])
    } catch (e) {
      Alert.alert('Erro', e.response?.data?.message || 'Falha ao enviar SMS.')
    } finally {
      setSending(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.bg }}
    >
      <View style={{ padding: 12 }}>
        <View style={{ flexDirection: 'row', backgroundColor: 'white', borderRadius: radius.lg, padding: 4, marginBottom: 12 }}>
          {TABS.map((t) => (
            <Pressable
              key={t.value}
              onPress={() => { setTab(t.value); setPicked(null); setPhone('') }}
              style={{
                flex: 1, paddingVertical: 9, borderRadius: radius.md,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5,
                backgroundColor: tab === t.value ? colors.hgb[600] : 'transparent',
              }}
            >
              <Ionicons name={t.Icon} size={15} color={tab === t.value ? 'white' : colors.slate[600]} />
              <Text style={{ color: tab === t.value ? 'white' : colors.slate[600], fontSize: font.sm, fontWeight: '600' }}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === 'manual' && (
          <View style={{ backgroundColor: 'white', borderRadius: radius.lg, padding: 12, marginBottom: 12 }}>
            <Text style={{ fontSize: font.xs, color: colors.slate[600], marginBottom: 6 }}>Telefone</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+244 9XX XXX XXX"
              style={inputStyle}
            />
          </View>
        )}

        {tab !== 'manual' && (
          <PickerCard
            kind={tab}
            picked={picked}
            onPick={setPicked}
          />
        )}

        <View style={{ backgroundColor: 'white', borderRadius: radius.lg, padding: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <Text style={{ fontSize: font.xs, color: colors.slate[600] }}>Mensagem</Text>
            <Text style={{ fontSize: font.xs, color: body.length > 160 ? colors.amber[700] : colors.slate[400] }}>
              {body.length}/160 chars
            </Text>
          </View>
          <TextInput
            value={body}
            onChangeText={setBody}
            multiline
            maxLength={480}
            placeholder="Escreve a mensagem…"
            style={[inputStyle, { minHeight: 110, textAlignVertical: 'top' }]}
          />
        </View>

        <TouchableOpacity
          onPress={send}
          disabled={sending || !body.trim()}
          style={{
            backgroundColor: colors.hgb[600],
            borderRadius: radius.md, padding: 14, marginTop: 14,
            alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6,
            opacity: (sending || !body.trim()) ? 0.5 : 1,
          }}
        >
          <Ionicons name="send" size={16} color="white" />
          <Text style={{ color: 'white', fontWeight: '700', fontSize: font.md }}>
            {sending ? 'A enviar…' : 'Enviar SMS'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

function PickerCard({ kind, picked, onPick }) {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef()

  useEffect(() => {
    if (picked) return
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      if (search.trim().length < 2) { setResults([]); return }
      setLoading(true)
      try {
        const path = kind === 'paciente' ? '/pacientes' : '/funcionarios'
        const { data } = await api.get(path, { params: { search, per_page: 10 } })
        setResults(data.data || [])
      } catch {} finally { setLoading(false) }
    }, 350)
    return () => clearTimeout(debounceRef.current)
  }, [search, kind, picked])

  if (picked) {
    return (
      <View style={{ backgroundColor: colors.hgb[50], borderRadius: radius.lg, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.hgb[100] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Ionicons name="checkmark-circle" size={22} color={colors.hgb[600]} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: font.sm, fontWeight: '600', color: colors.hgb[700] }} numberOfLines={1}>{picked.nome}</Text>
            <Text style={{ fontSize: font.xs, color: colors.slate[600], fontFamily: 'monospace' }}>{picked.telefone || '— sem telefone —'}</Text>
          </View>
          <TouchableOpacity onPress={() => onPick(null)}>
            <Ionicons name="close-circle" size={20} color={colors.slate[400]} />
          </TouchableOpacity>
        </View>
        {!picked.telefone && (
          <Text style={{ fontSize: font.xs, color: colors.amber[700], marginTop: 6 }}>
            ⚠ Este {kind} não tem telefone — escolhe outro.
          </Text>
        )}
      </View>
    )
  }

  return (
    <View style={{ backgroundColor: 'white', borderRadius: radius.lg, padding: 12, marginBottom: 12 }}>
      <Text style={{ fontSize: font.xs, color: colors.slate[600], marginBottom: 6 }}>
        Pesquisar {kind === 'paciente' ? 'paciente' : 'funcionário'}
      </Text>
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder={kind === 'paciente' ? 'Nome ou BI…' : 'Nome…'}
        autoCapitalize="words"
        style={inputStyle}
      />
      {loading && <ActivityIndicator color={colors.hgb[600]} style={{ marginTop: 8 }} />}
      {!loading && search.length >= 2 && results.length === 0 && (
        <Text style={{ fontSize: font.xs, color: colors.slate[400], marginTop: 8 }}>Sem resultados.</Text>
      )}
      <FlatList
        data={results}
        keyExtractor={(it) => String(it.id)}
        keyboardShouldPersistTaps="handled"
        scrollEnabled={false}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onPick(item)}
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 6,
              backgroundColor: pressed ? colors.slate[100] : 'transparent',
            })}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: font.sm, color: colors.slate[800] }} numberOfLines={1}>{item.nome}</Text>
              <Text style={{ fontSize: font.xs, color: colors.slate[500] }}>
                {item.telefone || 'sem telefone'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.slate[400]} />
          </Pressable>
        )}
      />
    </View>
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
  backgroundColor: 'white',
}
