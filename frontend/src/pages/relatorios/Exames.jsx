import { useEffect, useState } from 'react'
import { Printer, Pencil, Trash2 } from 'lucide-react'
import api, { downloadPdf } from '../../api/client'
import { useLookups } from '../../api/lookups'
import Modal from '../../components/Modal'
import Pagination from '../../components/Pagination'
import StatusBadge from '../../components/StatusBadge'
import { useConfirm } from '../../components/ConfirmDialog'

const empty = {
  paciente_id: '', medico_id: '', data_realizacao: '', tipo_exame: '',
  material: '', parametros: [], resultado: '', interpretacao: '',
  observacoes: '', status: 'rascunho',
}

export default function Exames() {
  const confirm = useConfirm()
  const { pacientes, medicos } = useLookups()
  const [list, setList] = useState({ data: [], current_page: 1, last_page: 1, total: 0 })
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})

  async function load() {
    const { data } = await api.get('/exames', { params: { page } })
    setList(data)
  }
  useEffect(() => { load() }, [page])

  function openNew() {
    setForm({ ...empty, data_realizacao: new Date().toISOString().slice(0, 10), parametros: [] })
    setErrors({}); setOpen(true)
  }
  function openEdit(x) {
    setForm({
      ...empty, ...x,
      data_realizacao: x.data_realizacao?.slice(0, 10) || '',
      parametros: x.parametros || [],
    })
    setErrors({}); setOpen(true)
  }
  function addParam() {
    setForm({ ...form, parametros: [...(form.parametros || []), { nome: '', valor: '', unidade: '', referencia: '' }] })
  }
  function updParam(i, k, v) {
    const p = [...form.parametros]; p[i] = { ...p[i], [k]: v }; setForm({ ...form, parametros: p })
  }
  function delParam(i) {
    setForm({ ...form, parametros: form.parametros.filter((_, idx) => idx !== i) })
  }
  async function save(e) {
    e.preventDefault(); setErrors({})
    try {
      const payload = { ...form }
      Object.keys(payload).forEach((k) => { if (payload[k] === '') payload[k] = null })
      if (form.id) await api.put(`/exames/${form.id}`, payload)
      else await api.post('/exames', payload)
      setOpen(false); load()
    } catch (e) {
      setErrors(e.response?.data?.errors || { _: [e.response?.data?.message || 'Erro'] })
    }
  }
  async function destroy(id) {
    if (!await confirm('Remover exame?')) return
    await api.delete(`/exames/${id}`); load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Exames laboratoriais</h1>
        <button className="btn-primary" onClick={openNew}>+ Novo exame</button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Nº</th>
              <th className="text-left px-4 py-2">Data</th>
              <th className="text-left px-4 py-2">Paciente</th>
              <th className="text-left px-4 py-2">Tipo</th>
              <th className="text-left px-4 py-2">Estado</th>
              <th className="text-right px-4 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {list.data.map((x) => (
              <tr key={x.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2 font-mono text-xs">{x.numero}</td>
                <td className="px-4 py-2">{x.data_realizacao?.slice(0, 10)}</td>
                <td className="px-4 py-2">{x.paciente?.nome}</td>
                <td className="px-4 py-2">{x.tipo_exame}</td>
                <td className="px-4 py-2"><StatusBadge status={x.status} /></td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <div className="inline-flex gap-1">
                    <button onClick={() => downloadPdf(`/exames/${x.id}/pdf`)} title="Ver PDF" className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600">
                      <Printer size={16} />
                    </button>
                    <button onClick={() => openEdit(x)} title="Editar" className="p-1.5 rounded hover:bg-hgb-50 text-hgb-600">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => destroy(x.id)} title="Remover" className="p-1.5 rounded hover:bg-red-50 text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {list.data.length === 0 && (
              <tr><td colSpan="6" className="px-4 py-6 text-center text-slate-400">Sem exames.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination meta={list} onPage={setPage} />

      <Modal open={open} title={form.id ? 'Editar exame' : 'Novo exame'} onClose={() => setOpen(false)} size="xl">
        <form onSubmit={save} className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Paciente *</label>
            <select className="input" required value={form.paciente_id || ''} onChange={(e) => setForm({ ...form, paciente_id: e.target.value })}>
              <option value="">—</option>
              {pacientes.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Médico responsável *</label>
            <select className="input" required value={form.medico_id || ''} onChange={(e) => setForm({ ...form, medico_id: e.target.value })}>
              <option value="">—</option>
              {medicos.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Data realização *</label>
            <input type="date" className="input" required value={form.data_realizacao} onChange={(e) => setForm({ ...form, data_realizacao: e.target.value })} />
          </div>
          <div>
            <label className="label">Tipo de exame *</label>
            <input className="input" required value={form.tipo_exame} onChange={(e) => setForm({ ...form, tipo_exame: e.target.value })} placeholder="Ex.: Hemograma completo" />
          </div>
          <div className="col-span-2">
            <label className="label">Material</label>
            <input className="input" value={form.material || ''} onChange={(e) => setForm({ ...form, material: e.target.value })} placeholder="Ex.: Sangue venoso" />
          </div>

          <div className="col-span-2">
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Parâmetros</label>
              <button type="button" className="text-sm text-hgb-600 hover:underline" onClick={addParam}>+ Adicionar parâmetro</button>
            </div>
            {form.parametros?.length > 0 && (
              <div className="space-y-2">
                {form.parametros.map((p, i) => (
                  <div key={i} className="grid grid-cols-12 gap-2">
                    <input className="input col-span-4" placeholder="Nome" value={p.nome} onChange={(e) => updParam(i, 'nome', e.target.value)} />
                    <input className="input col-span-2" placeholder="Valor" value={p.valor} onChange={(e) => updParam(i, 'valor', e.target.value)} />
                    <input className="input col-span-2" placeholder="Unidade" value={p.unidade} onChange={(e) => updParam(i, 'unidade', e.target.value)} />
                    <input className="input col-span-3" placeholder="Referência" value={p.referencia} onChange={(e) => updParam(i, 'referencia', e.target.value)} />
                    <button type="button" className="text-red-600 col-span-1" onClick={() => delParam(i)}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="col-span-2">
            <label className="label">Resultado *</label>
            <textarea rows="3" required className="input" value={form.resultado} onChange={(e) => setForm({ ...form, resultado: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="label">Interpretação</label>
            <textarea rows="2" className="input" value={form.interpretacao || ''} onChange={(e) => setForm({ ...form, interpretacao: e.target.value })} />
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
