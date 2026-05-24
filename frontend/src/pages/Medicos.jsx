import { useEffect, useState } from 'react'
import { Pencil, Trash2, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import AssinaturaUpload from '../components/AssinaturaUpload'
import { useConfirm } from '../components/ConfirmDialog'

const empty = { nome: '', numero_ordem: '', especialidade: '', telefone: '', email: '', ativo: true }

export default function Medicos() {
  const confirm = useConfirm()
  const [list, setList] = useState({ data: [], current_page: 1, last_page: 1, total: 0 })
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})

  async function load() {
    const { data } = await api.get('/medicos', { params: { page, search } })
    setList(data)
  }
  useEffect(() => { load() }, [page, search])

  function openNew() { setForm(empty); setErrors({}); setOpen(true) }
  function openEdit(m) { setForm({ ...empty, ...m }); setErrors({}); setOpen(true) }

  async function save(e) {
    e.preventDefault()
    setErrors({})
    try {
      const payload = { ...form }
      Object.keys(payload).forEach((k) => { if (payload[k] === '') payload[k] = null })
      if (form.id) await api.put(`/medicos/${form.id}`, payload)
      else await api.post('/medicos', payload)
      setOpen(false); load()
    } catch (e) {
      setErrors(e.response?.data?.errors || { _: [e.response?.data?.message || 'Erro'] })
    }
  }

  async function destroy(id) {
    if (!await confirm('Remover médico?')) return
    await api.delete(`/medicos/${id}`); load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Médicos</h1>
        <button className="btn-primary" onClick={openNew}>+ Novo médico</button>
      </div>

      <div className="card p-4 mb-4">
        <input className="input" placeholder="Pesquisar…" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value) }} />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Nº Ordem</th>
              <th className="text-left px-4 py-2">Nome</th>
              <th className="text-left px-4 py-2">Especialidade</th>
              <th className="text-left px-4 py-2">Telefone</th>
              <th className="text-left px-4 py-2">Estado</th>
              <th className="text-right px-4 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {list.data.map((m) => (
              <tr key={m.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2 font-mono text-xs">{m.numero_ordem}</td>
                <td className="px-4 py-2 font-medium">{m.nome}</td>
                <td className="px-4 py-2">{m.especialidade}</td>
                <td className="px-4 py-2">{m.telefone || '—'}</td>
                <td className="px-4 py-2">{m.ativo ? <span className="badge-emitido">ATIVO</span> : <span className="badge-anulado">INATIVO</span>}</td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <div className="inline-flex gap-1">
                    <Link to={`/medicos/${m.id}`} title="Ver detalhes" className="p-1.5 rounded hover:bg-slate-100 text-slate-600">
                      <Eye size={16} />
                    </Link>
                    <button onClick={() => openEdit(m)} title="Editar" className="p-1.5 rounded hover:bg-hgb-50 text-hgb-600">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => destroy(m.id)} title="Remover" className="p-1.5 rounded hover:bg-red-50 text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {list.data.length === 0 && (
              <tr><td colSpan="6" className="px-4 py-6 text-center text-slate-400">Nenhum médico.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination meta={list} onPage={setPage} />

      <Modal open={open} title={form.id ? 'Editar médico' : 'Novo médico'} onClose={() => setOpen(false)}>
        <form onSubmit={save} className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Nome *</label>
            <input className="input" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </div>
          <div>
            <label className="label">Nº de Ordem *</label>
            <input className="input" required value={form.numero_ordem} onChange={(e) => setForm({ ...form, numero_ordem: e.target.value })} />
          </div>
          <div>
            <label className="label">Especialidade *</label>
            <input className="input" required value={form.especialidade} onChange={(e) => setForm({ ...form, especialidade: e.target.value })} />
          </div>
          <div>
            <label className="label">Telefone</label>
            <input className="input" value={form.telefone || ''} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <input type="checkbox" id="ativo" checked={!!form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} />
            <label htmlFor="ativo" className="text-sm">Ativo</label>
          </div>

          {form.id && (
            <div className="col-span-2 border-t pt-4 mt-2">
              <div className="text-xs font-semibold text-slate-500 uppercase mb-3">Assinatura e Carimbo Digital</div>
              <div className="grid grid-cols-2 gap-3">
                <AssinaturaUpload medico={form} tipo="assinatura" onUpdated={(m) => setForm({ ...form, ...m })} />
                <AssinaturaUpload medico={form} tipo="carimbo" onUpdated={(m) => setForm({ ...form, ...m })} />
              </div>
              <p className="text-xs text-slate-500 mt-2">Estas imagens são automaticamente aplicadas em relatórios e atestados assinados por este médico.</p>
            </div>
          )}

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
