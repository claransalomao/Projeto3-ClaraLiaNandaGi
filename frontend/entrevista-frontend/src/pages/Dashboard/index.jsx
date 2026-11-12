import AppBar from '../../components/AppBar'
import { useAuth } from '../../contexts/useAuth'

// Versão inicial: confirma o login. O painel "Nova entrevista", a evolução
// e o histórico serão implementados nas próximas tarefas da sprint.
export default function Dashboard() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen">
      <AppBar />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-semibold">Olá, {user.nome}!</h1>
        <p className="mt-1 text-gray-500">Vamos para a próxima simulação?</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold">Nova entrevista</h2>
              <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                Gerada pela IA
              </span>
            </div>
            <p className="mt-4 text-gray-500">Em breve: escolha área, tipo de entrevista e entrevistador.</p>
          </section>

          <aside className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="font-semibold">Sua conta</h2>
            <p className="mt-2 text-sm text-gray-500">{user.email}</p>
          </aside>
        </div>
      </main>
    </div>
  )
}
