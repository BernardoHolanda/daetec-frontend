import { defineStore } from "pinia"
import { computed, ref } from "vue"
import { esquecerToken, guardarToken, lerToken } from "../utils/sessao"

export const useAuthStore = defineStore("auth", () => {
  const token = ref<string | null>(lerToken())

  const isAuthenticated = computed(() => token.value !== null)

  function setToken(newToken: string) {
    token.value = newToken
    guardarToken(newToken)
  }

  function logout() {
    token.value = null
    esquecerToken()
  }

  return { token, isAuthenticated, setToken, logout }
})
