import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api'
import AppBar from '../../components/AppBar'
import NovaEntrevista from '../../components/NovaEntrevista'
import { useAuth } from '../../contexts/useAuth'

function formatarNota(nota) {
  return nota.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

// A evolução e a tela de histórico completa serão implementadas na Sprint 2
export default function Dashboard() {
  const { user } = useAuth()
  const [entrevistas, setEntrevistas] = useState([])

  useEffect(() => {
    api.get('/entrevistas/').then((res) => setEntrevistas(res.data)).catch(() => {})
  }, [])

  return (
    <div className="min-h-screen">
      <AppBar />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-semibold">Olá, {user.nome}!</h1>
        <p className="mt-1 text-gray-500">Vamos para a próxima simulação?</p>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <NovaEntrevista />

          <aside className="space-y-6">
            <section className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="font-semibold">Suas entrevistas</h2>
              {entrevistas.length === 0 && (
                <p className="mt-2 text-sm text-gray-500">Nenhuma ainda. Configure a primeira ao lado.</p>
              )}
              <ul className="mt-3 space-y-2">
                {entrevistas.slice(0, 5).map((e) => (
                  <li key={e.id}>
                    <Link
                      to={
                        e.finalizada && e.nota_media !== null
                          ? `/entrevistas/${e.id}/relatorio`
                          : `/entrevistas/${e.id}`
                      }
                      className="flex items-center justify-between gap-2 rounded-lg bg-surface px-3 py-2.5 hover:bg-primary-soft"
                    >
                      <span className="min-w-0">
                        <strong className="block truncate text-sm">
                          {e.area} · {e.tipos[0]}{e.tipos.length > 1 ? ` +${e.tipos.length - 1}` : ''}
                        </strong>
                        <span className="text-xs text-gray-500">
                          {new Date(e.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                          {' · '}{e.entrevistador_nome}
                        </span>
                      </span>
                      {e.finalizada ? (
                        <span className="font-semibold">{e.nota_media !== null ? formatarNota(e.nota_media) : '—'}</span>
                      ) : (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
                          continuar
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6">
              <h2 className="font-semibold">Tem uma vaga em mente?</h2>
              <p className="mt-2 text-sm text-gray-500">
                A IA analisa a vaga e você pode usá-la como vaga-alvo da entrevista.
              </p>
              <Link to="/vagas" className="mt-3 inline-block text-sm font-semibold text-primary">
                Analisar uma vaga →
              </Link>
            </section>
          </aside>
        </div>
      </main>
    </div>
  )
}
