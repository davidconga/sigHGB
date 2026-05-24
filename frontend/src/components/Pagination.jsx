export default function Pagination({ meta, onPage }) {
  if (!meta || meta.last_page <= 1) return null
  return (
    <div className="flex items-center justify-between mt-4 text-sm">
      <div className="text-slate-500">
        Página {meta.current_page} de {meta.last_page} · {meta.total} registos
      </div>
      <div className="flex gap-2">
        <button
          className="btn-outline disabled:opacity-50"
          disabled={meta.current_page <= 1}
          onClick={() => onPage(meta.current_page - 1)}
        >
          Anterior
        </button>
        <button
          className="btn-outline disabled:opacity-50"
          disabled={meta.current_page >= meta.last_page}
          onClick={() => onPage(meta.current_page + 1)}
        >
          Seguinte
        </button>
      </div>
    </div>
  )
}
