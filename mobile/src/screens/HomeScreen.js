import { useEffect, useState } from 'react'
import { FlatList, RefreshControl, ScrollView, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import api from '../api/client'
import { useAuth } from '../auth/AuthContext'
import Card from '../components/Card'
import { colors, font } from '../theme'

const CARDS = [
  { key: 'atestados', label: 'Atestados', icon: 'document-text', color: '#e11d48', screen: 'Atestados' },
  { key: 'relatorios', label: 'Relatórios', icon: 'reader', color: '#1f5fa6', screen: 'Relatorios' },
  { key: 'pacientes', label: 'Pacientes', icon: 'people', color: '#10b981', screen: 'Pacientes' },
  { key: 'funcionarios', label: 'Funcionários', icon: 'briefcase', color: '#8b5cf6', screen: 'SMS' },
  { key: 'sms_enviados', label: 'SMS', icon: 'chatbubble-ellipses', color: '#f59e0b', screen: 'SMS' },
  { key: 'consultas', label: 'Consultas', icon: 'clipboard', color: '#06b6d4', screen: null },
]

export default function HomeScreen({ navigation }) {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    try {
      const { data } = await api.get('/dashboard/stats')
      setData(data)
    } catch {}
  }
  useEffect(() => { load() }, [])

  async function onRefresh() {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  if (!data) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.hgb[600]} />
      </View>
    )
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 14 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={{ marginBottom: 14 }}>
        <Text style={{ fontSize: font.xs, color: colors.slate[500] }}>Bem-vindo</Text>
        <Text style={{ fontSize: font.xl, fontWeight: '700', color: colors.slate[900] }}>{user?.name}</Text>
        <Text style={{ fontSize: font.xs, color: colors.slate[500], textTransform: 'capitalize' }}>{user?.roles?.join(', ')}</Text>
      </View>

      {(data.rascunhos_pendentes?.atestados > 0 || data.rascunhos_pendentes?.relatorios > 0) && (
        <Card style={{ backgroundColor: '#fef3c7', borderColor: '#fcd34d' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="warning" size={20} color="#b45309" />
            <Text style={{ flex: 1, fontSize: font.sm, color: '#92400e', fontWeight: '600' }}>
              Por assinar: {data.rascunhos_pendentes.atestados} atestados, {data.rascunhos_pendentes.relatorios} relatórios
            </Text>
          </View>
        </Card>
      )}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        {CARDS.map((c) => (
          <TouchableOpacity
            key={c.key}
            disabled={!c.screen}
            onPress={() => c.screen && navigation.navigate(c.screen)}
            style={{ width: '48%' }}
          >
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: c.color, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={c.icon} size={20} color="white" />
                </View>
                <View>
                  <Text style={{ fontSize: font.xs, color: colors.slate[500] }}>{c.label}</Text>
                  <Text style={{ fontSize: font.xl, fontWeight: '700' }}>{data.counts?.[c.key] ?? '—'}</Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </View>

      <Card>
        <Text style={{ fontSize: font.xs, color: colors.slate[500], fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 }}>
          Próximos aniversariantes
        </Text>
        {data.aniversariantes_proximos?.length === 0
          ? <Text style={{ fontSize: font.sm, color: colors.slate[400] }}>Nenhum nos próximos 14 dias.</Text>
          : data.aniversariantes_proximos.slice(0, 5).map((f) => (
              <View key={f.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.slate[100] }}>
                <Text style={{ fontSize: font.sm, flex: 1 }}>{f.nome}</Text>
                <Text style={{ fontSize: font.xs, color: f.dias === 0 ? '#be185d' : colors.slate[500], fontWeight: f.dias === 0 ? '700' : 'normal' }}>
                  {f.data_nascimento} · {f.dias === 0 ? 'HOJE 🎉' : f.dias === 1 ? 'amanhã' : `em ${f.dias} dias`}
                </Text>
              </View>
            ))
        }
      </Card>
    </ScrollView>
  )
}
