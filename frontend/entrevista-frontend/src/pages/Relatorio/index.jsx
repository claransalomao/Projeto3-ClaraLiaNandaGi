import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api, { mensagemDeErro } from '../../api'

function formatarNota(nota) {
  return nota.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

function corDaNota(nota) {
  if (nota >= 7) return 'text-green-700'
  if (nota >= 5) return 'text-amber-700'
  return 'text-red-700'
}

function corDaBarra(nota) {
  if (nota >= 7) return 'bg-primary'
  if (nota >= 5) return 'bg-amber-600'
  return 'bg-red-600'
}

// Na primeira vez o GET gera o relatório com a IA (demora alguns segundos).
// Guardamos a requisição em andamento para não gerar duas vezes (o StrictMode
// roda o useEffect duas vezes em desenvolvimento).
const pedidosEmAndamento = new Map()

function buscarRelatorio(id) {
  if (!pedidosEmAndamento.has(id)) {
    const pedido = api
      .get(`/entrevistas/${id}/relatorio/`)
      .finally(() => pedidosEmAndamento.delete(id))
    pedidosEmAndamento.set(id, pedido)
  }
  return pedidosEmAndamento.get(id)
}

function Variacao({ valor }) {
  if (valor === null || valor === undefined) return null
  const estilo =
    valor > 0 ? 'bg-green-700 text-white' : valor < 0 ? 'bg-red-700 text-white' : 'bg-white/15 text-gray-200'
  const sinal = valor > 0 ? '+' : ''
  return (
    <span className={`mt-4 inline-block rounded-full px-3 py-1 text-xs font-semibold ${estilo}`}>
      {sinal}{formatarNota(valor)} vs. entrevista anterior
    </span>
  )
}

function Criterio({ nome, nota }) {
  const temNota = nota !== null && nota !== undefined
  return (
    <li>
      <div className="flex justify-between text-sm">
        <span>{nome}</span>
        <strong className={temNota && nota < 7 ? corDaNota(nota) : ''}>
          {temNota ? formatarNota(nota) : '—'}
        </strong>
      </div>
      <div className="mt-1.5 h-2 rounded-full bg-gray-200">
        {temNota && (
          <div className={`h-2 rounded-full ${corDaBarra(nota)}`} style={{ width: `${nota * 10}%` }} />
        )}
      </div>
    </li>
  )
}

function Resposta({ pergunta }) {
  const [aberta, setAberta] = useState(false)
  const avaliada = pergunta.nota !== null

  return (
    <li className="rounded-xl bg-surface">
      <div className="flex items-center gap-3 px-4 py-3">
        <p className="min-w-0 flex-1 text-sm">
          <strong>{pergunta.ordem}.</strong> {pergunta.tema}
        </p>
        {avaliada ? (
          <span className={`font-display text-lg font-semibold ${corDaNota(pergunta.nota)}`}>
            {formatarNota(pergunta.nota)}
          </span>
        ) : (
          <span className="text-sm text-gray-400">{pergunta.pulada ? 'pulada' : '—'}</span>
        )}
        <button
          onClick={() => setAberta((a) => !a)}
          aria-expanded={aberta}
          className="cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-gray-50"
        >
          {aberta ? 'Fechar' : 'Ver feedback'}
        </button>
      </div>

      {aberta && (
        <div className="space-y-4 border-t border-gray-200 px-4 py-4 text-sm">
          <div>
            <strong className="block text-gray-500">Pergunta</strong>
            <p>{pergunta.texto}</p>
          </div>

          {pergunta.pulada ? (
            <p className="text-gray-500 italic">Você pulou esta pergunta.</p>
          ) : (
            <>
              <div>
                <strong className="block text-gray-500">Sua resposta</strong>
                <p className="whitespace-pre-line">{pergunta.resposta}</p>
              </div>
              {avaliada && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <strong className="block text-green-800">Pontos fortes</strong>
                      <p className="text-gray-700">{pergunta.pontos_fortes}</p>
                    </div>
                    <div>
                      <strong className="block text-amber-800">O que melhorar</strong>
                      <p className="text-gray-700">{pergunta.o_que_melhorar}</p>
                    </div>
                  </div>
                  <div className="rounded-lg bg-white p-3">
                    <strong className="block text-primary">Resposta modelo</strong>
                    <p className="whitespace-pre-line text-gray-700">{pergunta.resposta_modelo}</p>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </li>
  )
}

export default function Relatorio() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [relatorio, setRelatorio] = useState(null)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [refazendo, setRefazendo] = useState(false)
  const [erroRefazer, setErroRefazer] = useState('')

  const carregar = useCallback(
    () =>
      buscarRelatorio(id)
        .then((res) => setRelatorio(res.data))
        .catch((error) => setErro(mensagemDeErro(error)))
        .finally(() => setCarregando(false)),
    [id],
  )

  useEffect(() => {
    carregar()
  }, [carregar])

  function tentarDeNovo() {
    setErro('')
    setCarregando(true)
    carregar()
  }

  // Cria uma entrevista nova com a mesma configuração e vai direto para ela
  function refazer() {
    const e = relatorio.entrevista
    setErroRefazer('')
    setRefazendo(true)
    api
      .post('/entrevistas/', {
        area: e.area,
        tipos: e.tipos,
        entrevistador: e.entrevistador,
        nivel: e.nivel,
        num_perguntas: e.num_perguntas,
      })
      .then((res) => navigate(`/entrevistas/${res.data.id}`))
      .catch((error) => {
        setErroRefazer(mensagemDeErro(error))
        setRefazendo(false)
      })
  }

  if (carregando) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 px-4 text-center">
        <p className="animate-pulse font-semibold">A IA está preparando seu relatório…</p>
        <p className="text-sm text-gray-500">Isso pode levar alguns segundos na primeira vez.</p>
      </div>
    )
  }

  if (erro) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="max-w-md text-gray-700">{erro}</p>
        <div className="flex flex-wrap justify-center gap-4">
          <button onClick={tentarDeNovo} className="cursor-pointer font-semibold text-primary underline">
            Tentar de novo
          </button>
          <Link to={`/entrevistas/${id}`} className="font-semibold text-primary underline">
            Voltar à entrevista
          </Link>
          <Link to="/dashboard" className="font-semibold text-primary underline">
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const { entrevista } = relatorio
  const data = new Date(entrevista.criado_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 sm:px-6">
          <Link to="/dashboard" className="text-sm font-semibold text-primary hover:text-primary-dark">
            ← Voltar ao Dashboard
          </Link>
          <p className="text-sm text-gray-500">
            {entrevista.area} · {entrevista.tipos.join(', ')} · Entrevista de {data}
            {relatorio.duracao_min !== null && ` · ${relatorio.duracao_min} min`}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Nota geral */}
          <section className="rounded-2xl bg-ink p-6 text-white">
            <p className="text-sm text-gray-300">Nota geral</p>
            <p className="mt-2 font-display text-6xl font-semibold">
              {formatarNota(relatorio.nota_geral)}
              <span className="text-2xl text-gray-400"> /10</span>
            </p>
            <p className="mt-4 text-gray-200">{relatorio.resumo}</p>
            <Variacao valor={relatorio.variacao} />
          </section>

          {/* Critérios */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="font-semibold">Avaliação por critério</h2>
            <ul className="mt-4 space-y-4">
              {relatorio.criterios.map((c) => (
                <Criterio key={c.nome} nome={c.nome} nota={c.nota} />
              ))}
            </ul>
          </section>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[340px_1fr]">
          {/* Pontos para melhorar */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="font-semibold">{relatorio.pontos_melhorar.length} pontos para melhorar</h2>
            <ol className="mt-4 space-y-3 text-sm">
              {relatorio.pontos_melhorar.map((ponto, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-50 text-xs font-semibold text-amber-800">
                    {i + 1}
                  </span>
                  <span className="text-gray-700">{ponto}</span>
                </li>
              ))}
            </ol>
          </section>

          {/* Respostas */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="font-semibold">Respostas</h2>
            <ul className="mt-4 space-y-3">
              {relatorio.respostas.map((p) => (
                <Resposta key={p.id} pergunta={p} />
              ))}
            </ul>
          </section>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-wrap justify-end gap-3">
            <button
              onClick={refazer}
              disabled={refazendo}
              className="cursor-pointer rounded-xl border border-gray-300 bg-white px-5 py-2.5 font-semibold hover:bg-gray-50 disabled:opacity-50"
            >
              {refazendo ? 'Preparando…' : 'Refazer com a mesma configuração'}
            </button>
            <Link
              to="/dashboard"
              className="rounded-xl bg-primary px-5 py-2.5 font-semibold text-white hover:bg-primary-dark"
            >
              Nova entrevista
            </Link>
          </div>
          {erroRefazer && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{erroRefazer}</p>}
        </div>
      </main>
    </div>
  )
}
