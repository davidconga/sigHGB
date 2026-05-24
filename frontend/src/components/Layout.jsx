import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard, Users, Stethoscope, ClipboardList,
  FlaskConical, FileCheck2, BedDouble, LogOut, BookMarked,
  FileSpreadsheet, Settings, UserCog, ShieldCheck, MessageSquare, Briefcase,
} from 'lucide-react'
import { useAuth } from '../auth/AuthContext'

const links = [
  { to: '/', label: 'Dashboard', end: true, Icon: LayoutDashboard },
  { to: '/pacientes', label: 'Pacientes', Icon: Users },
  { to: '/medicos', label: 'Médicos', Icon: Stethoscope },
  { to: '/relatorios', label: 'Relatórios clínicos', Icon: FileSpreadsheet },
  { to: '/atestados', label: 'Atestados', Icon: FileCheck2 },
  { to: '/consultas', label: 'Consultas', Icon: ClipboardList },
  { to: '/exames', label: 'Exames', Icon: FlaskConical },
  { to: '/altas', label: 'Altas hospitalares', Icon: BedDouble },
  { to: '/cids', label: 'Tabela CID', Icon: BookMarked },
  { to: '/funcionarios', label: 'Funcionários', Icon: Briefcase },
  { to: '/sms', label: 'SMS', Icon: MessageSquare },
  { to: '/utilizadores', label: 'Utilizadores', Icon: UserCog, adminOnly: true },
  { to: '/perfis', label: 'Perfis & Permissões', Icon: ShieldCheck, adminOnly: true },
  { to: '/configuracoes', label: 'Configurações', Icon: Settings, adminOnly: true },
]

export default function Layout() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-hgb-900 text-slate-100 flex flex-col">
        <div className="px-5 py-5 border-b border-hgb-700 flex items-center gap-3">
          <img src="/logo.png" alt="HGB" className="w-12 h-12 bg-white rounded-full p-0.5" />
          <div>
            <div className="text-lg font-bold leading-tight">HGB</div>
            <div className="text-xs text-slate-300 leading-tight">Hospital Geral de Benguela</div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {links.filter((l) => !l.adminOnly || user?.roles?.includes('admin')).map(({ to, label, end, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition ${
                  isActive ? 'bg-hgb-600 text-white font-medium' : 'text-slate-300 hover:bg-hgb-700 hover:text-white'
                }`
              }
            >
              <Icon size={18} strokeWidth={2} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-hgb-700 text-xs">
          <div className="font-semibold text-white">{user?.name}</div>
          <div className="text-slate-300 mb-2 capitalize">{user?.roles?.join(', ')}</div>
          <button onClick={logout} className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white">
            <LogOut size={14} />
            Terminar sessão
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="max-w-screen-2xl mx-auto px-8 py-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
