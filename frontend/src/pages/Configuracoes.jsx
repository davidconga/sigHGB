import { useEffect, useState } from 'react'
import { Building2, Briefcase, Settings as SettingsIcon, Plus, Pencil, Trash2 } from 'lucide-react'
import api from '../api/client'
import { useAuth } from '../auth/AuthContext'
import Modal from '../components/Modal'
import { useConfirm } from '../components/ConfirmDialog'

const TABS = [
  { id: 'geral', label: 'Geral', Icon: SettingsIcon },
  { id: 'departamentos', label: 'Departamentos', Icon: Building2 },
  { id: 'servicos', label: 'Serviços', Icon: Briefcase },
]

export default function Configuracoes() {
  const confirm = useConfirm()
  const { user } = useAuth()
  const [tab, setTab] = useState('geral')

  if (!user || !user.roles?.includes('admin')) {
    return <div className="card p-6 text-center text-slate-500">Apenas administradores podem aceder às configurações.</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Configurações</h1>
      <p className="text-sm text-slate-500 mb-6">Dados institucionais e gestão de estruturas</p>

      <div className="flex gap-1 mb-4 border-b border-slate-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium inline-flex items-center gap-2 border-b-2 -mb-px transition ${
              tab === t.id ? 'border-hgb-600 text-hgb-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <t.Icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'geral' && <TabGeral />}
      {tab === 'departamentos' && <TabDepartamentos />}
      {tab === 'servicos' && <TabServicos />}
    </div>
  )
}

const LABELS_GERAL = {
  notify_medico_atestado_enabled: 'Notificar médico ao receber atestado (SMS)',
  notify_medico_atestado_template: 'Template SMS — atribuição de atestado',
  notify_medico_relatorio_enabled: 'Notificar médico ao receber relatório (SMS)',
  notify_medico_relatorio_template: 'Template SMS — atribuição de relatório',
  sms_aniversario_template: 'Template SMS de aniversário',
  hospital_nome: 'Nome do hospital',
  hospital_endereco: 'Endereço',
  hospital_localidade: 'Localidade',
  directora_nome: 'Nome da directora clínica',
  directora_especialidade: 'Especialidade',
  directora_titulo: 'Título da assinatura',
}

const TOGGLE_KEYS = ['notify_medico_atestado_enabled', 'notify_medico_relatorio_enabled']
const TEMPLATE_KEYS = ['sms_aniversario_template', 'notify_medico_atestado_template', 'notify_medico_relatorio_template']

function TabGeral() {
  const [settings, setSettings] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    api.get('/settings').then((r) => { setSettings(r.data); setLoading(false) })
  }, [])

  if (loading) return <div className="text-slate-500">A carregar…</div>

  function update(chave, valor) {
    setSettings((arr) => arr.map((s) => s.chave === chave ? { ...s, valor } : s))
  }

  async function save() {
    setSaving(true); setMsg('')
    try {
      await api.put('/settings', { settings: settings.map(({ chave, valor }) => ({ chave, valor })) })
      setMsg('Configurações guardadas.')
      setTimeout(() => setMsg(''), 3000)
    } catch { setMsg('Erro ao guardar.') }
    finally { setSaving(false) }
  }

  return (
    <div className="card p-6 space-y-4 max-w-3xl">
      {settings.map((s) => (
        <div key={s.chave}>
          {TOGGLE_KEYS.includes(s.chave) ? (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={s.valor === '1'}
                onChange={(e) => update(s.chave, e.target.checked ? '1' : '0')}
              />
              <span className="text-sm font-medium">{LABELS_GERAL[s.chave] || s.chave}</span>
            </label>
          ) : (
            <>
              <label className="label">{LABELS_GERAL[s.chave] || s.chave}</label>
              {TEMPLATE_KEYS.includes(s.chave) ? (
                <textarea
                  className="input font-mono text-xs"
                  rows="3"
                  value={s.valor || ''}
                  onChange={(e) => update(s.chave, e.target.value)}
                />
              ) : (
                <input className="input" value={s.valor || ''} onChange={(e) => update(s.chave, e.target.value)} />
              )}
            </>
          )}
          {s.descricao && <p className="text-xs text-slate-500 mt-1">{s.descricao}</p>}
        </div>
      ))}
      {msg && <div className="text-sm bg-emerald-50 text-emerald-700 px-3 py-2 rounded">{msg}</div>}
      <div className="flex justify-end pt-2">
        <button className="btn-primary" disabled={saving} onClick={save}>
          {saving ? 'A guardar…' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}

function TabDepartamentos() {
  const [list, setList] = useState([])
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ nome: '' })
  const [err, setErr] = useState('')

  async function load() {
    const { data } = await api.get('/departamentos', { params: { search } })
    setList(data)
  }
  useEffect(() => { load() }, [search])

  function openNew() { setForm({ nome: '' }); setErr(''); setOpen(true) }
  function openEdit(d) { setForm({ id: d.id, nome: d.nome }); setErr(''); setOpen(true) }

  async function save(e) {
    e.preventDefault(); setErr('')
    try {
      if (form.id) await api.put(`/departamentos/${form.id}`, { nome: form.nome })
      else await api.post('/departamentos', { nome: form.nome })
      setOpen(false); load()
    } catch (e) {
      setErr(e.response?.data?.errors?.nome?.[0] || 'Erro')
    }
  }

  async function destroy(d) {
    if (!await confirm(`Remover departamento "${d.nome}"? Os serviços associados serão removidos.`)) return
    try { await api.delete(`/departamentos/${d.id}`); load() }
    catch (e) { alert(e.response?.data?.message || 'Erro') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <input className="input w-72" placeholder="Pesquisar…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn-primary inline-flex items-center gap-1" onClick={openNew}>
          <Plus size={16} /> Novo departamento
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Nome</th>
              <th className="text-left px-4 py-2 w-32">Serviços</th>
              <th className="text-left px-4 py-2 w-32">Funcionários</th>
              <th className="text-right px-4 py-2 w-32">Ações</th>
            </tr>
          </thead>
          <tbody>
            {list.map((d) => (
              <tr key={d.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2 font-medium">{d.nome}</td>
                <td className="px-4 py-2">{d.servicos_count}</td>
                <td className="px-4 py-2">{d.funcionarios_count}</td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <div className="inline-flex gap-1">
                    <button onClick={() => openEdit(d)} title="Editar" className="p-1.5 rounded hover:bg-hgb-50 text-hgb-600"><Pencil size={16}/></button>
                    <button onClick={() => destroy(d)} title="Remover" className="p-1.5 rounded hover:bg-red-50 text-red-600"><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan="4" className="px-4 py-6 text-center text-slate-400">Sem departamentos.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={open} title={form.id ? 'Editar departamento' : 'Novo departamento'} onClose={() => setOpen(false)} size="md">
        <form onSubmit={save} className="space-y-3">
          <div>
            <label className="label">Nome *</label>
            <input className="input" required autoFocus value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </div>
          {err && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{err}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-outline" onClick={() => setOpen(false)}>Cancelar</button>
            <button type="submit" className="btn-primary">Guardar</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function TabServicos() {
  const [list, setList] = useState([])
  const [departamentos, setDepartamentos] = useState([])
  const [search, setSearch] = useState('')
  const [filterDep, setFilterDep] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ nome: '', departamento_id: '' })
  const [err, setErr] = useState('')

  async function load() {
    const params = { search, ...(filterDep ? { departamento_id: filterDep } : {}) }
    const { data } = await api.get('/servicos', { params })
    setList(data)
  }
  useEffect(() => { load() }, [search, filterDep])
  useEffect(() => {
    api.get('/departamentos').then((r) => setDepartamentos(r.data))
  }, [])

  function openNew() { setForm({ nome: '', departamento_id: filterDep || '' }); setErr(''); setOpen(true) }
  function openEdit(s) { setForm({ id: s.id, nome: s.nome, departamento_id: s.departamento_id }); setErr(''); setOpen(true) }

  async function save(e) {
    e.preventDefault(); setErr('')
    try {
      const payload = { nome: form.nome, departamento_id: form.departamento_id }
      if (form.id) await api.put(`/servicos/${form.id}`, payload)
      else await api.post('/servicos', payload)
      setOpen(false); load()
    } catch (e) {
      const errors = e.response?.data?.errors
      setErr(errors ? Object.values(errors).flat().join(' · ') : 'Erro')
    }
  }

  async function destroy(s) {
    if (!await confirm(`Remover serviço "${s.nome}"?`)) return
    try { await api.delete(`/servicos/${s.id}`); load() }
    catch (e) { alert(e.response?.data?.message || 'Erro') }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3 gap-2">
        <div className="flex gap-2 flex-1">
          <input className="input flex-1 max-w-xs" placeholder="Pesquisar…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="input w-auto" value={filterDep} onChange={(e) => setFilterDep(e.target.value)}>
            <option value="">Todos os departamentos</option>
            {departamentos.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
          </select>
        </div>
        <button className="btn-primary inline-flex items-center gap-1" onClick={openNew}>
          <Plus size={16} /> Novo serviço
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Nome</th>
              <th className="text-left px-4 py-2">Departamento</th>
              <th className="text-left px-4 py-2 w-32">Funcionários</th>
              <th className="text-right px-4 py-2 w-32">Ações</th>
            </tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2 font-medium">{s.nome}</td>
                <td className="px-4 py-2 text-xs text-slate-600">{s.departamento?.nome}</td>
                <td className="px-4 py-2">{s.funcionarios_count}</td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <div className="inline-flex gap-1">
                    <button onClick={() => openEdit(s)} title="Editar" className="p-1.5 rounded hover:bg-hgb-50 text-hgb-600"><Pencil size={16}/></button>
                    <button onClick={() => destroy(s)} title="Remover" className="p-1.5 rounded hover:bg-red-50 text-red-600"><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan="4" className="px-4 py-6 text-center text-slate-400">Sem serviços.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={open} title={form.id ? 'Editar serviço' : 'Novo serviço'} onClose={() => setOpen(false)} size="md">
        <form onSubmit={save} className="space-y-3">
          <div>
            <label className="label">Departamento *</label>
            <select className="input" required value={form.departamento_id} onChange={(e) => setForm({ ...form, departamento_id: e.target.value })}>
              <option value="">—</option>
              {departamentos.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Nome *</label>
            <input className="input" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </div>
          {err && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{err}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-outline" onClick={() => setOpen(false)}>Cancelar</button>
            <button type="submit" className="btn-primary">Guardar</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
