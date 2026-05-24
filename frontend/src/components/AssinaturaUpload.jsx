import { useRef, useState } from 'react'
import { Upload, Trash2, Pencil, Eraser, Check } from 'lucide-react'
import SignatureCanvas from 'react-signature-canvas'
import api from '../api/client'
import Modal from './Modal'
import { useConfirm } from './ConfirmDialog'

export default function AssinaturaUpload({ medico, tipo, onUpdated }) {
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [drawOpen, setDrawOpen] = useState(false)
  const fileRef = useRef(null)
  const sigRef = useRef(null)

  const url = tipo === 'assinatura' ? medico.assinatura_url : medico.carimbo_url
  const label = tipo === 'assinatura' ? 'Assinatura digital' : 'Carimbo digital'
  const endpoint = `/medicos/${medico.id}/${tipo}`
  const allowDraw = tipo === 'assinatura'

  async function uploadFile(file) {
    if (!file) return
    setErr(''); setBusy(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const { data } = await api.post(endpoint, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      onUpdated?.(data)
    } catch (e) {
      setErr(e.response?.data?.errors?.file?.[0] || e.response?.data?.message || 'Erro no upload')
    } finally { setBusy(false) }
  }

  async function saveDrawn() {
    if (!sigRef.current || sigRef.current.isEmpty()) {
      setErr('Desenha a assinatura antes de guardar.')
      return
    }
    const dataUrl = sigRef.current.getCanvas().toDataURL('image/png')
    const blob = await (await fetch(dataUrl)).blob()
    const file = new File([blob], `assinatura-${Date.now()}.png`, { type: 'image/png' })
    await uploadFile(file)
    setDrawOpen(false)
  }

  async function remove() {
    if (!await confirm(`Remover ${label.toLowerCase()}?`)) return
    setBusy(true)
    try {
      const { data } = await api.delete(endpoint)
      onUpdated?.(data)
    } finally { setBusy(false) }
  }

  return (
    <div className="border border-slate-200 rounded p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-600 uppercase">{label}</span>
        {url && (
          <button type="button" onClick={remove} disabled={busy} className="text-red-600 hover:underline text-xs inline-flex items-center gap-1">
            <Trash2 size={12} /> Remover
          </button>
        )}
      </div>

      {url ? (
        <div className="bg-slate-50 rounded p-2 mb-2 flex justify-center">
          <img src={url} alt={label} className="max-h-24 object-contain" />
        </div>
      ) : (
        <div className="bg-slate-50 rounded p-4 mb-2 text-center text-xs text-slate-400">Sem {label.toLowerCase()}</div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => uploadFile(e.target.files?.[0])}
      />

      <div className={`grid ${allowDraw ? 'grid-cols-2' : 'grid-cols-1'} gap-1`}>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="btn-outline text-xs inline-flex items-center justify-center gap-1"
        >
          <Upload size={12} /> {url ? 'Substituir' : 'Carregar'}
        </button>
        {allowDraw && (
          <button
            type="button"
            onClick={() => { setErr(''); setDrawOpen(true) }}
            disabled={busy}
            className="btn-outline text-xs inline-flex items-center justify-center gap-1"
          >
            <Pencil size={12} /> Desenhar
          </button>
        )}
      </div>

      {err && <div className="mt-2 text-xs text-red-600">{err}</div>}
      <p className="text-xs text-slate-400 mt-1">
        PNG, JPG ou WEBP até 2MB.{allowDraw ? ' Ou desenha com rato/touch.' : ''}
      </p>

      <Modal open={drawOpen} title={`Desenhar ${label.toLowerCase()}`} onClose={() => setDrawOpen(false)} size="lg">
        <div className="space-y-3">
          <p className="text-sm text-slate-600">Assina no quadro abaixo com o rato ou dedo (ecrã táctil).</p>
          <div className="border-2 border-dashed border-slate-300 rounded bg-white">
            <SignatureCanvas
              ref={sigRef}
              penColor="black"
              canvasProps={{ width: 600, height: 220, className: 'w-full h-[220px]' }}
            />
          </div>
          {err && <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{err}</div>}
          <div className="flex justify-between">
            <button type="button" onClick={() => sigRef.current?.clear()} className="btn-outline inline-flex items-center gap-1">
              <Eraser size={14} /> Limpar
            </button>
            <div className="flex gap-2">
              <button type="button" onClick={() => setDrawOpen(false)} className="btn-outline">Cancelar</button>
              <button type="button" onClick={saveDrawn} disabled={busy} className="btn-primary inline-flex items-center gap-1">
                <Check size={14} /> {busy ? 'A guardar…' : 'Guardar assinatura'}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
