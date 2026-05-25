import { useEffect, useState } from 'react'
import { RefreshCw, PlayCircle, CheckCircle2, XCircle } from 'lucide-react'
import api from '../api/client'
import { useLookups } from '../api/lookups'
import { useConfirm } from '../components/ConfirmDialog'

const STATUS_LABEL = {
  presente: 'Aguarda',
  em_atendimento: 'Em atendimento',
}

export default function FilaEspera() {
  const confirm = useConfirm()
  const { medicos } = useLookups()
  const [filters, setFilters] = useState({ medico_id: '' })
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const params = {}
      if (filters.medico_id) params.medico_id = filters.medico_id
      const { data } = await api.get('/agendamentos/fila', { params })
      setItems(data.data || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [filters])
  useEffect(() => {
    const t = setInterval(load, 30000)
    return () => clearInterval(t)
  }, [])

  async function setStatus(id, status, msg) {
    if (msg && !await confirm(msg)) return
    await api.put(`/agendamentos/${id}`, { status })
    load()
  }

  function tempoEspera(checkIn) {
    if (!checkIn) return '—'
    const mins = Math.floor((Date.now() - new Date(checkIn).getTime()) / 60000)
    if (mins < 60) return `${mins} min`
    const h = Math.floor(mins / 60), m = mins % 60
    return `${h}h${m.toString().padStart(2, '0')}`
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold">Fila de espera</h1>
        <button className="btn-outline inline-flex items-center gap-2" onClick={load}>
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      <div className="card p-3 mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Médico</label>
          <select className="input" value={filters.medico_id} onChange={(e) => setFilters({ ...filters, medico_id: e.target.value })}>
            <option value="">Todos</option>
            {medicos.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
        </div>
        <div className="text-sm text-slate-500 ml-auto">
          {loading ? 'A carregar…' : `${items.length} na fila · atualiza a cada 30s`}
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Ordem</th>
              <th className="text-left px-4 py-2">Paciente</th>
              <th className="text-left px-4 py-2">Nº processo</th>
              <th className="text-left px-4 py-2">Marcação</th>
              <th className="text-left px-4 py-2">Médico</th>
              <th className="text-left px-4 py-2">Check-in</th>
              <th className="text-left px-4 py-2">Espera</th>
              <th className="text-left px-4 py-2">Estado</th>
              <th className="text-right px-4 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a, idx) => (
              <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2 font-mono text-slate-500">{idx + 1}</td>
                <td className="px-4 py-2 font-medium">{a.paciente?.nome}</td>
                <td className="px-4 py-2 font-mono text-xs">{a.paciente?.numero_processo}</td>
                <td className="px-4 py-2 whitespace-nowrap">
                  {new Date(a.data_agendamento).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td className="px-4 py-2">{a.medico?.nome || '—'}</td>
                <td className="px-4 py-2 whitespace-nowrap">
                  {a.check_in_em ? new Date(a.check_in_em).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : '—'}
                </td>
                <td className="px-4 py-2 font-mono">{tempoEspera(a.check_in_em)}</td>
                <td className="px-4 py-2">
                  <span className={`badge ${a.status === 'em_atendimento' ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'}`}>
                    {STATUS_LABEL[a.status]}
                  </span>
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <div className="inline-flex gap-1">
                    {a.status === 'presente' && (
                      <button onClick={() => setStatus(a.id, 'em_atendimento')} title="Iniciar atendimento" className="p-1.5 rounded hover:bg-blue-50 text-blue-600">
                        <PlayCircle size={18} />
                      </button>
                    )}
                    {a.status === 'em_atendimento' && (
                      <button onClick={() => setStatus(a.id, 'realizada', 'Concluir atendimento?')} title="Concluir" className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600">
                        <CheckCircle2 size={18} />
                      </button>
                    )}
                    <button onClick={() => setStatus(a.id, 'faltou', 'Marcar como faltou?')} title="Marcar falta" className="p-1.5 rounded hover:bg-amber-50 text-amber-600">
                      <XCircle size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-400">Fila vazia.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
