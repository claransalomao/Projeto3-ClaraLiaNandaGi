import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'
import Logo from '../Logo'

// Histórico e Perfil ainda não existem; as rotas serão criadas nas próximas tarefas
const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/historico', label: 'Histórico' },
  { to: '/perfil', label: 'Perfil' },
]

export default function AppBar() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  function sair() {
    logout().then(() => navigate('/login'))
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Logo />
        <nav className="hidden gap-1 sm:flex">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `rounded-lg px-4 py-2 text-sm font-medium ${
                  isActive ? 'bg-primary-soft text-primary' : 'text-gray-600 hover:text-ink'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <button onClick={sair} className="cursor-pointer text-sm text-gray-600 hover:text-ink">
          Sair
        </button>
      </div>
    </header>
  )
}
