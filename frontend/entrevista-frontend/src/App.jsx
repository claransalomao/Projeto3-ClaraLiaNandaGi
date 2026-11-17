import { Navigate, Route, Routes } from 'react-router-dom'
import RotaProtegida from './components/RotaProtegida'
import AnaliseVaga from './pages/AnaliseVaga'
import Dashboard from './pages/Dashboard'
import Entrevista from './pages/Entrevista'
import Historico from './pages/Historico'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Relatorio from './pages/Relatorio'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login modo="entrar" />} />
      <Route path="/cadastro" element={<Login modo="cadastro" />} />
      <Route
        path="/dashboard"
        element={
          <RotaProtegida>
            <Dashboard />
          </RotaProtegida>
        }
      />
      <Route
        path="/historico"
        element={
          <RotaProtegida>
            <Historico />
          </RotaProtegida>
        }
      />
      <Route
        path="/vagas"
        element={
          <RotaProtegida>
            <AnaliseVaga />
          </RotaProtegida>
        }
      />
      <Route
        path="/entrevistas/:id"
        element={
          <RotaProtegida>
            <Entrevista />
          </RotaProtegida>
        }
      />
      <Route
        path="/entrevistas/:id/relatorio"
        element={
          <RotaProtegida>
            <Relatorio />
          </RotaProtegida>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App