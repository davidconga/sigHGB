import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider, useAuth } from './src/auth/AuthContext'
import Root from './src/navigation'
import Splash from './src/components/Splash'

function Gate() {
  const { loading } = useAuth()
  if (loading) return <Splash />
  return <Root />
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </SafeAreaProvider>
  )
}
