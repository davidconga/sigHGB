import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft, MessageSquare, User, Briefcase, Calendar, Clock, AlertCircle,
  CheckCircle2, Loader, X, Layers, RotateCcw,
} from 'lucide-react'
import api from '../api/client'
import { useConfirm } from '../components/ConfirmDialog'

const STATUS_MAP = {
  pendente: { cls: 'bg-amber-100 text-amber-700', Icon: Loader, label: 'Pendente' },
  enviado: { cls: 'bg-emerald-100 text-emerald-700', Icon: CheckCircle2, label: 'Enviado' },
  falhado: { cls: 'bg-red-100 text-red-700', Icon: AlertCircle, label: 'Falhado' },
  cancelado: { cls: 'bg-slate-100 text-slate-600', Icon: X, label: 'Cancelado' },
}

export default function SmsShow() {
  const confirm = useConfirm()
  const { id } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api.get(`/sms/${id}`).then((r) => setData(r.data))
  }, [id])

  async function resend() {
    if (!await confirm('Reenviar este SMS com o mesmo conteúdo?')) return
    setBusy(true)
    try {
      const { data: novo } = await api.post(`/sms/${id}/resend`)
      navigate(`/sms/${novo.id}`)
    } finally { setBusy(false) }
  }

  if (!data) return <div className="text-slate-500">A carregar…</div>

  const m = data.sms
  const s = STATUS_MAP[m.status] || STATUS_MAP.pendente

  return (
    <div>
      <Link to="/sms" className="text-sm text-slate-500 hover:text-hgb-600 inline-flex items-center gap-1 mb-3">
        <ArrowLeft size={14} /> Voltar à lista
      </Link>

      <div className="card p-6 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-xs text-slate-500 uppercase">Destino</div>
            <div className="text-2xl font-mono font-bold">{m.to}</div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded text-sm font-semibold ${s.cls}`}>
              <s.Icon size={14} /> {s.label}
            </span>
            {(m.status === 'enviado' || m.status === 'falhado') && (
              <button onClick={resend} disabled={busy} className="btn-outline inline-flex items-center gap-1 text-sm">
                <RotateCcw size={14} /> {busy ? 'A reenviar…' : 'Reenviar'}
              </button>
            )}
          </div>
        </div>

        <div className="bg-slate-50 rounded p-4 my-4">
          <div className="text-xs text-slate-500 uppercase mb-2">Mensagem</div>
          <div className="whitespace-pre-wrap text-sm">{m.body}</div>
          <div className="text-xs text-slate-400 mt-2">{m.body.length} caracteres</div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm border-t pt-4">
          {m.paciente && (
            <Field icon={<User size={14}/>} label="Paciente">
              <Link to={`/pacientes/${m.paciente.id}`} className="text-hgb-600 hover:underline">
                {m.paciente.nome}
              </Link>
              <span className="text-xs text-slate-500 ml-1">({m.paciente.numero_processo})</span>
            </Field>
          )}
          {m.funcionario && (
            <Field icon={<Briefcase size={14}/>} label="Funcionário">
              <Link to={`/funcionarios/${m.funcionario.id}`} className="text-hgb-600 hover:underline">
                {m.funcionario.nome}
              </Link>
            </Field>
          )}
          <Field icon={<User size={14}/>} label="Enviado por">{m.user?.name || '—'}</Field>
          {m.scheduled_at && (
            <Field icon={<Clock size={14}/>} label="Agendado para">{new Date(m.scheduled_at).toLocaleString('pt-PT')}</Field>
          )}
          {m.sent_at && (
            <Field icon={<Calendar size={14}/>} label="Enviado em">{new Date(m.sent_at).toLocaleString('pt-PT')}</Field>
          )}
          <Field icon={<Calendar size={14}/>} label="Criado em">{new Date(m.created_at).toLocaleString('pt-PT')}</Field>
          {m.provider && <Field label="Provider">{m.provider}</Field>}
          {m.provider_message_id && <Field label="ID externo" mono>{m.provider_message_id}</Field>}
        </div>

        {m.error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded p-3">
            <div className="text-xs font-semibold text-red-700 uppercase mb-1">Erro</div>
            <div className="text-sm text-red-600 font-mono">{m.error}</div>
          </div>
        )}
      </div>

      {data.batch && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="inline-flex items-center gap-2">
              <Layers size={18} className="text-hgb-600" />
              <h3 className="font-semibold">Envio em lote</h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">{data.batch.id}</span>
          </div>
          <div className="text-sm mb-3">Total de {data.batch.total} SMS neste lote:</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(data.batch.by_status).map(([status, count]) => {
              const ss = STATUS_MAP[status] || STATUS_MAP.pendente
              return (
                <div key={status} className={`px-3 py-2 rounded ${ss.cls} text-sm font-semibold inline-flex items-center gap-2`}>
                  <ss.Icon size={14} /> {ss.label}: {count}
                </div>
              )
            })}
          </div>
          <Link to={`/sms?batch_id=${data.batch.id}`} className="inline-block mt-3 text-sm text-hgb-600 hover:underline">
            Ver todos os SMS deste lote →
          </Link>
        </div>
      )}
    </div>
  )
}

function Field({ icon, label, children, mono }) {
  return (
    <div>
      <div className="text-xs text-slate-500 inline-flex items-center gap-1">{icon} {label}</div>
      <div className={`mt-0.5 ${mono ? 'font-mono text-xs' : ''}`}>{children}</div>
    </div>
  )
}
