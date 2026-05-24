import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft, User, Cake, Phone, Mail, Building2, Briefcase, ShieldCheck, MessageSquare,
} from 'lucide-react'
import api from '../api/client'
import StatusBadge from '../components/StatusBadge'

export default function FuncionarioShow() {
  const { id } = useParams()
  const [data, setData] = useState(null)

  useEffect(() => {
    api.get(`/funcionarios/${id}`).then((r) => setData(r.data))
  }, [id])

  if (!data) return <div className="text-slate-500">A carregar…</div>

  const f = data.funcionario
  const dn = f.data_nascimento?.slice(0,10)
  const idade = dn ? Math.floor((Date.now() - new Date(dn)) / (1000*60*60*24*365.25)) : null
  const proxAniv = dn ? (() => {
    const hoje = new Date()
    const next = new Date(hoje.getFullYear(), Number(dn.slice(5,7)) - 1, Number(dn.slice(8,10)))
    if (next < hoje) next.setFullYear(next.getFullYear() + 1)
    return Math.ceil((next - hoje) / (1000*60*60*24))
  })() : null

  return (
    <div>
      <Link to="/funcionarios" className="text-sm text-slate-500 hover:text-hgb-600 inline-flex items-center gap-1 mb-3">
        <ArrowLeft size={14} /> Voltar à lista
      </Link>

      <div className="card p-6 mb-4 bg-gradient-to-r from-hgb-50 to-white">
        <div className="flex items-start gap-4">
          <div className={`w-16 h-16 ${f.sexo === 'F' ? 'bg-rose-500' : 'bg-hgb-600'} text-white rounded-full flex items-center justify-center`}>
            <User size={28} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{f.nome}</h1>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-600">
              {f.sexo && <span>{f.sexo === 'F' ? 'Feminino' : 'Masculino'}</span>}
              {idade && <span>· {idade} anos</span>}
              {f.categoria && <span>· {f.categoria}</span>}
              {f.ativo ? <span className="badge-emitido">ATIVO</span> : <span className="badge-anulado">INATIVO</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="card p-4">
          <div className="text-xs font-semibold text-slate-500 uppercase mb-2 inline-flex items-center gap-1"><Phone size={14}/> Contacto</div>
          <Field label="Telefone" value={f.telefone} mono />
          <Field icon={<Mail size={14}/>} label="Email" value={f.email} />
        </div>
        <div className="card p-4">
          <div className="text-xs font-semibold text-slate-500 uppercase mb-2 inline-flex items-center gap-1"><Building2 size={14}/> Estrutura</div>
          <Field label="Departamento" value={f.departamento?.nome} />
          <Field icon={<Briefcase size={14}/>} label="Serviço" value={f.servico_rel?.nome || f.servico} />
          {(f.chefe_departamento || f.chefe_servico) && (
            <div className="text-xs text-amber-700 mt-2 inline-flex items-center gap-1"><ShieldCheck size={12}/>
              {f.chefe_departamento && 'Chefe de departamento'}
              {f.chefe_departamento && f.chefe_servico && ' · '}
              {f.chefe_servico && 'Chefe de serviço'}
            </div>
          )}
        </div>
        <div className={`card p-4 ${proxAniv === 0 ? 'bg-gradient-to-br from-pink-100 to-amber-50 border-pink-300' : ''}`}>
          <div className="text-xs font-semibold text-slate-500 uppercase mb-2 inline-flex items-center gap-1"><Cake size={14}/> Aniversário</div>
          {dn ? (
            <>
              <div className="text-2xl font-bold">{dn.slice(8,10)}/{dn.slice(5,7)}</div>
              <div className="text-xs text-slate-500">
                {proxAniv === 0 ? '🎉 É HOJE!'
                  : proxAniv === 1 ? 'Amanhã'
                  : `Em ${proxAniv} dias`}
              </div>
              <div className="text-xs mt-2">
                SMS aniversário: {f.receber_aniversario
                  ? <span className="badge-emitido">SIM</span>
                  : <span className="badge-anulado">NÃO</span>}
              </div>
            </>
          ) : <div className="text-sm text-slate-400">Sem data registada</div>}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 uppercase inline-flex items-center gap-2 w-full">
          <MessageSquare size={14}/> SMS ({data.sms_count})
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase border-t border-slate-200">
            <tr>
              <th className="text-left px-4 py-2">Mensagem</th>
              <th className="text-left px-4 py-2 w-28">Estado</th>
              <th className="text-left px-4 py-2 w-44">Quando</th>
            </tr>
          </thead>
          <tbody>
            {data.sms_recentes.map((m) => (
              <tr key={m.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2 truncate max-w-md">{m.body}</td>
                <td className="px-4 py-2"><StatusBadge status={m.status} /></td>
                <td className="px-4 py-2 text-xs text-slate-500">{(m.sent_at || m.created_at)?.slice(0,16).replace('T',' ')}</td>
              </tr>
            ))}
            {data.sms_recentes.length === 0 && (
              <tr><td colSpan="3" className="px-4 py-4 text-center text-xs text-slate-400">Ainda não recebeu SMS.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Field({ icon, label, value, mono }) {
  if (!value) return null
  return (
    <div className="text-sm mb-1">
      <span className="text-xs text-slate-500 inline-flex items-center gap-1">{icon} {label}:</span>{' '}
      <span className={mono ? 'font-mono' : ''}>{value}</span>
    </div>
  )
}
