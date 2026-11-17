import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api, { mensagemDeErro } from '../../api'

const STAR = [
  ['S', 'Situação', 'o contexto'],
  ['T', 'Tarefa', 'o seu papel'],
  ['A', 'Ação', 'o que você fez'],
  ['R', 'Resultado', 'o impacto, com números se der'],
]

function formatarNota(nota) {
  return nota.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

function corDaNota(nota) {
  if (nota >= 7) return 'text-green-700'
  if (nota >= 5) return 'text-amber-700'
  return 'text-red-700'
}

function formatarTempo(segundos) {
  const m = String(Math.floor(segundos / 60)).padStart(2, '0')
  const s = String(segundos % 60).padStart(2, '0')
  return `${m}:${s}`
}

// Tempo decorrido desde o início da entrevista (para quando ela é finalizada)
function useCronometro(entrevista) {
  const [agora, setAgora] = useState(() => Date.now())
  const ativa = entrevista && !entrevista.finalizada

  useEffect(() => {
    if (!ativa) return
    const id = setInterval(() => setAgora(Date.now()), 1000)
    return () => clearInterval(id)
  }, [ativa])

  if (!entrevista) return 0
  const inicio = new Date(entrevista.criado_em).getTime()
  const fim = entrevista.finalizada_em ? new Date(entrevista.finalizada_em).getTime() : agora
  return Math.max(0, Math.floor((fim - inicio) / 1000))
}

function BolhaIA({ pergunta, destaque }) {
  return (
    <div className="flex gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-semibold text-white">
        IA
      </span>
      <div className="max-w-[85%]">
        <p
          className={`rounded-2xl px-4 py-3 ${
            destaque ? 'border border-primary bg-primary-soft' : 'bg-gray-100'
          }`}
        >
          {pergunta.texto}
        </p>
        {pergunta.follow_up && destaque && (
          <p className="mt-2 flex items-center gap-2 text-xs text-gray-500">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Pergunta de follow-up gerada a partir da sua resposta
          </p>
        )}
      </div>
    </div>
  )
}

function Feedback({ pergunta }) {
  return (
    <div className="ml-12 rounded-2xl border border-green-200 bg-green-50 p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Feedback da resposta</h3>
        <span className={`font-display text-lg font-semibold ${corDaNota(pergunta.nota)}`}>
          {formatarNota(pergunta.nota)} / 10
        </span>
      </div>
      <div className="mt-3 grid gap-4 text-sm sm:grid-cols-2">
        <div>
          <strong className="block text-green-800">Pontos fortes</strong>
          <p className="text-gray-700">{pergunta.pontos_fortes}</p>
        </div>
        <div>
          <strong className="block text-amber-800">O que melhorar</strong>
          <p className="text-gray-700">{pergunta.o_que_melhorar}</p>
        </div>
      </div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer font-semibold text-primary">Ver resposta modelo</summary>
        <p className="mt-2 whitespace-pre-line text-gray-700">{pergunta.resposta_modelo}</p>
      </details>
    </div>
  )
}

export default function Entrevista() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [entrevista, setEntrevista] = useState(null)
  const [erroCarregar, setErroCarregar] = useState('')
  const [resposta, setResposta] = useState('')
  const [enviando, setEnviando] = useState(null) // 'responder' | 'pular' | 'proxima' | 'encerrar'
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('') // IA falhou ao gerar a próxima pergunta
  const fimDoChat = useRef(null)

  const segundos = useCronometro(entrevista)

  useEffect(() => {
    api
      .get(`/entrevistas/${id}/`)
      .then((res) => setEntrevista(res.data))
      .catch((error) => setErroCarregar(mensagemDeErro(error)))
  }, [id])

  const perguntas = entrevista?.perguntas ?? []
  const atual = perguntas.find((p) => !p.respondida_em && !p.pulada)

  // Rola o chat até a última mensagem sempre que algo novo aparece
  useEffect(() => {
    fimDoChat.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [perguntas.length, atual?.id, enviando, entrevista?.finalizada])

  // Se a IA falhou antes, a entrevista pode estar sem pergunta atual
  const semPergunta = entrevista && !entrevista.finalizada && !atual

  function aplicarResultado(data) {
    setEntrevista((e) => {
      const lista = e.perguntas.map((p) => (p.id === data.pergunta_respondida.id ? data.pergunta_respondida : p))
      if (data.proxima_pergunta) lista.push(data.proxima_pergunta)
      return {
        ...e,
        perguntas: lista,
        finalizada: data.finalizada,
        finalizada_em: data.finalizada ? new Date().toISOString() : e.finalizada_em,
      }
    })
    setAviso(data.aviso || '')
  }

  function enviar(acao) {
    setErro('')
    setEnviando(acao)
    const corpo = acao === 'responder' ? { resposta } : {}
    api
      .post(`/entrevistas/${id}/${acao}/`, corpo)
      .then((res) => {
        aplicarResultado(res.data)
        if (acao === 'responder') setResposta('')
      })
      .catch((error) => setErro(mensagemDeErro(error)))
      .finally(() => setEnviando(null))
  }

  function gerarProxima() {
    setErro('')
    setEnviando('proxima')
    api
      .post(`/entrevistas/${id}/proxima/`)
      .then((res) => {
        setAviso('')
        setEntrevista((e) => ({
          ...e,
          perguntas: e.perguntas.some((p) => p.id === res.data.id) ? e.perguntas : [...e.perguntas, res.data],
        }))
      })
      .catch((error) => {
        // Sem mais perguntas: recarrega para pegar o estado finalizado
        if (error.response?.status === 400) {
          api.get(`/entrevistas/${id}/`).then((res) => setEntrevista(res.data))
          setAviso('')
        } else {
          setAviso(mensagemDeErro(error))
        }
      })
      .finally(() => setEnviando(null))
  }

  function encerrar() {
    if (!window.confirm('Encerrar a entrevista agora? As perguntas que faltam serão descartadas.')) return
    setErro('')
    setEnviando('encerrar')
    api
      .post(`/entrevistas/${id}/encerrar/`)
      .then((res) => {
        setEntrevista(res.data)
        setAviso('')
      })
      .catch((error) => setErro(mensagemDeErro(error)))
      .finally(() => setEnviando(null))
  }

  function teclaNaResposta(event) {
    // Ctrl/Cmd + Enter envia
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && resposta.trim() && !enviando) {
      enviar('responder')
    }
  }

  if (erroCarregar) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-gray-700">{erroCarregar}</p>
        <Link to="/dashboard" className="font-semibold text-primary underline">Voltar ao Dashboard</Link>
      </div>
    )
  }

  if (!entrevista) {
    return <div className="flex min-h-screen items-center justify-center text-gray-500">Carregando entrevista…</div>
  }

  const numeroAtual = atual ? atual.ordem : Math.min(perguntas.length, entrevista.num_perguntas)
  const concluidas = perguntas.filter((p) => p.respondida_em || p.pulada).length
  const progresso = (concluidas / entrevista.num_perguntas) * 100
  // Calculada aqui porque nota_media do backend só vem no carregamento da página
  const notas = perguntas.filter((p) => p.nota !== null).map((p) => p.nota)
  const notaMedia = notas.length ? Math.round((notas.reduce((a, b) => a + b, 0) / notas.length) * 10) / 10 : null

  return (
    <div className="min-h-screen">
      {/* Barra superior da sessão */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3 sm:px-6">
          <button
            onClick={() => navigate('/dashboard')}
            aria-label="Voltar ao Dashboard"
            className="cursor-pointer rounded-xl border border-gray-200 px-3 py-2 hover:bg-gray-50"
          >
            ←
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-semibold">
              {entrevista.area} · {entrevista.tipos.join(', ')} · {entrevista.nivel}
            </h1>
            <p className="text-sm text-gray-500">Entrevistador: {entrevista.entrevistador_nome}</p>
          </div>
          <div className="w-40">
            <p className="text-xs text-gray-500">
              Pergunta <strong className="text-ink">{numeroAtual} de {entrevista.num_perguntas}</strong>
            </p>
            <div className="mt-1 h-1.5 rounded-full bg-gray-200">
              <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${progresso}%` }} />
            </div>
          </div>
          <span className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 tabular-nums">
            ⏱ {formatarTempo(segundos)}
          </span>
          {!entrevista.finalizada && (
            <button
              onClick={encerrar}
              disabled={!!enviando}
              className="cursor-pointer rounded-xl border border-gray-300 px-4 py-2 font-semibold hover:bg-gray-50 disabled:opacity-50"
            >
              Encerrar
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_280px]">
        {/* Chat */}
        <section className="flex flex-col rounded-2xl border border-gray-200 bg-white">
          <div className="space-y-5 p-6">
            {perguntas.map((p) => (
              <div key={p.id} className="space-y-4">
                <BolhaIA pergunta={p} destaque={p.id === atual?.id} />
                {p.respondida_em && (
                  <>
                    <div className="flex justify-end">
                      <p className="max-w-[85%] rounded-2xl bg-primary px-4 py-3 whitespace-pre-line text-white">
                        {p.resposta}
                      </p>
                    </div>
                    {p.nota !== null && <Feedback pergunta={p} />}
                  </>
                )}
                {p.pulada && <p className="ml-12 text-sm text-gray-500 italic">Você pulou esta pergunta.</p>}
              </div>
            ))}

            {enviando === 'responder' && (
              <>
                <div className="flex justify-end">
                  <p className="max-w-[85%] rounded-2xl bg-primary/70 px-4 py-3 whitespace-pre-line text-white">
                    {resposta}
                  </p>
                </div>
                <p className="ml-12 animate-pulse text-sm text-gray-500">A IA está avaliando sua resposta…</p>
              </>
            )}
            {enviando === 'pular' && (
              <p className="ml-12 animate-pulse text-sm text-gray-500">Preparando a próxima pergunta…</p>
            )}
            {enviando === 'proxima' && (
              <p className="ml-12 animate-pulse text-sm text-gray-500">Gerando a próxima pergunta…</p>
            )}

            {semPergunta && aviso && !enviando && (
              <div className="ml-12 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
                <p>Não consegui gerar a próxima pergunta: {aviso}</p>
                <button onClick={gerarProxima} className="mt-2 cursor-pointer font-semibold underline">
                  Tentar de novo
                </button>
              </div>
            )}
            {semPergunta && !aviso && !enviando && (
              <div className="ml-12">
                <button onClick={gerarProxima} className="cursor-pointer font-semibold text-primary underline">
                  Gerar a próxima pergunta
                </button>
              </div>
            )}

            {entrevista.finalizada && (
              <div className="rounded-2xl bg-ink p-6 text-white">
                <p className="text-sm text-gray-300">Entrevista finalizada</p>
                {notaMedia !== null ? (
                  <p className="mt-1 font-display text-4xl font-semibold">
                    {formatarNota(notaMedia)}
                    <span className="text-xl text-gray-400"> /10</span>
                  </p>
                ) : (
                  <p className="mt-1 font-display text-2xl font-semibold">Sem respostas avaliadas</p>
                )}
                {notaMedia !== null ? (
                  <>
                    <p className="mt-2 text-gray-300">
                      Veja o relatório completo, com a avaliação por critério e o que melhorar.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link
                        to={`/entrevistas/${id}/relatorio`}
                        className="rounded-xl bg-primary px-5 py-2.5 font-semibold hover:bg-primary-dark"
                      >
                        Ver relatório
                      </Link>
                      <Link
                        to="/dashboard"
                        className="rounded-xl border border-white/30 px-5 py-2.5 font-semibold hover:bg-white/10"
                      >
                        Nova entrevista
                      </Link>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="mt-2 text-gray-300">
                      Responda pelo menos uma pergunta para receber um relatório.
                    </p>
                    <Link
                      to="/dashboard"
                      className="mt-4 inline-block rounded-xl bg-primary px-5 py-2.5 font-semibold hover:bg-primary-dark"
                    >
                      Nova entrevista
                    </Link>
                  </>
                )}
              </div>
            )}
            <div ref={fimDoChat} />
          </div>

          {/* Campo de resposta */}
          {atual && !entrevista.finalizada && (
            <div className="mt-auto border-t border-gray-200 p-6">
              <label htmlFor="resposta" className="mb-2 block text-sm font-semibold">Sua resposta</label>
              <textarea
                id="resposta"
                rows={4}
                value={resposta}
                onChange={(e) => setResposta(e.target.value)}
                onKeyDown={teclaNaResposta}
                disabled={!!enviando}
                placeholder="Escreva sua resposta… (Ctrl + Enter para enviar)"
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-gray-50"
              />
              {erro && <p className="mt-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</p>}
              <div className="mt-3 flex justify-end gap-3">
                <button
                  onClick={() => enviar('pular')}
                  disabled={!!enviando}
                  className="cursor-pointer rounded-xl px-4 py-2.5 font-semibold text-gray-600 hover:text-ink disabled:opacity-50"
                >
                  Pular
                </button>
                <button
                  onClick={() => enviar('responder')}
                  disabled={!!enviando || !resposta.trim()}
                  className="cursor-pointer rounded-xl bg-primary px-5 py-2.5 font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {enviando === 'responder' ? 'Enviando…' : 'Enviar resposta'}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Lateral */}
        <aside className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="font-semibold">Dica: método STAR</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {STAR.map(([letra, nome, texto]) => (
                <li key={letra} className="flex gap-4">
                  <span className="w-3 font-semibold text-primary">{letra}</span>
                  <span><strong>{nome}</strong>: {texto}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="font-semibold">Perguntas</h2>
            <ol className="mt-3 space-y-2 text-sm">
              {Array.from({ length: entrevista.num_perguntas }, (_, i) => {
                const p = perguntas[i]
                if (!p) {
                  return <li key={i} className="text-gray-400">{i + 1}. —</li>
                }
                const ehAtual = p.id === atual?.id
                return (
                  <li key={p.id} className={`flex justify-between gap-2 ${ehAtual ? 'font-semibold text-primary' : ''}`}>
                    <span>{p.ordem}. {p.tema}</span>
                    {ehAtual && <span>agora</span>}
                    {p.nota !== null && <span className={`font-semibold ${corDaNota(p.nota)}`}>{formatarNota(p.nota)}</span>}
                    {p.pulada && <span className="text-gray-400">pulada</span>}
                  </li>
                )
              })}
            </ol>
          </section>
        </aside>
      </main>
    </div>
  )
}
