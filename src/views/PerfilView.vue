<script setup lang="ts">
import { computed } from "vue"
import { useRouter } from "vue-router"
import { useAuthStore } from "../stores/auth"
import { useUsuarioStore } from "../stores/usuario"
import IconeNav from "../components/IconeNav.vue"

const auth = useAuthStore()
const usuarioStore = useUsuarioStore()
const router = useRouter()

const username = computed(() => usuarioStore.usuario?.username ?? "")
const iniciais = computed(() => username.value.slice(0, 2).toUpperCase())
const papel = computed(() => (usuarioStore.isAdmin ? "Administrador" : "Vendedor"))

function sair() {
  auth.logout()
  usuarioStore.limpar()
  router.push({ name: "login" })
}
</script>

<template>
  <main class="flex flex-1 flex-col gap-5 p-6">
    <h1 class="text-[22px] font-semibold tracking-tight">Perfil</h1>

    <div class="border-linha flex items-center gap-3 rounded-xl border bg-white p-4">
      <div
        class="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-violet-200 text-lg font-semibold text-violet-800"
      >
        {{ iniciais }}
      </div>
      <div class="min-w-0">
        <p class="truncate font-semibold">{{ username }}</p>
        <p class="text-tinta-suave text-sm">{{ papel }}</p>
        <p class="text-tinta-fraca truncate text-sm">{{ usuarioStore.usuario?.email }}</p>
      </div>
    </div>

    <nav v-if="usuarioStore.isAdmin" class="flex flex-col gap-2">
      <p class="text-tinta-fraca text-[11px] font-semibold tracking-widest uppercase">Cadastros</p>
      <RouterLink
        :to="{ name: 'produtos' }"
        class="border-linha flex min-h-14 items-center gap-3 rounded-xl border bg-white px-4 font-medium"
      >
        <IconeNav nome="produtos" />
        Produtos
      </RouterLink>
      <RouterLink
        :to="{ name: 'clientes' }"
        class="border-linha flex min-h-14 items-center gap-3 rounded-xl border bg-white px-4 font-medium"
      >
        <IconeNav nome="clientes" />
        Clientes
      </RouterLink>
    </nav>

    <button
      type="button"
      class="border-linha text-tinta-suave mt-auto flex min-h-14 items-center gap-3 rounded-xl border bg-white px-4 font-medium"
      @click="sair"
    >
      <IconeNav nome="sair" />
      Sair
    </button>
  </main>
</template>
