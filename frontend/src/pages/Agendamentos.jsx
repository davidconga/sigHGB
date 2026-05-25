import { useEffect, useState } from 'react'
import { Pencil, Trash2, CheckCircle2, XCircle, LogIn, Filter, Printer, BarChart3 } from 'lucide-react'
import { Link } from 'react-router-dom'
import api, { downloadPdf } from '../api/client'
import { useLookups } from '../api/lookups'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import PacientePicker from '../components/PacientePicker'
import { useConfirm } from '../components/ConfirmDialog'

const STATUS_LABELS = {
  pendente: 'Pendente',
  confirmada: 'Confirmada',
  presente: 'Presente',
  em_atendimento: 'Em atendimento',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
  faltou: 'Faltou',
}

const STATUS_CLASSES = {
  pendente: 'bg-amber-100 text-amber-700',
  confirmada: 'bg-sky-100 text-sky-700',
  presente: 'bg-violet-100 text-violet-700',
  em_atendimento: 'bg-blue-100 text-blue-700',
  realizada: 'bg-emerald-100 text-emerald-700',
  cancelada: 'bg-red-100 text-red-700',
  faltou: 'bg-slate-200 text-slate-600',
}

const empty = {
  paciente_id: '',
  medico_id: '',
  servico_id: '',
  data_agendamento: '',
  duracao_minutos: 30,
  motivo: '',
  observacoes: '',
  status: 'confirmada',
  notificar_sms: true,
}

export default function Agendamentos() {
  const confirm = useConfirm()
  const { medicos } = useLookups()
  const [servicos, setServicos] = useState([])
  const [list, setList] = useState({ data: [], current_page: 1, last_page: 1, total: 0 })
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ status: '', medico_id: '', data_de: '', data_ate: '' })
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(null)
  const [cancelMotivo, setCancelMotivo] = useState('')
  const [slots, setSlots] = useState([])
  const [slotsLoading, setSlotsLoading] = useState(false)

  async function load() {
    const params = { page }
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v })
    const { data } = await api.get('/agendamentos', { params })
    setList(data)
  }

  useEffect(() => { load() }, [page, filters])

  useEffect(() => {
    api.get('/servicos').then((r) => setServicos(r.data.data || r.data || [])).catch(() => {})
  }, [])

  // Carregar slots disponíveis quando médico + data mudam (apenas em criação)
  useEffect(() => {
    if (!open || form.id || !form.medico_id || !form.data_agendamento) {
      setSlots([]); return
    }
    const data = form.data_agendamento.slice(0, 10)
    setSlotsLoading(true)
    api.get(`/medicos/${form.medico_id}/slots`, { params: { data } })
      .then((r) => setSlots(r.data.slots || []))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false))
  }, [open, form.id, form.medico_id, form.data_agendamento?.slice(0, 10)])

  function openNew() {
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getMinutes() % 15)
    now.setSeconds(0)
    setForm({ ...empty, data_agendamento: now.toISOString().slice(0, 16) })
    setErrors({}); setOpen(true)
  }

  function openEdit(a) {
    setForm({
      id: a.id,
      paciente_id: a.paciente_id,
      medico_id: a.medico_id || '',
      servico_id: a.servico_id || '',
      data_agendamento: a.data_agendamento ? new Date(a.data_agendamento).toISOString().slice(0, 16) : '',
      duracao_minutos: a.duracao_minutos ?? 30,
      motivo: a.motivo || '',
      observacoes: a.observacoes || '',
      status: a.status,
      notificar_sms: false,
    })
    setErrors({}); setOpen(true)
  }

  async function save(e) {
    e.preventDefault(); setErrors({}); setSaving(true)
    try {
      const payload = { ...form }
      Object.keys(payload).forEach((k) => { if (payload[k] === '') payload[k] = null })
      if (form.id) await api.put(`/agendamentos/${form.id}`, payload)
      else await api.post('/agendamentos', payload)
      setOpen(false); load()
    } catch (e) {
      setErrors(e.response?.data?.errors || { _: [e.response?.data?.message || 'Erro'] })
    } finally { setSaving(false) }
  }

  async function destroy(id) {
    if (!await confirm('Remover este agendamento?')) return
    await api.delete(`/agendamentos/${id}`); load()
  }

  async function checkIn(id) {
    if (!await confirm('Confirmar check-in deste paciente?')) return
    await api.post(`/agendamentos/${id}/check-in`); load()
  }

  async function cancelar() {
    if (!cancelOpen) return
    await api.post(`/agendamentos/${cancelOpen.id}/cancelar`, { motivo_cancelamento: cancelMotivo || null })
    setCancelOpen(null); setCancelMotivo(''); load()
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold">Marcação de consultas externas</h1>
        <div className="flex gap-2">
          <Link to="/agendamentos/estatisticas" className="btn-outline inline-flex items-center gap-2">
            <BarChart3 size={16} /> Estatísticas
          </Link>
          <button className="btn-primary" onClick={openNew}>+ Nova marcação</button>
        </div>
      </div>

      <div className="card p-3 mb-4 flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-2 text-slate-600 text-sm">
          <Filter size={16} /> Filtros:
        </div>
        <div>
          <label className="label">Estado</label>
          <select className="input" value={filters.status} onChange={(e) => { setPage(1); setFilters({ ...filters, status: e.target.value }) }}>
            <option value="">Todos</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Médico</label>
          <select className="input" value={filters.medico_id} onChange={(e) => { setPage(1); setFilters({ ...filters, medico_id: e.target.value }) }}>
            <option value="">Todos</option>
            {medicos.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="label">De</label>
          <input type="date" className="input" value={filters.data_de} onChange={(e) => { setPage(1); setFilters({ ...filters, data_de: e.target.value }) }} />
        </div>
        <div>
          <label className="label">Até</label>
          <input type="date" className="input" value={filters.data_ate} onChange={(e) => { setPage(1); setFilters({ ...filters, data_ate: e.target.value }) }} />
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Nº</th>
              <th className="text-left px-4 py-2">Data/Hora</th>
              <th className="text-left px-4 py-2">Paciente</th>
              <th className="text-left px-4 py-2">Médico</th>
              <th className="text-left px-4 py-2">Serviço</th>
              <th className="text-left px-4 py-2">Estado</th>
              <th className="text-right px-4 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {list.data.map((a) => (
              <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2 font-mono text-xs">{a.numero}</td>
                <td className="px-4 py-2 whitespace-nowrap">{new Date(a.data_agendamento).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' })}</td>
                <td className="px-4 py-2">{a.paciente?.nome}</td>
                <td className="px-4 py-2">{a.medico?.nome || '—'}</td>
                <td className="px-4 py-2">{a.servico?.nome || '—'}</td>
                <td className="px-4 py-2">
                  <span className={`badge ${STATUS_CLASSES[a.status] || 'bg-slate-100'}`}>
                    {STATUS_LABELS[a.status] || a.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <div className="inline-flex gap-1">
                    {['pendente', 'confirmada'].includes(a.status) && (
                      <button onClick={() => checkIn(a.id)} title="Check-in" className="p-1.5 rounded hover:bg-violet-50 text-violet-600">
                        <LogIn size={16} />
                      </button>
                    )}
                    <button onClick={() => downloadPdf(`/agendamentos/${a.id}/pdf`)} title="Comprovativo PDF" className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600">
                      <Printer size={16} />
                    </button>
                    <button onClick={() => openEdit(a)} title="Editar" className="p-1.5 rounded hover:bg-hgb-50 text-hgb-600">
                      <Pencil size={16} />
                    </button>
                    {!['cancelada', 'realizada'].includes(a.status) && (
                      <button onClick={() => { setCancelOpen(a); setCancelMotivo('') }} title="Cancelar" className="p-1.5 rounded hover:bg-amber-50 text-amber-600">
                        <XCircle size={16} />
                      </button>
                    )}
                    <button onClick={() => destroy(a.id)} title="Remover" className="p-1.5 rounded hover:bg-red-50 text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {list.data.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">Sem marcações.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination meta={list} onPage={setPage} />

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? 'Editar marcação' : 'Nova marcação'} size="lg">
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="label">Paciente *</label>
            <PacientePicker value={form.paciente_id} onPick={(p) => setForm({ ...form, paciente_id: p?.id || '' })} />
            {errors.paciente_id && <p className="text-xs text-red-600 mt-1">{errors.paciente_id[0]}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="label">Médico</label>
              <select className="input" value={form.medico_id} onChange={(e) => setForm({ ...form, medico_id: e.target.value })}>
                <option value="">— sem médico atribuído —</option>
                {medicos.map((m) => <option key={m.id} value={m.id}>{m.nome}{m.especialidade ? ` (${m.especialidade})` : ''}</option>)}
              </select>
              {errors.medico_id && <p className="text-xs text-red-600 mt-1">{errors.medico_id[0]}</p>}
            </div>
            <div>
              <label className="label">Serviço</label>
              <select className="input" value={form.servico_id} onChange={(e) => setForm({ ...form, servico_id: e.target.value })}>
                <option value="">— sem serviço —</option>
                {servicos.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="label">Data e hora *</label>
              <input type="datetime-local" className="input" value={form.data_agendamento}
                onChange={(e) => setForm({ ...form, data_agendamento: e.target.value })} required />
              {errors.data_agendamento && <p className="text-xs text-red-600 mt-1">{errors.data_agendamento[0]}</p>}
            </div>
            <div>
              <label className="label">Duração (min)</label>
              <input type="number" min={5} max={480} step={5} className="input" value={form.duracao_minutos}
                onChange={(e) => setForm({ ...form, duracao_minutos: e.target.value })} />
            </div>
          </div>

          {!form.id && form.medico_id && form.data_agendamento && (
            <div className="bg-slate-50 border border-slate-200 rounded p-3">
              <div className="text-xs font-semibold text-slate-600 mb-2">
                Slots disponíveis em {new Date(form.data_agendamento).toLocaleDateString('pt-PT', { weekday: 'long', day: '2-digit', month: 'short' })}
                {slotsLoading && ' · a carregar…'}
              </div>
              {!slotsLoading && slots.length === 0 && (
                <p className="text-xs text-amber-700">O médico não tem disponibilidade configurada para este dia.</p>
              )}
              {slots.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {slots.map((s) => (
                    <button type="button" key={s.inicio} disabled={s.ocupado}
                      onClick={() => {
                        const d = form.data_agendamento.slice(0, 10)
                        setForm({ ...form, data_agendamento: `${d}T${s.inicio}`, duracao_minutos: s.duracao_minutos })
                      }}
                      title={s.ocupado ? `Ocupado por ${s.agendamento_numero}` : 'Selecionar'}
                      className={`text-xs px-2 py-1 rounded font-mono ${
                        s.ocupado
                          ? 'bg-red-100 text-red-600 cursor-not-allowed line-through'
                          : form.data_agendamento.slice(11, 16) === s.inicio
                            ? 'bg-hgb-600 text-white'
                            : 'bg-white border border-slate-300 hover:border-hgb-500 hover:bg-hgb-50'
                      }`}>
                      {s.inicio}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <label className="label">Motivo da consulta</label>
            <input className="input" value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} maxLength={500} />
          </div>

          <div>
            <label className="label">Observações</label>
            <textarea className="input" rows={2} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
          </div>

          {form.id && (
            <div>
              <label className="label">Estado</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          )}

          {!form.id && (
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.notificar_sms}
                onChange={(e) => setForm({ ...form, notificar_sms: e.target.checked })} />
              Enviar SMS de confirmação ao paciente
            </label>
          )}

          {errors._ && <p className="text-sm text-red-600">{errors._[0]}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-outline" onClick={() => setOpen(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'A guardar…' : 'Guardar'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!cancelOpen} onClose={() => setCancelOpen(null)} title="Cancelar marcação">
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Cancelar marcação <span className="font-mono">{cancelOpen?.numero}</span> de <strong>{cancelOpen?.paciente?.nome}</strong>?
          </p>
          <div>
            <label className="label">Motivo (opcional)</label>
            <input className="input" value={cancelMotivo} onChange={(e) => setCancelMotivo(e.target.value)} maxLength={255} />
          </div>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <CheckCircle2 size={14} /> Um SMS de notificação será enviado ao paciente.
          </p>
          <div className="flex justify-end gap-2">
            <button className="btn-outline" onClick={() => setCancelOpen(null)}>Fechar</button>
            <button className="btn-danger" onClick={cancelar}>Confirmar cancelamento</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
