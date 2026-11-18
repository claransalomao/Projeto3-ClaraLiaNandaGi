import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api, { mensagemDeErro } from '../../api'
import AppBar from '../../components/AppBar'
import { useAuth } from '../../contexts/useAuth'

function formatarNota(nota) {
  return nota.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

function iniciais(nome) {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}

export default function Perfil() {
  const { user, atualizarNome, logout } = useAuth()
  const navigate = useNavigate()

  const [nome, setNome] = useState(user.nome)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const [erro, setErro] = useState('')
  const [entrevistas, setEntrevistas] = useState([])
  const [vagas, setVagas] = useState([])

  useEffect(() => {
    api.get('/entrevistas/').then((res) => setEntrevistas(res.data)).catch(() => {})
    api.get('/vagas/').then((res) => setVagas(res.data)).catch(() => {})
  }, [])

  const notas = entrevistas.filter((e) => e.finalizada && e.nota_media !== null).map((e) => e.nota_media)
  const media = notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : null

  const estatisticas = [
    { label: 'Entrevistas', valor: entrevistas.length },
    { label: 'Nota média', valor: media !== null ? formatarNota(media) : '—' },
    { label: 'Vagas analisadas', valor: vagas.length },
  ]

  function salvar(event) {
    event.preventDefault()
    setErro('')
    setMensagem('')
    setSalvando(true)
    atualizarNome(nome.trim())
      .then(() => setMensagem('Nome atualizado!'))
      .catch((error) => setErro(mensagemDeErro(error)))
      .finally(() => setSalvando(false))
  }

  function sair() {
    logout().then(() => navigate('/login'))
  }

  return (
    <div className="min-h-screen">
      <AppBar />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-soft font-display text-2xl font-semibold text-primary">
            {iniciais(user.nome) || '?'}
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-display text-3xl font-semibold">{user.nome}</h1>
            <p className="truncate text-gray-500">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {estatisticas.map((item) => (
            <div key={item.label} className="rounded-xl border border-gray-200 bg-white p-4">
              <span className="text-xs text-gray-500 sm:text-sm">{item.label}</span>
              <strong className="block font-display text-2xl font-semibold sm:text-3xl">{item.valor}</strong>
            </div>
          ))}
        </div>

        <form onSubmit={salvar} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="font-display text-xl font-semibold">Dados da conta</h2>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Nome</span>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">E-mail</span>
            <input
              value={user.email}
              disabled
              className="w-full rounded-lg border border-gray-200 bg-surface px-3.5 py-2.5 text-gray-500"
            />
            <span className="mt-1 block text-xs text-gray-500">O e-mail é usado no login e não pode ser alterado.</span>
          </label>

          {erro && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</p>}
          {mensagem && <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{mensagem}</p>}

          <button
            type="submit"
            disabled={salvando || !nome.trim() || nome.trim() === user.nome}
            className="cursor-pointer rounded-xl bg-primary px-5 py-2.5 font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {salvando ? 'Salvando…' : 'Salvar alterações'}
          </button>
        </form>

        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-6">
          <div>
            <h2 className="font-semibold">Atalhos</h2>
            <div className="mt-2 flex flex-wrap gap-4 text-sm font-semibold text-primary">
              <Link to="/historico">Ver histórico →</Link>
              <Link to="/vagas">Analisar uma vaga →</Link>
            </div>
          </div>
          <button
            onClick={sair}
            className="cursor-pointer rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold hover:bg-red-50 hover:text-red-700"
          >
            Sair da conta
          </button>
        </section>
      </main>
    </div>
  )
}