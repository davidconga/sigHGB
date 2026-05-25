import { useEffect, useState } from 'react'
import {
  Alert, FlatList, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Switch,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import api from '../api/client'
import { colors, font, radius } from '../theme'

export default function NovaAgendamentoScreen({ navigation }) {
  const [paciente, setPaciente] = useState(null)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)

  const [medicos, setMedicos] = useState([])
  const [medicoId, setMedicoId] = useState('')

  const amanha = (() => {
    const d = new Date(); d.setDate(d.getDate() + 1); return d
  })()
  const [dataStr, setDataStr] = useState(amanha.toISOString().slice(0, 10))
  const [horaStr, setHoraStr] = useState('09:00')
  const [duracao, setDuracao] = useState('30')
  const [motivo, setMotivo] = useState('')
  const [notificarSms, setNotificarSms] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api.get('/medicos', { params: { per_page: 500, apenas_ativos: 1 } })
      .then((r) => setMedicos(r.data.data || [])).catch(() => {})
  }, [])

  useEffect(() => {
    if (!search.trim() || paciente) { setResults([]); return }
    setSearching(true)
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get('/pacientes', { params: { search, per_page: 10 } })
        setResults(data.data || [])
      } catch {} finally { setSearching(false) }
    }, 350)
    return () => clearTimeout(t)
  }, [search, paciente])

  function quickDate(offsetDays) {
    const d = new Date(); d.setDate(d.getDate() + offsetDays)
    setDataStr(d.toISOString().slice(0, 10))
  }

  async function guardar() {
    if (!paciente) return Alert.alert('Paciente em falta', 'Escolhe um paciente.')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dataStr)) return Alert.alert('Data inválida', 'Formato: AAAA-MM-DD.')
    if (!/^\d{2}:\d{2}$/.test(horaStr)) return Alert.alert('Hora inválida', 'Formato: HH:MM.')
    const dataHora = new Date(`${dataStr}T${horaStr}:00`)
    if (isNaN(dataHora.getTime())) return Alert.alert('Data inválida', 'Verifica data e hora.')
    if (dataHora.getTime() < Date.now()) return Alert.alert('Data inválida', 'A marcação tem de ser no futuro.')

    setSaving(true)
    try {
      await api.post('/agendamentos', {
        paciente_id: paciente.id,
        medico_id: medicoId || null,
        data_agendamento: dataHora.toISOString(),
        duracao_minutos: Number(duracao) || 30,
        motivo: motivo || null,
        notificar_sms: notificarSms,
        status: 'confirmada',
      })
      Alert.alert('Marcação criada', 'A marcação foi registada com sucesso.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ])
    } catch (e) {
      const msg = e.response?.data?.errors
        ? Object.values(e.response.data.errors).flat().join(' · ')
        : (e.response?.data?.message || 'Falha ao guardar.')
      Alert.alert('Erro', msg)
    } finally { setSaving(false) }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.bg }}
    >
      <ScrollView contentContainerStyle={{ padding: 12 }}>
        {/* Paciente */}
        <View style={{ backgroundColor: 'white', borderRadius: radius.lg, padding: 12, marginBottom: 10 }}>
          <Text style={{ fontSize: font.xs, color: colors.slate[600], marginBottom: 6, fontWeight: '600' }}>PACIENTE</Text>
          {paciente ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', fontSize: font.md }}>{paciente.nome}</Text>
                <Text style={{ fontSize: font.xs, color: colors.slate[500] }}>
                  {paciente.numero_processo}{paciente.telefone ? ` · ${paciente.telefone}` : ' · sem telefone'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => { setPaciente(null); setSearch('') }}>
                <Ionicons name="close-circle" size={22} color={colors.slate[400]} />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.slate[100], borderRadius: radius.md, paddingHorizontal: 10 }}>
                <Ionicons name="search" size={18} color={colors.slate[400]} />
                <TextInput
                  placeholder="Pesquisar por nome, BI ou processo"
                  value={search}
                  onChangeText={setSearch}
                  autoCapitalize="words"
                  style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: font.sm }}
                />
                {searching && <ActivityIndicator size="small" color={colors.hgb[600]} />}
              </View>
              {results.length > 0 && (
                <View style={{ marginTop: 8, borderWidth: 1, borderColor: colors.slate[200], borderRadius: radius.md, maxHeight: 250 }}>
                  <FlatList
                    data={results}
                    keyExtractor={(it) => String(it.id)}
                    renderItem={({ item }) => (
                      <Pressable
                        onPress={() => { setPaciente(item); setResults([]); setSearch('') }}
                        style={{ padding: 10, borderBottomWidth: 1, borderBottomColor: colors.slate[100] }}
                      >
                        <Text style={{ fontSize: font.sm, fontWeight: '600' }}>{item.nome}</Text>
                        <Text style={{ fontSize: font.xs, color: colors.slate[500] }}>{item.numero_processo}</Text>
                      </Pressable>
                    )}
                  />
                </View>
              )}
            </>
          )}
        </View>

        {/* Médico */}
        <View style={{ backgroundColor: 'white', borderRadius: radius.lg, padding: 12, marginBottom: 10 }}>
          <Text style={{ fontSize: font.xs, color: colors.slate[600], marginBottom: 6, fontWeight: '600' }}>MÉDICO</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <Chip selected={!medicoId} onPress={() => setMedicoId('')} label="— nenhum —" />
              {medicos.map((m) => (
                <Chip key={m.id} selected={medicoId === m.id} onPress={() => setMedicoId(m.id)} label={m.nome} />
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Data/Hora */}
        <View style={{ backgroundColor: 'white', borderRadius: radius.lg, padding: 12, marginBottom: 10 }}>
          <Text style={{ fontSize: font.xs, color: colors.slate[600], marginBottom: 6, fontWeight: '600' }}>DATA E HORA</Text>

          <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
            <Chip selected={false} onPress={() => quickDate(1)} label="Amanhã" />
            <Chip selected={false} onPress={() => quickDate(7)} label="+ 1 semana" />
            <Chip selected={false} onPress={() => quickDate(14)} label="+ 2 semanas" />
          </View>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 2 }}>
              <Text style={{ fontSize: font.xs, color: colors.slate[500], marginBottom: 4 }}>Data (AAAA-MM-DD)</Text>
              <TextInput
                value={dataStr}
                onChangeText={setDataStr}
                placeholder="2026-06-01"
                style={{ backgroundColor: colors.slate[100], borderRadius: radius.md, padding: 12, fontSize: font.sm }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: font.xs, color: colors.slate[500], marginBottom: 4 }}>Hora (HH:MM)</Text>
              <TextInput
                value={horaStr}
                onChangeText={setHoraStr}
                placeholder="09:00"
                style={{ backgroundColor: colors.slate[100], borderRadius: radius.md, padding: 12, fontSize: font.sm }}
              />
            </View>
          </View>

          <Text style={{ fontSize: font.xs, color: colors.slate[600], marginTop: 12, marginBottom: 6, fontWeight: '600' }}>DURAÇÃO (MIN)</Text>
          <TextInput
            value={duracao}
            onChangeText={setDuracao}
            keyboardType="number-pad"
            style={{ backgroundColor: colors.slate[100], borderRadius: radius.md, padding: 12, fontSize: font.sm }}
          />
        </View>

        {/* Motivo + SMS */}
        <View style={{ backgroundColor: 'white', borderRadius: radius.lg, padding: 12, marginBottom: 10 }}>
          <Text style={{ fontSize: font.xs, color: colors.slate[600], marginBottom: 6, fontWeight: '600' }}>MOTIVO</Text>
          <TextInput
            value={motivo}
            onChangeText={setMotivo}
            placeholder="Ex.: Consulta de retorno, dor lombar…"
            maxLength={500}
            multiline
            style={{ backgroundColor: colors.slate[100], borderRadius: radius.md, padding: 12, fontSize: font.sm, minHeight: 60, textAlignVertical: 'top' }}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
            <Text style={{ fontSize: font.sm, color: colors.slate[700] }}>Enviar SMS de confirmação</Text>
            <Switch value={notificarSms} onValueChange={setNotificarSms} trackColor={{ true: colors.hgb[500] }} />
          </View>
        </View>

        <TouchableOpacity
          onPress={guardar}
          disabled={saving}
          style={{
            backgroundColor: saving ? colors.slate[300] : colors.hgb[600],
            paddingVertical: 14, borderRadius: radius.md, alignItems: 'center', marginBottom: 30,
          }}
        >
          {saving
            ? <ActivityIndicator color="white" />
            : <Text style={{ color: 'white', fontWeight: '700', fontSize: font.md }}>Guardar marcação</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

function Chip({ label, selected, onPress }) {
  return (
    <Pressable onPress={onPress}
      style={{
        paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.full,
        backgroundColor: selected ? colors.hgb[600] : colors.slate[100],
      }}>
      <Text style={{ fontSize: font.sm, fontWeight: '600', color: selected ? 'white' : colors.slate[700] }}>
        {label}
      </Text>
    </Pressable>
  )
}
