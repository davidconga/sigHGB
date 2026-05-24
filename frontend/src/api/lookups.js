import { useEffect, useState } from 'react'
import api from './client'

export function useLookups() {
  const [pacientes, setPacientes] = useState([])
  const [medicos, setMedicos] = useState([])

  useEffect(() => {
    api.get('/pacientes?per_page=500').then((r) => setPacientes(r.data.data || []))
    api.get('/medicos?per_page=500&apenas_ativos=1').then((r) => setMedicos(r.data.data || []))
  }, [])

  return { pacientes, medicos }
}
