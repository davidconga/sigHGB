import { useCallback, useState } from 'react'
import { Alert, Linking, ScrollView, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import api, { API_BASE } from '../api/client'
import AsyncStorage from '@react-native-async-storage/async-storage'
import StatusBadge from '../components/StatusBadge'
import Card from '../components/Card'
import { colors, font } from '../theme'

export default function AtestadoShowScreen({ route, navigation }) {
  const { id } = route.params
  const [a, setA] = useState(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    try { const { data } = await api.get(`/atestados/${id}`); setA(data) }
    catch {} finally { setLoading(false) }
  }
  useFocusEffect(useCallback(() => { load() }, [id]))

  async function abrirPdf() {
    const token = await AsyncStorage.getItem('hgb_token')
    const url = `${API_BASE.replace('/api','')}/api/atestados/${id}/pdf?token=${token}`
    Linking.openURL(url).catch(() => Alert.alert('Erro', 'Não foi possível abrir o PDF'))
  }

  if (loading) return <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor: colors.bg }}><ActivityIndicator color={colors.hgb[600]} /></View>
  if (!a) return null

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 12 }}>
      <Card style={{ backgroundColor: '#fff1f2', borderColor: '#fecdd3' }}>
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
          <View>
            <Text style={{ fontSize: font.xs, color: colors.slate[500], textTransform:'uppercase' }}>Atestado</Text>
            <Text style={{ fontSize: font.xl, fontWeight: '700' }}>{a.numero}</Text>
            <Text style={{ fontSize: font.xs, color: colors.slate[600], textTransform: 'capitalize' }}>{a.tipo} {a.destino && `· ${a.destino}`}</Text>
          </View>
          <StatusBadge status={a.status} />
        </View>
      </Card>

      <Card>
        <Field label="Paciente" value={a.paciente?.nome} />
        <Field label="Processo" value={a.paciente?.numero_processo} mono />
        <Field label="Médico" value={a.medico?.nome || '⚠ sem médico atribuído'} />
        <Field label="Data emissão" value={a.data_emissao?.slice(0,10)} />
        {a.cid && <Field label="CID" value={a.cid} mono />}
        {a.codigo_verificacao && <Field label="Código verificação" value={a.codigo_verificacao} mono />}
      </Card>

      {a.diagnostico && <Card><SectionTitle>Diagnóstico</SectionTitle><Text>{stripTags(a.diagnostico)}</Text></Card>}
      {a.motivo && <Card><SectionTitle>Motivo</SectionTitle><Text>{stripTags(a.motivo)}</Text></Card>}
      {a.observacoes && <Card><SectionTitle>Observações</SectionTitle><Text>{stripTags(a.observacoes)}</Text></Card>}

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        {a.status === 'rascunho' && (
          <TouchableOpacity
            onPress={() => navigation.navigate('ValidarAssinatura', { tipo: 'atestados', id: a.id, documento: a })}
            style={btnAmber}
          >
            <Ionicons name="shield-checkmark" size={18} color="white" />
            <Text style={{ color: 'white', fontWeight: '600', marginLeft: 6 }}>Validar e Assinar</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={abrirPdf} style={btnPrimary}>
          <Ionicons name="print" size={18} color="white" />
          <Text style={{ color: 'white', fontWeight: '600', marginLeft: 6 }}>Ver PDF</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

function Field({ label, value, mono }) {
  if (!value) return null
  return (
    <View style={{ marginVertical: 3 }}>
      <Text style={{ fontSize: font.xs, color: colors.slate[500] }}>{label}</Text>
      <Text style={{ fontSize: font.sm, color: colors.slate[900], fontFamily: mono ? 'monospace' : undefined }}>{value}</Text>
    </View>
  )
}

function SectionTitle({ children }) {
  return <Text style={{ fontSize: font.xs, color: colors.hgb[700], fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 }}>{children}</Text>
}

function stripTags(html) {
  return String(html || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')
}

const btnAmber = { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: colors.amber[600], borderRadius: 8, padding: 12 }
const btnPrimary = { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: colors.hgb[600], borderRadius: 8, padding: 12 }
