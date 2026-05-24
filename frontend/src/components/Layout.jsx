import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, Stethoscope, ClipboardList,
  FlaskConical, FileCheck2, BedDouble, LogOut, BookMarked,
  FileSpreadsheet, Settings, UserCog, ShieldCheck, MessageSquare, Briefcase,
  ChevronsLeft, ChevronsRight, Menu, X,
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
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('hgb_sidebar_collapsed') === '1'
  )
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  function toggleCollapsed() {
    setCollapsed((c) => {
      const next = !c
      localStorage.setItem('hgb_sidebar_collapsed', next ? '1' : '0')
      return next
    })
  }

  const visibleLinks = links.filter((l) => !l.adminOnly || user?.roles?.includes('admin'))

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          bg-hgb-900 text-slate-100 flex flex-col h-screen z-40
          fixed md:static top-0 left-0
          transition-[width,transform] duration-200
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          ${collapsed ? 'w-64 md:w-16' : 'w-64'}
        `}
      >
        <div className={`border-b border-hgb-700 flex items-center ${collapsed ? 'md:px-2 md:py-4 md:justify-center px-5 py-5 gap-3' : 'px-5 py-5 gap-3'}`}>
          <img src="/logo.png" alt="HGB" className={`bg-white rounded-full p-0.5 shrink-0 ${collapsed ? 'md:w-9 md:h-9 w-12 h-12' : 'w-12 h-12'}`} />
          {(!collapsed || mobileOpen) && (
            <div className={`min-w-0 ${collapsed ? 'md:hidden' : ''}`}>
              <div className="text-lg font-bold leading-tight">HGB</div>
              <div className="text-xs text-slate-300 leading-tight truncate">Hospital Geral de Benguela</div>
            </div>
          )}
        </div>

        <nav className={`flex-1 py-4 space-y-1 overflow-y-auto ${collapsed ? 'md:px-2 px-3' : 'px-3'}`}>
          {visibleLinks.map(({ to, label, end, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md text-sm transition px-3 py-2 ${
                  collapsed ? 'md:px-0 md:py-2 md:justify-center' : ''
                } ${
                  isActive ? 'bg-hgb-600 text-white font-medium' : 'text-slate-300 hover:bg-hgb-700 hover:text-white'
                }`
              }
            >
              <Icon size={18} strokeWidth={2} className="shrink-0" />
              <span className={`truncate ${collapsed ? 'md:hidden' : ''}`}>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className={`border-t border-hgb-700 p-4 ${collapsed ? 'md:px-2 md:py-3' : ''}`}>
          <div className={`text-xs mb-2 ${collapsed ? 'md:hidden' : ''}`}>
            <div className="font-semibold text-white truncate">{user?.name}</div>
            <div className="text-slate-300 capitalize truncate">{user?.roles?.join(', ')}</div>
          </div>
          <div className={`flex items-center justify-between gap-2 ${collapsed ? 'md:flex-col md:gap-2' : ''}`}>
            <button
              onClick={logout}
              title="Terminar sessão"
              className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white text-xs"
            >
              <LogOut size={14} />
              <span className={collapsed ? 'md:hidden' : ''}>Terminar sessão</span>
            </button>
            <button
              onClick={toggleCollapsed}
              title={collapsed ? 'Expandir menu' : 'Recolher menu'}
              className="hidden md:inline-flex items-center justify-center w-7 h-7 rounded-md text-slate-300 hover:bg-hgb-700 hover:text-white"
            >
              {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto flex flex-col min-w-0">
        {/* Top bar (mobile only) */}
        <header className="md:hidden bg-white border-b border-slate-200 flex items-center px-4 py-3 gap-3 sticky top-0 z-20">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1 text-slate-600 hover:text-hgb-700"
            aria-label="Abrir menu"
          >
            <Menu size={22} />
          </button>
          <img src="/logo.png" alt="HGB" className="w-8 h-8 bg-white rounded-full" />
          <span className="font-semibold text-hgb-900 text-sm">SIGHGB</span>
        </header>

        <div className="max-w-screen-2xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
