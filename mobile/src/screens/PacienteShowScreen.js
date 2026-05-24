import { useCallback, useState } from 'react'
import { ScrollView, Text, View, ActivityIndicator } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import api from '../api/client'
import Card from '../components/Card'
import { colors, font } from '../theme'

export default function PacienteShowScreen({ route }) {
  const { id } = route.params
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    try { const { data } = await api.get(`/pacientes/${id}`); setData(data) }
    catch {} finally { setLoading(false) }
  }
  useFocusEffect(useCallback(() => { load() }, [id]))

  if (loading) return <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor: colors.bg }}><ActivityIndicator color={colors.hgb[600]} /></View>
  if (!data) return null

  const p = data.paciente
  const idade = p.data_nascimento ? Math.floor((Date.now() - new Date(p.data_nascimento)) / 31557600000) : null
  const c = data.counts

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 12 }}>
      <Card>
        <Text style={{ fontSize: font.lg, fontWeight: '700' }}>{p.nome}</Text>
        <Text style={{ fontSize: font.xs, color: colors.slate[500], fontFamily: 'monospace' }}>{p.numero_processo}</Text>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
          {p.sexo && <Text style={{ fontSize: font.xs, color: colors.slate[600] }}>{p.sexo === 'F' ? 'Feminino' : 'Masculino'}</Text>}
          {idade != null && <Text style={{ fontSize: font.xs, color: colors.slate[600] }}>· {idade} anos</Text>}
          {p.estado_civil && <Text style={{ fontSize: font.xs, color: colors.slate[600] }}>· {p.estado_civil}</Text>}
        </View>
      </Card>

      <Card>
        <Title>Identificação</Title>
        <Field label="BI" value={p.bi} mono />
        {p.data_nascimento && <Field label="Nascimento" value={p.data_nascimento.slice(0,10)} />}
        <Field label="Telefone" value={p.telefone} mono />
        <Field label="Residência" value={[p.bairro, p.municipio, p.provincia].filter(Boolean).join(', ')} />
        <Field label="Naturalidade" value={[p.naturalidade_municipio, p.naturalidade_provincia].filter(Boolean).join(', ')} />
      </Card>

      {(p.nome_pai || p.nome_mae) && (
        <Card>
          <Title>Filiação</Title>
          <Field label="Pai" value={p.nome_pai} />
          <Field label="Mãe" value={p.nome_mae} />
        </Card>
      )}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <CountCard label="Atestados" value={c.atestados} color="#e11d48" />
        <CountCard label="Relatórios" value={c.relatorios} color="#1f5fa6" />
        <CountCard label="Consultas" value={c.consultas} color="#06b6d4" />
        <CountCard label="Exames" value={c.exames} color="#f59e0b" />
        <CountCard label="Altas" value={c.altas} color="#475569" />
        <CountCard label="SMS" value={c.sms} color="#10b981" />
      </View>
    </ScrollView>
  )
}

function Title({ children }) {
  return <Text style={{ fontSize: font.xs, color: colors.hgb[700], fontWeight: '700', textTransform: 'uppercase', marginBottom: 6 }}>{children}</Text>
}
function Field({ label, value, mono }) {
  if (!value) return null
  return (
    <View style={{ marginVertical: 2 }}>
      <Text style={{ fontSize: font.xs, color: colors.slate[500] }}>{label}</Text>
      <Text style={{ fontSize: font.sm, fontFamily: mono ? 'monospace' : undefined }}>{value}</Text>
    </View>
  )
}
function CountCard({ label, value, color }) {
  return (
    <View style={{ width: '31%', backgroundColor: 'white', borderRadius: 12, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: colors.slate[200] }}>
      <View style={{ width: 24, height: 4, borderRadius: 2, backgroundColor: color, marginBottom: 6 }} />
      <Text style={{ fontSize: font.xs, color: colors.slate[500] }}>{label}</Text>
      <Text style={{ fontSize: font.lg, fontWeight: '700' }}>{value}</Text>
    </View>
  )
}
