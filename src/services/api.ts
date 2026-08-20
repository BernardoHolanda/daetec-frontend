import axios from "axios"

const CHAVE_TOKEN = "daetec_token"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(CHAVE_TOKEN)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 401 = token vencido ou inválido: derruba a sessão e manda pro login.
// A exceção é a própria tela de login, onde 401 é só senha errada — redirecionar ali
// recarregaria a página e engoliria a mensagem de erro
api.interceptors.response.use(
  (resposta) => resposta,
  (erro) => {
    const naoAutorizado = axios.isAxiosError(erro) && erro.response?.status === 401
    const naTelaDeLogin = window.location.pathname === "/login"

    if (naoAutorizado && !naTelaDeLogin) {
      localStorage.removeItem(CHAVE_TOKEN)
      window.location.assign("/login")
    }

    return Promise.reject(erro)
  },
)

export default api
