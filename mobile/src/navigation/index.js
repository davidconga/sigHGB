import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../auth/AuthContext'
import { colors } from '../theme'

import LoginScreen from '../screens/LoginScreen'
import HomeScreen from '../screens/HomeScreen'
import AtestadosScreen from '../screens/AtestadosScreen'
import AtestadoShowScreen from '../screens/AtestadoShowScreen'
import RelatoriosScreen from '../screens/RelatoriosScreen'
import RelatorioShowScreen from '../screens/RelatorioShowScreen'
import PacientesScreen from '../screens/PacientesScreen'
import PacienteShowScreen from '../screens/PacienteShowScreen'
import SmsScreen from '../screens/SmsScreen'
import PerfilScreen from '../screens/PerfilScreen'
import ValidarAssinaturaScreen from '../screens/ValidarAssinaturaScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

const screenHeaderOptions = {
  headerStyle: { backgroundColor: colors.hgb[600] },
  headerTintColor: 'white',
  headerTitleStyle: { fontWeight: '700' },
}

function AtestadosStack() {
  return (
    <Stack.Navigator screenOptions={screenHeaderOptions}>
      <Stack.Screen name="AtestadosList" component={AtestadosScreen} options={{ title: 'Atestados' }} />
      <Stack.Screen name="AtestadoShow" component={AtestadoShowScreen} options={{ title: 'Detalhe' }} />
      <Stack.Screen name="ValidarAssinatura" component={ValidarAssinaturaScreen} options={{ title: 'Validar Assinatura' }} />
    </Stack.Navigator>
  )
}
function RelatoriosStack() {
  return (
    <Stack.Navigator screenOptions={screenHeaderOptions}>
      <Stack.Screen name="RelatoriosList" component={RelatoriosScreen} options={{ title: 'Relatórios' }} />
      <Stack.Screen name="RelatorioShow" component={RelatorioShowScreen} options={{ title: 'Detalhe' }} />
      <Stack.Screen name="ValidarAssinatura" component={ValidarAssinaturaScreen} options={{ title: 'Validar Assinatura' }} />
    </Stack.Navigator>
  )
}
function PacientesStack() {
  return (
    <Stack.Navigator screenOptions={screenHeaderOptions}>
      <Stack.Screen name="PacientesList" component={PacientesScreen} options={{ title: 'Pacientes' }} />
      <Stack.Screen name="PacienteShow" component={PacienteShowScreen} options={{ title: 'Paciente' }} />
    </Stack.Navigator>
  )
}
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={screenHeaderOptions}>
      <Stack.Screen name="HomeScreen" component={HomeScreen} options={{ title: 'HGB · Início' }} />
    </Stack.Navigator>
  )
}
function SmsStack() {
  return (
    <Stack.Navigator screenOptions={screenHeaderOptions}>
      <Stack.Screen name="SmsList" component={SmsScreen} options={{ title: 'SMS' }} />
    </Stack.Navigator>
  )
}
function PerfilStack() {
  return (
    <Stack.Navigator screenOptions={screenHeaderOptions}>
      <Stack.Screen name="PerfilScreen" component={PerfilScreen} options={{ title: 'Perfil' }} />
    </Stack.Navigator>
  )
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.hgb[600],
        tabBarInactiveTintColor: colors.slate[400],
        tabBarStyle: { paddingTop: 4, paddingBottom: 4, height: 60 },
        tabBarLabelStyle: { fontSize: 11 },
        tabBarIcon: ({ color, size }) => {
          const map = {
            Inicio: 'home',
            Atestados: 'document-text',
            Relatorios: 'reader',
            Pacientes: 'people',
            SMS: 'chatbubble-ellipses',
            Perfil: 'person-circle',
          }
          return <Ionicons name={map[route.name] || 'ellipse'} size={size} color={color} />
        },
      })}
    >
      <Tab.Screen name="Inicio" component={HomeStack} />
      <Tab.Screen name="Atestados" component={AtestadosStack} />
      <Tab.Screen name="Relatorios" component={RelatoriosStack} options={{ tabBarLabel: 'Relatórios' }} />
      <Tab.Screen name="Pacientes" component={PacientesStack} />
      <Tab.Screen name="SMS" component={SmsStack} />
      <Tab.Screen name="Perfil" component={PerfilStack} />
    </Tab.Navigator>
  )
}

export default function Root() {
  const { user } = useAuth()
  return (
    <NavigationContainer>
      {user ? <MainTabs /> : <LoginScreen />}
    </NavigationContainer>
  )
}
