import { useCallback, useState } from 'react'
import { FlatList, RefreshControl, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import api from '../api/client'
import Card from '../components/Card'
import StatusBadge from '../components/StatusBadge'
import { colors, font, radius } from '../theme'

export default function SmsScreen({ navigation }) {
  const [items, setItems] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    try {
      const [{ data: list }, { data: s }] = await Promise.all([
        api.get('/sms', { params: { per_page: 30 } }),
        api.get('/sms/stats'),
      ])
      setItems(list.data || [])
      setStats(s)
    } catch {} finally { setLoading(false) }
  }

  useFocusEffect(useCallback(() => { load() }, []))

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {stats?.balance?.ok && (
        <View style={{ backgroundColor: colors.hgb[50], padding: 12, borderBottomWidth: 1, borderBottomColor: colors.hgb[100], flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Ionicons name="wallet" size={22} color={colors.hgb[700]} />
          <View>
            <Text style={{ fontSize: font.xs, color: colors.slate[500] }}>Saldo Okulandisa</Text>
            <Text style={{ fontSize: font.lg, fontWeight: '700', color: colors.hgb[700] }}>
              {stats.balance.sms_available} SMS
            </Text>
          </View>
        </View>
      )}

      <TouchableOpacity
        onPress={() => navigation.navigate('NovaSms')}
        style={{
          position: 'absolute', right: 16, bottom: 24, zIndex: 10,
          backgroundColor: colors.hgb[600], width: 56, height: 56, borderRadius: 28,
          alignItems: 'center', justifyContent: 'center',
          shadowColor: '#000', shadowOpacity: 0.25, shadowOffset: { width: 0, height: 4 }, shadowRadius: 6, elevation: 6,
        }}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      {loading ? <ActivityIndicator color={colors.hgb[600]} style={{ marginTop: 20 }} /> : (
        <FlatList
          data={items}
          keyExtractor={(it) => String(it.id)}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false) }} />}
          contentContainerStyle={{ padding: 12 }}
          ListEmptyComponent={<Text style={{ textAlign: 'center', color: colors.slate[400], marginTop: 40 }}>Sem SMS.</Text>}
          renderItem={({ item }) => (
            <Card>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontFamily: 'monospace', fontSize: font.sm }}>{item.to}</Text>
                <StatusBadge status={item.status} />
              </View>
              <Text style={{ fontSize: font.sm, color: colors.slate[800] }} numberOfLines={2}>{item.body}</Text>
              {(item.paciente || item.funcionario) && (
                <Text style={{ fontSize: font.xs, color: colors.slate[500], marginTop: 4 }}>
                  → {item.paciente?.nome || item.funcionario?.nome}
                </Text>
              )}
              <Text style={{ fontSize: font.xs, color: colors.slate[400], marginTop: 2 }}>
                {(item.sent_at || item.created_at)?.slice(0,16).replace('T', ' ')}
              </Text>
            </Card>
          )}
        />
      )}
    </View>
  )
}
