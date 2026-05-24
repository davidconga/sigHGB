import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Smartphone, Download } from 'lucide-react'
import api from '../api/client'
import { useAuth } from '../auth/AuthContext'

function formatBytes(n) {
  if (!n || n <= 0) return ''
  if (n < 1024) return n + ' B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(0) + ' KB'
  return (n / 1024 / 1024).toFixed(1) + ' MB'
}

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@hgb.ao')
  const [password, setPassword] = useState('admin123')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [apk, setApk] = useState(null)

  useEffect(() => {
    api.get('/app/android').then(({ data }) => {
      if (data?.exists) setApk(data)
    }).catch(() => {})
  }, [])

  async function onSubmit(e) {
    e.preventDefault()
    setErr(''); setLoading(true)
    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch (e) {
      setErr(e.response?.data?.message || 'Falha no login.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-hgb-900 to-hgb-600 p-6">
      <div className="card w-full max-w-md p-8">
        <div className="text-center mb-6">
          <img src="/logo.png" alt="HGB" className="w-24 h-24 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-hgb-900">Hospital Geral de Benguela</h1>
          <p className="text-sm text-slate-500">Sistema Integrado de Gestão</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Palavra-passe</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {err && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{err}</div>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'A entrar…' : 'Entrar'}
          </button>
        </form>
        <p className="text-xs text-slate-400 mt-6 text-center">
          Demo: admin@hgb.ao / admin123
        </p>

        {apk && (
          <a
            href={apk.url}
            download
            className="mt-5 flex items-center gap-3 p-3 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-emerald-800">App Android — SIGHGB</div>
              <div className="text-xs text-emerald-700">
                v{apk.version} · {formatBytes(apk.size)} · toca para descarregar
              </div>
            </div>
            <Download className="w-4 h-4 text-emerald-700" />
          </a>
        )}

        <div className="text-center mt-4 pt-4 border-t border-slate-100">
          <Link to="/verificar" className="text-sm text-hgb-600 hover:underline">
            Verificar autenticidade de um relatório
          </Link>
        </div>
      </div>
    </div>
  )
}
