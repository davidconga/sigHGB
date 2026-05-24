import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Cake, Search, MessageSquare, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { useCan } from '../auth/AuthContext'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import { useConfirm } from '../components/ConfirmDialog'

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

const empty = {
  nome: '', telefone: '', sexo: '', email: '', data_nascimento: '',
  servico: '', categoria: '', chefe_departamento: false, chefe_servico: false,
  ativo: true, receber_aniversario: true,
}

export default function Funcionarios() {
  const confirm = useConfirm()
  const can = useCan()
  const [list, setList] = useState({ data: [], current_page: 1, last_page: 1, total: 0 })
  const [aniversariantes, setAniversariantes] = useState({ funcionarios: [], total: 0 })
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [mes, setMes] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})
  const [showAnivPanel, setShowAnivPanel] = useState(false)

  async function load() {
    const params = { page, search, ...(mes ? { mes_aniversario: mes } : {}) }
    const { data } = await api.get('/funcionarios', { params })
    setList(data)
  }
  useEffect(() => {
    const t = setTimeout(load, search ? 350 : 0)
    return () => clearTimeout(t)
  }, [page, search, mes])

  async function loadAniversariantes() {
    const m = new Date().getMonth() + 1
    const { data } = await api.get('/funcionarios/aniversariantes', { params: { mes: m } })
    setAniversariantes(data)
  }
  useEffect(() => { loadAniversariantes() }, [])

  function openNew() { setForm(empty); setErrors({}); setOpen(true) }
  function openEdit(f) {
    setForm({ ...empty, ...f, data_nascimento: f.data_nascimento?.slice(0, 10) || '' })
    setErrors({}); setOpen(true)
  }

  async function save(e) {
    e.preventDefault(); setErrors({})
    try {
      const payload = { ...form }
      Object.keys(payload).forEach((k) => { if (payload[k] === '') payload[k] = null })
      if (form.id) await api.put(`/funcionarios/${form.id}`, payload)
      else await api.post('/funcionarios', payload)
      setOpen(false); load(); loadAniversariantes()
    } catch (e) {
      setErrors(e.response?.data?.errors || { _: [e.response?.data?.message || 'Erro'] })
    }
  }

  async function destroy(id) {
    if (!await confirm('Remover funcionário?')) return
    await api.delete(`/funcionarios/${id}`); load(); loadAniversariantes()
  }

  const hoje = new Date()
  const hojeMD = `${(hoje.getMonth()+1).toString().padStart(2,'0')}-${hoje.getDate().toString().padStart(2,'0')}`

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Funcionários</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowAnivPanel(!showAnivPanel)} className="btn-outline inline-flex items-center gap-1">
            <Cake size={16} /> Aniversariantes do mês ({aniversariantes.total})
          </button>
          {can('funcionarios.create') && (
            <button className="btn-primary inline-flex items-center gap-1" onClick={openNew}>
              <Plus size={16} /> Novo funcionário
            </button>
          )}
        </div>
      </div>

      {showAnivPanel && (
        <div className="card p-4 mb-4 bg-gradient-to-r from-pink-50 to-amber-50 border-pink-200">
          <div className="flex items-center gap-2 mb-3">
            <Cake className="text-pink-600" size={20} />
            <h3 className="font-semibold">Aniversariantes de {MESES[hoje.getMonth()]}</h3>
            <span className="ml-auto text-xs text-slate-500">
              Cron diário às 08:00 envia SMS automaticamente aos que fazem anos hoje
            </span>
          </div>
          {aniversariantes.total === 0 ? (
            <p className="text-sm text-slate-500">Nenhum aniversariante este mês.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {aniversariantes.funcionarios.map((f) => {
                const dn = f.data_nascimento?.slice(0, 10) || ''
                const md = dn.slice(5, 10).replace('-', '-')
                const isHoje = md === hojeMD
                return (
                  <div key={f.id} className={`rounded p-2.5 text-sm ${isHoje ? 'bg-pink-200 border border-pink-400' : 'bg-white border border-slate-200'}`}>
                    <div className="font-medium flex items-center gap-1">
                      {isHoje && <span title="Aniversário hoje!">🎉</span>}
                      {f.nome}
                    </div>
                    <div className="text-xs text-slate-500 flex justify-between mt-0.5">
                      <span>{dn.slice(8, 10)}/{dn.slice(5, 7)}</span>
                      <span className="font-mono">{f.telefone}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      <div className="card p-4 mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Pesquisar nome, telefone, email ou serviço…"
            value={search} onChange={(e) => { setPage(1); setSearch(e.target.value) }} />
        </div>
        <select className="input w-auto" value={mes} onChange={(e) => { setPage(1); setMes(e.target.value) }}>
          <option value="">Todos os meses</option>
          {MESES.map((m, i) => <option key={i+1} value={i+1}>Aniversário em {m}</option>)}
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Nome</th>
              <th className="text-left px-4 py-2">Telefone</th>
              <th className="text-left px-4 py-2">Serviço</th>
              <th className="text-left px-4 py-2">Aniversário</th>
              <th className="text-left px-4 py-2">SMS Aniv.</th>
              <th className="text-left px-4 py-2">Estado</th>
              <th className="text-right px-4 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {list.data.map((f) => {
              const dn = f.data_nascimento?.slice(0, 10) || ''
              const md = dn ? `${dn.slice(5,7)}-${dn.slice(8,10)}` : ''
              const isHoje = md === hojeMD
              return (
                <tr key={f.id} className={`border-t border-slate-100 hover:bg-slate-50 ${isHoje ? 'bg-pink-50' : ''}`}>
                  <td className="px-4 py-2 font-medium">
                    {isHoje && '🎉 '}{f.nome}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">{f.telefone}</td>
                  <td className="px-4 py-2 text-xs">{f.servico || '—'}</td>
                  <td className="px-4 py-2 text-xs">{dn ? `${dn.slice(8,10)}/${dn.slice(5,7)}/${dn.slice(0,4)}` : '—'}</td>
                  <td className="px-4 py-2">
                    {f.receber_aniversario
                      ? <span className="badge-emitido">SIM</span>
                      : <span className="badge-anulado">NÃO</span>}
                  </td>
                  <td className="px-4 py-2">
                    {f.ativo ? <span className="badge-emitido">ATIVO</span> : <span className="badge-anulado">INATIVO</span>}
                  </td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">
                    <div className="inline-flex gap-1">
                      <Link to={`/funcionarios/${f.id}`} title="Ver detalhes" className="p-1.5 rounded hover:bg-slate-100 text-slate-600">
                        <Eye size={16} />
                      </Link>
                      {can('funcionarios.update') && (
                        <button onClick={() => openEdit(f)} title="Editar" className="p-1.5 rounded hover:bg-hgb-50 text-hgb-600">
                          <Pencil size={16} />
                        </button>
                      )}
                      {can('funcionarios.delete') && (
                        <button onClick={() => destroy(f.id)} title="Remover" className="p-1.5 rounded hover:bg-red-50 text-red-600">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
            {list.data.length === 0 && (
              <tr><td colSpan="7" className="px-4 py-6 text-center text-slate-400">Sem funcionários.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination meta={list} onPage={setPage} />

      <Modal open={open} title={form.id ? 'Editar funcionário' : 'Novo funcionário'} onClose={() => setOpen(false)} size="lg">
        <form onSubmit={save} className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Nome completo *</label>
            <input className="input" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </div>
          <div>
            <label className="label">Telefone *</label>
            <input className="input" required value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="label">Sexo</label>
            <select className="input" value={form.sexo || ''} onChange={(e) => setForm({ ...form, sexo: e.target.value })}>
              <option value="">—</option>
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
            </select>
          </div>
          <div>
            <label className="label">Data de nascimento</label>
            <input type="date" className="input" value={form.data_nascimento || ''} onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })} />
          </div>
          <div>
            <label className="label">Serviço</label>
            <input className="input" value={form.servico || ''} onChange={(e) => setForm({ ...form, servico: e.target.value })} />
          </div>
          <div>
            <label className="label">Categoria</label>
            <input className="input" value={form.categoria || ''} onChange={(e) => setForm({ ...form, categoria: e.target.value })} />
          </div>
          <div className="col-span-2 grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!form.ativo} onChange={(e) => setForm({ ...form, ativo: e.target.checked })} />
              Ativo
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!form.receber_aniversario} onChange={(e) => setForm({ ...form, receber_aniversario: e.target.checked })} />
              <Cake size={14} className="text-pink-600" /> Receber SMS de aniversário
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!form.chefe_departamento} onChange={(e) => setForm({ ...form, chefe_departamento: e.target.checked })} />
              Chefe de departamento
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={!!form.chefe_servico} onChange={(e) => setForm({ ...form, chefe_servico: e.target.checked })} />
              Chefe de serviço
            </label>
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
