import { useEffect, useState } from 'react'
import { Pencil, Trash2, Eye } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import LocationPicker from '../components/LocationPicker'
import { useConfirm } from '../components/ConfirmDialog'

const empty = {
  nome: '', nome_pai: '', nome_mae: '',
  bi: '', bi_emissao_local: '', bi_emissao_data: '',
  data_nascimento: '', sexo: '', estado_civil: '',
  telefone: '', email: '',
  endereco: '', bairro: '', municipio: '', provincia: 'Benguela',
  naturalidade_provincia: '', naturalidade_municipio: '',
  grupo_sanguineo: '', alergias: '', observacoes: '',
}

export default function Pacientes() {
  const confirm = useConfirm()
  const [list, setList] = useState({ data: [], current_page: 1, last_page: 1, total: 0 })
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(empty)
  const [errors, setErrors] = useState({})

  async function load() {
    const { data } = await api.get('/pacientes', { params: { page, search } })
    setList(data)
  }
  useEffect(() => { load() }, [page, search])

  function openNew() { setForm(empty); setErrors({}); setOpen(true) }
  function openEdit(p) {
    setForm({
      ...empty, ...p,
      data_nascimento: p.data_nascimento?.slice(0, 10) || '',
      bi_emissao_data: p.bi_emissao_data?.slice(0, 10) || '',
    })
    setErrors({}); setOpen(true)
  }

  async function save(e) {
    e.preventDefault()
    setErrors({})
    try {
      const payload = { ...form }
      Object.keys(payload).forEach((k) => { if (payload[k] === '') payload[k] = null })
      if (form.id) {
        await api.put(`/pacientes/${form.id}`, payload)
      } else {
        await api.post('/pacientes', payload)
      }
      setOpen(false)
      load()
    } catch (e) {
      setErrors(e.response?.data?.errors || { _: [e.response?.data?.message || 'Erro ao guardar'] })
    }
  }

  async function destroy(id) {
    if (!await confirm('Remover paciente?')) return
    await api.delete(`/pacientes/${id}`)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Pacientes</h1>
        <button className="btn-primary" onClick={openNew}>+ Novo paciente</button>
      </div>

      <div className="card p-4 mb-4">
        <input
          className="input"
          placeholder="Pesquisar por nome, processo ou BI…"
          value={search}
          onChange={(e) => { setPage(1); setSearch(e.target.value) }}
        />
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Processo</th>
              <th className="text-left px-4 py-2">Nome</th>
              <th className="text-left px-4 py-2">BI</th>
              <th className="text-left px-4 py-2">Sexo</th>
              <th className="text-left px-4 py-2">Telefone</th>
              <th className="text-right px-4 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {list.data.map((p) => (
              <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2 font-mono text-xs">{p.numero_processo}</td>
                <td className="px-4 py-2 font-medium">{p.nome}</td>
                <td className="px-4 py-2">{p.bi || '—'}</td>
                <td className="px-4 py-2">{p.sexo || '—'}</td>
                <td className="px-4 py-2">{p.telefone || '—'}</td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <div className="inline-flex gap-1">
                    <Link to={`/pacientes/${p.id}`} title="Ver detalhes" className="p-1.5 rounded hover:bg-slate-100 text-slate-600">
                      <Eye size={16} />
                    </Link>
                    <button onClick={() => openEdit(p)} title="Editar" className="p-1.5 rounded hover:bg-hgb-50 text-hgb-600">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => destroy(p.id)} title="Remover" className="p-1.5 rounded hover:bg-red-50 text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {list.data.length === 0 && (
              <tr><td colSpan="6" className="px-4 py-6 text-center text-slate-400">Nenhum paciente.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination meta={list} onPage={setPage} />

      <Modal open={open} title={form.id ? 'Editar paciente' : 'Novo paciente'} onClose={() => setOpen(false)} size="xl">
        <form onSubmit={save} className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Nome completo *</label>
            <input className="input" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </div>
          <div>
            <label className="label">Nome do pai</label>
            <input className="input" value={form.nome_pai || ''} onChange={(e) => setForm({ ...form, nome_pai: e.target.value })} />
          </div>
          <div>
            <label className="label">Nome da mãe</label>
            <input className="input" value={form.nome_mae || ''} onChange={(e) => setForm({ ...form, nome_mae: e.target.value })} />
          </div>
          <div>
            <label className="label">BI</label>
            <input className="input" value={form.bi || ''} onChange={(e) => setForm({ ...form, bi: e.target.value })} />
          </div>
          <div>
            <label className="label">BI — local de emissão</label>
            <input className="input" value={form.bi_emissao_local || ''} onChange={(e) => setForm({ ...form, bi_emissao_local: e.target.value })} />
          </div>
          <div>
            <label className="label">BI — data de emissão</label>
            <input type="date" className="input" value={form.bi_emissao_data || ''} onChange={(e) => setForm({ ...form, bi_emissao_data: e.target.value })} />
          </div>
          <div>
            <label className="label">Data de nascimento</label>
            <input type="date" className="input" value={form.data_nascimento || ''} onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })} />
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
            <label className="label">Estado civil</label>
            <select className="input" value={form.estado_civil || ''} onChange={(e) => setForm({ ...form, estado_civil: e.target.value })}>
              <option value="">—</option>
              <option value="Solteiro(a)">Solteiro(a)</option>
              <option value="Casado(a)">Casado(a)</option>
              <option value="Viúvo(a)">Viúvo(a)</option>
              <option value="Divorciado(a)">Divorciado(a)</option>
              <option value="União de facto">União de facto</option>
            </select>
          </div>
          <div>
            <label className="label">Grupo sanguíneo</label>
            <input className="input" value={form.grupo_sanguineo || ''} onChange={(e) => setForm({ ...form, grupo_sanguineo: e.target.value })} />
          </div>
          <div className="col-span-2 border-t pt-3 mt-2 text-xs font-semibold text-slate-500 uppercase">Naturalidade</div>
          <LocationPicker
            label="Naturalidade — "
            provincia={form.naturalidade_provincia}
            municipio={form.naturalidade_municipio}
            onChange={({ provincia, municipio }) => setForm({ ...form, naturalidade_provincia: provincia, naturalidade_municipio: municipio })}
          />
          <div className="col-span-2 border-t pt-3 mt-2 text-xs font-semibold text-slate-500 uppercase">Residência e contacto</div>
          <div className="col-span-2">
            <label className="label">Endereço</label>
            <input className="input" value={form.endereco || ''} onChange={(e) => setForm({ ...form, endereco: e.target.value })} />
          </div>
          <LocationPicker
            label="Residência — "
            provincia={form.provincia}
            municipio={form.municipio}
            onChange={({ provincia, municipio }) => setForm({ ...form, provincia, municipio })}
          />
          <div className="col-span-2">
            <label className="label">Bairro</label>
            <input className="input" value={form.bairro || ''} onChange={(e) => setForm({ ...form, bairro: e.target.value })} placeholder="Ex.: Bairro das Capiras" />
          </div>
          <div>
            <label className="label">Telefone</label>
            <input className="input" value={form.telefone || ''} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="label">Alergias</label>
            <textarea className="input" rows="2" value={form.alergias || ''} onChange={(e) => setForm({ ...form, alergias: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="label">Observações</label>
            <textarea className="input" rows="2" value={form.observacoes || ''} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
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
