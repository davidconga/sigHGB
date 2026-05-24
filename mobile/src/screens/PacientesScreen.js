import { useEffect, useState } from 'react'
import { FlatList, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import api from '../api/client'
import Card from '../components/Card'
import { colors, font } from '../theme'

export default function PacientesScreen({ navigation }) {
  const [items, setItems] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!search.trim()) { setItems([]); return }
    setLoading(true)
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get('/pacientes', { params: { search, per_page: 25 } })
        setItems(data.data || [])
      } catch {} finally { setLoading(false) }
    }, 350)
    return () => clearTimeout(t)
  }, [search])

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: 12, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: colors.slate[200] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.slate[100], borderRadius: 8, paddingHorizontal: 10 }}>
          <Ionicons name="search" size={18} color={colors.slate[400]} />
          <TextInput
            placeholder="Pesquisar paciente por nome, BI ou processo…"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="words"
            style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: font.sm }}
          />
        </View>
      </View>

      {loading
        ? <ActivityIndicator color={colors.hgb[600]} style={{ marginTop: 20 }} />
        : <FlatList
            data={items}
            keyExtractor={(it) => String(it.id)}
            contentContainerStyle={{ padding: 12 }}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', marginTop: 40 }}>
                <Ionicons name="people-outline" size={36} color={colors.slate[300]} />
                <Text style={{ color: colors.slate[400], marginTop: 8 }}>
                  {search ? 'Sem resultados.' : 'Escreve para pesquisar pacientes.'}
                </Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => navigation.navigate('PacienteShow', { id: item.id })}>
                <Card>
                  <Text style={{ fontWeight: '700', fontSize: font.sm }}>{item.nome}</Text>
                  <Text style={{ fontSize: font.xs, color: colors.slate[500] }}>
                    {item.numero_processo}{item.bi && ` · BI ${item.bi}`}
                  </Text>
                </Card>
              </TouchableOpacity>
            )}
          />
      }
    </View>
  )
}
