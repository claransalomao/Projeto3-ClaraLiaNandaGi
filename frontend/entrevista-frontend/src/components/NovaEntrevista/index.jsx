import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { mensagemDeErro } from '../../api'

const AREAS = [
  'Tecnologia', 'Mercado financeiro', 'Consultoria', 'Produto', 'Dados & Analytics', 'Marketing',
  'Vendas', 'Direito', 'Engenharia', 'Design / UX', 'RH / Pessoas', 'Operações & Supply Chain',
]

const TIPOS = [
  'Mista', 'Comportamental', 'Técnica', 'Case de negócios', 'Estimativa (market sizing)',
  'Live coding / algoritmos', 'Fit cultural', 'Em inglês', 'Pitch pessoal',
  'Entrevista final com gestor', 'Stress interview',
]

const ENTREVISTADORES = [
  { valor: 'rh', nome: 'RH amigável', descricao: 'Foco em fit e trajetória' },
  { valor: 'gestor', nome: 'Gestor técnico', descricao: 'Exigente, aprofunda respostas' },
  { valor: 'case', nome: 'Case / banco', descricao: 'Raciocínio sob pressão' },
]

const NIVEIS = ['Estágio', 'Trainee', 'Júnior']
const NUM_PERGUNTAS = [3, 5, 7, 10]

function Chip({ ativo, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm transition ${
        ativo
          ? 'border-primary bg-primary-soft font-semibold text-primary'
          : 'border-gray-300 bg-white text-ink hover:border-gray-400'
      }`}
    >
      {children}
    </button>
  )
}

function Rotulo({ children, extra }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-2">
      <span className="text-sm font-semibold">{children}</span>
      {extra && <span className="text-xs text-gray-500">{extra}</span>}
    </div>
  )
}

// Painel "Nova entrevista" do Dashboard: configura e cria a entrevista
export default function NovaEntrevista() {
  const navigate = useNavigate()

  const [area, setArea] = useState('Tecnologia')
  const [areaDigitada, setAreaDigitada] = useState('')
  const [tipos, setTipos] = useState(['Comportamental', 'Técnica'])
  const [entrevistador, setEntrevistador] = useState('rh')
  const [nivel, setNivel] = useState('Estágio')
  const [numPerguntas, setNumPerguntas] = useState(5)
  const [vaga, setVaga] = useState('')
  const [analiseId, setAnaliseId] = useState('')
  const [analises, setAnalises] = useState([])
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  // Vagas já analisadas podem ser usadas como vaga-alvo
  useEffect(() => {
    api.get('/vagas/').then((res) => setAnalises(res.data)).catch(() => {})
  }, [])

  const areaFinal = areaDigitada.trim() || area

  function alternarTipo(tipo) {
    setTipos((atuais) => (atuais.includes(tipo) ? atuais.filter((t) => t !== tipo) : [...atuais, tipo]))
  }

  function comecar(event) {
    event.preventDefault()
    setErro('')
    setEnviando(true)
    api
      .post('/entrevistas/', {
        area: areaFinal,
        tipos,
        entrevistador,
        nivel,
        num_perguntas: numPerguntas,
        vaga: analiseId ? '' : vaga,
        analise_vaga_id: analiseId ? Number(analiseId) : null,
      })
      .then((res) => navigate(`/entrevistas/${res.data.id}`))
      .catch((error) => {
        setErro(mensagemDeErro(error))
        setEnviando(false)
      })
  }

  return (
    <form onSubmit={comecar} className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-xl font-semibold">Nova entrevista</h2>
        <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
          Gerada pela IA
        </span>
      </div>

      <div>
        <Rotulo>Área</Rotulo>
        <div className="flex flex-wrap gap-2">
          {AREAS.map((a) => (
            <Chip key={a} ativo={!areaDigitada.trim() && area === a} onClick={() => { setArea(a); setAreaDigitada('') }}>
              {a}
            </Chip>
          ))}
        </div>
        <label className="mt-3 block">
          <span className="mb-1.5 block text-xs text-gray-500">Não achou sua área? Digite aqui</span>
          <input
            value={areaDigitada}
            onChange={(e) => setAreaDigitada(e.target.value)}
            maxLength={100}
            placeholder="Ex.: Private equity, Arquitetura, Jornalismo…"
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
      </div>

      <div>
        <Rotulo extra="escolha um ou mais">Tipo de entrevista</Rotulo>
        <div className="flex flex-wrap gap-2">
          {TIPOS.map((t) => (
            <Chip key={t} ativo={tipos.includes(t)} onClick={() => alternarTipo(t)}>
              {t}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <Rotulo>Entrevistador</Rotulo>
        <div className="grid gap-3 sm:grid-cols-3">
          {ENTREVISTADORES.map((e) => (
            <button
              key={e.valor}
              type="button"
              onClick={() => setEntrevistador(e.valor)}
              aria-pressed={entrevistador === e.valor}
              className={`cursor-pointer rounded-xl border p-4 text-left transition ${
                entrevistador === e.valor
                  ? 'border-primary bg-primary-soft'
                  : 'border-gray-300 bg-white hover:border-gray-400'
              }`}
            >
              <strong className="block text-sm">{e.nome}</strong>
              <span className="text-sm text-gray-500">{e.descricao}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <Rotulo>Nível</Rotulo>
          <select
            value={nivel}
            onChange={(e) => setNivel(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5"
          >
            {NIVEIS.map((n) => <option key={n}>{n}</option>)}
          </select>
        </label>
        <label className="block">
          <Rotulo>Número de perguntas</Rotulo>
          <select
            value={numPerguntas}
            onChange={(e) => setNumPerguntas(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5"
          >
            {NUM_PERGUNTAS.map((n) => (
              <option key={n} value={n}>{n} perguntas (~{n * 3} min)</option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <Rotulo>Vaga-alvo (opcional)</Rotulo>
        {analises.length > 0 && (
          <select
            value={analiseId}
            onChange={(e) => setAnaliseId(e.target.value)}
            className="mb-3 w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5"
          >
            <option value="">Colar uma descrição de vaga</option>
            {analises.map((a) => (
              <option key={a.id} value={a.id}>
                Vaga analisada: {a.resultado.cargo} {a.resultado.empresa ? `· ${a.resultado.empresa}` : ''}
              </option>
            ))}
          </select>
        )}
        {!analiseId && (
          <textarea
            rows={3}
            value={vaga}
            onChange={(e) => setVaga(e.target.value)}
            placeholder="Cole a descrição da vaga"
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        )}
      </div>

      {erro && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</p>}

      <button
        type="submit"
        disabled={enviando || tipos.length === 0 || !areaFinal}
        className="w-full cursor-pointer rounded-xl bg-primary py-3 font-semibold text-white hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {enviando ? 'Preparando a primeira pergunta…' : 'Começar entrevista →'}
      </button>
      {tipos.length === 0 && (
        <p className="-mt-3 text-center text-xs text-gray-500">Escolha pelo menos um tipo de entrevista.</p>
      )}
    </form>
  )
}
