import { useCallback, useState } from 'react'
import { Alert, Linking, ScrollView, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import api, { API_BASE } from '../api/client'
import StatusBadge from '../components/StatusBadge'
import Card from '../components/Card'
import { colors, font } from '../theme'

export default function RelatorioShowScreen({ route, navigation }) {
  const { id } = route.params
  const [r, setR] = useState(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    try { const { data } = await api.get(`/relatorios/${id}`); setR(data) }
    catch {} finally { setLoading(false) }
  }
  useFocusEffect(useCallback(() => { load() }, [id]))

  async function abrirPdf() {
    const token = await AsyncStorage.getItem('hgb_token')
    const url = `${API_BASE.replace('/api','')}/api/relatorios/${id}/pdf?token=${token}`
    Linking.openURL(url).catch(() => Alert.alert('Erro', 'Não foi possível abrir o PDF'))
  }

  if (loading) return <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor: colors.bg }}><ActivityIndicator color={colors.hgb[600]} /></View>
  if (!r) return null

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 12 }}>
      <Card>
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
          <View>
            <Text style={{ fontSize: font.xs, color: colors.slate[500], textTransform:'uppercase' }}>Relatório</Text>
            <Text style={{ fontSize: font.xl, fontWeight: '700' }}>{r.numero}</Text>
            {r.subtitulo && <Text style={{ fontSize: font.xs, color: colors.slate[600] }}>{r.subtitulo}</Text>}
          </View>
          <StatusBadge status={r.status} />
        </View>
      </Card>

      <Card>
        <Field label="Paciente" value={r.paciente?.nome} />
        <Field label="Processo" value={r.paciente?.numero_processo} mono />
        <Field label="Médico" value={r.medico?.nome || '⚠ sem médico atribuído'} />
        <Field label="Data emissão" value={r.data_emissao?.slice(0,10)} />
        {r.cid && <Field label="CID" value={r.cid} mono />}
        {r.grau_discapacidade != null && <Field label="Discapacidade" value={`${r.grau_discapacidade}%`} />}
        {r.codigo_verificacao && <Field label="Código verificação" value={r.codigo_verificacao} mono />}
      </Card>

      {r.historia_doenca && <Section title="História" html={r.historia_doenca} />}
      {r.exame_objectivo && <Section title="Exame objectivo" html={r.exame_objectivo} />}
      {r.exames_complementares && <Section title="Exames complementares" html={r.exames_complementares} />}
      {r.diagnostico && <Section title="Diagnóstico" html={r.diagnostico} />}
      {r.tratamento && <Section title="Tratamento" html={r.tratamento} />}
      {r.recomendacao && <Section title="Recomendação" html={r.recomendacao} />}
      {r.motivo && <Section title="Motivo" html={r.motivo} />}

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        {r.status === 'rascunho' && (
          <TouchableOpacity
            onPress={() => navigation.navigate('ValidarAssinatura', { tipo: 'relatorios', id: r.id, documento: r })}
            style={{ flex: 1, flexDirection:'row', justifyContent:'center', alignItems:'center', backgroundColor: colors.amber[600], borderRadius: 8, padding: 12 }}
          >
            <Ionicons name="shield-checkmark" size={18} color="white" />
            <Text style={{ color: 'white', fontWeight: '600', marginLeft: 6 }}>Validar</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={abrirPdf} style={{ flex: 1, flexDirection:'row', justifyContent:'center', alignItems:'center', backgroundColor: colors.hgb[600], borderRadius: 8, padding: 12 }}>
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
function Section({ title, html }) {
  return (
    <Card>
      <Text style={{ fontSize: font.xs, color: colors.hgb[700], fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 }}>{title}</Text>
      <Text style={{ fontSize: font.sm, color: colors.slate[800], lineHeight: 20 }}>
        {String(html).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ')}
      </Text>
    </Card>
  )
}
