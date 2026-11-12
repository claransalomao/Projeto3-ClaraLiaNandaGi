import { Link } from 'react-router-dom'
import Logo from '../../components/Logo'
import { useAuth } from '../../contexts/useAuth'

const passos = [
  { titulo: 'Configure', texto: 'Escolha a área, o tipo de entrevista e o estilo do entrevistador.' },
  { titulo: 'Responda', texto: 'A IA faz perguntas e follow-ups a partir das suas respostas.' },
  { titulo: 'Evolua', texto: 'Receba nota, pontos fortes e o que melhorar em cada resposta.' },
]

export default function Landing() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-ink text-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-6 sm:px-6">
        <Logo claro />
        <Link
          to={user ? '/dashboard' : '/login'}
          className="rounded-lg px-4 py-2 text-sm font-medium text-gray-200 hover:text-white"
        >
          {user ? 'Ir para o Dashboard' : 'Entrar'}
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-16 pb-24 sm:px-6 sm:pt-24">
        <h1 className="max-w-3xl font-display text-4xl leading-tight font-semibold sm:text-6xl">
          Treine para a entrevista antes da entrevista.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-gray-300">
          Um entrevistador com IA faz perguntas da sua área, reage às suas respostas e mostra exatamente o que
          melhorar.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            to={user ? '/dashboard' : '/cadastro'}
            className="rounded-lg bg-primary px-6 py-3 font-semibold text-white hover:bg-primary-dark"
          >
            Começar a treinar
          </Link>
          {!user && (
            <Link to="/login" className="rounded-lg border border-white/20 px-6 py-3 font-semibold hover:bg-white/10">
              Já tenho conta
            </Link>
          )}
        </div>

        <section className="mt-24 grid gap-4 sm:grid-cols-3">
          {passos.map((passo, i) => (
            <div key={passo.titulo} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <span className="text-sm font-semibold text-indigo-300">0{i + 1}</span>
              <h2 className="mt-2 font-display text-xl font-semibold">{passo.titulo}</h2>
              <p className="mt-2 text-gray-300">{passo.texto}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}
