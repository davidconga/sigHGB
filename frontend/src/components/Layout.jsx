import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard, Users, Stethoscope, ClipboardList,
  FlaskConical, FileCheck2, BedDouble, LogOut, BookMarked,
  FileSpreadsheet, Settings, UserCog, ShieldCheck, MessageSquare, Briefcase,
  ChevronsLeft, ChevronsRight,
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
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('hgb_sidebar_collapsed') === '1'
  )

  function toggle() {
    setCollapsed((c) => {
      const next = !c
      localStorage.setItem('hgb_sidebar_collapsed', next ? '1' : '0')
      return next
    })
  }

  return (
    <div className="min-h-screen flex">
      <aside
        className={`bg-hgb-900 text-slate-100 flex flex-col transition-[width] duration-200 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className={`border-b border-hgb-700 flex items-center ${collapsed ? 'px-2 py-4 justify-center' : 'px-5 py-5 gap-3'}`}>
          <img src="/logo.png" alt="HGB" className={`bg-white rounded-full p-0.5 shrink-0 ${collapsed ? 'w-9 h-9' : 'w-12 h-12'}`} />
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-lg font-bold leading-tight">HGB</div>
              <div className="text-xs text-slate-300 leading-tight truncate">Hospital Geral de Benguela</div>
            </div>
          )}
        </div>

        <nav className={`flex-1 py-4 space-y-1 ${collapsed ? 'px-2' : 'px-3'}`}>
          {links.filter((l) => !l.adminOnly || user?.roles?.includes('admin')).map(({ to, label, end, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md text-sm transition ${
                  collapsed ? 'px-0 py-2 justify-center' : 'px-3 py-2'
                } ${
                  isActive ? 'bg-hgb-600 text-white font-medium' : 'text-slate-300 hover:bg-hgb-700 hover:text-white'
                }`
              }
            >
              <Icon size={18} strokeWidth={2} className="shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className={`border-t border-hgb-700 ${collapsed ? 'px-2 py-3' : 'p-4'}`}>
          {!collapsed && (
            <div className="text-xs mb-2">
              <div className="font-semibold text-white truncate">{user?.name}</div>
              <div className="text-slate-300 capitalize truncate">{user?.roles?.join(', ')}</div>
            </div>
          )}
          <div className={`flex items-center ${collapsed ? 'flex-col gap-2' : 'justify-between gap-2'}`}>
            <button
              onClick={logout}
              title="Terminar sessão"
              className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white text-xs"
            >
              <LogOut size={14} />
              {!collapsed && <span>Terminar sessão</span>}
            </button>
            <button
              onClick={toggle}
              title={collapsed ? 'Expandir menu' : 'Recolher menu'}
              className="inline-flex items-center justify-center w-7 h-7 rounded-md text-slate-300 hover:bg-hgb-700 hover:text-white"
            >
              {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
            </button>
          </div>
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
