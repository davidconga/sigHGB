import { useEffect, useMemo, useState } from 'react'
import {
  Printer, Plus, FileText, HeartPulse, BedDouble, ClipboardCheck, FileBadge,
  Search, Filter, X, Pencil, Trash2, ShieldCheck, Eye,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import api, { downloadPdf } from '../../api/client'
import { useLookups } from '../../api/lookups'
import Modal from '../../components/Modal'
import Pagination from '../../components/Pagination'
import StatusBadge from '../../components/StatusBadge'
import Stepper from '../../components/Stepper'
import PacientePicker from '../../components/PacientePicker'
import CidAutocomplete from '../../components/CidAutocomplete'
import RichTextEditor from '../../components/RichTextEditor'
import ValidarAssinaturaModal from '../../components/ValidarAssinaturaModal'
import { useConfirm } from '../../components/ConfirmDialog'

const TIPOS = [
  {
    value: 'aptidao',
    label: 'Aptidão',
    desc: 'Boa saúde física e mental — para matrícula, trabalho, desporto, inscrição',
    Icon: HeartPulse, color: 'bg-emerald-600',
  },
  {
    value: 'repouso',
    label: 'Repouso',
    desc: 'Justificação para repouso médico com período específico',
    Icon: BedDouble, color: 'bg-amber-600',
  },
  {
    value: 'comparecimento',
    label: 'Comparecimento',
    desc: 'Justificação de presença em consulta ou exame',
    Icon: ClipboardCheck, color: 'bg-hgb-600',
  },
  {
    value: 'outros',
    label: 'Outros',
    desc: 'Atestado médico genérico',
    Icon: FileBadge, color: 'bg-slate-600',
  },
]

const EFEITOS = ['Matrícula', 'Trabalho', 'Desporto', 'Inscrição']

const empty = {
  paciente_id: '', medico_id: '', tipo: '',
  data_emissao: new Date().toISOString().slice(0, 10),
  data_inicio_repouso: '', data_fim_repouso: '', dias_repouso: '',
  diagnostico: '', cid: '', motivo: '', destino: '', observacoes: '',
  status: 'rascunho',
}

const emptyFilters = {
  search: '', tipo: '', destino: '', status: '', medico_id: '',
  data_de: '', data_ate: '', cid: '',
}

export default function Atestados() {
  const confirm = useConfirm()
  const { medicos } = useLookups()
  const [list, setList] = useState({ data: [], current_page: 1, last_page: 1, total: 0 })
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState(emptyFilters)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(empty)
  const [saved, setSaved] = useState(null)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [validarDoc, setValidarDoc] = useState(null)

  const activeFilterCount = useMemo(
    () => Object.entries(filters).filter(([k, v]) => k !== 'search' && v).length,
    [filters]
  )

  async function load() {
    const params = { page, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) }
    const { data } = await api.get('/atestados', { params })
    setList(data)
  }
  useEffect(() => {
    const t = setTimeout(load, filters.search ? 350 : 0)
    return () => clearTimeout(t)
  }, [page, filters])

  function updateFilter(k, v) {
    setPage(1)
    setFilters((f) => ({ ...f, [k]: v }))
  }

  function clearFilters() {
    setPage(1)
    setFilters(emptyFilters)
  }

  function openNew() {
    setForm(empty); setStep(0); setSaved(null); setErrors({}); setOpen(true)
  }
  function openEdit(a) {
    setForm({
      ...empty, ...a,
      data_emissao: a.data_emissao?.slice(0, 10) || '',
      data_inicio_repouso: a.data_inicio_repouso?.slice(0, 10) || '',
      data_fim_repouso: a.data_fim_repouso?.slice(0, 10) || '',
    })
    setStep(2); setSaved(null); setErrors({}); setOpen(true)
  }

  async function save() {
    setSaving(true); setErrors({})
    try {
      const payload = { ...form }
      Object.keys(payload).forEach((k) => { if (payload[k] === '') payload[k] = null })
      const { data } = form.id
        ? await api.put(`/atestados/${form.id}`, payload)
        : await api.post('/atestados', payload)
      setSaved(data); setStep(3); load()
    } catch (e) {
      setErrors(e.response?.data?.errors || { _: [e.response?.data?.message || 'Erro'] })
    } finally { setSaving(false) }
  }

  async function destroy(id) {
    if (!await confirm('Remover atestado?')) return
    await api.delete(`/atestados/${id}`); load()
  }

  const selectedTipo = TIPOS.find((t) => t.value === form.tipo)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Atestados médicos</h1>
        <button className="btn-primary inline-flex items-center gap-1" onClick={openNew}>
          <Plus size={16} /> Novo atestado
        </button>
      </div>

      <div className="card p-4 mb-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Pesquisar por nº, paciente (nome/BI/processo), motivo…"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`btn-outline inline-flex items-center gap-2 ${showAdvanced ? 'bg-hgb-50 border-hgb-500 text-hgb-700' : ''}`}
          >
            <Filter size={16} />
            Filtros
            {activeFilterCount > 0 && (
              <span className="bg-hgb-600 text-white rounded-full px-1.5 py-0.5 text-xs font-bold">{activeFilterCount}</span>
            )}
          </button>
          {(activeFilterCount > 0 || filters.search) && (
            <button type="button" onClick={clearFilters} className="btn-outline inline-flex items-center gap-1 text-red-600">
              <X size={14} /> Limpar
            </button>
          )}
        </div>

        {showAdvanced && (
          <div className="grid grid-cols-4 gap-3 pt-3 border-t border-slate-100">
            <div>
              <label className="label">Tipo</label>
              <select className="input" value={filters.tipo} onChange={(e) => updateFilter('tipo', e.target.value)}>
                <option value="">Todos</option>
                <option value="aptidao">Aptidão</option>
                <option value="repouso">Repouso</option>
                <option value="comparecimento">Comparecimento</option>
                <option value="outros">Outros</option>
              </select>
            </div>
            <div>
              <label className="label">Efeito</label>
              <select className="input" value={filters.destino} onChange={(e) => updateFilter('destino', e.target.value)}>
                <option value="">Todos</option>
                <option value="Matrícula">Matrícula</option>
                <option value="Trabalho">Trabalho</option>
                <option value="Desporto">Desporto</option>
                <option value="Inscrição">Inscrição</option>
              </select>
            </div>
            <div>
              <label className="label">Estado</label>
              <select className="input" value={filters.status} onChange={(e) => updateFilter('status', e.target.value)}>
                <option value="">Todos</option>
                <option value="rascunho">Rascunho</option>
                <option value="emitido">Emitido</option>
                <option value="anulado">Anulado</option>
              </select>
            </div>
            <div>
              <label className="label">Médico</label>
              <select className="input" value={filters.medico_id} onChange={(e) => updateFilter('medico_id', e.target.value)}>
                <option value="">Todos</option>
                {medicos.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="label">De</label>
              <input type="date" className="input" value={filters.data_de} onChange={(e) => updateFilter('data_de', e.target.value)} />
            </div>
            <div>
              <label className="label">Até</label>
              <input type="date" className="input" value={filters.data_ate} onChange={(e) => updateFilter('data_ate', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label">CID</label>
              <CidAutocomplete value={filters.cid} onChange={(v) => updateFilter('cid', v)} />
            </div>
          </div>
        )}

        <div className="text-xs text-slate-500">
          {list.total ?? 0} resultado{list.total === 1 ? '' : 's'}
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Nº</th>
              <th className="text-left px-4 py-2">Emissão</th>
              <th className="text-left px-4 py-2">Paciente</th>
              <th className="text-left px-4 py-2">Tipo</th>
              <th className="text-left px-4 py-2">Efeito</th>
              <th className="text-left px-4 py-2">Estado</th>
              <th className="text-right px-4 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {list.data.map((a) => (
              <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2 font-mono text-xs">{a.numero}</td>
                <td className="px-4 py-2">{a.data_emissao?.slice(0, 10)}</td>
                <td className="px-4 py-2">{a.paciente?.nome}</td>
                <td className="px-4 py-2 capitalize">{a.tipo}</td>
                <td className="px-4 py-2 text-xs">{a.destino || '—'}</td>
                <td className="px-4 py-2"><StatusBadge status={a.status} /></td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <div className="inline-flex gap-1">
                    <Link to={`/atestados/${a.id}`} title="Ver detalhes" className="p-1.5 rounded hover:bg-slate-100 text-slate-600">
                      <Eye size={16} />
                    </Link>
                    <button onClick={() => downloadPdf(`/atestados/${a.id}/pdf`)} title="Ver PDF" className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600">
                      <Printer size={16} />
                    </button>
                    {a.status === 'rascunho' && (
                      <button onClick={() => setValidarDoc(a)} title="Validar e assinar" className="p-1.5 rounded hover:bg-amber-50 text-amber-700">
                        <ShieldCheck size={16} />
                      </button>
                    )}
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
              <tr><td colSpan="7" className="px-4 py-6 text-center text-slate-400">Sem atestados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination meta={list} onPage={setPage} />

      <Modal open={open} title={form.id ? 'Editar atestado' : 'Novo atestado'} onClose={() => setOpen(false)} size="xl">
        <Stepper steps={['Tipo', 'Paciente', 'Dados', 'Gerar']} current={step} />

        {step === 0 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 mb-2">Seleciona o tipo de atestado.</p>
            <div className="grid grid-cols-2 gap-3">
              {TIPOS.map((t) => {
                const selected = form.tipo === t.value
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm({ ...form, tipo: t.value })}
                    className={`flex items-start gap-3 p-4 rounded-lg border-2 text-left transition ${
                      selected ? 'border-hgb-600 bg-hgb-50' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded ${t.color} text-white flex items-center justify-center flex-shrink-0`}>
                      <t.Icon size={20} />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{t.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{t.desc}</div>
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="flex justify-end pt-3">
              <button className="btn-primary" disabled={!form.tipo} onClick={() => setStep(1)}>Próximo →</button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Tipo selecionado: <strong>{selectedTipo?.label}</strong>. Agora seleciona o paciente.
            </p>
            <PacientePicker
              value={form.paciente_id || null}
              onPick={(p) => setForm({ ...form, paciente_id: p?.id || '' })}
            />
            <div className="flex justify-between pt-2">
              <button className="btn-outline" onClick={() => setStep(0)}>← Voltar</button>
              <button className="btn-primary" disabled={!form.paciente_id} onClick={() => setStep(2)}>Próximo →</button>
            </div>
          </div>
        )}

        {step === 2 && (
          <form onSubmit={(e) => { e.preventDefault(); save() }} className="grid grid-cols-2 gap-4">
            <div className="col-span-2 bg-slate-50 rounded p-3 text-xs text-slate-600">
              Atestado de <strong>{selectedTipo?.label}</strong>
            </div>

            <div>
              <label className="label">Médico *</label>
              <select className="input" required value={form.medico_id || ''} onChange={(e) => setForm({ ...form, medico_id: e.target.value })}>
                <option value="">—</option>
                {medicos.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Data emissão *</label>
              <input type="date" required className="input" value={form.data_emissao} onChange={(e) => setForm({ ...form, data_emissao: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="label">Para efeito de *</label>
              <select className="input" required value={form.destino || ''} onChange={(e) => setForm({ ...form, destino: e.target.value })}>
                <option value="">—</option>
                {EFEITOS.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>

            {form.tipo === 'repouso' && (
              <>
                <div>
                  <label className="label">Início repouso</label>
                  <input type="date" className="input" value={form.data_inicio_repouso || ''} onChange={(e) => setForm({ ...form, data_inicio_repouso: e.target.value })} />
                </div>
                <div>
                  <label className="label">Fim repouso</label>
                  <input type="date" className="input" value={form.data_fim_repouso || ''} onChange={(e) => setForm({ ...form, data_fim_repouso: e.target.value })} />
                </div>
                <div>
                  <label className="label">Dias de repouso</label>
                  <input type="number" min="1" className="input" value={form.dias_repouso || ''} onChange={(e) => setForm({ ...form, dias_repouso: e.target.value })} />
                </div>
              </>
            )}

            <div>
              <label className="label">CID</label>
              <CidAutocomplete value={form.cid || ''} onChange={(v) => setForm({ ...form, cid: v })} />
            </div>

            <div className="col-span-2">
              <label className="label">Diagnóstico</label>
              <RichTextEditor value={form.diagnostico} onChange={(v) => setForm({ ...form, diagnostico: v })} minHeight={70} />
            </div>
            <div className="col-span-2">
              <label className="label">Finalidade / motivo</label>
              <RichTextEditor value={form.motivo} onChange={(v) => setForm({ ...form, motivo: v })} minHeight={70} />
            </div>
            <div className="col-span-2">
              <label className="label">Observações</label>
              <RichTextEditor value={form.observacoes} onChange={(v) => setForm({ ...form, observacoes: v })} minHeight={70} />
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

            <div className="col-span-2 flex justify-between pt-2">
              <button type="button" className="btn-outline" onClick={() => setStep(1)}>← Voltar</button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'A guardar…' : 'Guardar e gerar →'}
              </button>
            </div>
          </form>
        )}

        {step === 3 && saved && (
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="text-emerald-600" size={32} />
            </div>
            <h3 className="text-lg font-bold mb-1">Atestado gerado!</h3>
            <p className="text-slate-500 text-sm mb-1">Nº <span className="font-mono">{saved.numero}</span></p>
            <p className="text-slate-500 text-sm mb-6">
              Estado: <StatusBadge status={saved.status} />
              {saved.codigo_verificacao && <> · Código verificação: <span className="font-mono">{saved.codigo_verificacao}</span></>}
            </p>
            <div className="flex justify-center gap-3">
              <button className="btn-primary inline-flex items-center gap-1" onClick={() => downloadPdf(`/atestados/${saved.id}/pdf`)}>
                <Printer size={16} /> Ver / Imprimir PDF
              </button>
              <button className="btn-outline" onClick={() => setOpen(false)}>Fechar</button>
              <button className="btn-outline" onClick={openNew}>+ Novo</button>
            </div>
          </div>
        )}
      </Modal>

      <ValidarAssinaturaModal
        open={!!validarDoc}
        documento={validarDoc}
        tipo="atestados"
        onClose={() => setValidarDoc(null)}
        onSuccess={() => { setValidarDoc(null); load() }}
      />
    </div>
  )
}
