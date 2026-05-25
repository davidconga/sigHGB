import { useCallback, useEffect, useState } from 'react'
import {
  Alert, FlatList, RefreshControl, Text, TouchableOpacity, View, ActivityIndicator,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import api from '../api/client'
import Card from '../components/Card'
import { colors, font, radius } from '../theme'

const STATUS = {
  pendente:       { label: 'Pendente',       bg: '#fef3c7', fg: '#92400e' },
  confirmada:     { label: 'Confirmada',     bg: '#dbeafe', fg: '#1d4ed8' },
  presente:       { label: 'Presente',       bg: '#ede9fe', fg: '#6d28d9' },
  em_atendimento: { label: 'Em atendimento', bg: '#dbeafe', fg: '#1e40af' },
  realizada:      { label: 'Realizada',      bg: '#d1fae5', fg: '#047857' },
  cancelada:      { label: 'Cancelada',      bg: '#fee2e2', fg: '#b91c1c' },
  faltou:         { label: 'Faltou',         bg: '#e2e8f0', fg: '#475569' },
}

const FILTROS = [
  { key: 'hoje',     label: 'Hoje',     params: () => ({ data_de: today(), data_ate: today(), order: 'asc' }) },
  { key: 'proximas', label: 'Próximas', params: () => ({ data_de: today(), order: 'asc' }) },
  { key: 'todas',    label: 'Todas',    params: () => ({}) },
]

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function AgendamentosScreen({ navigation }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [filtro, setFiltro] = useState('hoje')

  async function load() {
    setLoading(true)
    try {
      const params = FILTROS.find((f) => f.key === filtro).params()
      const { data } = await api.get('/agendamentos', { params: { ...params, per_page: 50 } })
      setItems(data.data || [])
    } catch (e) {
      Alert.alert('Erro', e.response?.data?.message || 'Falha ao carregar marcações.')
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filtro])
  useFocusEffect(useCallback(() => { load() }, [filtro]))

  async function onRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  async function checkIn(item) {
    Alert.alert('Check-in', `Confirmar presença de ${item.paciente?.nome}?`, [
      { text: 'Cancelar' },
      {
        text: 'Confirmar', onPress: async () => {
          try {
            await api.post(`/agendamentos/${item.id}/check-in`)
            load()
          } catch (e) {
            Alert.alert('Erro', e.response?.data?.message || 'Falha no check-in.')
          }
        },
      },
    ])
  }

  async function cancelar(item) {
    Alert.alert('Cancelar marcação', `Cancelar marcação ${item.numero}?`, [
      { text: 'Não' },
      {
        text: 'Sim, cancelar', style: 'destructive', onPress: async () => {
          try {
            await api.post(`/agendamentos/${item.id}/cancelar`)
            load()
          } catch (e) {
            Alert.alert('Erro', e.response?.data?.message || 'Falha ao cancelar.')
          }
        },
      },
    ])
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flexDirection: 'row', padding: 10, gap: 6, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: colors.slate[200] }}>
        {FILTROS.map((f) => (
          <TouchableOpacity
            key={f.key}
            onPress={() => setFiltro(f.key)}
            style={{
              flex: 1, paddingVertical: 8, borderRadius: radius.md, alignItems: 'center',
              backgroundColor: filtro === f.key ? colors.hgb[600] : colors.slate[100],
            }}
          >
            <Text style={{ fontSize: font.sm, fontWeight: '600', color: filtro === f.key ? 'white' : colors.slate[600] }}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && items.length === 0
        ? <ActivityIndicator color={colors.hgb[600]} style={{ marginTop: 20 }} />
        : <FlatList
            data={items}
            keyExtractor={(it) => String(it.id)}
            contentContainerStyle={{ padding: 12, paddingBottom: 80 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', marginTop: 40 }}>
                <Ionicons name="calendar-outline" size={36} color={colors.slate[300]} />
                <Text style={{ color: colors.slate[400], marginTop: 8 }}>Sem marcações.</Text>
              </View>
            }
            renderItem={({ item }) => {
              const st = STATUS[item.status] || { label: item.status, bg: colors.slate[100], fg: colors.slate[600] }
              const d = new Date(item.data_agendamento)
              const podeCheckIn = ['pendente', 'confirmada'].includes(item.status)
              const podeCancelar = !['cancelada', 'realizada'].includes(item.status)
              return (
                <Card>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <Text style={{ fontSize: font.xs, color: colors.slate[500], fontFamily: 'Courier' }}>{item.numero}</Text>
                    <View style={{ backgroundColor: st.bg, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: st.fg }}>{st.label.toUpperCase()}</Text>
                    </View>
                  </View>

                  <Text style={{ fontWeight: '700', fontSize: font.md }}>{item.paciente?.nome}</Text>
                  {item.paciente?.numero_processo && (
                    <Text style={{ fontSize: font.xs, color: colors.slate[500] }}>{item.paciente.numero_processo}</Text>
                  )}

                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 }}>
                    <Ionicons name="time-outline" size={14} color={colors.slate[500]} />
                    <Text style={{ fontSize: font.xs, color: colors.slate[700] }}>
                      {d.toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' })}
                    </Text>
                  </View>
                  {(item.medico || item.servico) && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 }}>
                      <Ionicons name="medical-outline" size={14} color={colors.slate[500]} />
                      <Text style={{ fontSize: font.xs, color: colors.slate[700] }}>
                        {item.medico?.nome || item.servico?.nome}
                      </Text>
                    </View>
                  )}
                  {item.motivo && (
                    <Text style={{ marginTop: 6, fontSize: font.xs, color: colors.slate[600] }} numberOfLines={2}>
                      {item.motivo}
                    </Text>
                  )}

                  {(podeCheckIn || podeCancelar) && (
                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                      {podeCheckIn && (
                        <TouchableOpacity onPress={() => checkIn(item)}
                          style={{ flex: 1, backgroundColor: colors.hgb[600], paddingVertical: 8, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <Ionicons name="enter-outline" size={16} color="white" />
                          <Text style={{ color: 'white', fontWeight: '600', fontSize: font.sm }}>Check-in</Text>
                        </TouchableOpacity>
                      )}
                      {podeCancelar && (
                        <TouchableOpacity onPress={() => cancelar(item)}
                          style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.md, borderWidth: 1, borderColor: colors.red[600], flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <Ionicons name="close-circle-outline" size={16} color={colors.red[600]} />
                          <Text style={{ color: colors.red[600], fontWeight: '600', fontSize: font.sm }}>Cancelar</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </Card>
              )
            }}
          />
      }

      <TouchableOpacity
        onPress={() => navigation.navigate('NovaAgendamento')}
        style={{
          position: 'absolute', bottom: 20, right: 20,
          backgroundColor: colors.hgb[600], width: 56, height: 56, borderRadius: 28,
          alignItems: 'center', justifyContent: 'center',
          shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
          elevation: 4,
        }}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
    </View>
  )
}
