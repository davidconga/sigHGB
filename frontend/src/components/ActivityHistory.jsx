import { useEffect, useState } from 'react'
import { Clock, User as UserIcon } from 'lucide-react'
import api from '../api/client'

const VERBS = { created: 'criou', updated: 'actualizou', deleted: 'eliminou' }
const VERB_COLORS = {
  created: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  updated: 'bg-amber-50 text-amber-700 border-amber-200',
  deleted: 'bg-red-50 text-red-700 border-red-200',
}

/**
 * @param {string} type   paciente | atestado | relatorio | medico | user
 * @param {number} id
 */
export default function ActivityHistory({ type, id }) {
  const [items, setItems] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    let alive = true
    api.get(`/activity/${type}/${id}`).then(({ data }) => {
      if (alive) setItems(data)
    }).catch((e) => alive && setErr(e.response?.data?.message || 'Erro ao carregar histórico.'))
    return () => { alive = false }
  }, [type, id])

  if (err) return <div className="text-sm text-red-600">{err}</div>
  if (items === null) return <div className="text-sm text-slate-400">A carregar…</div>
  if (items.length === 0) return <div className="text-sm text-slate-400">Sem alterações registadas.</div>

  return (
    <div className="space-y-2">
      {items.map((a) => (
        <div key={a.id} className="border border-slate-200 rounded-md p-3 bg-white">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${VERB_COLORS[a.description] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                {VERBS[a.description] || a.description}
              </span>
              <span className="text-xs text-slate-500 flex items-center gap-1 truncate">
                <UserIcon size={12} />
                {a.causer?.name || '(sistema)'}
              </span>
            </div>
            <span className="text-xs text-slate-400 flex items-center gap-1 whitespace-nowrap">
              <Clock size={12} />
              {new Date(a.created_at).toLocaleString('pt-PT')}
            </span>
          </div>
          {a.changes?.attributes && (
            <table className="mt-2 w-full text-xs">
              <tbody>
                {Object.entries(a.changes.attributes).map(([k, v]) => (
                  <tr key={k} className="border-t border-slate-100">
                    <td className="py-1 pr-3 text-slate-500 align-top w-1/4 font-medium">{k}</td>
                    <td className="py-1 align-top">
                      {a.changes.old?.[k] !== undefined && (
                        <span className="line-through text-slate-400 mr-2">{formatVal(a.changes.old[k])}</span>
                      )}
                      <span className="text-slate-800">{formatVal(v)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ))}
    </div>
  )
}

function formatVal(v) {
  if (v === null || v === undefined) return <em className="text-slate-400">vazio</em>
  if (typeof v === 'boolean') return v ? 'sim' : 'não'
  if (typeof v === 'object') return JSON.stringify(v)
  const s = String(v)
  return s.length > 100 ? s.slice(0, 100) + '…' : s
}
