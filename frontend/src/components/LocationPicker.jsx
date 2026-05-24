import { useEffect, useState } from 'react'
import api from '../api/client'

let provinciasCache = null

export default function LocationPicker({
  provincia, municipio,
  onChange,
  label = '',
}) {
  const [provincias, setProvincias] = useState(provinciasCache || [])
  const [municipios, setMunicipios] = useState([])
  const [loadingMun, setLoadingMun] = useState(false)

  useEffect(() => {
    if (provinciasCache) return
    api.get('/provincias').then((r) => {
      provinciasCache = r.data
      setProvincias(r.data)
    })
  }, [])

  useEffect(() => {
    if (!provincia) { setMunicipios([]); return }
    setLoadingMun(true)
    api.get('/municipios', { params: { provincia } })
      .then((r) => setMunicipios(r.data))
      .finally(() => setLoadingMun(false))
  }, [provincia])

  return (
    <>
      <div>
        <label className="label">{label}Província</label>
        <select
          className="input"
          value={provincia || ''}
          onChange={(e) => onChange?.({ provincia: e.target.value, municipio: '' })}
        >
          <option value="">—</option>
          {provincias.map((p) => <option key={p.id} value={p.nome}>{p.nome}</option>)}
        </select>
      </div>
      <div>
        <label className="label">{label}Município</label>
        <select
          className="input"
          value={municipio || ''}
          disabled={!provincia || loadingMun}
          onChange={(e) => onChange?.({ provincia, municipio: e.target.value })}
        >
          <option value="">{!provincia ? 'Selecione a província primeiro' : (loadingMun ? 'A carregar…' : '—')}</option>
          {municipios.map((m) => <option key={m.id} value={m.nome}>{m.nome}</option>)}
        </select>
      </div>
    </>
  )
}
