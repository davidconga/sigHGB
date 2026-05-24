import { Text, View } from 'react-native'
import { colors, radius, font } from '../theme'

const MAP = {
  emitido:   { bg: colors.emerald[100], fg: colors.emerald[700], label: 'EMITIDO' },
  rascunho:  { bg: colors.amber[100],   fg: colors.amber[700],   label: 'RASCUNHO' },
  anulado:   { bg: colors.red[100],     fg: colors.red[700],     label: 'ANULADO' },
  pendente:  { bg: colors.amber[100],   fg: colors.amber[700],   label: 'PENDENTE' },
  enviado:   { bg: colors.emerald[100], fg: colors.emerald[700], label: 'ENVIADO' },
  falhado:   { bg: colors.red[100],     fg: colors.red[700],     label: 'FALHADO' },
  cancelado: { bg: colors.slate[100],   fg: colors.slate[600],   label: 'CANCELADO' },
}

export default function StatusBadge({ status }) {
  const s = MAP[status] || { bg: colors.slate[100], fg: colors.slate[600], label: status?.toUpperCase() || '—' }
  return (
    <View style={{ alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.sm, backgroundColor: s.bg }}>
      <Text style={{ color: s.fg, fontSize: font.xs, fontWeight: '700' }}>{s.label}</Text>
    </View>
  )
}
