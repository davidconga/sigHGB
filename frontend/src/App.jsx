import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { ConfirmProvider } from './components/ConfirmDialog'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Verificar from './pages/Verificar'
import Registo from './pages/Registo'
import Dashboard from './pages/Dashboard'
import Pacientes from './pages/Pacientes'
import Medicos from './pages/Medicos'
import Cids from './pages/Cids'
import Relatorios from './pages/relatorios/Relatorios'
import Configuracoes from './pages/Configuracoes'
import Utilizadores from './pages/Utilizadores'
import PerfisPermissoes from './pages/PerfisPermissoes'
import Sms from './pages/Sms'
import SmsShow from './pages/SmsShow'
import Funcionarios from './pages/Funcionarios'
import FuncionarioShow from './pages/FuncionarioShow'
import PacienteShow from './pages/PacienteShow'
import MedicoShow from './pages/MedicoShow'
import AtestadoShow from './pages/AtestadoShow'
import RelatorioShow from './pages/RelatorioShow'
import Consultas from './pages/relatorios/Consultas'
import Exames from './pages/relatorios/Exames'
import Atestados from './pages/relatorios/Atestados'
import Altas from './pages/relatorios/Altas'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ConfirmProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registo" element={<Registo />} />
          <Route path="/verificar" element={<Verificar />} />
          <Route path="/verificar/:codigo" element={<Verificar />} />
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="pacientes" element={<Pacientes />} />
            <Route path="pacientes/:id" element={<PacienteShow />} />
            <Route path="medicos" element={<Medicos />} />
            <Route path="medicos/:id" element={<MedicoShow />} />
            <Route path="consultas" element={<Consultas />} />
            <Route path="exames" element={<Exames />} />
            <Route path="atestados" element={<Atestados />} />
            <Route path="atestados/:id" element={<AtestadoShow />} />
            <Route path="altas" element={<Altas />} />
            <Route path="relatorios" element={<Relatorios />} />
            <Route path="relatorios/:id" element={<RelatorioShow />} />
            <Route path="cids" element={<Cids />} />
            <Route path="sms" element={<Sms />} />
            <Route path="sms/:id" element={<SmsShow />} />
            <Route path="funcionarios" element={<Funcionarios />} />
            <Route path="funcionarios/:id" element={<FuncionarioShow />} />
            <Route path="configuracoes" element={<Configuracoes />} />
            <Route path="utilizadores" element={<Utilizadores />} />
            <Route path="perfis" element={<PerfisPermissoes />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </ConfirmProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
