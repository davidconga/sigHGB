import { View } from 'react-native'
import { colors, radius } from '../theme'

export default function Card({ children, style }) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.white,
          borderRadius: radius.lg,
          padding: 14,
          marginBottom: 10,
          shadowColor: '#000',
          shadowOpacity: 0.04,
          shadowOffset: { width: 0, height: 1 },
          shadowRadius: 3,
          elevation: 1,
          borderWidth: 1,
          borderColor: colors.slate[200],
        },
        style,
      ]}
    >
      {children}
    </View>
  )
}
