import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

const TOKEN_KEY = 'daetec_token'

export const useAuthStore = defineStore('auth', () => {

  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))

  const isAuthenticated = computed(() => token.value !== null)

  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem(TOKEN_KEY, newToken)
  }

  function logout() {
    token.value = null
    localStorage.removeItem(TOKEN_KEY)
  }

  return { token, isAuthenticated, setToken, logout }
})
