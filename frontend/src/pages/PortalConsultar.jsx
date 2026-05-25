import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import {
  Search, Phone, Hash, AlertCircle, CheckCircle2, Clock, XCircle,
  Calendar, User, Stethoscope, ArrowRight, IdCard,
} from 'lucide-react'

const apiPub = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
  headers: { Accept: 'application/json' },
})

const STATUS_STYLE = {
  pendente:       { color: 'amber',   Icon: Clock },
  confirmada:     { color: 'sky',     Icon: CheckCircle2 },
  presente:       { color: 'violet',  Icon: User },
  em_atendimento: { color: 'blue',    Icon: Stethoscope },
  realizada:      { color: 'emerald', Icon: CheckCircle2 },
  cancelada:      { color: 'red',     Icon: XCircle },
  faltou:         { color: 'slate',   Icon: XCircle },
}

const COLOR_CLASSES = {
  amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-800',   icon: 'text-amber-600',   chip: 'bg-amber-100 text-amber-800' },
  sky:     { bg: 'bg-sky-50',     border: 'border-sky-200',     text: 'text-sky-800',     icon: 'text-sky-600',     chip: 'bg-sky-100 text-sky-800' },
  violet:  { bg: 'bg-violet-50',  border: 'border-violet-200',  text: 'text-violet-800',  icon: 'text-violet-600',  chip: 'bg-violet-100 text-violet-800' },
  blue:    { bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-800',    icon: 'text-blue-600',    chip: 'bg-blue-100 text-blue-800' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', icon: 'text-emerald-600', chip: 'bg-emerald-100 text-emerald-800' },
  red:     { bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-800',     icon: 'text-red-600',     chip: 'bg-red-100 text-red-800' },
  slate:   { bg: 'bg-slate-50',   border: 'border-slate-200',   text: 'text-slate-700',   icon: 'text-slate-500',   chip: 'bg-slate-100 text-slate-700' },
}

export default function PortalConsultar() {
  const [params] = useSearchParams()
  const [numero, setNumero] = useState(params.get('numero') || '')
  const [metodo, setMetodo] = useState('telefone') // 'telefone' | 'bi'
  const [telefone, setTelefone] = useState('')
  const [bi, setBi] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [resultado, setResultado] = useState(null)

  async function buscar(e) {
    e?.preventDefault()
    setErro(''); setResultado(null); setLoading(true)
    try {
      const payload = {}
      if (numero.trim()) payload.numero = numero.trim()
      if (metodo === 'telefone' && telefone.trim()) payload.telefone = telefone.trim()
      if (metodo === 'bi' && bi.trim()) payload.bi = bi.trim()
      const { data } = await apiPub.post('/portal/consultar', payload)
      setResultado(data)
    } catch (e) {
      setErro(e.response?.data?.message || 'Não foi possível consultar.')
    } finally { setLoading(false) }
  }

  function reiniciar() {
    setResultado(null); setErro(''); setNumero(''); setTelefone(''); setBi('')
  }

  // BI sozinho basta; ou numero + (telefone OU bi)
  const podeSubmeter = (metodo === 'bi' && bi.trim()) ||
    (metodo === 'telefone' && numero.trim() && telefone.trim())

  return (
    <div className="min-h-screen bg-gradient-to-br from-hgb-50 via-white to-slate-50">
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <img src="/logo.png" alt="HGB" className="w-16 h-16 mx-auto mb-2 bg-white rounded-full shadow p-1" />
          <h1 className="text-2xl font-bold text-hgb-900">Consultar marcação</h1>
          <p className="text-xs text-slate-500">Verifique o estado do seu pedido</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sm:p-6">
          {!resultado ? (

            <form onSubmit={buscar} className="space-y-4">
              {erro && (
                <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700 flex items-start gap-2">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" /> {erro}
                </div>
              )}

              <div>
                <label className="label">Como prefere identificar-se?</label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button type="button" onClick={() => setMetodo('telefone')}
                    className={`p-2.5 rounded-md border-2 text-sm font-medium transition inline-flex items-center justify-center gap-2 ${
                      metodo === 'telefone' ? 'border-hgb-600 bg-hgb-50 text-hgb-800' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}>
                    <Phone size={14} /> Nº + Telefone
                  </button>
                  <button type="button" onClick={() => setMetodo('bi')}
                    className={`p-2.5 rounded-md border-2 text-sm font-medium transition inline-flex items-center justify-center gap-2 ${
                      metodo === 'bi' ? 'border-hgb-600 bg-hgb-50 text-hgb-800' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}>
                    <IdCard size={14} /> Apenas BI
                  </button>
                </div>
              </div>

              {metodo === 'telefone' && (
                <>
                  <div>
                    <label className="label flex items-center gap-1"><Hash size={12} /> Número da marcação *</label>
                    <input className="input font-mono uppercase" value={numero}
                      onChange={(e) => setNumero(e.target.value.toUpperCase())}
                      placeholder="AG-2026-00001" maxLength={30} required />
                    <p className="text-xs text-slate-500 mt-1">
                      Recebeu o número por SMS quando fez a marcação.
                    </p>
                  </div>
                  <div>
                    <label className="label flex items-center gap-1"><Phone size={12} /> Telefone *</label>
                    <input className="input" value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                      placeholder="Telefone usado na marcação" maxLength={30} />
                    <p className="text-xs text-slate-500 mt-1">
                      Pode introduzir só os últimos 4 dígitos do telefone.
                    </p>
                  </div>
                </>
              )}

              {metodo === 'bi' && (
                <div>
                  <label className="label flex items-center gap-1"><IdCard size={12} /> Bilhete de Identidade *</label>
                  <input className="input font-mono uppercase" value={bi}
                    onChange={(e) => setBi(e.target.value.toUpperCase())}
                    placeholder="Ex.: 000123456LA041" maxLength={20} required />
                  <p className="text-xs text-slate-500 mt-1">
                    Vamos listar todas as suas marcações ativas. Útil se não tem o número à mão
                    ou usou telefone de outra pessoa.
                  </p>
                </div>
              )}

              <button type="submit" className="btn-primary w-full inline-flex items-center justify-center gap-2"
                disabled={loading || !podeSubmeter}>
                <Search size={16} /> {loading ? 'A consultar…' : 'Consultar'}
              </button>

              <div className="text-center pt-3 border-t border-slate-100">
                <Link to="/marcar" className="text-sm text-hgb-600 hover:underline inline-flex items-center gap-1">
                  Fazer nova marcação <ArrowRight size={14} />
                </Link>
              </div>
            </form>
          ) : (
            <Resultado resultado={resultado} onReiniciar={reiniciar} />
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          Em caso de dúvida, contacte o HGB.
        </p>
      </div>
    </div>
  )
}

function Resultado({ resultado, onReiniciar }) {
  // Modo lista: vem do BI sozinho
  if (Array.isArray(resultado.marcacoes)) {
    return <ResultadoLista resultado={resultado} onReiniciar={onReiniciar} />
  }
  return <ResultadoUnica resultado={resultado} onReiniciar={onReiniciar} />
}

function ResultadoLista({ resultado, onReiniciar }) {
  const [selecionada, setSelecionada] = useState(null)

  if (selecionada) {
    return <ResultadoUnica resultado={selecionada} onReiniciar={() => setSelecionada(null)} />
  }

  if (resultado.marcacoes.length === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-slate-50 border border-slate-200 rounded p-4 text-center">
          <Calendar className="text-slate-400 mx-auto mb-2" size={36} />
          <p className="font-semibold text-slate-700">Olá {resultado.paciente_primeiro_nome}</p>
          <p className="text-sm text-slate-500 mt-1">Não tem marcações activas neste momento.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onReiniciar} className="btn-outline flex-1">Voltar</button>
          <Link to="/marcar" className="btn-primary flex-1 text-center">Nova marcação</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600 text-center">
        Olá <strong>{resultado.paciente_primeiro_nome}</strong>, tem <strong>{resultado.marcacoes.length}</strong> marcação(ões):
      </p>
      <div className="space-y-2">
        {resultado.marcacoes.map((m) => {
          const sty = STATUS_STYLE[m.status] || STATUS_STYLE.slate
          const cls = COLOR_CLASSES[sty.color]
          const Icon = sty.Icon
          const d = new Date(m.data_agendamento)
          return (
            <button key={m.numero} onClick={() => setSelecionada(m)}
              className={`w-full text-left ${cls.bg} ${cls.border} border-2 rounded-lg p-3 hover:shadow transition flex items-center gap-3`}>
              <Icon className={`${cls.icon} flex-shrink-0`} size={28} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs text-slate-500">{m.numero}</span>
                  <span className={`text-xs font-bold ${cls.text} ${cls.chip} px-2 py-0.5 rounded`}>
                    {m.status_label}
                  </span>
                </div>
                <div className="text-sm font-semibold text-slate-800 mt-1">
                  {d.toLocaleString('pt-PT', { dateStyle: 'long', timeStyle: 'short' })}
                </div>
                {m.medico && (
                  <div className="text-xs text-slate-600 mt-0.5">
                    {m.medico.nome} · {m.medico.especialidade}
                  </div>
                )}
              </div>
              <ArrowRight size={16} className="text-slate-400 flex-shrink-0" />
            </button>
          )
        })}
      </div>
      <div className="flex gap-2 pt-2">
        <button onClick={onReiniciar} className="btn-outline flex-1">Nova consulta</button>
        <Link to="/marcar" className="btn-primary flex-1 text-center">Nova marcação</Link>
      </div>
    </div>
  )
}

function ResultadoUnica({ resultado, onReiniciar }) {
  const sty = STATUS_STYLE[resultado.status] || STATUS_STYLE.slate
  const cls = COLOR_CLASSES[sty.color]
  const Icon = sty.Icon
  const data = new Date(resultado.data_agendamento)

  return (
    <div className="space-y-4">
      <div className={`${cls.bg} ${cls.border} border-2 rounded-lg p-4 text-center`}>
        <Icon className={`${cls.icon} mx-auto mb-2`} size={36} />
        <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">Estado actual</div>
        <div className={`text-xl font-bold ${cls.text}`}>{resultado.status_label}</div>
        <div className="font-mono text-xs text-slate-500 mt-2">{resultado.numero}</div>
      </div>

      {resultado.paciente_primeiro_nome && (
        <p className="text-sm text-slate-600 text-center">
          Olá <strong>{resultado.paciente_primeiro_nome}</strong>, eis os detalhes da sua marcação:
        </p>
      )}

      <dl className="bg-slate-50 border border-slate-200 rounded divide-y divide-slate-200 text-sm">
        <Row Icon={Calendar} label="Data e hora"
          value={data.toLocaleString('pt-PT', { dateStyle: 'full', timeStyle: 'short' })} />
        {resultado.medico && (
          <Row Icon={Stethoscope} label="Médico"
            value={<>{resultado.medico.nome}{resultado.medico.especialidade && <span className="text-slate-500"> · {resultado.medico.especialidade}</span>}</>} />
        )}
        {resultado.motivo && (
          <Row label="Motivo" value={resultado.motivo} />
        )}
        {resultado.check_in_em && (
          <Row label="Check-in feito em"
            value={new Date(resultado.check_in_em).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' })} />
        )}
        {resultado.motivo_cancelamento && (
          <Row label="Motivo do cancelamento" value={resultado.motivo_cancelamento} />
        )}
      </dl>

      {resultado.status === 'pendente' && (
        <div className="bg-amber-50 border border-amber-200 rounded p-3 text-xs text-amber-800">
          <strong>O seu pedido está a aguardar aprovação.</strong> A recepção irá confirmar e
          receberá um SMS com a confirmação. Volte a consultar mais tarde.
        </div>
      )}

      {resultado.status === 'confirmada' && (
        <div className="bg-sky-50 border border-sky-200 rounded p-3 text-xs text-sky-800">
          <strong>A sua marcação está confirmada.</strong> Compareça 15 minutos antes da hora marcada.
          Traga o seu BI e este número de marcação.
        </div>
      )}

      {resultado.status === 'cancelada' && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-xs text-red-800">
          Esta marcação foi cancelada. Pode fazer nova marcação no portal.
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button onClick={onReiniciar} className="btn-outline flex-1">Consultar outra</button>
        <Link to="/marcar" className="btn-primary flex-1 text-center">Nova marcação</Link>
      </div>
    </div>
  )
}

function Row({ Icon, label, value }) {
  return (
    <div className="px-4 py-2.5 flex items-start gap-3">
      {Icon && <Icon size={14} className="text-slate-400 mt-1 flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <div className="text-xs text-slate-500 uppercase tracking-wide">{label}</div>
        <div className="text-sm text-slate-800">{value}</div>
      </div>
    </div>
  )
}
