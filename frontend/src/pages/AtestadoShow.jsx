import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Printer, ShieldCheck, FileCheck2, User, Stethoscope, Calendar } from 'lucide-react'
import api, { downloadPdf } from '../api/client'
import StatusBadge from '../components/StatusBadge'
import ValidarAssinaturaModal from '../components/ValidarAssinaturaModal'

export default function AtestadoShow() {
  const { id } = useParams()
  const [a, setA] = useState(null)
  const [validarOpen, setValidarOpen] = useState(false)

  async function load() {
    const { data } = await api.get(`/atestados/${id}`)
    setA(data)
  }
  useEffect(() => { load() }, [id])

  if (!a) return <div className="text-slate-500">A carregar…</div>

  return (
    <div>
      <Link to="/atestados" className="text-sm text-slate-500 hover:text-hgb-600 inline-flex items-center gap-1 mb-3">
        <ArrowLeft size={14} /> Voltar à lista
      </Link>

      <div className="card p-6 mb-4 bg-gradient-to-r from-rose-50 to-white">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-rose-600 text-white rounded-full flex items-center justify-center"><FileCheck2 size={26}/></div>
            <div>
              <div className="text-xs text-slate-500 uppercase">Atestado Médico</div>
              <h1 className="text-2xl font-bold">{a.numero}</h1>
              <div className="flex flex-wrap gap-2 mt-1 text-xs">
                <span className="capitalize bg-slate-100 px-2 py-0.5 rounded">{a.tipo}</span>
                {a.destino && <span className="bg-slate-100 px-2 py-0.5 rounded">Para: {a.destino}</span>}
                <StatusBadge status={a.status} />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {a.status === 'rascunho' && (
              <button onClick={() => setValidarOpen(true)} className="btn-outline inline-flex items-center gap-1 text-amber-700 border-amber-300">
                <ShieldCheck size={16} /> Validar e Assinar
              </button>
            )}
            <button onClick={() => downloadPdf(`/atestados/${a.id}/pdf`)} className="btn-primary inline-flex items-center gap-1">
              <Printer size={16} /> Ver PDF
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="card p-4">
          <div className="text-xs font-semibold text-slate-500 uppercase mb-2 inline-flex items-center gap-1"><User size={14}/> Paciente</div>
          {a.paciente ? (
            <>
              <Link to={`/pacientes/${a.paciente.id}`} className="font-semibold text-hgb-700 hover:underline">{a.paciente.nome}</Link>
              <div className="text-xs text-slate-500 font-mono mt-0.5">{a.paciente.numero_processo}</div>
            </>
          ) : <div className="text-sm text-slate-400">—</div>}
        </div>
        <div className="card p-4">
          <div className="text-xs font-semibold text-slate-500 uppercase mb-2 inline-flex items-center gap-1"><Stethoscope size={14}/> Médico</div>
          {a.medico ? (
            <>
              <Link to={`/medicos/${a.medico.id}`} className="font-semibold text-emerald-700 hover:underline">{a.medico.nome}</Link>
              <div className="text-xs text-slate-500 mt-0.5">{a.medico.especialidade} · Ordem nº {a.medico.numero_ordem}</div>
            </>
          ) : <div className="text-sm text-amber-700">⚠ Sem médico atribuído</div>}
        </div>
      </div>

      <div className="card p-4 mb-4 grid grid-cols-4 gap-4 text-sm">
        <F label="Data emissão" value={a.data_emissao?.slice(0,10)} icon={<Calendar size={14}/>} />
        {a.tipo === 'repouso' && <>
          <F label="Início repouso" value={a.data_inicio_repouso?.slice(0,10)} />
          <F label="Fim repouso" value={a.data_fim_repouso?.slice(0,10)} />
          <F label="Dias" value={a.dias_repouso} />
        </>}
        {a.cid && <F label="CID" value={a.cid} mono />}
        {a.codigo_verificacao && <F label="Código verificação" value={a.codigo_verificacao} mono />}
      </div>

      <div className="space-y-3">
        {a.diagnostico && <Block title="Diagnóstico" html={a.diagnostico} />}
        {a.motivo && <Block title="Finalidade / Motivo" html={a.motivo} />}
        {a.observacoes && <Block title="Observações" html={a.observacoes} />}
      </div>

      <ValidarAssinaturaModal
        open={validarOpen}
        documento={a}
        tipo="atestados"
        onClose={() => setValidarOpen(false)}
        onSuccess={() => { setValidarOpen(false); load() }}
      />
    </div>
  )
}

function F({ icon, label, value, mono }) {
  if (!value) return null
  return (
    <div>
      <div className="text-xs text-slate-500 inline-flex items-center gap-1">{icon} {label}</div>
      <div className={`font-medium ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  )
}

function Block({ title, html }) {
  return (
    <div className="card p-4">
      <div className="text-xs font-semibold text-slate-500 uppercase mb-2">{title}</div>
      <div className="text-sm prose-sm" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
