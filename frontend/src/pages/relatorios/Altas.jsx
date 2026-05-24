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
  paciente_id: '', medico_id: '', data_internamento: '', data_alta: '',
  servico: '', cama: '', diagnostico_admissao: '', diagnostico_alta: '',
  cid: '', procedimentos: '', evolucao: '', medicacao_alta: '',
  recomendacoes: '', condicao_alta: 'melhorado', status: 'rascunho',
}

export default function Altas() {
  const confirm = useConfirm()
  const { pacientes, medicos } = useLookups()
  const [list, setList] = useState({ data: [], current_page: 1, last_page: 1, total: 0 })
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})

  async function load() {
    const { data } = await api.get('/altas', { params: { page } })
    setList(data)
  }
  useEffect(() => { load() }, [page])

  function openNew() {
    setForm({ ...empty, data_alta: new Date().toISOString().slice(0, 10) })
    setErrors({}); setOpen(true)
  }
  function openEdit(a) {
    setForm({
      ...empty, ...a,
      data_internamento: a.data_internamento?.slice(0, 10) || '',
      data_alta: a.data_alta?.slice(0, 10) || '',
    })
    setErrors({}); setOpen(true)
  }
  async function save(e) {
    e.preventDefault(); setErrors({})
    try {
      const payload = { ...form }
      Object.keys(payload).forEach((k) => { if (payload[k] === '') payload[k] = null })
      if (form.id) await api.put(`/altas/${form.id}`, payload)
      else await api.post('/altas', payload)
      setOpen(false); load()
    } catch (e) {
      setErrors(e.response?.data?.errors || { _: [e.response?.data?.message || 'Erro'] })
    }
  }
  async function destroy(id) {
    if (!await confirm('Remover alta?')) return
    await api.delete(`/altas/${id}`); load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Altas hospitalares</h1>
        <button className="btn-primary" onClick={openNew}>+ Nova alta</button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Nº</th>
              <th className="text-left px-4 py-2">Alta</th>
              <th className="text-left px-4 py-2">Paciente</th>
              <th className="text-left px-4 py-2">Serviço</th>
              <th className="text-left px-4 py-2">Condição</th>
              <th className="text-left px-4 py-2">Estado</th>
              <th className="text-right px-4 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {list.data.map((a) => (
              <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2 font-mono text-xs">{a.numero}</td>
                <td className="px-4 py-2">{a.data_alta?.slice(0, 10)}</td>
                <td className="px-4 py-2">{a.paciente?.nome}</td>
                <td className="px-4 py-2">{a.servico || '—'}</td>
                <td className="px-4 py-2 capitalize">{a.condicao_alta}</td>
                <td className="px-4 py-2"><StatusBadge status={a.status} /></td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <div className="inline-flex gap-1">
                    <button onClick={() => downloadPdf(`/altas/${a.id}/pdf`)} title="Ver PDF" className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600">
                      <Printer size={16} />
                    </button>
                    <button onClick={() => openEdit(a)} title="Editar" className="p-1.5 rounded hover:bg-hgb-50 text-hgb-600">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => destroy(a.id)} title="Remover" className="p-1.5 rounded hover:bg-red-50 text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {list.data.length === 0 && (
              <tr><td colSpan="7" className="px-4 py-6 text-center text-slate-400">Sem altas registadas.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination meta={list} onPage={setPage} />

      <Modal open={open} title={form.id ? 'Editar alta' : 'Nova alta hospitalar'} onClose={() => setOpen(false)} size="xl">
        <form onSubmit={save} className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Paciente *</label>
            <select className="input" required value={form.paciente_id || ''} onChange={(e) => setForm({ ...form, paciente_id: e.target.value })}>
              <option value="">—</option>
              {pacientes.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Médico *</label>
            <select className="input" required value={form.medico_id || ''} onChange={(e) => setForm({ ...form, medico_id: e.target.value })}>
              <option value="">—</option>
              {medicos.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Internamento *</label>
            <input type="date" required className="input" value={form.data_internamento} onChange={(e) => setForm({ ...form, data_internamento: e.target.value })} />
          </div>
          <div>
            <label className="label">Alta *</label>
            <input type="date" required className="input" value={form.data_alta} onChange={(e) => setForm({ ...form, data_alta: e.target.value })} />
          </div>
          <div>
            <label className="label">Serviço</label>
            <input className="input" value={form.servico || ''} onChange={(e) => setForm({ ...form, servico: e.target.value })} placeholder="Ex.: Medicina Interna" />
          </div>
          <div>
            <label className="label">Cama</label>
            <input className="input" value={form.cama || ''} onChange={(e) => setForm({ ...form, cama: e.target.value })} />
          </div>
          <div>
            <label className="label">Condição de alta *</label>
            <select className="input" required value={form.condicao_alta} onChange={(e) => setForm({ ...form, condicao_alta: e.target.value })}>
              <option value="curado">Curado</option>
              <option value="melhorado">Melhorado</option>
              <option value="transferido">Transferido</option>
              <option value="obito">Óbito</option>
              <option value="desistencia">Desistência</option>
            </select>
          </div>
          <div>
            <label className="label">CID</label>
            <CidAutocomplete value={form.cid || ''} onChange={(v) => setForm({ ...form, cid: v })} />
          </div>
          <div className="col-span-2">
            <label className="label">Diagnóstico de admissão</label>
            <textarea rows="2" className="input" value={form.diagnostico_admissao || ''} onChange={(e) => setForm({ ...form, diagnostico_admissao: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="label">Diagnóstico de alta *</label>
            <textarea rows="2" required className="input" value={form.diagnostico_alta} onChange={(e) => setForm({ ...form, diagnostico_alta: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="label">Procedimentos</label>
            <textarea rows="2" className="input" value={form.procedimentos || ''} onChange={(e) => setForm({ ...form, procedimentos: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="label">Evolução clínica</label>
            <textarea rows="2" className="input" value={form.evolucao || ''} onChange={(e) => setForm({ ...form, evolucao: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="label">Medicação de alta</label>
            <textarea rows="2" className="input" value={form.medicacao_alta || ''} onChange={(e) => setForm({ ...form, medicacao_alta: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="label">Recomendações</label>
            <textarea rows="2" className="input" value={form.recomendacoes || ''} onChange={(e) => setForm({ ...form, recomendacoes: e.target.value })} />
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
