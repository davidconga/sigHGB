import { useEffect, useRef, useState } from 'react'
import { UserPlus } from 'lucide-react'
import api from '../api/client'
import Modal from './Modal'
import LocationPicker from './LocationPicker'

const emptyForm = {
  nome: '', nome_pai: '', nome_mae: '',
  bi: '', bi_emissao_local: '', bi_emissao_data: '',
  data_nascimento: '', sexo: '', estado_civil: '',
  telefone: '',
  bairro: '', municipio: 'Benguela', provincia: 'Benguela',
  naturalidade_provincia: '', naturalidade_municipio: '',
}

export default function PacientePicker({ value, onPick }) {
  const [paciente, setPaciente] = useState(null)
  const [query, setQuery] = useState('')
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const timer = useRef(null)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!value) { setPaciente(null); return }
    if (paciente?.id === value) return
    api.get(`/pacientes/${value}`).then((r) => setPaciente(r.data)).catch(() => {})
  }, [value])

  useEffect(() => {
    function onDoc(e) { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  function search(q) {
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      setLoading(true)
      try {
        const { data } = await api.get('/pacientes', { params: { search: q, per_page: 10 } })
        setItems(data.data || [])
        setSearched(true)
        setOpen(true)
      } finally { setLoading(false) }
    }, 250)
  }

  function pick(p) {
    setPaciente(p)
    onPick?.(p)
    setOpen(false)
    setQuery('')
  }

  function clear() {
    setPaciente(null)
    onPick?.(null)
    setQuery('')
    setItems([])
    setSearched(false)
  }

  function openCreate() {
    setForm({ ...emptyForm, nome: query.trim() })
    setErrors({})
    setOpen(false)
    setCreateOpen(true)
  }

  async function createPaciente(e) {
    e.preventDefault()
    setSaving(true); setErrors({})
    try {
      const payload = { ...form }
      Object.keys(payload).forEach((k) => { if (payload[k] === '') payload[k] = null })
      const { data } = await api.post('/pacientes', payload)
      pick(data)
      setCreateOpen(false)
    } catch (e) {
      setErrors(e.response?.data?.errors || { _: [e.response?.data?.message || 'Erro ao criar paciente'] })
    } finally { setSaving(false) }
  }

  if (paciente) {
    return (
      <div className="border border-emerald-300 bg-emerald-50 rounded-md p-4 flex items-start justify-between gap-3">
        <div className="text-sm">
          <div className="font-semibold text-emerald-900">{paciente.nome}</div>
          <div className="text-slate-600 text-xs mt-0.5">
            <span className="font-mono">{paciente.numero_processo}</span>
            {paciente.bi && <> · BI: <span className="font-mono">{paciente.bi}</span></>}
            {paciente.data_nascimento && <> · {Math.floor((Date.now() - new Date(paciente.data_nascimento)) / (1000*60*60*24*365.25))} anos</>}
            {paciente.sexo && <> · {paciente.sexo === 'F' ? 'Feminino' : 'Masculino'}</>}
          </div>
          {(paciente.bairro || paciente.municipio) && (
            <div className="text-slate-500 text-xs">
              Residência: {[paciente.bairro, paciente.municipio].filter(Boolean).join(', ')}
            </div>
          )}
        </div>
        <button type="button" onClick={clear} className="text-sm text-emerald-700 hover:underline">Trocar</button>
      </div>
    )
  }

  return (
    <>
      <div className="relative" ref={wrapRef}>
        <input
          className="input"
          placeholder="Pesquisar paciente por nome, processo ou BI…"
          value={query}
          onChange={(e) => {
            const v = e.target.value
            setQuery(v)
            if (v.trim()) search(v.trim())
            else { setItems([]); setOpen(false); setSearched(false) }
          }}
          onFocus={() => { if (searched) setOpen(true) }}
          autoFocus
        />
        {open && (
          <ul className="absolute z-20 left-0 right-0 mt-1 max-h-80 overflow-auto bg-white border border-slate-200 rounded-md shadow-lg text-sm">
            {loading && <li className="px-3 py-2 text-slate-400">A pesquisar…</li>}
            {!loading && items.map((p) => (
              <li
                key={p.id}
                onMouseDown={(e) => { e.preventDefault(); pick(p) }}
                className="px-3 py-2 cursor-pointer hover:bg-hgb-50"
              >
                <div className="font-medium">{p.nome}</div>
                <div className="text-xs text-slate-500 font-mono">{p.numero_processo}{p.bi && ` · BI ${p.bi}`}</div>
              </li>
            ))}
            {!loading && items.length === 0 && searched && (
              <li className="px-3 py-3 text-center text-slate-500 text-sm">
                Sem resultados para <strong>"{query}"</strong>
              </li>
            )}
            {!loading && searched && (
              <li
                onMouseDown={(e) => { e.preventDefault(); openCreate() }}
                className="px-3 py-2.5 border-t border-slate-100 bg-slate-50 cursor-pointer hover:bg-hgb-50 text-hgb-700 font-medium flex items-center gap-2"
              >
                <UserPlus size={16} /> Criar novo paciente {query && <span className="text-slate-500 font-normal">"{query}"</span>}
              </li>
            )}
          </ul>
        )}
      </div>

      <Modal open={createOpen} title="Novo paciente" onClose={() => setCreateOpen(false)} size="xl">
        <form onSubmit={createPaciente} className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Nome completo *</label>
            <input className="input" required value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </div>
          <div>
            <label className="label">Nome do pai</label>
            <input className="input" value={form.nome_pai} onChange={(e) => setForm({ ...form, nome_pai: e.target.value })} />
          </div>
          <div>
            <label className="label">Nome da mãe</label>
            <input className="input" value={form.nome_mae} onChange={(e) => setForm({ ...form, nome_mae: e.target.value })} />
          </div>
          <div>
            <label className="label">BI</label>
            <input className="input" value={form.bi} onChange={(e) => setForm({ ...form, bi: e.target.value })} />
          </div>
          <div>
            <label className="label">BI — local emissão</label>
            <input className="input" value={form.bi_emissao_local} onChange={(e) => setForm({ ...form, bi_emissao_local: e.target.value })} />
          </div>
          <div>
            <label className="label">BI — data emissão</label>
            <input type="date" className="input" value={form.bi_emissao_data} onChange={(e) => setForm({ ...form, bi_emissao_data: e.target.value })} />
          </div>
          <div>
            <label className="label">Data de nascimento</label>
            <input type="date" className="input" value={form.data_nascimento} onChange={(e) => setForm({ ...form, data_nascimento: e.target.value })} />
          </div>
          <div>
            <label className="label">Sexo</label>
            <select className="input" value={form.sexo} onChange={(e) => setForm({ ...form, sexo: e.target.value })}>
              <option value="">—</option>
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
            </select>
          </div>
          <div>
            <label className="label">Estado civil</label>
            <select className="input" value={form.estado_civil} onChange={(e) => setForm({ ...form, estado_civil: e.target.value })}>
              <option value="">—</option>
              <option value="Solteiro(a)">Solteiro(a)</option>
              <option value="Casado(a)">Casado(a)</option>
              <option value="Viúvo(a)">Viúvo(a)</option>
              <option value="Divorciado(a)">Divorciado(a)</option>
              <option value="União de facto">União de facto</option>
            </select>
          </div>
          <div className="col-span-2 border-t pt-3 mt-2 text-xs font-semibold text-slate-500 uppercase">Naturalidade</div>
          <LocationPicker
            provincia={form.naturalidade_provincia}
            municipio={form.naturalidade_municipio}
            onChange={({ provincia, municipio }) => setForm({ ...form, naturalidade_provincia: provincia, naturalidade_municipio: municipio })}
          />
          <div className="col-span-2 border-t pt-3 mt-2 text-xs font-semibold text-slate-500 uppercase">Residência</div>
          <LocationPicker
            provincia={form.provincia}
            municipio={form.municipio}
            onChange={({ provincia, municipio }) => setForm({ ...form, provincia, municipio })}
          />
          <div className="col-span-2">
            <label className="label">Bairro</label>
            <input className="input" value={form.bairro} onChange={(e) => setForm({ ...form, bairro: e.target.value })} placeholder="Ex.: Bairro das Capiras" />
          </div>
          <div>
            <label className="label">Telefone</label>
            <input className="input" value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
          </div>

          {Object.keys(errors).length > 0 && (
            <div className="col-span-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
              {Object.values(errors).flat().join(' · ')}
            </div>
          )}

          <div className="col-span-2 flex justify-end gap-2 pt-2">
            <button type="button" className="btn-outline" onClick={() => setCreateOpen(false)}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={saving || !form.nome}>
              {saving ? 'A criar…' : 'Criar e selecionar'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
