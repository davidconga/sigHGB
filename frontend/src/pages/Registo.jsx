import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, Stethoscope, Briefcase } from 'lucide-react'
import api from '../api/client'

export default function Registo() {
  const navigate = useNavigate()
  const [tipo, setTipo] = useState('medico')
  const [departamentos, setDepartamentos] = useState([])
  const [servicos, setServicos] = useState([])
  const [form, setForm] = useState({
    name: '', email: '', password: '', telefone: '',
    numero_ordem: '', especialidade: '',
    bi: '', cargo: '', departamento_id: '', servico_id: '',
  })
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    api.get('/registo/opcoes').then(({ data }) => {
      setDepartamentos(data.departamentos || [])
      setServicos(data.servicos || [])
    }).catch(() => {})
  }, [])

  const filteredServicos = form.departamento_id
    ? servicos.filter((s) => String(s.departamento_id) === String(form.departamento_id))
    : servicos

  function setField(k, v) { setForm((f) => ({ ...f, [k]: v })) }

  async function submit(e) {
    e.preventDefault()
    setErr(''); setLoading(true)
    try {
      await api.post('/register', { tipo, ...form })
      setDone(true)
    } catch (e) {
      const v = e.response?.data?.errors
      if (v) setErr(Object.values(v).flat().join(' · '))
      else setErr(e.response?.data?.message || 'Erro ao registar.')
    } finally { setLoading(false) }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-hgb-900 to-hgb-600 p-6">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-hgb-900 mb-2">Registo submetido</h1>
          <p className="text-sm text-slate-600 mb-5">
            O teu pedido foi enviado para o administrador. Vais ser notificado quando for aprovado.
          </p>
          <button onClick={() => navigate('/login')} className="btn-primary w-full">Voltar ao login</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-hgb-900 to-hgb-600 p-4 sm:p-6">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 sm:p-8">
        <div className="text-center mb-5">
          <img src="/logo.png" alt="HGB" className="w-16 h-16 mx-auto mb-2" />
          <h1 className="text-xl font-bold text-hgb-900">Criar conta</h1>
          <p className="text-xs text-slate-500">Após o envio, o admin aprovará o teu acesso.</p>
        </div>

        <div className="flex gap-2 mb-5">
          <TipoButton active={tipo === 'medico'} onClick={() => setTipo('medico')} Icon={Stethoscope} label="Médico" />
          <TipoButton active={tipo === 'funcionario'} onClick={() => setTipo('funcionario')} Icon={Briefcase} label="Funcionário" />
        </div>

        <form onSubmit={submit} className="space-y-3">
          <Row>
            <Field label="Nome completo *" value={form.name} onChange={(v) => setField('name', v)} required />
          </Row>
          <Row>
            <Field label="Email *" type="email" value={form.email} onChange={(v) => setField('email', v)} required />
            <Field label="Telefone" value={form.telefone} onChange={(v) => setField('telefone', v)} />
          </Row>
          <Row>
            <Field label="Palavra-passe *" type="password" value={form.password} onChange={(v) => setField('password', v)} required minLength={6} />
          </Row>

          {tipo === 'medico' ? (
            <Row>
              <Field label="Nº de Ordem *" value={form.numero_ordem} onChange={(v) => setField('numero_ordem', v)} required />
              <Field label="Especialidade *" value={form.especialidade} onChange={(v) => setField('especialidade', v)} required />
            </Row>
          ) : (
            <>
              <Row>
                <Field label="BI *" value={form.bi} onChange={(v) => setField('bi', v)} required />
                <Field label="Cargo" value={form.cargo} onChange={(v) => setField('cargo', v)} />
              </Row>
              <Row>
                <div className="flex-1">
                  <label className="label">Departamento</label>
                  <select className="input" value={form.departamento_id} onChange={(e) => { setField('departamento_id', e.target.value); setField('servico_id', '') }}>
                    <option value="">—</option>
                    {departamentos.map((d) => <option key={d.id} value={d.id}>{d.nome}</option>)}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="label">Serviço</label>
                  <select className="input" value={form.servico_id} onChange={(e) => setField('servico_id', e.target.value)} disabled={!form.departamento_id}>
                    <option value="">—</option>
                    {filteredServicos.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
                  </select>
                </div>
              </Row>
            </>
          )}

          {err && <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded">{err}</div>}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'A enviar…' : 'Submeter pedido'}
          </button>
        </form>

        <p className="text-xs text-slate-500 text-center mt-5">
          Já tens conta? <Link to="/login" className="text-hgb-600 hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  )
}

function TipoButton({ active, onClick, Icon, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm border transition ${
        active
          ? 'bg-hgb-600 text-white border-hgb-600'
          : 'bg-white text-slate-600 border-slate-200 hover:border-hgb-500'
      }`}
    >
      <Icon size={16} />
      <span className="font-medium">{label}</span>
    </button>
  )
}

function Row({ children }) {
  return <div className="flex flex-col sm:flex-row gap-3">{children}</div>
}

function Field({ label, value, onChange, type = 'text', ...rest }) {
  return (
    <div className="flex-1">
      <label className="label">{label}</label>
      <input
        type={type}
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        {...rest}
      />
    </div>
  )
}
