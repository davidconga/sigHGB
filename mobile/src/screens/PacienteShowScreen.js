import { useCallback, useState } from 'react'
import { Alert, Image, Pressable, ScrollView, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import api from '../api/client'
import Card from '../components/Card'
import { colors, font, radius } from '../theme'

const TIPOS = [
  { value: 'bi', label: 'BI' },
  { value: 'prescricao', label: 'Prescrição' },
  { value: 'exame', label: 'Exame' },
  { value: 'outro', label: 'Outro' },
]

export default function PacienteShowScreen({ route }) {
  const { id } = route.params
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [anexos, setAnexos] = useState([])
  const [uploading, setUploading] = useState(false)
  const [tipo, setTipo] = useState('bi')

  async function loadAll() {
    try {
      const [det, an] = await Promise.all([
        api.get(`/pacientes/${id}`),
        api.get(`/pacientes/${id}/anexos`),
      ])
      setData(det.data)
      setAnexos(an.data || [])
    } catch {} finally { setLoading(false) }
  }
  useFocusEffect(useCallback(() => { loadAll() }, [id]))

  async function pickFromCamera() {
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Permissão necessária', 'Activa o acesso à câmara nas definições.')
      return
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: false,
    })
    if (!result.canceled && result.assets?.[0]) upload(result.assets[0])
  }

  async function pickFromGallery() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Permissão necessária', 'Activa o acesso à galeria nas definições.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    })
    if (!result.canceled && result.assets?.[0]) upload(result.assets[0])
  }

  async function upload(asset) {
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', {
        uri: asset.uri,
        name: asset.fileName || `${tipo}-${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      })
      form.append('tipo', tipo)
      const { data } = await api.post(`/pacientes/${id}/anexos`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setAnexos((cur) => [data, ...cur])
    } catch (e) {
      Alert.alert('Erro', e.response?.data?.message || 'Falha ao enviar.')
    } finally {
      setUploading(false)
    }
  }

  async function remove(anexo) {
    Alert.alert('Remover anexo?', anexo.original_name || 'Este anexo será apagado.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/pacientes/${id}/anexos/${anexo.id}`)
            setAnexos((cur) => cur.filter((a) => a.id !== anexo.id))
          } catch (e) {
            Alert.alert('Erro', e.response?.data?.message || 'Falha ao remover.')
          }
        },
      },
    ])
  }

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

      {/* ============ ANEXOS ============ */}
      <Card>
        <Title>Anexos ({anexos.length})</Title>

        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
          {TIPOS.map((t) => (
            <Pressable
              key={t.value}
              onPress={() => setTipo(t.value)}
              style={{
                paddingHorizontal: 10, paddingVertical: 5, borderRadius: 16,
                backgroundColor: tipo === t.value ? colors.hgb[600] : colors.slate[100],
              }}
            >
              <Text style={{ fontSize: font.xs, color: tipo === t.value ? 'white' : colors.slate[700], fontWeight: '600' }}>
                {t.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={pickFromCamera}
            disabled={uploading}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10, borderRadius: radius.md, backgroundColor: colors.hgb[600], opacity: uploading ? 0.6 : 1 }}
          >
            <Ionicons name="camera" size={18} color="white" />
            <Text style={{ color: 'white', fontWeight: '600', fontSize: font.sm }}>Fotografar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={pickFromGallery}
            disabled={uploading}
            style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.hgb[600], opacity: uploading ? 0.6 : 1 }}
          >
            <Ionicons name="image" size={18} color={colors.hgb[600]} />
            <Text style={{ color: colors.hgb[600], fontWeight: '600', fontSize: font.sm }}>Galeria</Text>
          </TouchableOpacity>
        </View>

        {uploading && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
            <ActivityIndicator size="small" color={colors.hgb[600]} />
            <Text style={{ fontSize: font.xs, color: colors.slate[600] }}>A enviar…</Text>
          </View>
        )}

        {anexos.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, marginHorizontal: -3 }}>
            {anexos.map((a) => (
              <View key={a.id} style={{ width: '50%', padding: 3 }}>
                <View style={{ borderWidth: 1, borderColor: colors.slate[200], borderRadius: radius.md, overflow: 'hidden', backgroundColor: '#f8fafc' }}>
                  {a.mime?.startsWith('image/') ? (
                    <Image source={{ uri: a.url }} style={{ width: '100%', height: 110 }} resizeMode="cover" />
                  ) : (
                    <View style={{ height: 110, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="document" size={36} color={colors.slate[400]} />
                    </View>
                  )}
                  <View style={{ padding: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 10, color: colors.hgb[700], fontWeight: '700', textTransform: 'uppercase' }}>{a.tipo}</Text>
                      <Text style={{ fontSize: 10, color: colors.slate[500] }} numberOfLines={1}>
                        {(a.size / 1024).toFixed(0)} KB
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => remove(a)} style={{ padding: 4 }}>
                      <Ionicons name="trash-outline" size={16} color={colors.red[600]} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </Card>

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
