import { useEffect, useMemo, useState } from 'react'
import {
  MessageSquare, Send, Users, Plus, Clock, Trash2, X, Search,
  CheckCircle2, AlertCircle, Loader, Calendar, Wallet, Eye, RotateCcw, PhoneCall,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { useCan } from '../auth/AuthContext'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import PacientePicker from '../components/PacientePicker'
import { useConfirm } from '../components/ConfirmDialog'

const STATUS_BADGE = {
  pendente: { cls: 'bg-amber-100 text-amber-700', Icon: Loader, label: 'Pendente' },
  enviado: { cls: 'bg-emerald-100 text-emerald-700', Icon: CheckCircle2, label: 'Enviado' },
  falhado: { cls: 'bg-red-100 text-red-700', Icon: AlertCircle, label: 'Falhado' },
  cancelado: { cls: 'bg-slate-100 text-slate-600', Icon: X, label: 'Cancelado' },
}

function StatusPill({ status }) {
  const s = STATUS_BADGE[status] || STATUS_BADGE.pendente
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${s.cls}`}>
      <s.Icon size={12} /> {s.label}
    </span>
  )
}

const emptyFilters = { search: '', status: '', data_de: '', data_ate: '' }

export default function Sms() {
  const confirm = useConfirm()
  const can = useCan()
  const [list, setList] = useState({ data: [], current_page: 1, last_page: 1, total: 0 })
  const [stats, setStats] = useState(null)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState(emptyFilters)
  const [composeOpen, setComposeOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [pedidoOpen, setPedidoOpen] = useState(false)

  async function load() {
    const params = { page, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) }
    const [{ data: l }, { data: s }] = await Promise.all([
      api.get('/sms', { params }),
      api.get('/sms/stats'),
    ])
    setList(l); setStats(s)
  }
  useEffect(() => {
    const t = setTimeout(load, filters.search ? 350 : 0)
    return () => clearTimeout(t)
  }, [page, filters])

  async function cancel(id) {
    if (!await confirm('Cancelar este SMS pendente?')) return
    await api.post(`/sms/${id}/cancel`); load()
  }
  async function destroy(id) {
    if (!await confirm('Remover SMS do histórico?')) return
    await api.delete(`/sms/${id}`); load()
  }
  async function resend(id) {
    if (!await confirm('Reenviar este SMS com o mesmo conteúdo?')) return
    await api.post(`/sms/${id}/resend`); load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold inline-flex items-center gap-2">
            <MessageSquare size={24} className="text-hgb-600" /> SMS
          </h1>
          {stats && (
            <p className="text-xs text-slate-500 mt-0.5">
             
              {stats.driver === 'log' && <span className="ml-2 text-amber-600">(modo teste — SMS apenas gravados em log)</span>}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {can('sms.bulk') && (
            <button onClick={() => setBulkOpen(true)} className="btn-outline inline-flex items-center gap-1">
              <Users size={16} /> Envio em massa
            </button>
          )}
          {can('sms.send') && (
            <button onClick={() => setComposeOpen(true)} className="btn-primary inline-flex items-center gap-1">
              <Plus size={16} /> Novo SMS
            </button>
          )}
        </div>
      </div>

      {stats?.balance?.ok && (
        <div className={`card p-4 mb-4 bg-gradient-to-r border flex items-center gap-4 ${
          stats.balance.sms_available < 100
            ? 'from-red-50 to-amber-50 border-red-200'
            : 'from-hgb-50 to-emerald-50 border-hgb-200'
        }`}>
          <div className={`w-12 h-12 text-white rounded-full flex items-center justify-center ${
            stats.balance.sms_available < 100 ? 'bg-red-600' : 'bg-hgb-600'
          }`}>
            <Wallet size={22} />
          </div>
          <div className="flex-1">
            <div className="text-xs text-slate-500 uppercase tracking-wide">Saldo Okulandisa</div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-hgb-700">{stats.balance.sms_available}</span>
              <span className="text-sm text-slate-500">SMS disponíveis</span>
              <span className="text-xs text-slate-400 ml-3">· {stats.balance.sms_sent} enviados no total</span>
            </div>
          </div>
          {stats.balance.plan_expired && (
            <span className="badge-anulado">PLANO EXPIRADO</span>
          )}
          <button onClick={() => setPedidoOpen(true)} className="btn-outline inline-flex items-center gap-1 text-sm">
            <PhoneCall size={14} /> Solicitar saldo
          </button>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-5 gap-3 mb-4">
          <Card label="Enviados" value={stats.enviados} color="bg-emerald-600" Icon={CheckCircle2} />
          <Card label="Pendentes" value={stats.pendentes} color="bg-amber-600" Icon={Loader} />
          <Card label="Agendados futuros" value={stats.agendados_futuros} color="bg-indigo-600" Icon={Calendar} />
          <Card label="Falhados" value={stats.falhados} color="bg-red-600" Icon={AlertCircle} />
          <Card label="Cancelados" value={stats.cancelados} color="bg-slate-500" Icon={X} />
        </div>
      )}

      <div className="card p-3 mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Pesquisar nº, paciente ou mensagem…"
            value={filters.search}
            onChange={(e) => { setPage(1); setFilters((f) => ({ ...f, search: e.target.value })) }}
          />
        </div>
        <select className="input w-auto" value={filters.status}
          onChange={(e) => { setPage(1); setFilters((f) => ({ ...f, status: e.target.value })) }}>
          <option value="">Todos os estados</option>
          <option value="pendente">Pendente</option>
          <option value="enviado">Enviado</option>
          <option value="falhado">Falhado</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Destino</th>
              <th className="text-left px-4 py-2">Funcionário</th>
              <th className="text-left px-4 py-2">Paciente</th>
              <th className="text-left px-4 py-2">Mensagem</th>
              <th className="text-left px-4 py-2">Estado</th>
              <th className="text-left px-4 py-2">Quando</th>
              <th className="text-right px-4 py-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {list.data.map((m) => (
              <tr key={m.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2 font-mono text-xs">{m.to}</td>
                <td className="px-4 py-2 text-xs">{m.funcionario?.nome || '—'}</td>
                <td className="px-4 py-2 text-xs">{m.paciente?.nome || '—'}</td>
                <td className="px-4 py-2 truncate max-w-md">{m.body}</td>
                <td className="px-4 py-2"><StatusPill status={m.status} /></td>
                <td className="px-4 py-2 text-xs text-slate-500">
                  {m.scheduled_at && m.status === 'pendente'
                    ? <span className="inline-flex items-center gap-1"><Clock size={12} /> {new Date(m.scheduled_at).toLocaleString('pt-PT')}</span>
                    : m.sent_at
                      ? new Date(m.sent_at).toLocaleString('pt-PT')
                      : new Date(m.created_at).toLocaleString('pt-PT')}
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <div className="inline-flex gap-1">
                    <Link to={`/sms/${m.id}`} title="Ver detalhes" className="p-1.5 rounded hover:bg-slate-100 text-slate-600">
                      <Eye size={16} />
                    </Link>
                    {(m.status === 'enviado' || m.status === 'falhado') && (
                      <button onClick={() => resend(m.id)} title="Reenviar" className="p-1.5 rounded hover:bg-hgb-50 text-hgb-600">
                        <RotateCcw size={16} />
                      </button>
                    )}
                    {m.status === 'pendente' && (
                      <button onClick={() => cancel(m.id)} title="Cancelar" className="p-1.5 rounded hover:bg-amber-50 text-amber-600">
                        <X size={16} />
                      </button>
                    )}
                    <button onClick={() => destroy(m.id)} title="Remover" className="p-1.5 rounded hover:bg-red-50 text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {list.data.length === 0 && (
              <tr><td colSpan="7" className="px-4 py-6 text-center text-slate-400">Sem SMS.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination meta={list} onPage={setPage} />

      <ComposeModal open={composeOpen} onClose={() => setComposeOpen(false)} onSent={load} />
      <BulkModal open={bulkOpen} onClose={() => setBulkOpen(false)} onSent={load} />
      <PedidoSaldoModal open={pedidoOpen} onClose={() => setPedidoOpen(false)} onSent={load} />
    </div>
  )
}

function PedidoSaldoModal({ open, onClose, onSent }) {
  const [quantidade, setQuantidade] = useState(1000)
  const [mensagem, setMensagem] = useState('')
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState(null)
  const [err, setErr] = useState('')

  async function submit(e) {
    e.preventDefault(); setSaving(true); setErr(''); setResult(null)
    try {
      const { data } = await api.post('/sms-pedido-saldo', {
        quantidade: quantidade || null,
        mensagem: mensagem || null,
      })
      setResult(data)
      onSent?.()
    } catch (e) {
      setErr(e.response?.data?.message || 'Erro ao enviar pedido')
    } finally { setSaving(false) }
  }

  function reset() { setResult(null); setErr(''); setMensagem(''); setQuantidade(1000) }

  return (
    <Modal open={open} title="Solicitar saldo SMS" onClose={() => { reset(); onClose() }} size="md">
      {result ? (
        <div className="text-center py-6">
          <CheckCircle2 className="text-emerald-600 mx-auto mb-3" size={48} />
          <h3 className="text-lg font-bold mb-1">Pedido enviado!</h3>
          <p className="text-sm text-slate-500 mb-1">Enviado SMS para <span className="font-mono">935698185</span></p>
          <p className="text-xs text-slate-400">A Okulandisa SMS vai entrar em contacto para confirmar a recarga.</p>
          <button className="btn-primary mt-6" onClick={() => { reset(); onClose() }}>Fechar</button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="bg-slate-50 rounded p-3 text-sm">
            <div className="font-semibold mb-1 inline-flex items-center gap-1"><PhoneCall size={14}/> Okulandisa SMS</div>
            <div className="text-xs text-slate-600">
              Será enviada uma mensagem para <strong className="font-mono">935698185</strong> a solicitar
              recarga do saldo SMS do hospital.
            </div>
          </div>

          <div>
            <label className="label">Quantidade pretendida</label>
            <input type="number" min="100" step="100" className="input"
              value={quantidade} onChange={(e) => setQuantidade(parseInt(e.target.value) || 0)} />
            <p className="text-xs text-slate-500 mt-1">Indique quantos SMS pretende recarregar.</p>
          </div>

          <div>
            <label className="label">Mensagem adicional (opcional)</label>
            <textarea rows="3" className="input" maxLength={300}
              value={mensagem} onChange={(e) => setMensagem(e.target.value)}
              placeholder="Para sobrescrever o texto padrão…" />
          </div>

          {err && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{err}</div>}

          <div className="flex justify-end gap-2">
            <button type="button" className="btn-outline" onClick={() => { reset(); onClose() }}>Cancelar</button>
            <button type="submit" className="btn-primary inline-flex items-center gap-1" disabled={saving}>
              <PhoneCall size={14} /> {saving ? 'A enviar…' : 'Enviar pedido'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}

function Card({ label, value, color, Icon }) {
  return (
    <div className="card p-3 flex items-center gap-3">
      <div className={`w-10 h-10 ${color} text-white rounded flex items-center justify-center`}>
        <Icon size={18} />
      </div>
      <div>
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-2xl font-bold">{value}</div>
      </div>
    </div>
  )
}

function ComposeModal({ open, onClose, onSent }) {
  const [paciente, setPaciente] = useState(null)
  const [to, setTo] = useState('')
  const [body, setBody] = useState('')
  const [schedule, setSchedule] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (paciente?.telefone) setTo(paciente.telefone)
  }, [paciente])

  function reset() {
    setPaciente(null); setTo(''); setBody(''); setSchedule(false); setScheduledAt(''); setErr('')
  }

  async function submit(e) {
    e.preventDefault(); setSaving(true); setErr('')
    try {
      await api.post('/sms', {
        to: to || null,
        paciente_id: paciente?.id || null,
        body,
        scheduled_at: schedule && scheduledAt ? scheduledAt : null,
      })
      reset(); onSent?.(); onClose()
    } catch (e) {
      setErr(e.response?.data?.message || 'Erro ao enviar')
    } finally { setSaving(false) }
  }

  return (
    <Modal open={open} title="Novo SMS" onClose={onClose} size="lg">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="label">Paciente (opcional)</label>
          <PacientePicker value={paciente?.id || null} onPick={setPaciente} />
        </div>
        <div>
          <label className="label">Número de telefone *</label>
          <input className="input font-mono" required placeholder="+244 9XX XXX XXX"
            value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div>
          <label className="label">Mensagem * <span className="text-slate-400 normal-case font-normal">({body.length}/480)</span></label>
          <textarea required rows="4" maxLength={480} className="input"
            value={body} onChange={(e) => setBody(e.target.value)} />
        </div>
        <div>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={schedule} onChange={(e) => setSchedule(e.target.checked)} />
            <Clock size={14} /> Agendar para mais tarde
          </label>
          {schedule && (
            <input type="datetime-local" className="input mt-2"
              value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
          )}
        </div>
        {err && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{err}</div>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-outline" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary inline-flex items-center gap-1" disabled={saving}>
            <Send size={14} /> {saving ? 'A enviar…' : (schedule ? 'Agendar' : 'Enviar')}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function TargetCard({ active, onClick, title, desc, danger }) {
  return (
    <button type="button" onClick={onClick}
      className={`text-left p-3 rounded border-2 transition ${
        active
          ? (danger ? 'border-red-500 bg-red-50' : 'border-hgb-600 bg-hgb-50')
          : 'border-slate-200 hover:border-slate-300'
      }`}>
      <div className={`text-sm font-medium ${active && danger ? 'text-red-700' : ''}`}>{title}</div>
      <div className="text-xs text-slate-500 mt-0.5">{desc}</div>
    </button>
  )
}

function BulkModal({ open, onClose, onSent }) {
  const [body, setBody] = useState('')
  const [target, setTarget] = useState('pacientes_selected')
  const [pacientes, setPacientes] = useState([])
  const [departamentos, setDepartamentos] = useState([])
  const [servicos, setServicos] = useState([])
  const [depIds, setDepIds] = useState([])
  const [servIds, setServIds] = useState([])
  const [extras, setExtras] = useState('')
  const [schedule, setSchedule] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')
  const [result, setResult] = useState(null)

  useEffect(() => {
    if (!open) return
    api.get('/departamentos').then((r) => setDepartamentos(r.data)).catch(() => {})
    api.get('/servicos').then((r) => setServicos(r.data)).catch(() => {})
  }, [open])

  function reset() {
    setBody(''); setTarget('pacientes_selected'); setPacientes([])
    setDepIds([]); setServIds([]); setExtras('')
    setSchedule(false); setScheduledAt(''); setErr(''); setResult(null)
  }

  function toggleId(arr, setter, id) {
    setter(arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id])
  }

  async function submit(e) {
    e.preventDefault(); setSaving(true); setErr(''); setResult(null)
    try {
      const payload = { body, scheduled_at: schedule && scheduledAt ? scheduledAt : null }
      switch (target) {
        case 'pacientes_selected': payload.paciente_ids = pacientes.map((p) => p.id); break
        case 'pacientes_all': payload.all_pacientes = true; break
        case 'funcionarios_all': payload.all_funcionarios = true; break
        case 'funcionarios_dep': payload.departamento_ids = depIds; break
        case 'funcionarios_serv': payload.servico_ids = servIds; break
        case 'todo_hospital': payload.todo_hospital = true; break
      }
      if (extras.trim()) payload.extra_numeros = extras.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean)
      const { data } = await api.post('/sms/bulk', payload)
      setResult(data); onSent?.()
    } catch (e) {
      setErr(e.response?.data?.message || 'Erro')
    } finally { setSaving(false) }
  }

  return (
    <Modal open={open} title="Envio em massa" onClose={() => { reset(); onClose() }} size="xl">
      {result ? (
        <div className="text-center py-6">
          <CheckCircle2 className="text-emerald-600 mx-auto mb-3" size={48} />
          <h3 className="text-lg font-bold mb-1">{result.count} SMS criados</h3>
          <p className="text-xs text-slate-500 font-mono">Batch: {result.batch_id}</p>
          <div className="flex justify-center gap-2 mt-6">
            <button className="btn-outline" onClick={() => { reset() }}>+ Novo envio</button>
            <button className="btn-primary" onClick={() => { reset(); onClose() }}>Fechar</button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Mensagem * <span className="text-slate-400 normal-case font-normal">({body.length}/480)</span></label>
            <textarea required rows="3" maxLength={480} className="input"
              value={body} onChange={(e) => setBody(e.target.value)} />
          </div>

          <div>
            <label className="label">Destinatários</label>
            <div className="grid grid-cols-2 gap-2">
              <TargetCard active={target === 'pacientes_selected'} onClick={() => setTarget('pacientes_selected')}
                title="Pacientes selecionados" desc="Escolher pacientes individualmente" />
              <TargetCard active={target === 'pacientes_all'} onClick={() => setTarget('pacientes_all')}
                title="Todos os pacientes" desc="Pacientes com telefone registado" />
              <TargetCard active={target === 'funcionarios_dep'} onClick={() => setTarget('funcionarios_dep')}
                title="Por departamento" desc="Funcionários de um ou mais departamentos" />
              <TargetCard active={target === 'funcionarios_serv'} onClick={() => setTarget('funcionarios_serv')}
                title="Por serviço" desc="Funcionários de um ou mais serviços" />
              <TargetCard active={target === 'funcionarios_all'} onClick={() => setTarget('funcionarios_all')}
                title="Todos os funcionários" desc="Funcionários ativos" />
              <TargetCard active={target === 'todo_hospital'} onClick={() => setTarget('todo_hospital')}
                title="Todo o hospital" desc="Pacientes + Funcionários (sem duplicados)" danger />
            </div>
          </div>

          {target === 'pacientes_selected' && (
            <div>
              <label className="label">Adicionar paciente</label>
              <PacientePicker value={null} onPick={(p) => {
                if (p && !pacientes.find((x) => x.id === p.id)) setPacientes([...pacientes, p])
              }} />
              {pacientes.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {pacientes.map((p) => (
                    <span key={p.id} className="inline-flex items-center gap-1 bg-hgb-100 text-hgb-700 px-2 py-0.5 rounded text-xs">
                      {p.nome}
                      <button type="button" onClick={() => setPacientes(pacientes.filter((x) => x.id !== p.id))}>
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  <span className="text-xs text-slate-500 ml-2">{pacientes.length} paciente(s)</span>
                </div>
              )}
            </div>
          )}

          {target === 'funcionarios_dep' && (
            <div>
              <label className="label">Departamentos ({depIds.length} selecionados)</label>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-auto border border-slate-200 rounded p-2">
                {departamentos.map((d) => (
                  <label key={d.id} className={`flex items-center gap-2 px-2.5 py-1 rounded border cursor-pointer text-xs ${
                    depIds.includes(d.id) ? 'bg-hgb-50 border-hgb-500 text-hgb-700' : 'border-slate-200 hover:bg-slate-50'
                  }`}>
                    <input type="checkbox" checked={depIds.includes(d.id)} onChange={() => toggleId(depIds, setDepIds, d.id)} />
                    {d.nome} <span className="text-slate-400">({d.funcionarios_count})</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {target === 'funcionarios_serv' && (
            <div>
              <label className="label">Serviços ({servIds.length} selecionados)</label>
              <div className="flex flex-wrap gap-2 max-h-60 overflow-auto border border-slate-200 rounded p-2">
                {servicos.map((s) => (
                  <label key={s.id} className={`flex items-center gap-2 px-2.5 py-1 rounded border cursor-pointer text-xs ${
                    servIds.includes(s.id) ? 'bg-hgb-50 border-hgb-500 text-hgb-700' : 'border-slate-200 hover:bg-slate-50'
                  }`}>
                    <input type="checkbox" checked={servIds.includes(s.id)} onChange={() => toggleId(servIds, setServIds, s.id)} />
                    {s.nome} <span className="text-slate-400">({s.departamento?.nome})</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="label">Números adicionais <span className="text-slate-400 normal-case font-normal">(opcional, um por linha)</span></label>
            <textarea rows="3" className="input font-mono text-sm"
              placeholder="+244 923 000 001&#10;+244 924 111 222"
              value={extras} onChange={(e) => setExtras(e.target.value)} />
          </div>

          <div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={schedule} onChange={(e) => setSchedule(e.target.checked)} />
              <Clock size={14} /> Agendar para mais tarde
            </label>
            {schedule && (
              <input type="datetime-local" className="input mt-2"
                value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
            )}
          </div>

          {err && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{err}</div>}
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-outline" onClick={() => { reset(); onClose() }}>Cancelar</button>
            <button type="submit" className="btn-primary inline-flex items-center gap-1" disabled={saving}>
              <Send size={14} /> {saving ? 'A processar…' : 'Enviar / Agendar'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}
