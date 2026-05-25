import { useEffect, useState } from 'react'
import { Printer, Pencil, Trash2 } from 'lucide-react'
import api, { downloadPdf } from '../../api/client'
import { useLookups } from '../../api/lookups'
import Modal from '../../components/Modal'
import Pagination from '../../components/Pagination'
import StatusBadge from '../../components/StatusBadge'
import CidAutocomplete from '../../components/CidAutocomplete'
import { useConfirm } from '../../components/ConfirmDialog'

const empty = {
  paciente_id: '', medico_id: '', data_consulta: '',
  queixa_principal: '', historia_doenca: '', exame_fisico: '',
  diagnostico: '', cid: '', prescricao: '', observacoes: '', status: 'rascunho',
  agendamento_id: '',
}

export default function Consultas() {
  const confirm = useConfirm()
  const { pacientes, medicos } = useLookups()
  const [list, setList] = useState({ data: [], current_page: 1, last_page: 1, total: 0 })
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})
  const [pendentes, setPendentes] = useState([])

  async function load() {
    const { data } = await api.get('/consultas', { params: { page } })
    setList(data)
  }
  useEffect(() => { load() }, [page])

  function openNew() {
    setForm({ ...empty, data_consulta: new Date().toISOString().slice(0, 16) })
    setErrors({}); setPendentes([]); setOpen(true)
  }

  async function carregarPendentes(pacienteId) {
    if (!pacienteId) { setPendentes([]); return }
    try {
      const { data } = await api.get(`/agendamentos/paciente/${pacienteId}`)
      setPendentes(data.data || [])
    } catch { setPendentes([]) }
  }

  function selecionarPaciente(id) {
    setForm((f) => ({ ...f, paciente_id: id, agendamento_id: '' }))
    carregarPendentes(id)
  }

  function vincularAgendamento(a) {
    setForm((f) => ({
      ...f,
      agendamento_id: a.id,
      medico_id: a.medico_id || f.medico_id,
      data_consulta: a.data_agendamento
        ? new Date(a.data_agendamento).toISOString().slice(0, 16)
        : f.data_consulta,
      queixa_principal: f.queixa_principal || a.motivo || '',
    }))
  }
  function openEdit(c) {
    setForm({
      ...empty, ...c,
      data_consulta: c.data_consulta ? new Date(c.data_consulta).toISOString().slice(0, 16) : '',
    })
    setErrors({}); setOpen(true)
  }
  async function save(e) {
    e.preventDefault(); setErrors({})
    try {
      const payload = { ...form }
      Object.keys(payload).forEach((k) => { if (payload[k] === '') payload[k] = null })
      if (form.id) await api.put(`/consultas/${form.id}`, payload)
      else await api.post('/consultas', payload)
      setOpen(false); load()
    } catch (e) {
      setErrors(e.response?.data?.errors || { _: [e.response?.data?.message || 'Erro'] })
    }
  }
  async function destroy(id) {
    if (!await confirm('Remover consulta?')) return
    await api.delete(`/consultas/${id}`); load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Consultas</h1>
        <button className="btn-primary" onClick={openNew}>+ Nova consulta</button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Nº</th>
              <th className="text-left px-4 py-2">Data</th>
              <th className="text-left px-4 py-2">Paciente</th>
              <th className="text-left px-4 py-2">Médico</th>
              <th className="text-left px-4 py-2">Diagnóstico</th>
              <th className="text-left px-4 py-2">Estado</th>
              <th className="text-right px-4 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {list.data.map((c) => (
              <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2 font-mono text-xs">{c.numero}</td>
                <td className="px-4 py-2">{new Date(c.data_consulta).toLocaleString('pt-PT')}</td>
                <td className="px-4 py-2">{c.paciente?.nome}</td>
                <td className="px-4 py-2">{c.medico?.nome}</td>
                <td className="px-4 py-2 truncate max-w-xs">{c.diagnostico}</td>
                <td className="px-4 py-2"><StatusBadge status={c.status} /></td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <div className="inline-flex gap-1">
                    <button onClick={() => downloadPdf(`/consultas/${c.id}/pdf`)} title="Ver PDF" className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600">
                      <Printer size={16} />
                    </button>
                    <button onClick={() => openEdit(c)} title="Editar" className="p-1.5 rounded hover:bg-hgb-50 text-hgb-600">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => destroy(c.id)} title="Remover" className="p-1.5 rounded hover:bg-red-50 text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {list.data.length === 0 && (
              <tr><td colSpan="7" className="px-4 py-6 text-center text-slate-400">Sem consultas.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination meta={list} onPage={setPage} />

      <Modal open={open} title={form.id ? 'Editar consulta' : 'Nova consulta'} onClose={() => setOpen(false)} size="xl">
        <form onSubmit={save} className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Paciente *</label>
            <select className="input" required value={form.paciente_id || ''} onChange={(e) => selecionarPaciente(e.target.value)}>
              <option value="">—</option>
              {pacientes.map((p) => <option key={p.id} value={p.id}>{p.nome} ({p.numero_processo})</option>)}
            </select>
            {pendentes.length > 0 && !form.agendamento_id && (
              <div className="mt-2 p-2 rounded bg-sky-50 border border-sky-200 text-xs space-y-1">
                <div className="font-semibold text-sky-800">Marcações pendentes deste paciente:</div>
                {pendentes.map((a) => (
                  <button type="button" key={a.id} onClick={() => vincularAgendamento(a)}
                    className="block w-full text-left px-2 py-1 rounded hover:bg-sky-100">
                    <span className="font-mono">{a.numero}</span> · {new Date(a.data_agendamento).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' })}
                    {a.medico ? ` · ${a.medico.nome}` : ''} <span className="text-sky-700">→ vincular</span>
                  </button>
                ))}
              </div>
            )}
            {form.agendamento_id && (
              <div className="mt-2 p-2 rounded bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between">
                <span>Vinculado à marcação <span className="font-mono">#{form.agendamento_id}</span></span>
                <button type="button" className="text-emerald-700 hover:underline"
                  onClick={() => setForm({ ...form, agendamento_id: '' })}>desvincular</button>
              </div>
            )}
          </div>
          <div>
            <label className="label">Médico *</label>
            <select className="input" required value={form.medico_id || ''} onChange={(e) => setForm({ ...form, medico_id: e.target.value })}>
              <option value="">—</option>
              {medicos.map((m) => <option key={m.id} value={m.id}>{m.nome} — {m.especialidade}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Data/hora *</label>
            <input type="datetime-local" className="input" required value={form.data_consulta} onChange={(e) => setForm({ ...form, data_consulta: e.target.value })} />
          </div>
          <div>
            <label className="label">CID</label>
            <CidAutocomplete value={form.cid || ''} onChange={(v) => setForm({ ...form, cid: v })} />
          </div>
          <div className="col-span-2">
            <label className="label">Queixa principal</label>
            <textarea rows="2" className="input" value={form.queixa_principal || ''} onChange={(e) => setForm({ ...form, queixa_principal: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="label">História da doença</label>
            <textarea rows="2" className="input" value={form.historia_doenca || ''} onChange={(e) => setForm({ ...form, historia_doenca: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="label">Exame físico</label>
            <textarea rows="2" className="input" value={form.exame_fisico || ''} onChange={(e) => setForm({ ...form, exame_fisico: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="label">Diagnóstico *</label>
            <textarea rows="2" required className="input" value={form.diagnostico} onChange={(e) => setForm({ ...form, diagnostico: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="label">Prescrição</label>
            <textarea rows="3" className="input" value={form.prescricao || ''} onChange={(e) => setForm({ ...form, prescricao: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="label">Observações</label>
            <textarea rows="2" className="input" value={form.observacoes || ''} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
          </div>
          <div>
            <label className="label">Estado</label>
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="rascunho">Rascunho</option>
              <option value="emitido">Emitido</option>
              <option value="anulado">Anulado</option>
            </select>
          </div>
          {Object.keys(errors).length > 0 && (
            <div className="col-span-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
              {Object.values(errors).flat().join(' · ')}
            </div>
          )}
          <div className="col-span-2 flex justify-end gap-2 pt-2">
            <button type="button" className="btn-outline" onClick={() => setOpen(false)}>Cancelar</button>
            <button type="submit" className="btn-primary">Guardar</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
