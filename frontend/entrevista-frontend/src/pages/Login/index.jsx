import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { mensagemDeErro } from '../../api'
import Logo from '../../components/Logo'
import { useAuth } from '../../contexts/useAuth'

const beneficios = [
  'Perguntas de tecnologia, finanças, consultoria e comportamentais',
  'Feedback por resposta, com nota e resposta modelo',
  'Acompanhe sua evolução entrevista após entrevista',
]

function Campo({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      <input
        {...props}
        className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-ink outline-none placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  )
}

// modo = "entrar" (rota /login) ou "cadastro" (rota /cadastro)
export default function Login({ modo }) {
  const { user, login, cadastro } = useAuth()
  const navigate = useNavigate()

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  const ehCadastro = modo === 'cadastro'

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  function handleSubmit(event) {
    event.preventDefault()
    setErro('')
    setEnviando(true)

    const requisicao = ehCadastro ? cadastro(nome, email, senha) : login(email, senha)
    requisicao
      .then(() => navigate('/dashboard'))
      .catch((error) => {
        setErro(mensagemDeErro(error))
        setEnviando(false)
      })
  }

  const abaClasse = (ativa) =>
    `flex-1 rounded-lg py-2 text-center text-sm font-semibold transition ${
      ativa ? 'bg-white text-ink shadow-sm' : 'text-gray-500 hover:text-ink'
    }`

  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,480px)_1fr]">
      {/* Painel escuro com a proposta */}
      <aside className="flex flex-col justify-between bg-ink px-6 py-10 text-white sm:px-14">
        <Link to="/">
          <Logo claro />
        </Link>
        <div className="my-12 lg:my-0">
          <h1 className="font-display text-4xl leading-tight font-semibold sm:text-5xl">
            Treine para a entrevista antes da entrevista.
          </h1>
          <p className="mt-6 text-lg text-gray-300">
            Um entrevistador com IA faz perguntas da sua área, reage às suas respostas e mostra exatamente o que
            melhorar.
          </p>
          <ul className="mt-8 space-y-4">
            {beneficios.map((item) => (
              <li key={item} className="flex gap-3 text-gray-100">
                <span className="text-indigo-300">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <p className="hidden text-sm text-gray-400 lg:block">Projeto 3 · Tecnologias Web · Insper</p>
      </aside>

      {/* Formulário */}
      <main className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex rounded-xl bg-gray-100 p-1">
            <Link to="/login" className={abaClasse(!ehCadastro)}>
              Entrar
            </Link>
            <Link to="/cadastro" className={abaClasse(ehCadastro)}>
              Criar conta
            </Link>
          </div>

          <h2 className="font-display text-2xl font-semibold">{ehCadastro ? 'Crie sua conta' : 'Bem-vindo de volta'}</h2>
          <p className="mt-1 text-gray-500">
            {ehCadastro ? 'Comece a treinar em menos de um minuto.' : 'Entre para continuar treinando.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {ehCadastro && (
              <Campo
                label="Nome"
                type="text"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                placeholder="Seu nome"
                autoComplete="name"
                required
              />
            )}
            <Campo
              label="E-mail"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="voce@al.insper.edu.br"
              autoComplete="email"
              required
            />
            <Campo
              label="Senha"
              type="password"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              placeholder={ehCadastro ? 'Mínimo de 8 caracteres' : '••••••••'}
              autoComplete={ehCadastro ? 'new-password' : 'current-password'}
              minLength={ehCadastro ? 8 : undefined}
              required
            />

            {erro && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}

            <button
              type="submit"
              disabled={enviando}
              className="w-full cursor-pointer rounded-lg bg-primary py-3 font-semibold text-white transition hover:bg-primary-dark disabled:cursor-wait disabled:opacity-60"
            >
              {enviando ? 'Aguarde…' : ehCadastro ? 'Criar conta' : 'Entrar'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            {ehCadastro ? 'Já tem conta? ' : 'Ainda não tem conta? '}
            <Link to={ehCadastro ? '/login' : '/cadastro'} className="font-medium text-primary underline">
              {ehCadastro ? 'Entrar' : 'Criar conta'}
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
