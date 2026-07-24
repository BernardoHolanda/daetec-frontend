import axios from "axios"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
})

// anexa o token JWT em toda requisição, se existir
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("daetec_token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
