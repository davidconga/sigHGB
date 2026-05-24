import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import api from '../api/client'
import { useHasRole } from '../auth/AuthContext'
import Modal from '../components/Modal'
import { useConfirm } from '../components/ConfirmDialog'

export default function PerfisPermissoes() {
  const confirm = useConfirm()
  const isAdmin = useHasRole()('admin')
  const [roles, setRoles] = useState([])
  const [perms, setPerms] = useState([])
  const [active, setActive] = useState(null)
  const [draft, setDraft] = useState([])
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')

  async function load() {
    const [r, p] = await Promise.all([api.get('/roles'), api.get('/permissions')])
    setRoles(r.data); setPerms(p.data)
    if (r.data.length && !active) {
      setActive(r.data[0].id)
      setDraft(r.data[0].permissions.map((pm) => pm.name))
    }
  }
  useEffect(() => { if (isAdmin) load() }, [isAdmin])

  function selectRole(id) {
    setActive(id)
    const r = roles.find((x) => x.id === id)
    setDraft(r?.permissions.map((p) => p.name) || [])
    setMsg('')
  }

  const grouped = useMemo(() => {
    const out = {}
    for (const p of perms) {
      const [resource] = p.name.split('.')
      if (!out[resource]) out[resource] = []
      out[resource].push(p)
    }
    return out
  }, [perms])

  function toggle(name) {
    setDraft((d) => d.includes(name) ? d.filter((x) => x !== name) : [...d, name])
  }

  function toggleResource(resource, allChecked) {
    const resourcePerms = grouped[resource].map((p) => p.name)
    setDraft((d) => allChecked ? d.filter((x) => !resourcePerms.includes(x)) : [...new Set([...d, ...resourcePerms])])
  }

  async function save() {
    setSaving(true); setMsg('')
    try {
      await api.put(`/roles/${active}`, { permissions: draft })
      setMsg('Permissões atualizadas.')
      await load()
    } catch (e) {
      setMsg(e.response?.data?.message || 'Erro ao guardar.')
    } finally { setSaving(false) }
  }

  async function createRole(e) {
    e.preventDefault()
    try {
      await api.post('/roles', { name: newName.trim(), permissions: [] })
      setNewName(''); setCreating(false); await load()
    } catch (e) {
      alert(e.response?.data?.errors?.name?.[0] || 'Erro')
    }
  }

  async function destroyRole(id) {
    const r = roles.find((x) => x.id === id)
    if (!await confirm(`Remover perfil "${r?.name}"?`)) return
    try { await api.delete(`/roles/${id}`); setActive(null); await load() }
    catch (e) { alert(e.response?.data?.message || 'Erro') }
  }

  if (!isAdmin) return <div className="card p-6 text-center text-slate-500">Apenas administradores.</div>

  const activeRole = roles.find((r) => r.id === active)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Perfis & Permissões</h1>
          <p className="text-sm text-slate-500">Define o que cada perfil pode fazer no sistema.</p>
        </div>
        <button onClick={() => setCreating(true)} className="btn-primary inline-flex items-center gap-1">
          <Plus size={16}/> Novo perfil
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <aside className="col-span-3 card p-3 space-y-1">
          {roles.map((r) => (
            <div key={r.id} className={`flex items-center justify-between rounded px-3 py-2 text-sm cursor-pointer ${
              active === r.id ? 'bg-hgb-600 text-white' : 'hover:bg-slate-50 text-slate-700'
            }`} onClick={() => selectRole(r.id)}>
              <span className="capitalize">{r.name}</span>
              <span className={`text-xs ${active === r.id ? 'text-hgb-100' : 'text-slate-400'}`}>{r.permissions.length}</span>
            </div>
          ))}
        </aside>

        <section className="col-span-9 card p-6">
          {activeRole && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold capitalize">{activeRole.name}</h2>
                {!['admin', 'medico', 'recepcionista'].includes(activeRole.name) && (
                  <button onClick={() => destroyRole(activeRole.id)} className="text-red-600 hover:underline text-sm inline-flex items-center gap-1">
                    <Trash2 size={14}/> Remover perfil
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {Object.entries(grouped).map(([resource, list]) => {
                  const allChecked = list.every((p) => draft.includes(p.name))
                  const someChecked = list.some((p) => draft.includes(p.name))
                  return (
                    <div key={resource} className="border border-slate-200 rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold capitalize text-slate-700">{resource}</div>
                        <button onClick={() => toggleResource(resource, allChecked)} className="text-xs text-hgb-600 hover:underline">
                          {allChecked ? 'Desmarcar tudo' : (someChecked ? 'Marcar todos' : 'Marcar todos')}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {list.map((p) => {
                          const checked = draft.includes(p.name)
                          const action = p.name.split('.')[1]
                          return (
                            <label key={p.id} className={`flex items-center gap-2 px-2.5 py-1 rounded border cursor-pointer text-xs ${
                              checked ? 'bg-hgb-50 border-hgb-500 text-hgb-700' : 'border-slate-200 hover:bg-slate-50'
                            }`}>
                              <input type="checkbox" checked={checked} onChange={() => toggle(p.name)} />
                              {action}
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>

              {msg && <div className="mt-4 text-sm bg-emerald-50 text-emerald-700 px-3 py-2 rounded">{msg}</div>}

              <div className="flex justify-end mt-4">
                <button onClick={save} disabled={saving} className="btn-primary">
                  {saving ? 'A guardar…' : 'Guardar alterações'}
                </button>
              </div>
            </>
          )}
        </section>
      </div>

      <Modal open={creating} title="Novo perfil" onClose={() => setCreating(false)} size="md">
        <form onSubmit={createRole} className="space-y-4">
          <div>
            <label className="label">Nome do perfil *</label>
            <input className="input" required value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex.: enfermeiro" />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-outline" onClick={() => setCreating(false)}>Cancelar</button>
            <button type="submit" className="btn-primary">Criar</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
