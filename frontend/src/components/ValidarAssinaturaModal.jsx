import { useEffect, useState } from 'react'
import { ShieldCheck, Lock, IdCard, CheckCircle2, AlertCircle } from 'lucide-react'
import api from '../api/client'
import { useAuth } from '../auth/AuthContext'
import Modal from './Modal'

/**
 * Modal de validação de assinatura.
 * - tipo: 'atestados' ou 'relatorios'
 * - documento: { id, numero, medico_id, medico?, ... }
 * - onSuccess: callback após validação bem-sucedida
 */
export default function ValidarAssinaturaModal({ open, onClose, tipo, documento, onSuccess }) {
  const { user } = useAuth()
  const [numeroOrdem, setNumeroOrdem] = useState('')
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (open) {
      setNumeroOrdem(user?.medico?.numero_ordem || '')
      setPassword(''); setErr('')
    }
  }, [open, user])

  if (!documento) return null

  const userIsMedico = user?.medico_id != null
  const userIsAttributed = user?.medico_id === documento.medico_id
  const docHasMedico = documento.medico_id != null

  async function submit(e) {
    e.preventDefault()
    setSaving(true); setErr('')
    try {
      const { data } = await api.post(`/${tipo}/${documento.id}/validar`, {
        numero_ordem: numeroOrdem,
        password,
      })
      onSuccess?.(data)
      onClose()
    } catch (e) {
      setErr(e.response?.data?.message || 'Não foi possível validar.')
    } finally { setSaving(false) }
  }

  return (
    <Modal open={open} title="Validar e Assinar Documento" onClose={onClose} size="md">
      <div className="space-y-4">
        <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm">
          <div className="font-semibold text-amber-900 mb-1 inline-flex items-center gap-1">
            <ShieldCheck size={16} /> Documento {documento.numero}
          </div>
          <div className="text-xs text-amber-800">
            Ao validar, o estado muda para <strong>EMITIDO</strong>, o watermark "RASCUNHO" é removido,
            e é gerado um código de verificação único.
          </div>
        </div>

        {!docHasMedico && (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700 inline-flex gap-2">
            <AlertCircle size={18} className="flex-shrink-0" />
            <span>Este documento ainda não tem médico atribuído. Atribua um médico antes de validar.</span>
          </div>
        )}

        {docHasMedico && !userIsMedico && (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700 inline-flex gap-2">
            <AlertCircle size={18} className="flex-shrink-0" />
            <span>A sua conta não está associada a nenhum médico. Contacte o administrador.</span>
          </div>
        )}

        {docHasMedico && userIsMedico && !userIsAttributed && (
          <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700 inline-flex gap-2">
            <AlertCircle size={18} className="flex-shrink-0" />
            <span>Este documento está atribuído a <strong>{documento.medico?.nome || 'outro médico'}</strong>. Só esse médico pode assinar.</span>
          </div>
        )}

        {docHasMedico && userIsAttributed && (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="label inline-flex items-center gap-1"><IdCard size={14}/> Nº de Ordem dos Médicos</label>
              <input
                className="input font-mono"
                required
                value={numeroOrdem}
                onChange={(e) => setNumeroOrdem(e.target.value)}
                placeholder="Ex.: OMA-1234"
              />
              <p className="text-xs text-slate-500 mt-1">Confirma o teu número de ordem registado.</p>
            </div>
            <div>
              <label className="label inline-flex items-center gap-1"><Lock size={14}/> Palavra-passe</label>
              <input
                className="input"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-xs text-slate-500 mt-1">A palavra-passe que usas para entrar no sistema.</p>
            </div>

            {err && (
              <div className="bg-red-50 border border-red-200 rounded p-2 text-sm text-red-700 inline-flex items-start gap-2">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" /> {err}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-outline" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btn-primary inline-flex items-center gap-1" disabled={saving}>
                <CheckCircle2 size={16} /> {saving ? 'A validar…' : 'Validar e Assinar'}
              </button>
            </div>
          </form>
        )}

        {(!docHasMedico || !userIsMedico || !userIsAttributed) && (
          <div className="flex justify-end pt-2">
            <button type="button" className="btn-outline" onClick={onClose}>Fechar</button>
          </div>
        )}
      </div>
    </Modal>
  )
}
