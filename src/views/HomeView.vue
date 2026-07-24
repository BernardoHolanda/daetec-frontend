<script setup lang="ts">
import { useRouter } from "vue-router"
import { useAuthStore } from "../stores/auth"

const auth = useAuthStore()
const router = useRouter()

function sair() {
  auth.logout()
  router.push({ name: "login" })
}
</script>

<template>
  <main class="min-h-screen flex flex-col items-center justify-center gap-4 bg-zinc-100">
    <h1 class="text-2xl font-bold text-zinc-800">Você está logado 🎉</h1>
    <button @click="sair" class="bg-zinc-800 hover:bg-zinc-900 text-white px-4 py-2 rounded-lg">
      Sair
    </button>
  </main>
</template>
