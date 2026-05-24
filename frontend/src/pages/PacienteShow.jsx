import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft, FileText, ClipboardList, FileCheck2, FlaskConical, BedDouble, MessageSquare, Printer,
  User, Cake, Phone, Mail, MapPin, IdCard, Users,
} from 'lucide-react'
import api, { downloadPdf } from '../api/client'
import StatusBadge from '../components/StatusBadge'
import ActivityHistory from '../components/ActivityHistory'

const sexoLabel = (s) => s === 'F' ? 'Feminino' : s === 'M' ? 'Masculino' : '—'

export default function PacienteShow() {
  const { id } = useParams()
  const [data, setData] = useState(null)

  useEffect(() => {
    api.get(`/pacientes/${id}`).then((r) => setData(r.data))
  }, [id])

  if (!data) return <div className="text-slate-500">A carregar…</div>

  const p = data.paciente
  const idade = p.data_nascimento ? Math.floor((Date.now() - new Date(p.data_nascimento)) / (1000*60*60*24*365.25)) : null

  return (
    <div>
      <Link to="/pacientes" className="text-sm text-slate-500 hover:text-hgb-600 inline-flex items-center gap-1 mb-3">
        <ArrowLeft size={14} /> Voltar à lista
      </Link>

      <div className="card p-6 mb-4 bg-gradient-to-r from-hgb-50 to-white">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-hgb-600 text-white rounded-full flex items-center justify-center">
            <User size={28} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{p.nome}</h1>
            <div className="text-sm text-slate-500 font-mono mt-0.5">{p.numero_processo}</div>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-600">
              {p.sexo && <span>{sexoLabel(p.sexo)}</span>}
              {idade != null && <span>· {idade} anos</span>}
              {p.estado_civil && <span>· {p.estado_civil}</span>}
              {p.grupo_sanguineo && <span>· Grupo {p.grupo_sanguineo}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="card p-4">
          <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Identificação</div>
          <Field icon={<IdCard size={14}/>} label="BI" value={p.bi} mono />
          {p.bi_emissao_local && <Field label="Emissão BI" value={`${p.bi_emissao_local}${p.bi_emissao_data ? ' · '+p.bi_emissao_data.slice(0,10) : ''}`} />}
          {p.data_nascimento && <Field icon={<Cake size={14}/>} label="Nascimento" value={p.data_nascimento.slice(0,10)} />}
        </div>
        <div className="card p-4">
          <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Contacto</div>
          <Field icon={<Phone size={14}/>} label="Telefone" value={p.telefone} mono />
          <Field icon={<Mail size={14}/>} label="Email" value={p.email} />
        </div>
        <div className="card p-4">
          <div className="text-xs font-semibold text-slate-500 uppercase mb-2">Localização</div>
          <Field icon={<MapPin size={14}/>} label="Residência" value={[p.bairro, p.municipio, p.provincia].filter(Boolean).join(', ')} />
          <Field label="Naturalidade" value={[p.naturalidade_municipio, p.naturalidade_provincia].filter(Boolean).join(', ')} />
        </div>
      </div>

      {(p.nome_pai || p.nome_mae) && (
        <div className="card p-4 mb-4">
          <div className="text-xs font-semibold text-slate-500 uppercase mb-2 inline-flex items-center gap-1"><Users size={14}/> Filiação</div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Field label="Pai" value={p.nome_pai} />
            <Field label="Mãe" value={p.nome_mae} />
          </div>
        </div>
      )}

      {(p.alergias || p.observacoes) && (
        <div className="card p-4 mb-4">
          {p.alergias && <Field label="Alergias" value={p.alergias} />}
          {p.observacoes && <Field label="Observações" value={p.observacoes} />}
        </div>
      )}

      <div className="grid grid-cols-6 gap-3 mb-4">
        <CountCard label="Atestados" value={data.counts.atestados} color="bg-rose-600" Icon={FileCheck2} />
        <CountCard label="Relatórios" value={data.counts.relatorios} color="bg-hgb-600" Icon={FileText} />
        <CountCard label="Consultas" value={data.counts.consultas} color="bg-indigo-600" Icon={ClipboardList} />
        <CountCard label="Exames" value={data.counts.exames} color="bg-amber-600" Icon={FlaskConical} />
        <CountCard label="Altas" value={data.counts.altas} color="bg-cyan-700" Icon={BedDouble} />
        <CountCard label="SMS" value={data.counts.sms} color="bg-emerald-600" Icon={MessageSquare} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <DocList title="Atestados" items={p.atestados} pathPrefix="/atestados" labelFn={(a) => `${a.numero} · ${a.tipo}`} />
        <DocList title="Relatórios clínicos" items={data.relatorios} pathPrefix="/relatorios" labelFn={(r) => `${r.numero} · ${r.tipo}`} />
        <DocList title="Consultas" items={p.consultas} pathPrefix="/consultas" labelFn={(c) => `${c.numero} · ${c.diagnostico?.slice(0,50)}`} />
        <DocList title="Exames" items={p.exames} pathPrefix="/exames" labelFn={(e) => `${e.numero} · ${e.tipo_exame}`} />
        <DocList title="Altas hospitalares" items={p.altas} pathPrefix="/altas" labelFn={(a) => `${a.numero} · ${a.condicao_alta}`} />
        <SmsList items={data.sms} />
      </div>

      <div className="card p-4 mt-4">
        <div className="text-xs font-semibold text-slate-500 uppercase mb-3">Histórico de alterações</div>
        <ActivityHistory type="paciente" id={p.id} />
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
        {(items || []).slice(0, 10).map((it) => (
          <li key={it.id} className="px-4 py-2 text-sm flex items-center justify-between hover:bg-slate-50">
            <div className="truncate">
              <div className="font-medium truncate">{labelFn(it)}</div>
              <div className="text-xs text-slate-500">{(it.data_emissao || it.data_consulta || it.data_realizacao || it.data_alta)?.slice(0,10)}{it.medico ? ' · '+it.medico.nome : ''}</div>
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

function SmsList({ items }) {
  return (
    <div className="card overflow-hidden">
      <div className="bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600 uppercase">SMS ({items?.length || 0})</div>
      <ul className="divide-y divide-slate-100">
        {(items || []).slice(0, 10).map((s) => (
          <li key={s.id} className="px-4 py-2 text-sm">
            <div className="flex justify-between items-start">
              <span className="font-mono text-xs">{s.to}</span>
              <StatusBadge status={s.status} />
            </div>
            <div className="text-xs text-slate-600 truncate mt-1">{s.body}</div>
            <div className="text-xs text-slate-400 mt-0.5">{(s.sent_at || s.created_at)?.slice(0,16).replace('T',' ')}</div>
          </li>
        ))}
        {(!items || items.length === 0) && <li className="px-4 py-3 text-xs text-slate-400">Sem SMS.</li>}
      </ul>
    </div>
  )
}
