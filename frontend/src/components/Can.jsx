import { useCan } from '../auth/AuthContext'

export default function Can({ permission, fallback = null, children }) {
  const can = useCan()
  return can(permission) ? children : fallback
}
