import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import PreloaderSplash from './PreloaderSplash'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <PreloaderSplash />
  if (!user) return <Navigate to="/login" replace />
  return children
}
