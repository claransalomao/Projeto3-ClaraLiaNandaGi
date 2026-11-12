import { useEffect, useState } from 'react'
import api, { TOKEN_KEY } from '../api'
import { AuthContext } from './useAuth'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [carregando, setCarregando] = useState(() => !!localStorage.getItem(TOKEN_KEY))

  // Ao abrir o site, se já existe um token salvo, busca o usuário logado
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return
    api
      .get('/me/')
      .then((res) => setUser(res.data))
      .catch(() => localStorage.removeItem(TOKEN_KEY))
      .finally(() => setCarregando(false))
  }, [])

  function salvarSessao(res) {
    localStorage.setItem(TOKEN_KEY, res.data.token)
    setUser(res.data.user)
  }

  function login(email, senha) {
    return api.post('/login/', { email, senha }).then(salvarSessao)
  }

  function cadastro(nome, email, senha) {
    return api.post('/cadastro/', { nome, email, senha }).then(salvarSessao)
  }

  function logout() {
    // mesmo se o servidor falhar, a sessão local é encerrada
    return api
      .post('/logout/')
      .catch(() => {})
      .then(() => {
        localStorage.removeItem(TOKEN_KEY)
        setUser(null)
      })
  }

  return (
    <AuthContext.Provider value={{ user, carregando, login, cadastro, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
