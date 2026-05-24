import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../api/client'

const tipoLabel = {
  Consulta: 'Consulta médica',
  Exame: 'Exame laboratorial',
  Atestado: 'Atestado médico',
  Alta: 'Alta hospitalar',
}

export default function Verificar() {
  const { codigo: codigoUrl } = useParams()
  const navigate = useNavigate()
  const [codigo, setCodigo] = useState(codigoUrl || '')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (codigoUrl) verificar(codigoUrl)
  }, [codigoUrl])

  async function verificar(c) {
    setLoading(true); setError(''); setResult(null)
    try {
      const { data } = await api.get(`/verificar/${encodeURIComponent(c.toUpperCase())}`)
      setResult(data)
    } catch (e) {
      setError(e.response?.status === 404
        ? 'Código de verificação inválido. O documento não foi encontrado.'
        : 'Erro ao consultar o serviço de verificação.')
    } finally {
      setLoading(false)
    }
  }

  function onSubmit(e) {
    e.preventDefault()
    const c = codigo.trim()
    if (!c) return
    navigate(`/verificar/${c.toUpperCase()}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-hgb-900 to-hgb-600 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center text-white mb-6">
          <img src="/logo.png" alt="HGB" className="w-20 h-20 mx-auto mb-3 bg-white rounded-full p-1" />
          <h1 className="text-2xl font-bold text-white">Hospital Geral de Benguela</h1>
          <p className="text-sm text-hgb-100">Verificação de autenticidade de relatórios</p>
        </div>

        <div className="card p-6">
          <p className="text-sm text-slate-600 mb-4">
            Insira o <strong>código de verificação</strong> de 8 caracteres que aparece no rodapé do relatório
            médico para confirmar a sua autenticidade.
          </p>

          <form onSubmit={onSubmit} className="flex gap-2 mb-6">
            <input
              className="input flex-1 font-mono uppercase tracking-widest text-center"
              maxLength={10}
              placeholder="XXXXXXXX"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              required
            />
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'A verificar…' : 'Verificar'}
            </button>
          </form>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="font-semibold text-red-700">✗ Documento não autenticado</div>
              <div className="text-sm text-red-600 mt-1">{error}</div>
            </div>
          )}

          {result && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-md p-4">
              <div className="font-semibold text-emerald-700 mb-3">✓ Documento autêntico</div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-slate-500 uppercase">Tipo</dt>
                  <dd className="font-medium">{tipoLabel[result.tipo] || result.tipo}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 uppercase">Nº do documento</dt>
                  <dd className="font-mono">{result.numero}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 uppercase">Paciente</dt>
                  <dd className="font-medium">{result.paciente?.nome}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 uppercase">Processo</dt>
                  <dd className="font-mono text-xs">{result.paciente?.numero_processo}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs text-slate-500 uppercase">Médico responsável</dt>
                  <dd className="font-medium">
                    {result.medico?.nome} · {result.medico?.especialidade} ·
                    <span className="text-slate-500"> Ordem nº {result.medico?.numero_ordem}</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 uppercase">Estado</dt>
                  <dd>
                    <span className={`badge-${result.status}`}>{result.status?.toUpperCase()}</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 uppercase">Emitido em</dt>
                  <dd>{new Date(result.emitido_em).toLocaleString('pt-PT')}</dd>
                </div>
              </dl>
            </div>
          )}
        </div>

        <div className="text-center mt-4">
          <Link to="/login" className="text-sm text-hgb-100 hover:text-white underline">
            Aceder ao sistema
          </Link>
        </div>
      </div>
    </div>
  )
}
