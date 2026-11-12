import axios from 'axios'

export const TOKEN_KEY = 'prepai_token'

// URL do backend: definida em .env.local (VITE_API_URL) ou localhost:8000 por padrão
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
})

// Envia o token em todas as requisições: "Authorization: Token <token>"
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Token ${token}`
  }
  return config
})

// Transforma a resposta de erro do Django REST em uma mensagem legível
export function mensagemDeErro(error) {
  if (!error.response) {
    return 'Não foi possível conectar ao servidor. O backend está rodando?'
  }
  const data = error.response.data
  if (data?.detail) return data.detail
  if (data && typeof data === 'object') {
    const primeiro = Object.values(data)[0]
    return Array.isArray(primeiro) ? primeiro[0] : String(primeiro)
  }
  return 'Algo deu errado. Tente novamente.'
}

export default api
