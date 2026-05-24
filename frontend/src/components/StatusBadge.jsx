export default function StatusBadge({ status }) {
  const cls = {
    emitido: 'badge-emitido',
    rascunho: 'badge-rascunho',
    anulado: 'badge-anulado',
  }[status] || 'badge'
  return <span className={cls}>{status?.toUpperCase()}</span>
}
