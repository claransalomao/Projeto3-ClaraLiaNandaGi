import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { mensagemDeErro } from '../../api'
import AppBar from '../../components/AppBar'

function formatarNota(nota) {
  return nota.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
}

function corDaNota(nota) {
  if (nota >= 7) return 'text-green-700'
  if (nota >= 5) return 'text-amber-700'
  return 'text-red-700'
}

function formatarData(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// Mesma regra do Dashboard: com nota e finalizada → relatório; senão → sessão
function linkDaEntrevista(e) {
  return e.finalizada && e.nota_media !== null ? `/entrevistas/${e.id}/relatorio` : `/entrevistas/${e.id}`
}

const FILTROS_STATUS = [
  { valor: 'todas', label: 'Todas' },
  { valor: 'finalizadas', label: 'Finalizadas' },
  { valor: 'andamento', label: 'Em andamento' },
]

function Resumo({ entrevistas }) {
  const notas = entrevistas.filter((e) => e.finalizada && e.nota_media !== null).map((e) => e.nota_media)
  const media = notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : null
  const melhor = notas.length ? Math.max(...notas) : null

  const itens = [
    { label: 'Entrevistas', valor: entrevistas.length },
    { label: 'Nota média', valor: media !== null ? formatarNota(media) : '—' },
    { label: 'Melhor nota', valor: melhor !== null ? formatarNota(melhor) : '—', cor: melhor !== null ? corDaNota(melhor) : '' },
  ]

  return (
    <div className="grid grid-cols-3 gap-3">
      {itens.map((item) => (
        <div key={item.label} className="rounded-xl border border-gray-200 bg-white p-4">
          <span className="text-xs text-gray-500 sm:text-sm">{item.label}</span>
          <strong className={`block font-display text-2xl font-semibold sm:text-3xl ${item.cor || ''}`}>
            {item.valor}
          </strong>
        </div>
      ))}
    </div>
  )
}

function ItemHistorico({ entrevista: e, onExcluir }) {
  const [excluindo, setExcluindo] = useState(false)
  const comNota = e.finalizada && e.nota_media !== null

  function excluir() {
    if (!window.confirm('Excluir esta entrevista do histórico? Essa ação não pode ser desfeita.')) return
    setExcluindo(true)
    onExcluir(e.id).catch(() => setExcluindo(false))
  }

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border border-gray-200 bg-white px-4 py-4 sm:flex-nowrap">
      <div className="min-w-0 flex-1 basis-full sm:basis-auto">
        <strong className="block truncate">
          {e.area} · {e.tipos.join(', ')}
        </strong>
        <span className="text-sm text-gray-500">
          {formatarData(e.criado_em)} · {e.entrevistador_nome} · {e.nivel}
        </span>
      </div>

      <div className="w-20 text-left sm:text-right">
        {comNota ? (
          <span className={`font-display text-xl font-semibold ${corDaNota(e.nota_media)}`}>
            {formatarNota(e.nota_media)}
          </span>
        ) : e.finalizada ? (
          <span className="text-sm text-gray-400">sem nota</span>
        ) : (
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
            em andamento
          </span>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Link
          to={linkDaEntrevista(e)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-semibold hover:bg-gray-50"
        >
          {comNota ? 'Ver relatório' : e.finalizada ? 'Ver entrevista' : 'Continuar'}
        </Link>
        <button
          onClick={excluir}
          disabled={excluindo}
          className="cursor-pointer rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
        >
          {excluindo ? 'Excluindo…' : 'Excluir'}
        </button>
      </div>
    </li>
  )
}

export default function Historico() {
  const [entrevistas, setEntrevistas] = useState([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [status, setStatus] = useState('todas')
  const [area, setArea] = useState('')

  useEffect(() => {
    api
      .get('/entrevistas/')
      .then((res) => setEntrevistas(res.data))
      .catch((error) => setErro(mensagemDeErro(error)))
      .finally(() => setCarregando(false))
  }, [])

  function excluirEntrevista(id) {
    return api
      .delete(`/entrevistas/${id}/`)
      .then(() => setEntrevistas((lista) => lista.filter((e) => e.id !== id)))
      .catch((error) => {
        window.alert(mensagemDeErro(error))
        throw error
      })
  }

  const areas = [...new Set(entrevistas.map((e) => e.area))].sort()

  const filtradas = entrevistas.filter((e) => {
    if (status === 'finalizadas' && !e.finalizada) return false
    if (status === 'andamento' && e.finalizada) return false
    if (area && e.area !== area) return false
    return true
  })

  return (
    <div className="min-h-screen">
      <AppBar />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold">Histórico</h1>
            <p className="mt-1 text-gray-500">Todas as suas simulações, da mais recente para a mais antiga.</p>
          </div>
          <Link
            to="/dashboard"
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            Nova entrevista
          </Link>
        </div>

        {carregando && <p className="mt-10 text-gray-500">Carregando histórico…</p>}

        {erro && <p className="mt-8 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</p>}

        {!carregando && !erro && entrevistas.length === 0 && (
          <div className="mt-10 rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
            <h2 className="font-display text-xl font-semibold">Nenhuma entrevista ainda</h2>
            <p className="mt-2 text-gray-500">Faça sua primeira simulação e ela aparece aqui.</p>
            <Link to="/dashboard" className="mt-4 inline-block font-semibold text-primary">
              Configurar entrevista →
            </Link>
          </div>
        )}

        {!carregando && !erro && entrevistas.length > 0 && (
          <>
            <div className="mt-8">
              <Resumo entrevistas={entrevistas} />
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <div className="flex rounded-xl bg-gray-100 p-1">
                {FILTROS_STATUS.map((f) => (
                  <button
                    key={f.valor}
                    onClick={() => setStatus(f.valor)}
                    className={`cursor-pointer rounded-lg px-3 py-1.5 text-sm font-semibold ${
                      status === f.valor ? 'bg-white text-ink shadow-sm' : 'text-gray-500 hover:text-ink'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {areas.length > 1 && (
                <select
                  value={area}
                  onChange={(event) => setArea(event.target.value)}
                  aria-label="Filtrar por área"
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Todas as áreas</option>
                  {areas.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {filtradas.length === 0 ? (
              <p className="mt-6 text-sm text-gray-500">Nenhuma entrevista com esses filtros.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {filtradas.map((e) => (
                  <ItemHistorico key={e.id} entrevista={e} onExcluir={excluirEntrevista} />
                ))}
              </ul>
            )}
          </>
        )}
      </main>
    </div>
  )
}
