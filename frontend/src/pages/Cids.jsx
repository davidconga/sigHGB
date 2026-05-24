import { useEffect, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import api from '../api/client'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import { useConfirm } from '../components/ConfirmDialog'

const empty = { codigo: '', descricao: '', capitulo: '', ativo: true }

export default function Cids() {
  const confirm = useConfirm()
  const [list, setList] = useState({ data: [], current_page: 1, last_page: 1, total: 0 })
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})

  async function load() {
    const { data } = await api.get('/cids', { params: { page, search } })
    setList(data)
  }
  useEffect(() => { load() }, [page, search])

  function openNew() { setForm(empty); setErrors({}); setOpen(true) }
  function openEdit(c) { setForm({ ...empty, ...c }); setErrors({}); setOpen(true) }

  async function save(e) {
    e.preventDefault(); setErrors({})
    try {
      const payload = { ...form, codigo: form.codigo.trim().toUpperCase() }
      if (form.id) await api.put(`/cids/${form.id}`, payload)
      else await api.post('/cids', payload)
      setOpen(false); load()
    } catch (e) {
      setErrors(e.response?.data?.errors || { _: [e.response?.data?.message || 'Erro'] })
    }
  }

  async function destroy(id) {
    if (!await confirm('Remover CID?')) return
    await api.delete(`/cids/${id}`); load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Tabela CID</h1>
          <p className="text-sm text-slate-500">Classificação Internacional de Doenças</p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ Novo CID</button>
      </div>

      <div className="card p-4 mb-4">
        <input
          className="input"
          placeholder="Pesquisar por código (ex.: J18) ou descrição (ex.: pneumonia)…"
          value={search}
          onChange={(e) => { setPage(1); setSearch(e.target.value) }}
        />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2 w-24">Código</th>
              <th className="text-left px-4 py-2">Descrição (PT)</th>
              <th className="text-left px-4 py-2">Descrição (EN)</th>
              <th className="text-left px-4 py-2">Capítulo</th>
              <th className="text-left px-4 py-2 w-20">Estado</th>
              <th className="text-right px-4 py-2 w-40">Ações</th>
            </tr>
          </thead>
          <tbody>
            {list.data.map((c) => (
              <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2 font-mono font-semibold text-hgb-700">{c.codigo}</td>
                <td className="px-4 py-2">{c.descricao}</td>
                <td className="px-4 py-2 text-xs text-slate-500 italic">{c.descricao_en || '—'}</td>
                <td className="px-4 py-2 text-slate-500 text-xs">{c.capitulo || '—'}</td>
                <td className="px-4 py-2">{c.ativo ? <span className="badge-emitido">ATIVO</span> : <span className="badge-anulado">INATIVO</span>}</td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <div className="inline-flex gap-1">
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
              <tr><td colSpan="6" className="px-4 py-6 text-center text-slate-400">Sem CIDs.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination meta={list} onPage={setPage} />

      <Modal open={open} title={form.id ? 'Editar CID' : 'Novo CID'} onClose={() => setOpen(false)}>
        <form onSubmit={save} className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Código *</label>
            <input className="input font-mono uppercase" required value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} maxLength={10} />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <input type="checkbox" id="cid-ativo" checked={!!form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} />
            <label htmlFor="cid-ativo" className="text-sm">Ativo</label>
          </div>
          <div className="col-span-2">
            <label className="label">Descrição *</label>
            <input className="input" required value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="label">Capítulo</label>
            <input className="input" value={form.capitulo || ''} onChange={(e) => setForm({ ...form, capitulo: e.target.value })} placeholder="Ex.: Doenças do aparelho respiratório" />
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
