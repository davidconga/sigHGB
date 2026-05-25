import { useEffect, useMemo, useState } from 'react'
import { Printer, TrendingUp, TrendingDown, Calendar } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend,
} from 'recharts'
import api, { downloadPdf } from '../api/client'

const ESTADOS = [
  { key: 'pendente',       label: 'Pendente',       color: '#f59e0b' },
  { key: 'confirmada',     label: 'Confirmada',     color: '#0ea5e9' },
  { key: 'presente',       label: 'Presente',       color: '#8b5cf6' },
  { key: 'em_atendimento', label: 'Em atendimento', color: '#3b82f6' },
  { key: 'realizada',      label: 'Realizada',      color: '#10b981' },
  { key: 'cancelada',      label: 'Cancelada',      color: '#ef4444' },
  { key: 'faltou',         label: 'Faltou',         color: '#64748b' },
]

const meses = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

export default function AgendamentosEstatisticas() {
  const hoje = new Date()
  const [ano, setAno] = useState(hoje.getFullYear())
  const [mes, setMes] = useState(hoje.getMonth() + 1)
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const { data } = await api.get('/agendamentos/estatisticas', { params: { ano, mes } })
      setStats(data)
    } catch {} finally { setLoading(false) }
  }
  useEffect(() => { load() }, [ano, mes])

  const dataChart = useMemo(() => {
    if (!stats?.por_dia) return []
    return stats.por_dia.map((d) => ({
      dia: d.dia.slice(8),
      total: d.total,
    }))
  }, [stats])

  const anosDisponiveis = Array.from({ length: 5 }, (_, i) => hoje.getFullYear() - i)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold">Estatísticas de marcações</h1>
        <button
          className="btn-primary inline-flex items-center gap-2"
          onClick={() => downloadPdf(`/agendamentos/mapa-mensal/pdf?ano=${ano}&mes=${mes}`)}
        >
          <Printer size={16} /> Imprimir mapa mensal
        </button>
      </div>

      <div className="card p-3 mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Ano</label>
          <select className="input" value={ano} onChange={(e) => setAno(Number(e.target.value))}>
            {anosDisponiveis.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Mês</label>
          <select className="input" value={mes} onChange={(e) => setMes(Number(e.target.value))}>
            {meses.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </div>
        {loading && <div className="text-sm text-slate-500">A carregar…</div>}
      </div>

      {!stats ? null : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
            <Kpi label="Total" value={stats.totais.total} color="bg-hgb-600" Icon={Calendar} />
            <Kpi label="Realizadas" value={stats.totais.realizadas} color="bg-emerald-600" />
            <Kpi label="Faltou" value={stats.totais.faltou} color="bg-red-600" />
            <Kpi label="Canceladas" value={stats.totais.canceladas} color="bg-amber-600" />
            <Kpi label="Taxa de conclusão" value={`${stats.totais.taxa_conclusao}%`} color="bg-emerald-700" Icon={TrendingUp} />
            <Kpi label="Absenteísmo" value={`${stats.totais.taxa_absenteismo}%`} color="bg-rose-700" Icon={TrendingDown} />
          </div>

          {/* Gráfico diário */}
          <div className="card p-4 mb-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600 mb-3">Marcações por dia</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={dataChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="dia" fontSize={11} stroke="#64748b" />
                <YAxis fontSize={11} stroke="#64748b" />
                <Tooltip cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="total" fill="#1f5fa6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Por médico */}
          <div className="card mb-4 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">Por médico</h2>
              <span className="text-xs text-slate-500">{stats.por_medico.length} médico(s)</span>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-2">Médico</th>
                  <th className="text-left px-4 py-2">Especialidade</th>
                  {ESTADOS.map((e) => (
                    <th key={e.key} className="text-right px-2 py-2" title={e.label}>
                      <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: e.color }}></span>
                      {e.label.slice(0, 4)}.
                    </th>
                  ))}
                  <th className="text-right px-4 py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {stats.por_medico.map((m) => (
                  <tr key={m.medico_id || 'sem'} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2 font-medium">{m.medico}</td>
                    <td className="px-4 py-2 text-slate-600">{m.especialidade || '—'}</td>
                    {ESTADOS.map((e) => (
                      <td key={e.key} className="text-right px-2 py-2 font-mono">
                        {m.por_estado[e.key] || 0}
                      </td>
                    ))}
                    <td className="text-right px-4 py-2 font-bold">{m.total}</td>
                  </tr>
                ))}
                {stats.por_medico.length === 0 && (
                  <tr><td colSpan={ESTADOS.length + 3} className="px-4 py-6 text-center text-slate-400">Sem dados no período.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Por serviço */}
          <div className="card mb-4 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600">Por serviço</h2>
              <span className="text-xs text-slate-500">{stats.por_servico.length} serviço(s)</span>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
                <tr>
                  <th className="text-left px-4 py-2">Serviço</th>
                  {ESTADOS.map((e) => (
                    <th key={e.key} className="text-right px-2 py-2" title={e.label}>
                      <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: e.color }}></span>
                      {e.label.slice(0, 4)}.
                    </th>
                  ))}
                  <th className="text-right px-4 py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {stats.por_servico.map((s) => (
                  <tr key={s.servico_id || 'sem'} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2 font-medium">{s.servico}</td>
                    {ESTADOS.map((e) => (
                      <td key={e.key} className="text-right px-2 py-2 font-mono">
                        {s.por_estado[e.key] || 0}
                      </td>
                    ))}
                    <td className="text-right px-4 py-2 font-bold">{s.total}</td>
                  </tr>
                ))}
                {stats.por_servico.length === 0 && (
                  <tr><td colSpan={ESTADOS.length + 2} className="px-4 py-6 text-center text-slate-400">Sem dados no período.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

function Kpi({ label, value, color, Icon }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded ${color} text-white flex items-center justify-center`}>
          {Icon ? <Icon size={18} /> : <Calendar size={18} />}
        </div>
        <div className="min-w-0">
          <div className="text-xs text-slate-500 truncate">{label}</div>
          <div className="text-xl font-bold text-slate-900">{value}</div>
        </div>
      </div>
    </div>
  )
}
