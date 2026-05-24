import { useEffect, useState } from 'react'
import { Plus, Shield, Pencil, Trash2, Check, X, Clock } from 'lucide-react'
import api from '../api/client'
import { useAuth, useHasRole } from '../auth/AuthContext'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import { useConfirm } from '../components/ConfirmDialog'

const empty = { name: '', email: '', password: '', roles: [], medico_id: '', ativo: true }

export default function Utilizadores() {
  const confirm = useConfirm()
  const isAdmin = useHasRole()('admin')
  const [list, setList] = useState({ data: [], current_page: 1, last_page: 1, total: 0 })
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pendingCount, setPendingCount] = useState(0)
  const [roles, setRoles] = useState([])
  const [medicos, setMedicos] = useState([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})

  async function load() {
    const params = { page, search }
    if (statusFilter) params.registration_status = statusFilter
    const { data } = await api.get('/users', { params })
    setList(data)
  }
  async function loadPendingCount() {
    try {
      const { data } = await api.get('/users', { params: { registration_status: 'pending', per_page: 1 } })
      setPendingCount(data.total || 0)
    } catch {}
  }
  useEffect(() => {
    if (!isAdmin) return
    load()
    loadPendingCount()
    api.get('/users-roles-list').then((r) => setRoles(r.data))
    api.get('/medicos?per_page=200').then((r) => setMedicos(r.data.data || []))
  }, [isAdmin, page, search, statusFilter])

  async function approve(id) {
    if (!await confirm('Aprovar este registo? O utilizador vai poder entrar imediatamente.')) return
    try { await api.post(`/users/${id}/approve`); load(); loadPendingCount() }
    catch (e) { alert(e.response?.data?.message || 'Erro ao aprovar.') }
  }
  async function reject(id) {
    if (!await confirm('Rejeitar este registo? A conta fica bloqueada.')) return
    try { await api.post(`/users/${id}/reject`); load(); loadPendingCount() }
    catch (e) { alert(e.response?.data?.message || 'Erro ao rejeitar.') }
  }

  if (!isAdmin) {
    return <div className="card p-6 text-center text-slate-500">Apenas administradores.</div>
  }

  function openNew() { setForm(empty); setErrors({}); setOpen(true) }
  function openEdit(u) {
    setForm({
      ...empty, ...u, password: '',
      roles: u.roles?.map((r) => r.name) || [],
      medico_id: u.medico_id || '',
    })
    setErrors({}); setOpen(true)
  }

  async function save(e) {
    e.preventDefault(); setErrors({})
    try {
      const payload = { ...form }
      if (!payload.password) delete payload.password
      if (!payload.medico_id) payload.medico_id = null
      if (form.id) await api.put(`/users/${form.id}`, payload)
      else await api.post('/users', payload)
      setOpen(false); load()
    } catch (e) {
      setErrors(e.response?.data?.errors || { _: [e.response?.data?.message || 'Erro'] })
    }
  }

  async function destroy(id) {
    if (!await confirm('Remover utilizador?')) return
    try { await api.delete(`/users/${id}`); load() }
    catch (e) { alert(e.response?.data?.message || 'Erro') }
  }

  function toggleRole(name) {
    setForm((f) => ({
      ...f,
      roles: f.roles.includes(name) ? f.roles.filter((r) => r !== name) : [...f.roles, name],
    }))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Utilizadores</h1>
        <button className="btn-primary inline-flex items-center gap-1" onClick={openNew}>
          <Plus size={16} /> Novo utilizador
        </button>
      </div>

      {pendingCount > 0 && statusFilter !== 'pending' && (
        <button
          onClick={() => { setPage(1); setStatusFilter('pending') }}
          className="w-full mb-4 flex items-center justify-between gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 transition"
        >
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-amber-700" />
            <span className="text-sm font-medium text-amber-800">
              {pendingCount} {pendingCount === 1 ? 'registo aguarda' : 'registos aguardam'} aprovação
            </span>
          </div>
          <span className="text-xs text-amber-700 underline">Ver pendentes</span>
        </button>
      )}

      <div className="card p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <input className="input flex-1" placeholder="Pesquisar nome ou email…" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value) }} />
        <select className="input sm:w-48" value={statusFilter} onChange={(e) => { setPage(1); setStatusFilter(e.target.value) }}>
          <option value="">Todos os estados</option>
          <option value="pending">Pendentes</option>
          <option value="approved">Aprovados</option>
          <option value="rejected">Rejeitados</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Nome</th>
              <th className="text-left px-4 py-2">Email</th>
              <th className="text-left px-4 py-2">Perfis</th>
              <th className="text-left px-4 py-2">Médico</th>
              <th className="text-left px-4 py-2">Estado</th>
              <th className="text-right px-4 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {list.data.map((u) => (
              <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2 font-medium">{u.name}</td>
                <td className="px-4 py-2">{u.email}</td>
                <td className="px-4 py-2">
                  {u.roles?.map((r) => (
                    <span key={r.name} className="inline-block bg-hgb-50 text-hgb-700 text-xs px-2 py-0.5 rounded mr-1">{r.name}</span>
                  ))}
                </td>
                <td className="px-4 py-2 text-xs">{u.medico?.nome || '—'}</td>
                <td className="px-4 py-2">
                  {u.registration_status === 'pending' && (
                    <span className="inline-block bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded">PENDENTE</span>
                  )}
                  {u.registration_status === 'rejected' && (
                    <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded">REJEITADO</span>
                  )}
                  {(u.registration_status === 'approved' || !u.registration_status) && (
                    u.ativo
                      ? <span className="badge-emitido">ATIVO</span>
                      : <span className="badge-anulado">INATIVO</span>
                  )}
                  {u.registration_status === 'pending' && u.requested_role && (
                    <div className="text-[10px] text-slate-500 mt-1">pediu: {u.requested_role}</div>
                  )}
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <div className="inline-flex gap-1">
                    {u.registration_status === 'pending' && (
                      <>
                        <button onClick={() => approve(u.id)} title="Aprovar" className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600">
                          <Check size={16} />
                        </button>
                        <button onClick={() => reject(u.id)} title="Rejeitar" className="p-1.5 rounded hover:bg-red-50 text-red-600">
                          <X size={16} />
                        </button>
                      </>
                    )}
                    <button onClick={() => openEdit(u)} title="Editar" className="p-1.5 rounded hover:bg-hgb-50 text-hgb-600">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => destroy(u.id)} title="Remover" className="p-1.5 rounded hover:bg-red-50 text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {list.data.length === 0 && (
              <tr><td colSpan="6" className="px-4 py-6 text-center text-slate-400">Sem utilizadores.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination meta={list} onPage={setPage} />

      <Modal open={open} title={form.id ? 'Editar utilizador' : 'Novo utilizador'} onClose={() => setOpen(false)}>
        <form onSubmit={save} className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Nome *</label>
            <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Email *</label>
            <input type="email" className="input" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Palavra-passe {form.id && <span className="text-slate-400 normal-case font-normal">(deixar vazio para manter)</span>}</label>
            <input type="password" className="input" required={!form.id} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div>
            <label className="label">Associar a médico</label>
            <select className="input" value={form.medico_id || ''} onChange={(e) => setForm({ ...form, medico_id: e.target.value })}>
              <option value="">— Nenhum —</option>
              {medicos.map((m) => <option key={m.id} value={m.id}>{m.nome} ({m.especialidade})</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">Perfis *</label>
            <div className="flex flex-wrap gap-2">
              {roles.map((r) => (
                <label key={r.id} className={`flex items-center gap-2 px-3 py-1.5 rounded border cursor-pointer text-sm ${
                  form.roles.includes(r.name) ? 'bg-hgb-50 border-hgb-500 text-hgb-700' : 'border-slate-200 hover:bg-slate-50'
                }`}>
                  <input type="checkbox" checked={form.roles.includes(r.name)} onChange={() => toggleRole(r.name)} className="rounded" />
                  {r.name}
                </label>
              ))}
            </div>
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <input type="checkbox" id="ativo" checked={!!form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} />
            <label htmlFor="ativo" className="text-sm">Conta ativa</label>
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
