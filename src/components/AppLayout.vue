<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import { useRouter } from "vue-router"
import { useAuthStore } from "../stores/auth"
import { useUsuarioStore } from "../stores/usuario"
import { CADASTROS, OPERACAO, type ItemNav } from "../router/navegacao"
import IconeNav from "./IconeNav.vue"

const auth = useAuthStore()
const usuarioStore = useUsuarioStore()
const router = useRouter()

function visivel(item: ItemNav) {
  if (!item.papel) return true
  return item.papel === (usuarioStore.isAdmin ? "admin" : "comum")
}

const itensOperacao = computed(() => OPERACAO.filter(visivel))

const itensCelular = computed<ItemNav[]>(() => [
  ...itensOperacao.value.filter((item) => item.celular),
  // no celular não há barra lateral: os cadastros entram como quarto item
  ...(usuarioStore.isAdmin ? [{ nome: "cadastros", rotulo: "Cadastros" }] : []),
])

const username = computed(() => usuarioStore.usuario?.username ?? "")
const iniciais = computed(() => username.value.slice(0, 2).toUpperCase())
const papel = computed(() => (usuarioStore.isAdmin ? "Administrador" : "Vendedor"))

const menuAberto = ref(false)

function aoTeclar(evento: KeyboardEvent) {
  if (evento.key === "Escape") menuAberto.value = false
}

// listener global precisa ser removido junto com o componente,
// senão fica vazando um a cada montagem
onMounted(() => window.addEventListener("keydown", aoTeclar))
onBeforeUnmount(() => window.removeEventListener("keydown", aoTeclar))

function sair() {
  auth.logout()
  usuarioStore.limpar()
  router.push({ name: "login" })
}
</script>

<template>
  <div class="flex min-h-screen">
    <aside
      class="border-linha hidden w-62 shrink-0 flex-col gap-6 border-r bg-white px-4 py-5 lg:flex"
    >
      <div class="flex items-center gap-2.5 px-2">
        <div
          class="grid h-8.5 w-8.5 shrink-0 place-items-center rounded-[10px] bg-violet-600 text-base font-bold text-white"
        >
          D
        </div>
        <div class="min-w-0">
          <p class="text-base leading-tight font-bold tracking-tight">DAETEC</p>
          <p class="text-tinta-fraca text-[10px] font-medium tracking-widest">
            DIRETÓRIO ACADÊMICO
          </p>
        </div>
      </div>

      <nav class="flex flex-col gap-1">
        <RouterLink
          v-for="item in itensOperacao"
          :key="item.nome"
          :to="{ name: item.nome }"
          class="text-tinta-suave flex min-h-11 items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[15px] font-medium"
          active-class="!bg-violet-100 !font-semibold !text-violet-800"
        >
          <IconeNav :nome="item.nome" />
          {{ item.rotulo }}
        </RouterLink>

        <template v-if="usuarioStore.isAdmin">
          <p class="text-tinta-fraca mt-4 mb-1 px-3 text-[10px] font-semibold tracking-widest">
            CADASTROS
          </p>
          <RouterLink
            v-for="item in CADASTROS"
            :key="item.nome"
            :to="{ name: item.nome }"
            class="text-tinta-suave flex min-h-11 items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[15px] font-medium"
            active-class="!bg-violet-100 !font-semibold !text-violet-800"
          >
            <IconeNav :nome="item.nome" />
            {{ item.rotulo }}
          </RouterLink>
        </template>
      </nav>

      <div class="mt-auto flex flex-col gap-2">
        <div class="bg-fundo flex items-center gap-2.5 rounded-[10px] p-2.5">
          <div
            class="grid h-8.5 w-8.5 shrink-0 place-items-center rounded-full bg-violet-200 text-sm font-semibold text-violet-800"
          >
            {{ iniciais }}
          </div>
          <div class="min-w-0">
            <p class="truncate text-sm leading-tight font-semibold">{{ username }}</p>
            <p class="text-tinta-fraca text-xs">{{ papel }}</p>
          </div>
        </div>
        <button
          type="button"
          class="text-tinta-suave hover:bg-fundo flex min-h-11 items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-sm font-medium"
          @click="sair"
        >
          <IconeNav nome="sair" />
          Sair
        </button>
      </div>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col pb-16 lg:pb-0">
      <header
        class="border-linha sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between border-b bg-white px-4 lg:hidden"
      >
        <div class="flex items-center gap-2">
          <div
            class="grid h-7 w-7 place-items-center rounded-lg bg-violet-600 text-xs font-bold text-white"
          >
            D
          </div>
          <span class="font-bold tracking-tight">DAETEC</span>
        </div>

        <div class="relative">
          <button
            type="button"
            class="grid h-9 w-9 place-items-center rounded-full bg-violet-200 text-[13px] font-semibold text-violet-800"
            aria-haspopup="menu"
            :aria-expanded="menuAberto"
            :aria-label="`Conta de ${username}`"
            @click="menuAberto = !menuAberto"
          >
            {{ iniciais }}
          </button>

          <template v-if="menuAberto">
            <!-- fundo invisível que captura o clique fora — resolve o
                 'fechar ao clicar em qualquer lugar' sem listener no document -->
            <div class="fixed inset-0 z-20" @click="menuAberto = false"></div>

            <div
              role="menu"
              class="border-linha absolute top-11 right-0 z-30 w-52 overflow-hidden rounded-xl border bg-white shadow-lg"
            >
              <div class="border-linha border-b px-4 py-3">
                <p class="truncate text-sm font-semibold">{{ username }}</p>
                <p class="text-tinta-fraca text-xs">{{ papel }}</p>
              </div>
              <button
                type="button"
                role="menuitem"
                class="text-tinta-suave hover:bg-fundo flex min-h-12 w-full items-center gap-2.5 px-4 text-sm font-medium"
                @click="sair"
              >
                <IconeNav nome="sair" />
                Sair
              </button>
            </div>
          </template>
        </div>
      </header>

      <RouterView />
    </div>

    <nav
      class="border-linha fixed inset-x-0 bottom-0 z-10 flex border-t bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <RouterLink
        v-for="item in itensCelular"
        :key="item.nome"
        :to="{ name: item.nome }"
        class="text-tinta-suave flex h-16 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium"
        active-class="!text-violet-800 !font-semibold"
      >
        <IconeNav :nome="item.nome" />
        {{ item.curto ?? item.rotulo }}
      </RouterLink>
    </nav>
  </div>
</template>
