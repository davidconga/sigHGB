import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import api from '../api/client'
import { useLookups } from '../api/lookups'

const STATUS_COLOR = {
  pendente: 'border-amber-400 bg-amber-50',
  confirmada: 'border-sky-400 bg-sky-50',
  presente: 'border-violet-400 bg-violet-50',
  em_atendimento: 'border-blue-400 bg-blue-50',
  realizada: 'border-emerald-400 bg-emerald-50',
}

function startOfWeek(d) {
  const x = new Date(d)
  const wd = (x.getDay() + 6) % 7
  x.setDate(x.getDate() - wd)
  x.setHours(0, 0, 0, 0)
  return x
}

function fmtDate(d) {
  return d.toISOString().slice(0, 10)
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export default function Agenda() {
  const { medicos } = useLookups()
  const [medicoId, setMedicoId] = useState('')
  const [view, setView] = useState('week')
  const [anchor, setAnchor] = useState(() => new Date())
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  const range = useMemo(() => {
    if (view === 'day') {
      const d = new Date(anchor); d.setHours(0, 0, 0, 0)
      return { de: d, ate: d, days: [d] }
    }
    const start = startOfWeek(anchor)
    const days = Array.from({ length: 7 }, (_, i) => {
      const x = new Date(start); x.setDate(start.getDate() + i); return x
    })
    return { de: days[0], ate: days[6], days }
  }, [anchor, view])

  async function load() {
    setLoading(true)
    try {
      const params = { data_de: fmtDate(range.de), data_ate: fmtDate(range.ate) }
      if (medicoId) params.medico_id = medicoId
      const { data } = await api.get('/agendamentos/agenda', { params })
      setItems(data.data || [])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [range.de.getTime(), range.ate.getTime(), medicoId])

  function shift(direction) {
    const d = new Date(anchor)
    d.setDate(d.getDate() + (view === 'day' ? direction : direction * 7))
    setAnchor(d)
  }

  const hours = Array.from({ length: 13 }, (_, i) => i + 7) // 07h–19h

  function itemsAt(day, hour) {
    return items.filter((it) => {
      const d = new Date(it.data_agendamento)
      return sameDay(d, day) && d.getHours() === hour
    })
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold">Agenda</h1>
        <div className="flex gap-2">
          <button className={`btn-outline ${view === 'day' ? 'bg-slate-100' : ''}`} onClick={() => setView('day')}>Dia</button>
          <button className={`btn-outline ${view === 'week' ? 'bg-slate-100' : ''}`} onClick={() => setView('week')}>Semana</button>
        </div>
      </div>

      <div className="card p-3 mb-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Médico</label>
          <select className="input" value={medicoId} onChange={(e) => setMedicoId(e.target.value)}>
            <option value="">Todos os médicos</option>
            {medicos.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <button className="btn-outline" onClick={() => shift(-1)}><ChevronLeft size={16} /></button>
          <button className="btn-outline inline-flex items-center gap-2" onClick={() => setAnchor(new Date())}>
            <CalendarIcon size={14} /> Hoje
          </button>
          <button className="btn-outline" onClick={() => shift(1)}><ChevronRight size={16} /></button>
        </div>
        <div className="text-sm text-slate-600 font-medium ml-2">
          {view === 'day'
            ? range.de.toLocaleDateString('pt-PT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
            : `${range.de.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })} – ${range.ate.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}`}
        </div>
      </div>

      <div className="card overflow-x-auto">
        {loading && <div className="p-4 text-slate-500 text-sm">A carregar…</div>}
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600">
              <th className="px-2 py-2 w-16 text-left">Hora</th>
              {range.days.map((d) => (
                <th key={d.toISOString()} className="px-2 py-2 text-left border-l border-slate-100">
                  <div className="font-semibold capitalize">{d.toLocaleDateString('pt-PT', { weekday: 'short' })}</div>
                  <div className="text-slate-500">{d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hours.map((h) => (
              <tr key={h} className="border-t border-slate-100 align-top">
                <td className="px-2 py-2 text-slate-500 font-mono">{String(h).padStart(2, '0')}:00</td>
                {range.days.map((d) => {
                  const cell = itemsAt(d, h)
                  return (
                    <td key={d.toISOString() + h} className="border-l border-slate-100 p-1 min-w-[140px]">
                      <div className="space-y-1">
                        {cell.map((it) => (
                          <div key={it.id}
                            className={`border-l-4 rounded px-2 py-1 text-xs ${STATUS_COLOR[it.status] || 'border-slate-300 bg-slate-50'}`}
                            title={`${it.numero} · ${it.motivo || ''}`}>
                            <div className="font-mono text-[10px] text-slate-500">
                              {new Date(it.data_agendamento).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className="font-semibold truncate">{it.paciente?.nome}</div>
                            {it.medico && <div className="text-slate-600 truncate">{it.medico.nome}</div>}
                          </div>
                        ))}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600">
        {Object.entries(STATUS_COLOR).map(([k, cls]) => (
          <span key={k} className={`inline-flex items-center gap-1 border-l-4 pl-2 ${cls}`}>{k}</span>
        ))}
      </div>
    </div>
  )
}
