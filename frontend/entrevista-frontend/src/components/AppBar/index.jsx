import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth'
import Logo from '../Logo'

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/vagas', label: 'Vagas' },
  { to: '/historico', label: 'Histórico' },
  { to: '/perfil', label: 'Perfil' },
]

const classeLink = ({ isActive }) =>
  `rounded-lg px-4 py-2 text-sm font-medium ${
    isActive ? 'bg-primary-soft text-primary' : 'text-gray-600 hover:text-ink'
  }`

export default function AppBar() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [menuAberto, setMenuAberto] = useState(false)

  function sair() {
    logout().then(() => navigate('/login'))
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <NavLink to="/dashboard">
          <Logo />
        </NavLink>

        {/* Menu no computador */}
        <nav className="hidden gap-1 sm:flex" aria-label="Principal">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={classeLink}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button onClick={sair} className="hidden cursor-pointer text-sm text-gray-600 hover:text-ink sm:block">
            Sair
          </button>

          {/* Botão do menu no celular */}
          <button
            onClick={() => setMenuAberto((aberto) => !aberto)}
            aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={menuAberto}
            className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-gray-200 sm:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {menuAberto ? (
                <path d="M6 6l12 12M18 6L6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Menu aberto no celular */}
      {menuAberto && (
        <nav className="flex flex-col gap-1 border-t border-gray-200 px-4 py-3 sm:hidden" aria-label="Principal">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={classeLink} onClick={() => setMenuAberto(false)}>
              {link.label}
            </NavLink>
          ))}
          <button
            onClick={sair}
            className="cursor-pointer rounded-lg px-4 py-2 text-left text-sm font-medium text-gray-600 hover:text-ink"
          >
            Sair
          </button>
        </nav>
      )}
    </header>
  )
}