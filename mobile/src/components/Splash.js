import { ActivityIndicator, Image, Text, View } from 'react-native'
import { colors, font } from '../theme'

export default function Splash({ message = 'A carregar…' }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.hgb[900] }}>
      <View style={{ backgroundColor: 'white', borderRadius: 999, padding: 14 }}>
        <Image source={require('../../assets/icon.png')} style={{ width: 90, height: 90 }} />
      </View>
      <Text style={{ color: 'white', fontSize: font.lg, fontWeight: '700', letterSpacing: 1, marginTop: 22 }}>
        HOSPITAL GERAL DE BENGUELA
      </Text>
      <Text style={{ color: colors.hgb[100], fontSize: font.sm, marginTop: 4 }}>
        Sistema Integrado de Gestão
      </Text>
      <ActivityIndicator color="white" style={{ marginTop: 18 }} />
      <Text style={{ color: colors.hgb[100], fontSize: font.xs, marginTop: 6 }}>{message}</Text>
    </View>
  )
}
