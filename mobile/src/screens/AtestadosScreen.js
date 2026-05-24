import { useCallback, useEffect, useState } from 'react'
import { FlatList, RefreshControl, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import api from '../api/client'
import StatusBadge from '../components/StatusBadge'
import Card from '../components/Card'
import { colors, font } from '../theme'

export default function AtestadosScreen({ navigation }) {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  async function load() {
    try {
      const { data } = await api.get('/atestados', { params: { search, per_page: 30 } })
      setItems(data.data || [])
    } catch {} finally { setLoading(false) }
  }

  useFocusEffect(useCallback(() => { load() }, []))
  useEffect(() => {
    const t = setTimeout(load, 350)
    return () => clearTimeout(t)
  }, [search])

  async function onRefresh() {
    setRefreshing(true); await load(); setRefreshing(false)
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: 12, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: colors.slate[200] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.slate[100], borderRadius: 8, paddingHorizontal: 10 }}>
          <Ionicons name="search" size={18} color={colors.slate[400]} />
          <TextInput
            placeholder="Pesquisar atestado, paciente, BI…"
            value={search}
            onChangeText={setSearch}
            style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: font.sm }}
          />
        </View>
      </View>

      {loading
        ? <ActivityIndicator color={colors.hgb[600]} style={{ marginTop: 20 }} />
        : <FlatList
            data={items}
            keyExtractor={(it) => String(it.id)}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={{ padding: 12 }}
            ListEmptyComponent={<Text style={{ textAlign: 'center', color: colors.slate[400], marginTop: 40 }}>Sem atestados.</Text>}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => navigation.navigate('AtestadoShow', { id: item.id })}>
                <Card>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontWeight: '700', fontSize: font.md, color: colors.hgb[700] }}>{item.numero}</Text>
                    <StatusBadge status={item.status} />
                  </View>
                  <Text style={{ fontSize: font.sm, marginTop: 4 }}>{item.paciente?.nome}</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                    <Text style={{ fontSize: font.xs, color: colors.slate[500] }}>
                      {item.tipo} · {item.destino || '—'}
                    </Text>
                    <Text style={{ fontSize: font.xs, color: colors.slate[500] }}>
                      {item.data_emissao?.slice(0, 10)}
                    </Text>
                  </View>
                </Card>
              </TouchableOpacity>
            )}
          />
      }
    </View>
  )
}
