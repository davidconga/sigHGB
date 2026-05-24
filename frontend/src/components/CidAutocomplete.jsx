import { useEffect, useRef, useState } from 'react'
import api from '../api/client'

export default function CidAutocomplete({ value, onChange, placeholder = 'Pesquisar código ou descrição…' }) {
  const [query, setQuery] = useState(value || '')
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const [hover, setHover] = useState(-1)
  const wrapRef = useRef(null)
  const timer = useRef(null)

  useEffect(() => { setQuery(value || '') }, [value])

  useEffect(() => {
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  function search(q) {
    clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      try {
        const { data } = await api.get('/cids', { params: { search: q, todos: 1, apenas_ativos: 1 } })
        setItems(Array.isArray(data) ? data : (data.data || []))
        setOpen(true)
        setHover(-1)
      } catch { setItems([]) }
    }, 200)
  }

  function onInput(e) {
    const v = e.target.value
    setQuery(v)
    onChange?.(v)
    if (v.trim()) search(v.trim())
    else { setItems([]); setOpen(false) }
  }

  function pick(c) {
    setQuery(c.codigo)
    onChange?.(c.codigo)
    setOpen(false)
  }

  function onKey(e) {
    if (!open || items.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setHover((h) => Math.min(items.length - 1, h + 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHover((h) => Math.max(0, h - 1)) }
    else if (e.key === 'Enter' && hover >= 0) { e.preventDefault(); pick(items[hover]) }
    else if (e.key === 'Escape') setOpen(false)
  }

  return (
    <div className="relative" ref={wrapRef}>
      <input
        className="input font-mono uppercase"
        placeholder={placeholder}
        value={query}
        onChange={onInput}
        onFocus={() => { if (items.length) setOpen(true) }}
        onKeyDown={onKey}
        autoComplete="off"
      />
      {open && items.length > 0 && (
        <ul className="absolute z-20 left-0 right-0 mt-1 max-h-72 overflow-auto bg-white border border-slate-200 rounded-md shadow-lg text-sm">
          {items.map((c, i) => (
            <li
              key={c.id}
              onMouseEnter={() => setHover(i)}
              onMouseDown={(e) => { e.preventDefault(); pick(c) }}
              className={`px-3 py-2 cursor-pointer ${hover === i ? 'bg-hgb-50' : 'hover:bg-slate-50'}`}
            >
              <div className="font-mono font-semibold text-hgb-700">{c.codigo}</div>
              <div className="text-slate-700 text-xs truncate">{c.descricao}</div>
              {c.descricao_en && (
                <div className="text-slate-400 text-xs truncate italic">{c.descricao_en}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
