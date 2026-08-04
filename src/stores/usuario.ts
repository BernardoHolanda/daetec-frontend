import { defineStore } from "pinia"
import { computed, ref } from "vue"
import api from "../services/api"
import type { Usuario } from "../types/api"

export const useUsuarioStore = defineStore("usuario", () => {
  const usuario = ref<Usuario | null>(null)

  const isAdmin = computed(() => usuario.value?.papel === "admin")

  async function carregar(): Promise<boolean> {
    if (usuario.value) return true
    try {
      const { data } = await api.get<Usuario>("/usuarios/me")
      usuario.value = data
      return true
    } catch {
      return false
    }
  }

  function limpar() {
    usuario.value = null
  }

  return { usuario, isAdmin, carregar, limpar }
})
