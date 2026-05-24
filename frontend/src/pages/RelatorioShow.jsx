import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Printer, ShieldCheck, FileText, User, Stethoscope, Calendar } from 'lucide-react'
import api, { downloadPdf } from '../api/client'
import StatusBadge from '../components/StatusBadge'
import ValidarAssinaturaModal from '../components/ValidarAssinaturaModal'
import ActivityHistory from '../components/ActivityHistory'

const TIPOS = {
  relatorio_medico: 'Relatório Médico',
  junta_medica: 'Relatório Médico (Junta)',
  fisioterapeutico: 'Relatório Fisioterapéutico',
  informacao_clinica: 'Informação Clínica',
  nota_alta: 'Nota de Alta',
  guia_transferencia: 'Guia de Transferência',
}

export default function RelatorioShow() {
  const { id } = useParams()
  const [r, setR] = useState(null)
  const [validarOpen, setValidarOpen] = useState(false)

  async function load() {
    const { data } = await api.get(`/relatorios/${id}`)
    setR(data)
  }
  useEffect(() => { load() }, [id])

  if (!r) return <div className="text-slate-500">A carregar…</div>

  return (
    <div>
      <Link to="/relatorios" className="text-sm text-slate-500 hover:text-hgb-600 inline-flex items-center gap-1 mb-3">
        <ArrowLeft size={14} /> Voltar à lista
      </Link>

      <div className="card p-6 mb-4 bg-gradient-to-r from-hgb-50 to-white">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-hgb-600 text-white rounded-full flex items-center justify-center"><FileText size={26}/></div>
            <div>
              <div className="text-xs text-slate-500 uppercase">{TIPOS[r.tipo] || r.tipo}</div>
              <h1 className="text-2xl font-bold">{r.numero}</h1>
              {r.subtitulo && <div className="text-sm font-semibold text-slate-700 mt-1">{r.subtitulo}</div>}
              <div className="mt-1"><StatusBadge status={r.status} /></div>
            </div>
          </div>
          <div className="flex gap-2">
            {r.status === 'rascunho' && (
              <button onClick={() => setValidarOpen(true)} className="btn-outline inline-flex items-center gap-1 text-amber-700 border-amber-300">
                <ShieldCheck size={16} /> Validar e Assinar
              </button>
            )}
            <button onClick={() => downloadPdf(`/relatorios/${r.id}/pdf`)} className="btn-primary inline-flex items-center gap-1">
              <Printer size={16} /> Ver PDF
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="card p-4">
          <div className="text-xs font-semibold text-slate-500 uppercase mb-2 inline-flex items-center gap-1"><User size={14}/> Paciente</div>
          {r.paciente ? (
            <>
              <Link to={`/pacientes/${r.paciente.id}`} className="font-semibold text-hgb-700 hover:underline">{r.paciente.nome}</Link>
              <div className="text-xs text-slate-500 font-mono mt-0.5">{r.paciente.numero_processo}</div>
            </>
          ) : <div className="text-sm text-slate-400">—</div>}
        </div>
        <div className="card p-4">
          <div className="text-xs font-semibold text-slate-500 uppercase mb-2 inline-flex items-center gap-1"><Stethoscope size={14}/> Médico</div>
          {r.medico ? (
            <>
              <Link to={`/medicos/${r.medico.id}`} className="font-semibold text-emerald-700 hover:underline">{r.medico.nome}</Link>
              <div className="text-xs text-slate-500 mt-0.5">{r.medico.especialidade} · Ordem nº {r.medico.numero_ordem}</div>
            </>
          ) : <div className="text-sm text-amber-700">⚠ Sem médico atribuído</div>}
        </div>
      </div>

      <div className="card p-4 mb-4 grid grid-cols-4 gap-4 text-sm">
        <F label="Data emissão" value={r.data_emissao?.slice(0,10)} icon={<Calendar size={14}/>} />
        {r.cid && <F label="CID" value={r.cid} mono />}
        {r.grau_discapacidade != null && <F label="Discapacidade" value={`${r.grau_discapacidade}%`} />}
        {r.codigo_verificacao && <F label="Código verificação" value={r.codigo_verificacao} mono />}
      </div>

      <div className="space-y-3">
        {r.historia_doenca && <Block title="História da doença actual" html={r.historia_doenca} />}
        {r.exame_objectivo && <Block title="Exame objectivo" html={r.exame_objectivo} />}
        {r.exames_complementares && <Block title="Exames complementares" html={r.exames_complementares} />}
        {r.diagnostico && <Block title="Diagnóstico" html={r.diagnostico} />}
        {r.tratamento && <Block title="Tratamento" html={r.tratamento} />}
        {r.recomendacao && <Block title="Recomendação" html={r.recomendacao} />}
        {r.causa_morte && <Block title="Causa da morte" html={r.causa_morte} color="text-red-700" />}
        {r.motivo && <Block title="Motivo" html={r.motivo} />}
      </div>

      <div className="card p-4 mt-4">
        <div className="text-xs font-semibold text-slate-500 uppercase mb-3">Histórico de alterações</div>
        <ActivityHistory type="relatorio" id={r.id} />
      </div>

      <ValidarAssinaturaModal
        open={validarOpen}
        documento={r}
        tipo="relatorios"
        onClose={() => setValidarOpen(false)}
        onSuccess={() => { setValidarOpen(false); load() }}
      />
    </div>
  )
}

function F({ icon, label, value, mono }) {
  if (value == null || value === '') return null
  return (
    <div>
      <div className="text-xs text-slate-500 inline-flex items-center gap-1">{icon} {label}</div>
      <div className={`font-medium ${mono ? 'font-mono' : ''}`}>{value}</div>
    </div>
  )
}

function Block({ title, html, color }) {
  return (
    <div className="card p-4">
      <div className={`text-xs font-semibold uppercase mb-2 ${color || 'text-slate-500'}`}>{title}</div>
      <div className="text-sm prose-sm" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
