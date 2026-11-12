import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'

// Só deixa entrar nas páginas internas quem estiver logado
export default function RotaProtegida({ children }) {
  const { user, carregando } = useAuth()

  if (carregando) {
    return <div className="flex min-h-screen items-center justify-center text-gray-500">Carregando…</div>
  }
  if (!user) {
    return <Navigate to="/login" replace />
  }
  return children
}
