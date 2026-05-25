import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import {
  CalendarDays, Check, ChevronRight, ChevronLeft, Phone, User, Stethoscope,
  Search, Plus, MessageSquare, ShieldCheck, AlertCircle, CheckCircle2,
} from 'lucide-react'

// Cliente publico sem token — nao usa o /api/client (que injeta Authorization)
const apiPub = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
  headers: { Accept: 'application/json' },
})

const PASSOS = ['Identificação', 'Especialidade', 'Data e hora', 'Confirmação']

export default function PortalMarcacao() {
  const [passo, setPasso] = useState(0)
  // Passo 1
  const [tipoIdent, setTipoIdent] = useState('') // 'existente' | 'novo'
  const [bi, setBi] = useState('')
  const [pacienteExistente, setPacienteExistente] = useState(null)
  const [searchingBi, setSearchingBi] = useState(false)
  const [pacienteNovo, setPacienteNovo] = useState({ nome: '', bi: '', data_nascimento: '', sexo: '' })
  // Passo 2
  const [especialidades, setEspecialidades] = useState([])
  const [especialidade, setEspecialidade] = useState('')
  const [medicos, setMedicos] = useState([])
  const [medicoId, setMedicoId] = useState('')
  // Passo 3
  const [data, setData] = useState('')
  const [slots, setSlots] = useState([])
  const [slotSel, setSlotSel] = useState(null)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [motivo, setMotivo] = useState('')
  // Passo 4
  const [telefone, setTelefone] = useState('')
  const [sessionId, setSessionId] = useState(null)
  const [codigo, setCodigo] = useState('')
  const [telefoneMask, setTelefoneMask] = useState('')
  const [sending, setSending] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(null)

  useEffect(() => {
    apiPub.get('/portal/especialidades').then((r) => setEspecialidades(r.data.data || []))
  }, [])

  // Quando muda especialidade, carrega medicos dessa especialidade
  useEffect(() => {
    if (!especialidade) { setMedicos([]); setMedicoId(''); return }
    apiPub.get('/portal/medicos', { params: { especialidade } })
      .then((r) => setMedicos(r.data.data || []))
      .catch(() => setMedicos([]))
  }, [especialidade])

  async function buscarBi() {
    if (!bi.trim()) return
    setSearchingBi(true); setErro('')
    try {
      const { data } = await apiPub.post('/portal/verificar-paciente', { bi: bi.trim() })
      if (data.existe) {
        setPacienteExistente(data)
      } else {
        setErro('BI não encontrado. Pode optar por se registar como novo paciente.')
        setPacienteExistente(null)
      }
    } catch (e) {
      setErro(e.response?.data?.message || 'Erro na verificação.')
    } finally { setSearchingBi(false) }
  }

  async function carregarSlots() {
    if (!medicoId || !data) { setSlots([]); return }
    setSlotsLoading(true); setSlotSel(null)
    try {
      const { data: resp } = await apiPub.get(`/portal/medicos/${medicoId}/slots`, { params: { data } })
      setSlots(resp.data || [])
    } catch (e) {
      setErro(e.response?.data?.message || 'Erro ao carregar horários.')
    } finally { setSlotsLoading(false) }
  }

  useEffect(() => { carregarSlots() }, [medicoId, data])

  async function enviarCodigo() {
    setSending(true); setErro('')
    try {
      const payload = {
        telefone,
        medico_id: medicoId,
        data_agendamento: `${data}T${slotSel.inicio}`,
        duracao_minutos: slotSel.duracao_minutos,
        motivo: motivo || null,
      }
      if (tipoIdent === 'existente') {
        payload.paciente_id = pacienteExistente.paciente_id
      } else {
        payload.paciente_novo = pacienteNovo
      }
      const { data: resp } = await apiPub.post('/portal/iniciar', payload)
      setSessionId(resp.session_id); setTelefoneMask(resp.telefone_mask)
    } catch (e) {
      setErro(e.response?.data?.errors
        ? Object.values(e.response.data.errors).flat().join(' · ')
        : (e.response?.data?.message || 'Erro ao enviar código.'))
    } finally { setSending(false) }
  }

  async function confirmarCodigo() {
    setConfirming(true); setErro('')
    try {
      const { data: resp } = await apiPub.post('/portal/confirmar', { session_id: sessionId, codigo })
      setSucesso(resp)
    } catch (e) {
      const msg = e.response?.data?.message || 'Código incorreto.'
      const restantes = e.response?.data?.restantes
      setErro(restantes !== undefined ? `${msg} (${restantes} tentativas restantes)` : msg)
    } finally { setConfirming(false) }
  }

  const podeAvancar = () => {
    if (passo === 0) {
      if (tipoIdent === 'existente') return !!pacienteExistente
      if (tipoIdent === 'novo') return pacienteNovo.nome && pacienteNovo.bi && pacienteNovo.data_nascimento
      return false
    }
    if (passo === 1) return !!especialidade && !!medicoId
    if (passo === 2) return !!slotSel && !!data
    return false
  }

  // ============== SUCCESS SCREEN ==============
  if (sucesso) {
    return (
      <PortalLayout>
        <div className="text-center py-10">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="text-emerald-600" size={42} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Pedido recebido!</h2>
          <p className="text-slate-600 mb-4">{sucesso.mensagem}</p>
          <div className="inline-block bg-slate-50 border border-slate-200 rounded-lg px-6 py-3 mb-6">
            <div className="text-xs text-slate-500">Nº do pedido</div>
            <div className="font-mono text-xl font-bold text-hgb-700">{sucesso.agendamento_numero}</div>
          </div>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Vai receber um SMS no seu telemóvel quando a recepção confirmar a sua marcação.
            Em caso de dúvida, contacte o HGB.
          </p>
          <div className="flex gap-2 justify-center mt-6">
            <Link to={`/consultar?numero=${sucesso.agendamento_numero}`} className="btn-outline">
              Consultar estado
            </Link>
            <button onClick={() => window.location.reload()} className="btn-primary">
              Fazer nova marcação
            </button>
          </div>
        </div>
      </PortalLayout>
    )
  }

  return (
    <PortalLayout>
      {/* Stepper */}
      <ol className="flex items-center w-full mb-6 text-xs">
        {PASSOS.map((label, i) => (
          <li key={i} className={`flex items-center ${i < PASSOS.length - 1 ? 'flex-1' : ''}`}>
            <div className={`flex items-center gap-2 ${i <= passo ? 'text-hgb-700' : 'text-slate-400'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold ${
                i < passo ? 'bg-emerald-500 text-white'
                : i === passo ? 'bg-hgb-600 text-white'
                : 'bg-slate-200 text-slate-500'
              }`}>
                {i < passo ? <Check size={14} /> : i + 1}
              </div>
              <span className="hidden sm:inline font-medium">{label}</span>
            </div>
            {i < PASSOS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${i < passo ? 'bg-emerald-500' : 'bg-slate-200'}`} />
            )}
          </li>
        ))}
      </ol>

      {erro && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" /> {erro}
        </div>
      )}

      {/* PASSO 1: Identificação */}
      {passo === 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2"><User size={18} /> Quem vai à consulta?</h2>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setTipoIdent('existente')}
              className={`p-4 rounded-lg border-2 text-left transition ${
                tipoIdent === 'existente' ? 'border-hgb-600 bg-hgb-50' : 'border-slate-200 hover:border-slate-300'
              }`}>
              <Search className="text-hgb-600 mb-2" size={20} />
              <div className="font-semibold text-sm">Já sou paciente</div>
              <div className="text-xs text-slate-500">Tenho processo no HGB</div>
            </button>
            <button onClick={() => setTipoIdent('novo')}
              className={`p-4 rounded-lg border-2 text-left transition ${
                tipoIdent === 'novo' ? 'border-hgb-600 bg-hgb-50' : 'border-slate-200 hover:border-slate-300'
              }`}>
              <Plus className="text-hgb-600 mb-2" size={20} />
              <div className="font-semibold text-sm">Sou novo paciente</div>
              <div className="text-xs text-slate-500">Quero registar-me agora</div>
            </button>
          </div>

          {tipoIdent === 'existente' && (
            <div className="space-y-3">
              <div>
                <label className="label">Número do BI</label>
                <div className="flex gap-2">
                  <input className="input" value={bi} onChange={(e) => setBi(e.target.value)}
                    placeholder="Ex.: 000123456LA041" maxLength={20} />
                  <button className="btn-primary" onClick={buscarBi} disabled={searchingBi || !bi.trim()}>
                    {searchingBi ? '…' : 'Procurar'}
                  </button>
                </div>
              </div>
              {pacienteExistente && (
                <div className="bg-emerald-50 border border-emerald-200 rounded p-3 text-sm">
                  <div className="font-semibold text-emerald-800">✓ Encontrado</div>
                  <div className="text-emerald-700 text-xs mt-1">
                    Nome começa por <strong>{pacienteExistente.primeiro_nome}</strong>
                    {pacienteExistente.telefone_mask && <> · telefone <span className="font-mono">{pacienteExistente.telefone_mask}</span></>}
                  </div>
                </div>
              )}
            </div>
          )}

          {tipoIdent === 'novo' && (
            <div className="space-y-3">
              <div>
                <label className="label">Nome completo *</label>
                <input className="input" value={pacienteNovo.nome}
                  onChange={(e) => setPacienteNovo({ ...pacienteNovo, nome: e.target.value })} maxLength={255} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">BI *</label>
                  <input className="input" value={pacienteNovo.bi}
                    onChange={(e) => setPacienteNovo({ ...pacienteNovo, bi: e.target.value })} maxLength={20} />
                </div>
                <div>
                  <label className="label">Data de nascimento *</label>
                  <input type="date" className="input" value={pacienteNovo.data_nascimento}
                    onChange={(e) => setPacienteNovo({ ...pacienteNovo, data_nascimento: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">Sexo</label>
                <select className="input" value={pacienteNovo.sexo}
                  onChange={(e) => setPacienteNovo({ ...pacienteNovo, sexo: e.target.value })}>
                  <option value="">—</option>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PASSO 2: Especialidade → Médico */}
      {passo === 1 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2"><Stethoscope size={18} /> Qual consulta pretende?</h2>
          <p className="text-sm text-slate-500">Escolha primeiro a especialidade e depois o médico.</p>

          <div>
            <label className="label">Especialidade *</label>
            {especialidades.length === 0 ? (
              <p className="text-xs text-slate-400">A carregar…</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {especialidades.map((e) => (
                  <button type="button" key={e.especialidade}
                    onClick={() => setEspecialidade(e.especialidade)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition ${
                      especialidade === e.especialidade
                        ? 'bg-hgb-600 text-white border-hgb-600'
                        : 'bg-white border-slate-300 hover:border-hgb-500 hover:bg-hgb-50 text-slate-700'
                    }`}>
                    {e.especialidade}
                    <span className="ml-1.5 text-xs opacity-75">({e.medicos_count})</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {especialidade && (
            <div>
              <label className="label">Médico *</label>
              {medicos.length === 0 ? (
                <p className="text-xs text-amber-700">Sem médicos disponíveis nesta especialidade.</p>
              ) : (
                <select className="input" value={medicoId} onChange={(e) => setMedicoId(e.target.value)} required>
                  <option value="">— selecione —</option>
                  {medicos.map((m) => (
                    <option key={m.id} value={m.id}>{m.nome}</option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>
      )}

      {/* PASSO 3: Data e hora */}
      {passo === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2"><CalendarDays size={18} /> Quando?</h2>

          <div>
            <label className="label">Data</label>
            <input type="date" className="input" value={data} min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setData(e.target.value)} />
          </div>

          {data && medicoId && (
            <div className="bg-slate-50 border border-slate-200 rounded p-3">
              <div className="text-xs font-semibold text-slate-600 mb-2">
                Horários disponíveis {slotsLoading && '· a carregar…'}
              </div>
              {!slotsLoading && slots.length === 0 && (
                <p className="text-xs text-amber-700">Sem disponibilidade neste dia. Escolha outra data.</p>
              )}
              <div className="flex flex-wrap gap-1.5">
                {slots.map((s) => (
                  <button key={s.inicio} type="button" disabled={!s.disponivel}
                    onClick={() => setSlotSel(s)}
                    className={`text-sm px-3 py-1.5 rounded font-mono ${
                      !s.disponivel
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed line-through'
                        : slotSel?.inicio === s.inicio
                          ? 'bg-hgb-600 text-white'
                          : 'bg-white border border-slate-300 hover:border-hgb-500 hover:bg-hgb-50'
                    }`}>
                    {s.inicio}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="label">Motivo da consulta (opcional)</label>
            <textarea className="input" rows={2} value={motivo} maxLength={500}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ex.: Consulta de seguimento, dor lombar…" />
          </div>
        </div>
      )}

      {/* PASSO 4: Confirmação via SMS */}
      {passo === 3 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold flex items-center gap-2"><ShieldCheck size={18} /> Confirmação</h2>

          {!sessionId ? (
            <>
              <div className="bg-slate-50 border border-slate-200 rounded p-3 text-sm space-y-1">
                <div className="font-semibold text-slate-700">Resumo do pedido</div>
                {especialidade && (
                  <div className="text-slate-600"><strong>Especialidade:</strong> {especialidade}</div>
                )}
                {(medicos.find((m) => m.id === Number(medicoId))) && (
                  <div className="text-slate-600">
                    <strong>Médico:</strong> {medicos.find((m) => m.id === Number(medicoId))?.nome}
                  </div>
                )}
                <div className="text-slate-600">
                  <strong>Data:</strong> {new Date(`${data}T${slotSel?.inicio}`).toLocaleString('pt-PT', { dateStyle: 'long', timeStyle: 'short' })}
                </div>
              </div>

              <div>
                <label className="label flex items-center gap-1"><Phone size={12} /> Telefone para SMS *</label>
                <input className="input" value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="Ex.: 923000000 ou +244923000000"
                  maxLength={30} />
                <p className="text-xs text-slate-500 mt-1">Vai receber um código de 6 dígitos para confirmar.</p>
              </div>

              <button className="btn-primary w-full inline-flex items-center justify-center gap-2"
                onClick={enviarCodigo} disabled={sending || !telefone.trim()}>
                <MessageSquare size={16} /> {sending ? 'A enviar…' : 'Enviar código por SMS'}
              </button>
            </>
          ) : (
            <>
              <div className="bg-emerald-50 border border-emerald-200 rounded p-3 text-sm text-emerald-700">
                Código enviado para <strong className="font-mono">{telefoneMask}</strong>. Válido por 10 minutos.
              </div>
              <div>
                <label className="label">Código de 6 dígitos *</label>
                <input className="input text-center text-2xl font-mono tracking-widest"
                  value={codigo} onChange={(e) => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6} placeholder="000000" />
              </div>
              <button className="btn-primary w-full"
                onClick={confirmarCodigo} disabled={confirming || codigo.length !== 6}>
                {confirming ? 'A confirmar…' : 'Confirmar marcação'}
              </button>
              <button className="text-xs text-slate-500 hover:underline w-full"
                onClick={() => { setSessionId(null); setCodigo('') }}>
                Trocar de telefone
              </button>
            </>
          )}
        </div>
      )}

      {/* Navegação */}
      {!sessionId && (
        <div className="flex justify-between mt-6">
          <button className="btn-outline inline-flex items-center gap-1"
            onClick={() => { setPasso((p) => Math.max(0, p - 1)); setErro('') }}
            disabled={passo === 0}>
            <ChevronLeft size={16} /> Voltar
          </button>
          {passo < 3 && (
            <button className="btn-primary inline-flex items-center gap-1"
              onClick={() => { setPasso((p) => p + 1); setErro('') }}
              disabled={!podeAvancar()}>
              Seguinte <ChevronRight size={16} />
            </button>
          )}
        </div>
      )}
    </PortalLayout>
  )
}

function PortalLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-hgb-50 via-white to-slate-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="text-center mb-6">
          <img src="/logo.png" alt="HGB" className="w-16 h-16 mx-auto mb-2 bg-white rounded-full shadow p-1" />
          <h1 className="text-2xl font-bold text-hgb-900">Marcar consulta</h1>
          <p className="text-xs text-slate-500">Hospital Geral de Benguela</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 sm:p-6">
          {children}
        </div>
        <p className="text-center text-xs text-slate-400 mt-4">
          Já marcou e quer ver o estado? <Link to="/consultar" className="text-hgb-600 hover:underline">Consultar marcação</Link>
        </p>
        <p className="text-center text-xs text-slate-400 mt-2">
          Em caso de emergência, dirija-se imediatamente à urgência do hospital.
        </p>
      </div>
    </div>
  )
}
