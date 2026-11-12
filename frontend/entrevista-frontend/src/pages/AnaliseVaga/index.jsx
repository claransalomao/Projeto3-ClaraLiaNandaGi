import { useEffect, useState } from 'react'
import api, { mensagemDeErro } from '../../api'
import AppBar from '../../components/AppBar'

function Lista({ titulo, itens }) {
  if (!itens?.length) return null
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6">
      <h3 className="font-semibold">{titulo}</h3>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-gray-700">
        {itens.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </section>
  )
}

function Etiquetas({ titulo, itens }) {
  if (!itens?.length) return null
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6">
      <h3 className="font-semibold">{titulo}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {itens.map((item) => (
          <span key={item} className="rounded-full bg-primary-soft px-3 py-1 text-sm font-medium text-primary">
            {item}
          </span>
        ))}
      </div>
    </section>
  )
}

export default function AnaliseVaga() {
  const [descricao, setDescricao] = useState('')
  const [area, setArea] = useState('')
  const [nivel, setNivel] = useState('Estágio')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [analise, setAnalise] = useState(null)
  const [anteriores, setAnteriores] = useState([])

  // Carrega as análises que o usuário já fez
  useEffect(() => {
    api.get('/vagas/').then((res) => setAnteriores(res.data)).catch(() => {})
  }, [])

  function analisar(event) {
    event.preventDefault()
    setErro('')
    setEnviando(true)
    api
      .post('/vagas/', { descricao, area, nivel })
      .then((res) => {
        setAnalise(res.data)
        setAnteriores((lista) => [res.data, ...lista])
      })
      .catch((error) => setErro(mensagemDeErro(error)))
      .finally(() => setEnviando(false))
  }

  const r = analise?.resultado

  return (
    <div className="min-h-screen">
      <AppBar />
      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          {!analise ? (
            <form onSubmit={analisar} className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6">
              <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                Análise da vaga · IA
              </span>
              <h1 className="font-display text-2xl font-semibold">Cole a vaga que você quer conquistar</h1>
              <p className="text-gray-500">
                A IA identifica as competências pedidas e as perguntas que devem cair na entrevista.
              </p>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium">Descrição da vaga</span>
                <textarea
                  rows={10}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Cole aqui o texto completo da vaga (LinkedIn, Gupy, site da empresa…)"
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <span className="text-xs text-gray-500">{descricao.trim().length} caracteres (mínimo 80)</span>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium">Área (opcional)</span>
                  <input
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    placeholder="Ex.: Tecnologia"
                    className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 outline-none focus:border-primary"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium">Nível</span>
                  <select
                    value={nivel}
                    onChange={(e) => setNivel(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5"
                  >
                    <option>Estágio</option>
                    <option>Trainee</option>
                    <option>Júnior</option>
                  </select>
                </label>
              </div>

              {erro && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</p>}

              <button
                type="submit"
                disabled={enviando || descricao.trim().length < 80}
                className="w-full cursor-pointer rounded-xl bg-primary py-3 font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                {enviando ? 'Analisando a vaga…' : 'Analisar vaga com IA'}
              </button>
            </form>
          ) : (
            <>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h1 className="font-display text-3xl font-semibold">{r.cargo}</h1>
                  <p className="text-gray-500">{r.empresa} · {r.area} · {r.senioridade}</p>
                </div>
                <button
                  onClick={() => { setAnalise(null); setDescricao('') }}
                  className="cursor-pointer rounded-xl border border-gray-300 bg-white px-4 py-2.5 font-semibold hover:bg-gray-50"
                >
                  Analisar outra vaga
                </button>
              </div>

              <section className="rounded-2xl border border-gray-200 bg-white p-6">
                <h3 className="font-semibold">Resumo</h3>
                <p className="mt-2 text-gray-700">{r.resumo}</p>
              </section>

              <div className="grid gap-6 md:grid-cols-2">
                <Etiquetas titulo="Competências técnicas" itens={r.competencias_tecnicas} />
                <Etiquetas titulo="Competências comportamentais" itens={r.competencias_comportamentais} />
                <Lista titulo="Requisitos obrigatórios" itens={r.requisitos_obrigatorios} />
                <Lista titulo="Diferenciais" itens={r.diferenciais} />
              </div>

              <section className="rounded-2xl border border-gray-200 bg-white p-6">
                <h3 className="font-semibold">Perguntas prováveis</h3>
                <ol className="mt-3 list-decimal space-y-4 pl-5">
                  {r.perguntas_provaveis.map((p) => (
                    <li key={p.pergunta}>
                      <div className="flex flex-wrap items-center gap-2">
                        <strong>{p.pergunta}</strong>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">{p.tipo}</span>
                      </div>
                      <p className="text-sm text-gray-500">{p.por_que}</p>
                    </li>
                  ))}
                </ol>
              </section>

              <Lista titulo="Dicas de preparação" itens={r.dicas_preparacao} />
            </>
          )}
        </div>

        <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold">Análises anteriores</h2>
          {anteriores.length === 0 && <p className="mt-2 text-sm text-gray-500">Nenhuma ainda.</p>}
          <ul className="mt-3 space-y-2">
            {anteriores.map((a) => (
              <li key={a.id}>
                <button
                  onClick={() => setAnalise(a)}
                  className="w-full cursor-pointer rounded-lg bg-surface px-3 py-2 text-left text-sm hover:bg-primary-soft"
                >
                  <strong className="block">{a.resultado.cargo}</strong>
                  <span className="text-gray-500">{new Date(a.criado_em).toLocaleDateString('pt-BR')}</span>
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </main>
    </div>
  )
}