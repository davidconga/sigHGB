import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Stethoscope, ClipboardList, FlaskConical, FileCheck2, BedDouble,
  FileSpreadsheet, MessageSquare, Briefcase, AlertTriangle, Cake,
  CalendarDays, ListChecks, CheckCircle2, Clock,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts'
import api from '../api/client'

const COLORS = ['#1f5fa6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16']

const cards = [
  { key: 'pacientes', label: 'Pacientes', to: '/pacientes', color: 'bg-hgb-600', Icon: Users },
  { key: 'agendamentos', label: 'Marcações', to: '/agendamentos', color: 'bg-sky-600', Icon: CalendarDays },
  { key: 'medicos', label: 'Médicos ativos', to: '/medicos', color: 'bg-emerald-600', Icon: Stethoscope },
  { key: 'funcionarios', label: 'Funcionários', to: '/funcionarios', color: 'bg-purple-600', Icon: Briefcase },
  { key: 'atestados', label: 'Atestados', to: '/atestados', color: 'bg-rose-600', Icon: FileCheck2 },
  { key: 'relatorios', label: 'Relatórios', to: '/relatorios', color: 'bg-indigo-600', Icon: FileSpreadsheet },
  { key: 'consultas', label: 'Consultas', to: '/consultas', color: 'bg-amber-600', Icon: ClipboardList },
  { key: 'exames', label: 'Exames', to: '/exames', color: 'bg-cyan-700', Icon: FlaskConical },
  { key: 'altas', label: 'Altas', to: '/altas', color: 'bg-slate-600', Icon: BedDouble },
]

export default function Dashboard() {
  const [data, setData] = useState(null)

  useEffect(() => {
    api.get('/dashboard/stats').then((r) => setData(r.data))
  }, [])

  if (!data) return <div className="text-slate-500">A carregar dashboard…</div>

  const { counts, atestados_por_mes, relatorios_por_tipo, atestados_por_efeito,
    sms_por_dia, aniversariantes_proximos, rascunhos_pendentes, agendamentos,
    agendamentos_por_dia } = data

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
      <p className="text-sm text-slate-500 mb-6">Visão geral do Hospital Geral de Benguela</p>

      {/* ============ ALERTAS ============ */}
      {(rascunhos_pendentes.atestados > 0 || rascunhos_pendentes.relatorios > 0) && (
        <div className="card p-4 mb-4 bg-amber-50 border-amber-200 flex items-center gap-3">
          <AlertTriangle className="text-amber-600 flex-shrink-0" size={22} />
          <div className="flex-1 text-sm">
            <strong className="text-amber-900">Documentos por assinar:</strong>{' '}
            {rascunhos_pendentes.atestados > 0 && (
              <Link to="/atestados" className="text-amber-700 hover:underline mr-3">
                {rascunhos_pendentes.atestados} atestado(s) em rascunho
              </Link>
            )}
            {rascunhos_pendentes.relatorios > 0 && (
              <Link to="/relatorios" className="text-amber-700 hover:underline">
                {rascunhos_pendentes.relatorios} relatório(s) em rascunho
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ============ AGENDA DE HOJE ============ */}
      {agendamentos && (
        <div className="card p-4 mb-4 bg-gradient-to-r from-sky-50 to-white border-sky-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="text-sky-700" size={20} />
              <h2 className="text-sm font-bold text-sky-900 uppercase tracking-wide">Marcações de hoje</h2>
            </div>
            <Link to="/agenda" className="text-xs text-sky-700 hover:underline">Ver agenda →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Link to="/agendamentos" className="bg-white border border-sky-200 rounded p-3 hover:shadow transition">
              <div className="text-2xl font-bold text-sky-900">{agendamentos.hoje_total}</div>
              <div className="text-xs text-slate-500 flex items-center gap-1"><CalendarDays size={12} /> Total hoje</div>
            </Link>
            <Link to="/agendamentos" className="bg-white border border-amber-200 rounded p-3 hover:shadow transition">
              <div className="text-2xl font-bold text-amber-700">{agendamentos.hoje_pendentes}</div>
              <div className="text-xs text-slate-500 flex items-center gap-1"><Clock size={12} /> Por chegar</div>
            </Link>
            <Link to="/fila" className="bg-white border border-violet-200 rounded p-3 hover:shadow transition">
              <div className="text-2xl font-bold text-violet-700">{agendamentos.hoje_na_fila}</div>
              <div className="text-xs text-slate-500 flex items-center gap-1"><ListChecks size={12} /> Na fila</div>
            </Link>
            <Link to="/agendamentos" className="bg-white border border-emerald-200 rounded p-3 hover:shadow transition">
              <div className="text-2xl font-bold text-emerald-700">{agendamentos.hoje_realizadas}</div>
              <div className="text-xs text-slate-500 flex items-center gap-1"><CheckCircle2 size={12} /> Realizadas</div>
            </Link>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Próximos 7 dias: <strong className="text-slate-700">{agendamentos.proximos_7_dias}</strong> marcação(ões) por confirmar/realizar.
          </div>
        </div>
      )}

      {/* ============ COUNTERS ============ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {cards.map(({ key, label, to, color, Icon }) => (
          <Link key={key} to={to} className="card p-4 hover:shadow-md transition group">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded ${color} text-white flex items-center justify-center group-hover:scale-105 transition`}>
                <Icon size={20} />
              </div>
              <div>
                <div className="text-xs text-slate-500">{label}</div>
                <div className="text-2xl font-bold text-slate-900">{counts[key] ?? '—'}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ============ CHARTS GRID ============ */}
      <div className="grid grid-cols-12 gap-4 mb-4">

        {/* Atestados últimos 12 meses */}
        <ChartCard title="Atestados emitidos · últimos 12 meses" cols="col-span-12 lg:col-span-8">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={atestados_por_mes}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="mes" fontSize={11} stroke="#64748b" />
              <YAxis fontSize={11} stroke="#64748b" />
              <Tooltip cursor={{ fill: '#f1f5f9' }} />
              <Bar dataKey="total" fill="#1f5fa6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Relatórios por tipo */}
        <ChartCard title="Relatórios por tipo" cols="col-span-12 lg:col-span-4">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={relatorios_por_tipo} dataKey="total" nameKey="tipo"
                cx="50%" cy="50%" outerRadius={75} label={(e) => e.total}>
                {relatorios_por_tipo.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 10 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Atestados por efeito */}
        <ChartCard title="Atestados por efeito (Top 10)" cols="col-span-12 lg:col-span-6">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={atestados_por_efeito} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" fontSize={11} stroke="#64748b" />
              <YAxis type="category" dataKey="efeito" fontSize={11} stroke="#64748b" width={80} />
              <Tooltip cursor={{ fill: '#f1f5f9' }} />
              <Bar dataKey="total" fill="#10b981" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Marcações últimos 30 dias por estado */}
        {agendamentos_por_dia && (
          <ChartCard title="Marcações · últimos 30 dias" cols="col-span-12">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={agendamentos_por_dia}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="dia" fontSize={10} stroke="#64748b" interval={1} />
                <YAxis fontSize={11} stroke="#64748b" />
                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="agendadas"  stackId="a" fill="#0ea5e9" name="Agendadas" />
                <Bar dataKey="realizadas" stackId="a" fill="#10b981" name="Realizadas" />
                <Bar dataKey="faltou"     stackId="a" fill="#ef4444" name="Faltou" />
                <Bar dataKey="canceladas" stackId="a" fill="#f59e0b" name="Canceladas" />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {/* SMS últimos 7 dias */}
        <ChartCard title="SMS · últimos 7 dias" cols="col-span-12 lg:col-span-6">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={sms_por_dia}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="dia" fontSize={11} stroke="#64748b" />
              <YAxis fontSize={11} stroke="#64748b" />
              <Tooltip cursor={{ stroke: '#94a3b8' }} />
              <Line type="monotone" dataKey="total" stroke="#1f5fa6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Aniversariantes próximos 14 dias */}
        <ChartCard title="Próximos aniversários (14 dias)" cols="col-span-12" badge={aniversariantes_proximos.length}>
          {aniversariantes_proximos.length === 0 ? (
            <div className="text-center text-slate-400 py-8 text-sm">Nenhum aniversário nos próximos 14 dias.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {aniversariantes_proximos.map((f) => (
                <Link key={f.id} to={`/funcionarios/${f.id}`}
                  className={`p-3 rounded border flex items-center gap-3 transition ${
                    f.dias === 0
                      ? 'border-pink-400 bg-pink-50 hover:bg-pink-100'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white flex-shrink-0 ${
                    f.dias === 0 ? 'bg-pink-500' : f.dias <= 3 ? 'bg-amber-500' : 'bg-slate-400'
                  }`}>
                    <Cake size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{f.nome}</div>
                    <div className="text-xs text-slate-500">
                      {f.data_nascimento} · {f.dias === 0 ? <strong className="text-pink-700">HOJE 🎉</strong>
                        : f.dias === 1 ? 'amanhã'
                        : `em ${f.dias} dias`}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </ChartCard>

      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <MiniCard label="Atestados emitidos" value={counts.atestados_emitidos} total={counts.atestados} color="bg-rose-100 text-rose-700" />
        <MiniCard label="Relatórios emitidos" value={counts.relatorios_emitidos} total={counts.relatorios} color="bg-indigo-100 text-indigo-700" />
        <MiniCard label="SMS enviados" value={counts.sms_enviados} color="bg-emerald-100 text-emerald-700" Icon={MessageSquare} />
        <MiniCard label="SMS pendentes" value={counts.sms_pendentes} color="bg-amber-100 text-amber-700" Icon={MessageSquare} />
      </div>
    </div>
  )
}

function ChartCard({ title, cols, children, badge }) {
  return (
    <div className={`card p-4 ${cols}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-slate-700">{title}</div>
        {badge != null && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-hgb-100 text-hgb-700 font-semibold">{badge}</span>
        )}
      </div>
      {children}
    </div>
  )
}

function MiniCard({ label, value, total, color, Icon }) {
  const pct = total ? Math.round((value / total) * 100) : null
  return (
    <div className="card p-4 flex items-center justify-between">
      <div>
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-2xl font-bold">
          {value?.toLocaleString('pt-PT')}
          {total != null && <span className="text-sm text-slate-400 font-normal"> / {total.toLocaleString('pt-PT')}</span>}
        </div>
        {pct != null && <div className="text-xs text-slate-500 mt-0.5">{pct}% do total</div>}
      </div>
      {Icon && (
        <div className={`w-10 h-10 rounded ${color} flex items-center justify-center`}>
          <Icon size={18} />
        </div>
      )}
    </div>
  )
}
