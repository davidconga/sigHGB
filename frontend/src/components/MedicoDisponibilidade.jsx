import { useEffect, useState } from 'react'
import { Plus, Trash2, CalendarClock, CalendarX } from 'lucide-react'
import api from '../api/client'
import Modal from './Modal'
import { useConfirm } from './ConfirmDialog'

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export default function MedicoDisponibilidade({ medicoId }) {
  const confirm = useConfirm()
  const [data, setData] = useState({ disponibilidades: [], ausencias: [] })
  const [openDisp, setOpenDisp] = useState(false)
  const [formDisp, setFormDisp] = useState({ dia_semana: 1, hora_inicio: '08:00', hora_fim: '12:00', duracao_minutos: 30, ativo: true })
  const [errorsDisp, setErrorsDisp] = useState({})
  const [openAus, setOpenAus] = useState(false)
  const [formAus, setFormAus] = useState({ inicio: '', fim: '', motivo: '' })
  const [errorsAus, setErrorsAus] = useState({})

  async function load() {
    const { data } = await api.get(`/medicos/${medicoId}/disponibilidade`)
    setData(data)
  }
  useEffect(() => { load() }, [medicoId])

  function openNovoBloco(diaSemana = 1) {
    setFormDisp({ dia_semana: diaSemana, hora_inicio: '08:00', hora_fim: '12:00', duracao_minutos: 30, ativo: true })
    setErrorsDisp({}); setOpenDisp(true)
  }

  async function guardarBloco(e) {
    e.preventDefault(); setErrorsDisp({})
    try {
      await api.post(`/medicos/${medicoId}/disponibilidades`, formDisp)
      setOpenDisp(false); load()
    } catch (e) {
      setErrorsDisp(e.response?.data?.errors || { _: [e.response?.data?.message || 'Erro'] })
    }
  }

  async function removerBloco(id) {
    if (!await confirm('Remover este bloco de disponibilidade?')) return
    await api.delete(`/medicos/${medicoId}/disponibilidades/${id}`); load()
  }

  function openNovaAusencia() {
    const agora = new Date()
    const init = agora.toISOString().slice(0, 16)
    setFormAus({ inicio: init, fim: init, motivo: '' })
    setErrorsAus({}); setOpenAus(true)
  }

  async function guardarAusencia(e) {
    e.preventDefault(); setErrorsAus({})
    try {
      await api.post(`/medicos/${medicoId}/ausencias`, formAus)
      setOpenAus(false); load()
    } catch (e) {
      setErrorsAus(e.response?.data?.errors || { _: [e.response?.data?.message || 'Erro'] })
    }
  }

  async function removerAusencia(id) {
    if (!await confirm('Remover esta ausência?')) return
    await api.delete(`/medicos/${medicoId}/ausencias/${id}`); load()
  }

  // Agrupa disponibilidades por dia
  const porDia = DIAS.map((nome, idx) => ({
    idx, nome,
    blocos: data.disponibilidades.filter((d) => d.dia_semana === idx),
  }))

  return (
    <div className="space-y-4">
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600 flex items-center gap-2">
            <CalendarClock size={16} /> Horário semanal
          </h2>
          <button onClick={() => openNovoBloco()} className="btn-primary inline-flex items-center gap-1 text-xs px-2 py-1">
            <Plus size={14} /> Adicionar bloco
          </button>
        </div>
        <div className="divide-y divide-slate-100">
          {porDia.map((d) => (
            <div key={d.idx} className="px-4 py-3 flex items-start gap-4">
              <div className="w-24 text-sm font-semibold text-slate-700">{d.nome}</div>
              <div className="flex-1 flex flex-wrap gap-2">
                {d.blocos.length === 0 && <span className="text-xs text-slate-400 italic">Sem disponibilidade</span>}
                {d.blocos.map((b) => (
                  <div key={b.id} className={`group inline-flex items-center gap-2 px-3 py-1.5 rounded border text-xs ${
                    b.ativo ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-slate-100 border-slate-200 text-slate-500 line-through'
                  }`}>
                    <span className="font-mono">{b.hora_inicio.slice(0, 5)}–{b.hora_fim.slice(0, 5)}</span>
                    <span className="text-slate-500">·</span>
                    <span>{b.duracao_minutos}min</span>
                    <button onClick={() => removerBloco(b.id)} className="opacity-0 group-hover:opacity-100 text-red-600 hover:bg-red-100 rounded p-0.5 transition">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                <button onClick={() => openNovoBloco(d.idx)} className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-hgb-600 px-2 py-1">
                  <Plus size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600 flex items-center gap-2">
            <CalendarX size={16} /> Ausências e folgas
          </h2>
          <button onClick={openNovaAusencia} className="btn-primary inline-flex items-center gap-1 text-xs px-2 py-1">
            <Plus size={14} /> Adicionar ausência
          </button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Início</th>
              <th className="text-left px-4 py-2">Fim</th>
              <th className="text-left px-4 py-2">Motivo</th>
              <th className="text-right px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {data.ausencias.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">Sem ausências registadas.</td></tr>
            )}
            {data.ausencias.map((a) => {
              const passou = new Date(a.fim) < new Date()
              return (
                <tr key={a.id} className={`border-t border-slate-100 ${passou ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-2">{new Date(a.inicio).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td className="px-4 py-2">{new Date(a.fim).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' })}</td>
                  <td className="px-4 py-2 text-slate-600">{a.motivo || '—'}</td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => removerAusencia(a.id)} className="p-1.5 rounded hover:bg-red-50 text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Modal open={openDisp} onClose={() => setOpenDisp(false)} title="Novo bloco de disponibilidade">
        <form onSubmit={guardarBloco} className="space-y-3">
          <div>
            <label className="label">Dia da semana</label>
            <select className="input" value={formDisp.dia_semana} onChange={(e) => setFormDisp({ ...formDisp, dia_semana: Number(e.target.value) })}>
              {DIAS.map((d, i) => <option key={i} value={i}>{d}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Início</label>
              <input type="time" className="input" value={formDisp.hora_inicio} onChange={(e) => setFormDisp({ ...formDisp, hora_inicio: e.target.value })} required />
            </div>
            <div>
              <label className="label">Fim</label>
              <input type="time" className="input" value={formDisp.hora_fim} onChange={(e) => setFormDisp({ ...formDisp, hora_fim: e.target.value })} required />
            </div>
            <div>
              <label className="label">Slot (min)</label>
              <input type="number" min={5} max={480} step={5} className="input" value={formDisp.duracao_minutos} onChange={(e) => setFormDisp({ ...formDisp, duracao_minutos: Number(e.target.value) })} />
            </div>
          </div>
          {errorsDisp._ && <p className="text-sm text-red-600">{errorsDisp._[0]}</p>}
          {Object.entries(errorsDisp).filter(([k]) => k !== '_').map(([k, v]) => (
            <p key={k} className="text-xs text-red-600">{k}: {v[0]}</p>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-outline" onClick={() => setOpenDisp(false)}>Cancelar</button>
            <button type="submit" className="btn-primary">Guardar</button>
          </div>
        </form>
      </Modal>

      <Modal open={openAus} onClose={() => setOpenAus(false)} title="Nova ausência">
        <form onSubmit={guardarAusencia} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Início</label>
              <input type="datetime-local" className="input" value={formAus.inicio} onChange={(e) => setFormAus({ ...formAus, inicio: e.target.value })} required />
            </div>
            <div>
              <label className="label">Fim</label>
              <input type="datetime-local" className="input" value={formAus.fim} onChange={(e) => setFormAus({ ...formAus, fim: e.target.value })} required />
            </div>
          </div>
          <div>
            <label className="label">Motivo</label>
            <input className="input" value={formAus.motivo} onChange={(e) => setFormAus({ ...formAus, motivo: e.target.value })} placeholder="Férias, formação, congresso…" maxLength={255} />
          </div>
          {errorsAus._ && <p className="text-sm text-red-600">{errorsAus._[0]}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-outline" onClick={() => setOpenAus(false)}>Cancelar</button>
            <button type="submit" className="btn-primary">Guardar</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
