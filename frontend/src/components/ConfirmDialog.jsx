import { createContext, useCallback, useContext, useState } from 'react'
import { AlertTriangle, Trash2, CheckCircle2, Info } from 'lucide-react'
import Modal from './Modal'

const ConfirmCtx = createContext(null)

const VARIANTS = {
  danger:  { Icon: Trash2,         iconColor: 'text-red-600',    iconBg: 'bg-red-100',    btn: 'bg-red-600 hover:bg-red-700' },
  warning: { Icon: AlertTriangle,  iconColor: 'text-amber-600',  iconBg: 'bg-amber-100',  btn: 'bg-amber-600 hover:bg-amber-700' },
  success: { Icon: CheckCircle2,   iconColor: 'text-emerald-600',iconBg: 'bg-emerald-100',btn: 'bg-emerald-600 hover:bg-emerald-700' },
  info:    { Icon: Info,           iconColor: 'text-hgb-600',    iconBg: 'bg-hgb-100',    btn: 'bg-hgb-600 hover:bg-hgb-700' },
}

export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null)

  const confirm = useCallback((opts = {}) => {
    // Compat: aceita string (igual a window.confirm) ou objecto
    if (typeof opts === 'string') opts = { message: opts }
    return new Promise((resolve) => {
      setState({
        title: opts.title || 'Confirmar',
        message: opts.message || 'Tens a certeza?',
        confirmLabel: opts.confirmLabel || 'Confirmar',
        cancelLabel: opts.cancelLabel || 'Cancelar',
        variant: opts.variant || 'danger',
        resolve,
      })
    })
  }, [])

  function handle(ok) {
    state?.resolve?.(ok)
    setState(null)
  }

  const v = VARIANTS[state?.variant || 'danger']

  return (
    <ConfirmCtx.Provider value={confirm}>
      {children}
      <Modal open={!!state} title={state?.title || ''} onClose={() => handle(false)} size="md">
        {state && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full ${v.iconBg} ${v.iconColor} flex items-center justify-center flex-shrink-0`}>
                <v.Icon size={20} />
              </div>
              <div className="text-sm text-slate-700 whitespace-pre-wrap pt-1">{state.message}</div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button className="btn-outline" onClick={() => handle(false)}>{state.cancelLabel}</button>
              <button className={`btn text-white ${v.btn}`} onClick={() => handle(true)} autoFocus>{state.confirmLabel}</button>
            </div>
          </div>
        )}
      </Modal>
    </ConfirmCtx.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmCtx)
  if (!ctx) throw new Error('useConfirm must be used within <ConfirmProvider>')
  return ctx
}
