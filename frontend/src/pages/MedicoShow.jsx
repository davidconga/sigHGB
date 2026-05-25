import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft, Stethoscope, IdCard, Phone, Mail,
  FileText, ClipboardList, FileCheck2, FlaskConical, BedDouble, Printer,
} from 'lucide-react'
import api, { downloadPdf } from '../api/client'
import StatusBadge from '../components/StatusBadge'
import MedicoDisponibilidade from '../components/MedicoDisponibilidade'

export default function MedicoShow() {
  const { id } = useParams()
  const [data, setData] = useState(null)

  useEffect(() => {
    api.get(`/medicos/${id}`).then((r) => setData(r.data))
  }, [id])

  if (!data) return <div className="text-slate-500">A carregar…</div>

  const m = data.medico

  return (
    <div>
      <Link to="/medicos" className="text-sm text-slate-500 hover:text-hgb-600 inline-flex items-center gap-1 mb-3">
        <ArrowLeft size={14} /> Voltar à lista
      </Link>

      <div className="card p-6 mb-4 bg-gradient-to-r from-hgb-50 to-white">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-emerald-600 text-white rounded-full flex items-center justify-center">
            <Stethoscope size={28} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{m.nome}</h1>
            <div className="text-sm text-slate-600 mt-0.5">{m.especialidade}</div>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1"><IdCard size={12} /> Ordem nº <span className="font-mono">{m.numero_ordem}</span></span>
              {m.telefone && <span className="inline-flex items-center gap-1"><Phone size={12} /> {m.telefone}</span>}
              {m.email && <span className="inline-flex items-center gap-1"><Mail size={12} /> {m.email}</span>}
              {m.ativo ? <span className="badge-emitido">ATIVO</span> : <span className="badge-anulado">INATIVO</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="card p-4">
          <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Assinatura digital</div>
          {m.assinatura_url
            ? <div className="bg-slate-50 rounded p-2 flex justify-center"><img src={m.assinatura_url} className="max-h-24" alt="" /></div>
            : <div className="text-xs text-slate-400 italic">Não carregada</div>}
        </div>
        <div className="card p-4">
          <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Carimbo digital</div>
          {m.carimbo_url
            ? <div className="bg-slate-50 rounded p-2 flex justify-center"><img src={m.carimbo_url} className="max-h-24" alt="" /></div>
            : <div className="text-xs text-slate-400 italic">Não carregado</div>}
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3 mb-4">
        <CountCard label="Atestados" value={data.counts.atestados} color="bg-rose-600" Icon={FileCheck2} />
        <CountCard label="Relatórios" value={data.counts.relatorios} color="bg-hgb-600" Icon={FileText} />
        <CountCard label="Consultas" value={data.counts.consultas} color="bg-indigo-600" Icon={ClipboardList} />
        <CountCard label="Exames" value={data.counts.exames} color="bg-amber-600" Icon={FlaskConical} />
        <CountCard label="Altas" value={data.counts.altas} color="bg-cyan-700" Icon={BedDouble} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <DocList title="Atestados recentes" items={data.atestados} pathPrefix="/atestados" labelFn={(a) => `${a.numero} · ${a.tipo}`} />
        <DocList title="Relatórios recentes" items={data.relatorios} pathPrefix="/relatorios" labelFn={(r) => `${r.numero} · ${r.tipo}`} />
      </div>

      <MedicoDisponibilidade medicoId={m.id} />
    </div>
  )
}

function CountCard({ label, value, color, Icon }) {
  return (
    <div className="card p-3">
      <div className={`w-9 h-9 ${color} text-white rounded mb-2 flex items-center justify-center`}><Icon size={16}/></div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  )
}

function DocList({ title, items, pathPrefix, labelFn }) {
  return (
    <div className="card overflow-hidden">
      <div className="bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 uppercase">{title} ({items?.length || 0})</div>
      <ul className="divide-y divide-slate-100">
        {(items || []).map((it) => (
          <li key={it.id} className="px-4 py-2 text-sm flex items-center justify-between hover:bg-slate-50">
            <div className="truncate flex-1 min-w-0">
              <div className="font-medium truncate">{labelFn(it)}</div>
              <div className="text-xs text-slate-500 truncate">
                {it.paciente?.nome}
                {it.data_emissao && ' · ' + it.data_emissao.slice(0,10)}
                {' · '}<StatusBadge status={it.status} />
              </div>
            </div>
            <button onClick={() => downloadPdf(`${pathPrefix}/${it.id}/pdf`)} title="PDF" className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600 flex-shrink-0">
              <Printer size={14} />
            </button>
          </li>
        ))}
        {(!items || items.length === 0) && <li className="px-4 py-3 text-xs text-slate-400">Sem registos.</li>}
      </ul>
    </div>
  )
}
